// PixiJS scene manager for the Blueprint renderer.
//
// Owns the Application, a single panned/zoomed `world` Container (the camera),
// an infinite dot-grid background, a batched wire layer, and an animated flow
// layer. Cards are NOT drawn here: they stay real interactive DOM in the
// overlay above this canvas at all times (no painted/snapshot substitute). This
// scene only accelerates the grid + wires + flow on the GPU. The Vue component
// (BlueprintPixiRenderer.vue) drives it with the culled scene NbBlueprint feeds
// every renderer; this module has all the PixiJS specifics.
//
// PixiJS is passed in (not imported) so it stays a dynamically-loaded,
// externalized optional peer dependency; only `import type` references reach
// this module statically, and those are erased at build time.

import type * as PIXI from 'pixi.js'
import type { IBlueprintCard, TBlueprintBackground } from '../Blueprint.types'
import type { IBlueprintWire } from '../Blueprint.renderer'
import { makeColorResolver } from './pixi-color'
import { parseCubicPath, cubicAt, type ICubicBezier } from './wire-path'
import { levelToColorNumber } from './level-color'
import type { BlueprintLiveData } from './live-data'

const GRID_TILE = 24
const FLOW_SPEED = 0.45 // fraction of a wire traversed per second
const FLOW_DOT_R = 2.5
// A flow candidate only animates when its live signal exceeds this (linear
// peak, ~-48 dBFS): low enough to trace inaudible-but-present signal, high
// enough to ignore the noise floor, so activity shows the real signal path and
// visibly stops where the signal stops (muted / no-input / silent wires).
const ACTIVITY_THRESHOLD = 0.004
// Wire/flow geometry lives in the zoomed `world`. A normal world-space stroke
// shrinks on screen as you zoom out (wires vanish at far zoom); `pixelLine`
// renders a crisp screen-space line instead, constant at every zoom, so the
// wire layer is drawn once and never re-stroked as the camera moves.
const GRID_BASE_ALPHA = 0.4
// This scene renders ON DEMAND: there is no free-running 60fps loop. A state
// change (camera, wires, background) requests a single repaint, and when
// nothing changes the scene renders nothing and costs ~0 CPU, which matters in
// an audio host where the GPU/CPU budget belongs to DSP. Animated modes
// ("levels"/flow) push updates as fast as ~60Hz; we coalesce those and repaint
// at most this often, so an always-animating mode stays cheap. ~25fps reads as
// smooth for level/flow motion at a fraction of the cost of 60.
const ANIM_FRAME_MS = 40

export interface IPixiSceneOptions {
  canvas: HTMLCanvasElement
  /** Reference element for resolving CSS custom properties (the container). */
  el: HTMLElement
  width: number
  height: number
  resolution: number
  background: TBlueprintBackground
  /** Non-reactive live values (wire levels, ...) the host writes at audio rate;
   *  the scene reads them on its throttled render tick. */
  liveData?: BlueprintLiveData
}

// One meter's GPU geometry in world coords (resolved from a card + its local
// meter box). Recomputed only when a card moves or the visible set changes.
interface IMeterGeom {
  id: string
  x: number
  y: number
  w: number
  h: number
}

// A drawn meter: a static dark track and an animated fill, plus a signature so
// geometry is only re-laid-out when it actually changes.
interface IMeterNode {
  track: PIXI.Sprite
  fill: PIXI.Sprite
  sig: string
}

// One wire drawn once (geometry baked, stroked white) and recoloured by `tint`.
// Animating the level colour is then a uniform change, NOT a re-tessellation,
// which is what eliminates the per-frame GPU-geometry churn (and its GC spikes).
interface IWireNode {
  gfx: PIXI.Graphics
  path: string
  bezier: ICubicBezier
  baseColor: number
  isMidi: boolean
  dim: boolean
  flows: boolean
  key: string
}

export class PixiScene {
  private app: PIXI.Application
  private world!: PIXI.Container
  private grid!: PIXI.TilingSprite
  // Wire layer: a container of per-wire Graphics (see IWireNode). Flow layer: a
  // pool of reused dot sprites repositioned each frame (no re-tessellation).
  private wireLayer!: PIXI.Container
  private wireNodes = new Map<string, IWireNode>()
  private flowLayer!: PIXI.Container
  private flowSprites: PIXI.Sprite[] = []
  private dotTexture!: PIXI.Texture
  // Meter layer: each declared card meter is a static dark track + an animated
  // fill sprite (scale.y + tint from the live channel). Drawn over wires, on the
  // back canvas; the DOM card leaves a transparent hole so it shows through.
  private meterLayer!: PIXI.Container
  private meterNodes = new Map<string, IMeterNode>()
  private pendingMeters: IMeterGeom[] = []
  private metersDirty = false
  private trackColor = 0x16161e
  private resolveColor!: ReturnType<typeof makeColorResolver>
  // Fallback colour for a wire whose own colour does not resolve.
  private connectedColor = 0x6366f1
  private flowNodes: IWireNode[] = []
  private flowPhase = 0
  private zoom = 1
  // Render-on-demand scheduler. `needsRender` is the immediate path (camera,
  // background, resize). `rafId` holds the single in-flight frame; the loop
  // only stays alive while there is pending or ongoing (animation) work, then
  // stops so the scene costs nothing at rest. `lastAnimMs` paces the throttled
  // animation/wire-rebuild path.
  private needsRender = false
  private rafId = 0
  private lastAnimMs = 0
  // Colour wires by live level ('levels' mode) vs keep base colour. Distinct
  // from "is live data present", because 'activity' mode also streams levels
  // (to gate flow) but must NOT colour wires. See setLevelColoring.
  private colorByLevel = false
  // Live wire levels (host writes at audio rate, bypassing Vue). `levelsDirty`
  // is set when a write lands; the frame loop recolours wires on the throttled
  // animation cadence, then idles when the host stops writing.
  private liveData: BlueprintLiveData | undefined
  private levelsDirty = false
  // Coalesced wire state: setWires only stashes the latest set + marks dirty;
  // the frame loop rebuilds it (immediately the first time, then throttled to
  // ANIM_FRAME_MS). Parsed beziers are cached by path string so unchanged
  // geometry (levels mode only shifts colour) never pays the regex parse again.
  private pendingWires: IBlueprintWire[] = []
  private pendingShouldFlow: (conn: IBlueprintWire['conn']) => boolean = () =>
    false
  private wiresDirty = false
  private wiresDrawnOnce = false
  private bezierCache = new Map<string, ICubicBezier | null>()
  private destroyed = false
  private background: TBlueprintBackground = 'dots'
  private gridColor = 0x2a2a38
  private gridTexture!: PIXI.Texture

  private constructor(private readonly Pixi: typeof PIXI) {
    this.app = new Pixi.Application()
  }

  /** Create and initialise a scene. Async because PixiJS v8 `app.init` is. */
  static async create(
    Pixi: typeof PIXI,
    opts: IPixiSceneOptions,
  ): Promise<PixiScene> {
    const scene = new PixiScene(Pixi)
    await scene.init(opts)
    return scene
  }

  private async init(opts: IPixiSceneOptions): Promise<void> {
    await this.app.init({
      canvas: opts.canvas,
      width: opts.width,
      height: opts.height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: opts.resolution,
      autoDensity: true,
      preference: 'webgl',
      // No free-running render loop: we drive app.render() on demand so an idle
      // blueprint costs ~0 CPU (the audio engine gets the budget).
      autoStart: false,
    })
    if (this.destroyed) {
      this.app.destroy({ removeView: false }, { children: true })
      return
    }

    this.resolveColor = makeColorResolver(this.Pixi, opts.el)
    this.connectedColor = this.resolveColor('var(--nb-c-primary)', 0x6366f1)

    this.liveData = opts.liveData
    if (this.liveData) {
      // A host write wakes the loop; the actual recolour is throttled in frame().
      this.liveData.onChange = () => {
        if (this.destroyed) return
        this.levelsDirty = true
        this.ensureRaf()
      }
    }

    this.background = opts.background
    this.gridColor = this.resolveColor(
      'var(--nb-blueprint-grid-color, var(--nb-c-border))',
      0x2a2a38,
    )
    this.grid = this.buildGrid(opts.width, opts.height)
    this.app.stage.addChild(this.grid)

    this.world = new this.Pixi.Container()
    this.app.stage.addChild(this.world)

    this.wireLayer = new this.Pixi.Container()
    this.meterLayer = new this.Pixi.Container()
    this.flowLayer = new this.Pixi.Container()
    // Order: wires (back) -> meters (over the card area) -> flow dots (top).
    this.world.addChild(this.wireLayer, this.meterLayer, this.flowLayer)
    this.dotTexture = this.makeDotTexture()
    this.trackColor = this.resolveColor('var(--nb-c-layer-2)', 0x16161e)
    // Stop Pixi's shared ticker for good measure; rendering is fully on-demand.
    this.app.ticker.stop()
  }

  private buildGrid(width: number, height: number): PIXI.TilingSprite {
    // A GRID_TILE-sized pattern tile, tiled across the screen. The grid lives
    // in stage (screen) space; panning/zooming maps to the tiling sprite's
    // tilePosition/tileScale (= zoom), which is far cheaper than redrawing a
    // world-space pattern every camera change.
    this.gridTexture = this.makeGridTexture(this.background)
    const sprite = new this.Pixi.TilingSprite({
      texture: this.gridTexture,
      width,
      height,
    })
    sprite.alpha = 0.4
    sprite.visible = this.background !== 'none'
    return sprite
  }

  private makeGridTexture(bg: TBlueprintBackground): PIXI.Texture {
    // A transparent full-tile rect fixes the texture size to GRID_TILE; the
    // pattern (dot, or top+left edge lines) is drawn over it so tiling yields
    // an evenly spaced grid.
    const g = new this.Pixi.Graphics()
    g.rect(0, 0, GRID_TILE, GRID_TILE).fill({ color: 0xffffff, alpha: 0 })
    if (bg === 'dots') {
      g.circle(1, 1, 1).fill({ color: this.gridColor, alpha: 1 })
    } else if (bg === 'lines') {
      g.rect(0, 0, GRID_TILE, 1).fill({ color: this.gridColor, alpha: 1 })
      g.rect(0, 0, 1, GRID_TILE).fill({ color: this.gridColor, alpha: 1 })
    }
    const texture = this.app.renderer.generateTexture(g)
    // Linear sampling softens the pattern when it is minified (zoomed out),
    // which together with the far-zoom alpha fade (see updateGridAlpha) avoids
    // the moiré a nearest-sampled 1px dot/line grid produces at fractional
    // tile scales.
    texture.source.scaleMode = 'linear'
    g.destroy()
    return texture
  }

  /** Switch the background pattern at runtime. */
  setBackground(bg: TBlueprintBackground): void {
    if (this.destroyed || bg === this.background) return
    this.background = bg
    const old = this.gridTexture
    this.gridTexture = this.makeGridTexture(bg)
    this.grid.texture = this.gridTexture
    this.grid.visible = bg !== 'none'
    old?.destroy(true)
    this.requestRender()
  }

  setCamera(panX: number, panY: number, zoom: number): void {
    if (this.destroyed) return
    this.zoom = zoom
    this.world.position.set(panX, panY)
    this.world.scale.set(zoom)
    // Grid follows the camera: the GRID_TILE-sized pattern scales with zoom
    // and slides with pan.
    this.grid.tilePosition.set(panX, panY)
    this.grid.tileScale.set(zoom)
    this.updateGridAlpha(zoom)
    // Wires use pixelLine (constant screen width), so the camera never needs to
    // re-stroke them: panning and zooming are a pure GPU transform of the layer.
    this.requestRender()
  }

  /** Fade the grid out as tiles approach sub-pixel density (far zoom): the
   *  pattern is meaningless when that dense and is the source of moiré. */
  private updateGridAlpha(zoom: number): void {
    if (this.background === 'none') return
    const tilePx = GRID_TILE * zoom
    const fade = Math.max(0, Math.min(1, (tilePx - 6) / 10))
    this.grid.alpha = GRID_BASE_ALPHA * fade
  }

  /** Stash the latest wire set; the frame loop reconciles geometry + colours it
   *  (the first set at once, later ones coalesced to ANIM_FRAME_MS). */
  setWires(
    wires: IBlueprintWire[],
    shouldFlow: (conn: IBlueprintWire['conn']) => boolean,
  ): void {
    if (this.destroyed) return
    this.pendingWires = wires
    this.pendingShouldFlow = shouldFlow
    this.wiresDirty = true
    this.ensureRaf()
  }

  /** Reconcile the per-wire Graphics against the pending set. Geometry is
   *  stroked (white, pixelLine) only when a wire is new or its path changed;
   *  colour is NOT baked here (see applyWireColors). This runs on a
   *  topology/geometry change, never per animation frame. */
  private reconcileWireGeometry(): void {
    this.wiresDirty = false
    this.wiresDrawnOnce = true
    const seen = new Set<string>()
    const flow: IWireNode[] = []
    for (const wire of this.pendingWires) {
      let b = this.bezierCache.get(wire.path)
      if (b === undefined) {
        b = parseCubicPath(wire.path)
        this.bezierCache.set(wire.path, b)
      }
      if (!b) continue
      const c = wire.conn
      const key = `${c.fromNode}|${c.fromPort}|${c.toNode}|${c.toPort}`
      seen.add(key)
      const dim = c.active === false
      let node = this.wireNodes.get(key)
      if (!node) {
        const gfx = new this.Pixi.Graphics()
        node = {
          gfx,
          path: '',
          bezier: b,
          baseColor: 0,
          isMidi: wire.isMidi,
          dim,
          flows: false,
          key,
        }
        this.wireNodes.set(key, node)
        this.wireLayer.addChild(gfx)
      }
      node.bezier = b
      node.baseColor = this.resolveColor(wire.color, this.connectedColor)
      node.isMidi = wire.isMidi
      node.dim = dim
      node.flows = !dim && this.pendingShouldFlow(c)
      // Re-stroke only when the geometry actually changed.
      if (node.path !== wire.path) {
        node.path = wire.path
        node.gfx.clear()
        node.gfx
          .moveTo(b.p0[0], b.p0[1])
          .bezierCurveTo(b.c1[0], b.c1[1], b.c2[0], b.c2[1], b.p3[0], b.p3[1])
          .stroke({ width: 1, pixelLine: true, color: 0xffffff })
      }
      node.gfx.alpha = dim ? 0.25 : 0.55
      if (node.flows) flow.push(node)
    }
    for (const [key, node] of this.wireNodes) {
      if (seen.has(key)) continue
      node.gfx.destroy()
      this.wireNodes.delete(key)
    }
    this.flowNodes = flow
    if (!flow.length) this.clearFlow()
    if (this.bezierCache.size > seen.size * 2 + 64) {
      const live = new Set([...this.wireNodes.values()].map((n) => n.path))
      for (const path of this.bezierCache.keys()) {
        if (!live.has(path)) this.bezierCache.delete(path)
      }
    }
  }

  /** The current colour of a wire: its live level (only in level-colouring /
   *  'levels' mode) or its base accent. In 'activity' mode wires keep their base
   *  colour (activity is motion, not colour — the two are separate). */
  private wireColorFor(node: IWireNode): number {
    if (this.colorByLevel && this.liveData && !node.isMidi && !node.dim) {
      const level = this.liveData.get(node.key)
      if (level > 0) return levelToColorNumber(level)
    }
    return node.baseColor
  }

  /** Colour wires by their live level ('levels' mode) vs keep base colour
   *  ('activity'/'simple'). Live data may still be streaming in 'activity' for
   *  the flow gate, so this flag, not the presence of data, decides colouring. */
  setLevelColoring(on: boolean): void {
    if (this.destroyed || this.colorByLevel === on) return
    this.colorByLevel = on
    this.levelsDirty = true
    this.ensureRaf()
  }

  /** Recolour every wire by tint only (no re-tessellation). Cheap enough to run
   *  on every level tick. */
  private applyWireColors(): void {
    for (const node of this.wireNodes.values()) {
      node.gfx.tint = this.wireColorFor(node)
    }
  }

  /** Stash the visible cards' meter geometry (world coords). Runs when the
   *  visible set or a card position changes, NOT per animation frame. */
  setMeters(cards: IBlueprintCard[]): void {
    if (this.destroyed) return
    const geoms: IMeterGeom[] = []
    for (const card of cards) {
      if (!card.meters) continue
      for (const m of card.meters) {
        geoms.push({
          id: m.id,
          x: card.x + m.x,
          y: card.y + m.y,
          w: m.w,
          h: m.h,
        })
      }
    }
    this.pendingMeters = geoms
    this.metersDirty = true
    this.ensureRaf()
  }

  /** Reconcile meter sprites against the pending geometry. Lays out a track +
   *  fill per meter only when its box changes; values are applied separately. */
  private reconcileMeters(): void {
    this.metersDirty = false
    const seen = new Set<string>()
    for (const g of this.pendingMeters) {
      seen.add(g.id)
      const sig = `${Math.round(g.x)},${Math.round(g.y)},${Math.round(g.w)},${Math.round(g.h)}`
      let node = this.meterNodes.get(g.id)
      if (!node) {
        const track = new this.Pixi.Sprite(this.Pixi.Texture.WHITE)
        const fill = new this.Pixi.Sprite(this.Pixi.Texture.WHITE)
        track.tint = this.trackColor
        fill.anchor.set(0, 1) // grow up from the bottom
        this.meterLayer.addChild(track, fill)
        node = { track, fill, sig: '' }
        this.meterNodes.set(g.id, node)
      }
      if (node.sig !== sig) {
        node.sig = sig
        node.track.position.set(g.x, g.y)
        node.track.width = g.w
        node.track.height = g.h
        node.fill.position.set(g.x, g.y + g.h)
        node.fill.width = g.w
      }
    }
    for (const [id, node] of this.meterNodes) {
      if (seen.has(id)) continue
      node.track.destroy()
      node.fill.destroy()
      this.meterNodes.delete(id)
    }
  }

  /** Set each meter's fill height + colour from the live channel. Cheap (a
   *  sprite scale + tint), no geometry rebuild; runs on the live tick. */
  private updateMeterValues(): void {
    if (!this.meterNodes.size) return
    const live = this.liveData
    for (const [id, node] of this.meterNodes) {
      const v = live ? Math.max(0, Math.min(1, live.get(id))) : 0
      const h = Math.round(Number(node.sig.split(',')[3]))
      node.fill.height = v * h
      node.fill.tint = levelToColorNumber(v)
    }
  }

  /** A small white dot, tinted per flow wire. Built once. */
  private makeDotTexture(): PIXI.Texture {
    const g = new this.Pixi.Graphics()
    g.circle(8, 8, 8).fill({ color: 0xffffff, alpha: 1 })
    const tex = this.app.renderer.generateTexture(g)
    tex.source.scaleMode = 'linear'
    g.destroy()
    return tex
  }

  resize(width: number, height: number, resolution: number): void {
    if (this.destroyed) return
    this.app.renderer.resolution = resolution
    this.app.renderer.resize(width, height)
    this.grid.width = width
    this.grid.height = height
    this.requestRender()
  }

  // ── Render-on-demand scheduler ────────────────────────────────────────

  /** Request a single repaint for an immediate change (camera/background/resize). */
  private requestRender(): void {
    this.needsRender = true
    this.ensureRaf()
  }

  /** Ensure exactly one frame is scheduled. */
  private ensureRaf(): void {
    if (this.rafId || this.destroyed) return
    this.rafId = requestAnimationFrame(this.frame)
  }

  /** The only place app.render() is called. Runs a frame, then reschedules
   *  itself ONLY while there is pending or ongoing (animation) work, so an idle
   *  scene drops to zero scheduled frames and zero CPU. */
  private frame = (ts: number): void => {
    this.rafId = 0
    if (this.destroyed) return
    let render = this.needsRender
    this.needsRender = false

    const animWindow = ts - this.lastAnimMs >= ANIM_FRAME_MS
    // Geometry reconcile (topology/path change) runs at once the first time then
    // throttled; colour (base or live level) is a cheap tint pass, no
    // re-tessellation, so a 60Hz level stream costs almost nothing.
    const doGeometry = this.wiresDirty && (!this.wiresDrawnOnce || animWindow)
    const doColors = doGeometry || (this.levelsDirty && animWindow)
    if (doGeometry) this.reconcileWireGeometry()
    // Meter geometry reconciles when the visible set / a card moves (infrequent,
    // not throttled); values animate from the live channel on the same throttled
    // cadence as wire colours.
    if (this.metersDirty) {
      this.reconcileMeters()
      this.updateMeterValues()
      render = true
    }
    if (doColors) {
      this.levelsDirty = false
      this.applyWireColors()
      this.updateMeterValues()
      render = true
    }
    // Flow dots: advance + reposition pooled sprites on the anim cadence.
    if (this.flowNodes.length && animWindow) {
      const dt = this.lastAnimMs ? ts - this.lastAnimMs : ANIM_FRAME_MS
      this.flowPhase = (this.flowPhase + FLOW_SPEED * (dt / 1000)) % 1
      this.drawFlow()
      render = true
    }
    if (animWindow) this.lastAnimMs = ts

    if (render) this.app.render()

    // Keep looping only while work remains; otherwise stop (0 CPU at rest).
    if (
      this.needsRender ||
      this.wiresDirty ||
      this.levelsDirty ||
      this.metersDirty ||
      this.flowNodes.length
    ) {
      this.ensureRaf()
    }
  }

  /** Position a pooled, tinted dot sprite on each flowing wire. Reuses sprites
   *  (no per-frame geometry/allocation), so flow animation does not churn. */
  private drawFlow(): void {
    const scale = FLOW_DOT_R / Math.max(this.zoom, 0.01) / 8
    let i = 0
    for (const node of this.flowNodes) {
      // Gate on REAL signal: skip wires not carrying signal above the noise
      // floor, so the animation traces the live path and stops where it stops.
      const level = this.liveData ? this.liveData.get(node.key) : 0
      if (level <= ACTIVITY_THRESHOLD) continue
      const [x, y] = cubicAt(node.bezier, this.flowPhase)
      let sprite = this.flowSprites[i]
      if (!sprite) {
        sprite = new this.Pixi.Sprite(this.dotTexture)
        sprite.anchor.set(0.5)
        sprite.alpha = 0.9
        this.flowLayer.addChild(sprite)
        this.flowSprites[i] = sprite
      }
      sprite.visible = true
      sprite.position.set(x, y)
      sprite.scale.set(scale)
      sprite.tint = this.wireColorFor(node)
      i++
    }
    for (; i < this.flowSprites.length; i++)
      this.flowSprites[i]!.visible = false
  }

  private clearFlow(): void {
    for (const s of this.flowSprites) s.visible = false
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
    this.wireNodes.clear()
    this.flowSprites = []
    this.flowNodes = []
    this.meterNodes.clear()
    // removeView:false — the <canvas> is Vue-owned and unmounts with the
    // component; we only tear down the GPU scene + textures.
    this.app.destroy({ removeView: false }, { children: true, texture: true })
  }
}
