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
import { cardPorts, portLocalCenter } from '../blueprint-port-geometry'
import { makeColorResolver } from './pixi-color'
import { parseCubicPath, cubicAt, type ICubicBezier } from './wire-path'
import { levelToColorNumber } from './level-color'
import type { BlueprintLiveData } from './live-data'
import { CardContentPainter, type IBuiltContent } from './card-content-painter'
import type { TCardPrimitive } from '../blueprint-card-content'

const GRID_TILE = 24
const FLOW_SPEED = 0.45 // fraction of a wire traversed per second
const FLOW_DOT_R = 2.5
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

// One drawn card: a Graphics holding its chrome (frame / border / accent bar /
// port pins), redrawn only when its signature (geometry / colour / ports)
// changes. This is the native card painter that lets the DOM overlay drop to
// just the focused card, collapsing N composited DOM layers to one GPU surface.
interface ICardNode {
  gfx: PIXI.Graphics
  label?: PIXI.Text
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
  // Card chrome layer: one Graphics per painted card. Reconciled on a
  // visible-set / geometry change, never per animation frame.
  private cardLayer!: PIXI.Container
  private cardNodes = new Map<string, ICardNode>()
  private pendingCards: IBlueprintCard[] = []
  private cardsDirty = false
  private cardBg = 0x101218
  private cardBorder = 0x2a2a38
  private cardText = 0xf5f5f5
  // Card-content layer: the GPU-drawn inner controls (faders, knobs, meters,
  // labels...) of every painted card. Built by CardContentPainter, reconciled by
  // a per-card content signature; static primitives cost nothing at rest, live
  // ones (`liveContent`) update on the throttled animation tick.
  private contentLayer!: PIXI.Container
  private contentNodes = new Map<
    string,
    { built: IBuiltContent; sig: string }
  >()
  private liveContent: IBuiltContent['live'] = []
  private contentPainter!: CardContentPainter
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
    this.cardBg = this.resolveColor('var(--nb-c-layer-1)', 0x101218)
    this.cardBorder = this.resolveColor('var(--nb-c-border)', 0x2a2a38)
    this.cardText = this.resolveColor('var(--nb-c-text)', 0xf5f5f5)

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

    this.cardLayer = new this.Pixi.Container()
    this.contentLayer = new this.Pixi.Container()
    this.wireLayer = new this.Pixi.Container()
    this.meterLayer = new this.Pixi.Container()
    this.flowLayer = new this.Pixi.Container()
    // Order: card chrome -> card content -> wires -> meters -> flow dots (top).
    this.world.addChild(
      this.cardLayer,
      this.contentLayer,
      this.wireLayer,
      this.meterLayer,
      this.flowLayer,
    )
    this.dotTexture = this.makeDotTexture()
    this.trackColor = this.resolveColor('var(--nb-c-layer-2)', 0x16161e)
    this.contentPainter = new CardContentPainter(
      this.Pixi,
      this.resolveColor,
      this.trackColor,
      this.liveData,
    )
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

  /** The current colour of a wire: its live level (audio, active, non-MIDI) or
   *  its base accent. Applied as a cheap tint, no geometry rebuild. */
  private wireColorFor(node: IWireNode): number {
    if (this.liveData && !node.isMidi && !node.dim) {
      const level = this.liveData.get(node.key)
      if (level > 0) return levelToColorNumber(level)
    }
    return node.baseColor
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

  /** Stash the cards to paint natively (chrome). Excludes the focused card,
   *  which the host keeps as a real interactive DOM overlay. Reconciled on a
   *  visible-set / geometry change, not per frame. */
  setCards(cards: IBlueprintCard[], focusedId: string | null): void {
    if (this.destroyed) return
    this.pendingCards = focusedId
      ? cards.filter((c) => c.id !== focusedId)
      : cards
    this.cardsDirty = true
    this.ensureRaf()
  }

  /** Reconcile per-card chrome Graphics against the pending set. Redraws a card
   *  only when its signature (geometry / colour / port count) changes. */
  private reconcileCardChrome(): void {
    this.cardsDirty = false
    const seen = new Set<string>()
    for (const card of this.pendingCards) {
      seen.add(card.id)
      const w = card.width ?? 200
      const h = card.height ?? 120
      const color =
        card.paint?.color ?? (card as unknown as { color?: string }).color ?? ''
      const title =
        card.paint?.title ?? (card as unknown as { title?: string }).title ?? ''
      const sig = `${Math.round(card.x)},${Math.round(card.y)},${Math.round(w)},${Math.round(h)},${color},${cardPorts(card).length},${title}`
      let node = this.cardNodes.get(card.id)
      if (!node) {
        const gfx = new this.Pixi.Graphics()
        this.cardLayer.addChild(gfx)
        node = { gfx, sig: '' }
        this.cardNodes.set(card.id, node)
      }
      if (node.sig !== sig) {
        node.sig = sig
        this.drawCardChrome(node.gfx, card, w, h)
        this.updateCardLabel(node, card, title)
      }
    }
    for (const [id, node] of this.cardNodes) {
      if (seen.has(id)) continue
      node.gfx.destroy()
      node.label?.destroy()
      this.cardNodes.delete(id)
    }
  }

  /** Draw one card's chrome: rounded frame + border, a top accent bar in the
   *  card colour, and port pins evenly distributed down the left/right edges. */
  private drawCardChrome(
    gfx: PIXI.Graphics,
    card: IBlueprintCard,
    w: number,
    h: number,
  ): void {
    const { x, y } = card
    const colorStr =
      card.paint?.color ?? (card as unknown as { color?: string }).color
    const accent = colorStr
      ? this.resolveColor(colorStr, this.connectedColor)
      : this.connectedColor
    gfx.clear()
    gfx
      .roundRect(x, y, w, h, 10)
      .fill({ color: this.cardBg })
      .stroke({ width: 1, color: this.cardBorder, alignment: 1 })
    gfx.roundRect(x, y, w, 3, 2).fill({ color: accent })
    // Port pins, placed by the shared geometry so wire endpoints line up.
    for (const p of cardPorts(card)) {
      const local = portLocalCenter(card, p.id)
      if (local)
        gfx.circle(x + local.x, y + local.y, 3).fill({ color: this.cardBorder })
    }
  }

  /** Create / update / remove a painted card's title text (cached per card). */
  private updateCardLabel(
    node: ICardNode,
    card: IBlueprintCard,
    title: string,
  ): void {
    if (!title) {
      node.label?.destroy()
      node.label = undefined
      return
    }
    if (!node.label) {
      node.label = new this.Pixi.Text({
        text: title,
        style: {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 12,
          fontWeight: '600',
          fill: this.cardText,
        },
        resolution: 2,
      })
      this.cardLayer.addChild(node.label)
    } else {
      node.label.text = title
    }
    node.label.position.set(card.x + 10, card.y + 8)
  }

  /** Reconcile each painted card's inner content (faders, knobs, meters, ...)
   *  against its descriptor. A card is rebuilt only when its content signature
   *  changes; a pure move just repositions the existing container. Live
   *  primitives across all cards are collected into `liveContent` for the tick
   *  updater. Runs with the chrome reconcile (visible-set / edit change). */
  private reconcileContent(): void {
    const seen = new Set<string>()
    const live: IBuiltContent['live'] = []
    for (const card of this.pendingCards) {
      const content =
        card.paint?.content ??
        (card as unknown as { content?: TCardPrimitive[] }).content
      if (!content || !content.length) continue
      seen.add(card.id)
      const sig = JSON.stringify(content)
      let node = this.contentNodes.get(card.id)
      if (!node || node.sig !== sig) {
        node?.built.container.destroy({ children: true })
        const built = this.contentPainter.build(content, card.x, card.y)
        this.contentLayer.addChild(built.container)
        node = { built, sig }
        this.contentNodes.set(card.id, node)
      } else {
        // Unchanged content, possibly moved: keep the drawn objects, reposition.
        node.built.container.position.set(card.x, card.y)
      }
      for (const l of node.built.live) live.push(l)
    }
    for (const [id, node] of this.contentNodes) {
      if (seen.has(id)) continue
      node.built.container.destroy({ children: true })
      this.contentNodes.delete(id)
    }
    this.liveContent = live
  }

  /** Push the live channel into every card's live primitives (meters, needles).
   *  Cheap: a sprite scale / position / tint per object, no rebuild. Runs on the
   *  throttled animation tick alongside wire colours + meters. */
  private updateLiveContent(): void {
    if (!this.liveContent.length || !this.liveData) return
    for (const l of this.liveContent) l.apply(this.liveData.get(l.key))
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
    if (this.cardsDirty) {
      this.reconcileCardChrome()
      this.reconcileContent()
      render = true
    }
    if (this.metersDirty) {
      this.reconcileMeters()
      this.updateMeterValues()
      render = true
    }
    if (doColors) {
      this.levelsDirty = false
      this.applyWireColors()
      this.updateMeterValues()
      this.updateLiveContent()
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
    this.contentNodes.clear()
    this.liveContent = []
    // removeView:false — the <canvas> is Vue-owned and unmounts with the
    // component; we only tear down the GPU scene + textures.
    this.app.destroy({ removeView: false }, { children: true, texture: true })
  }
}
