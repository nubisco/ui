// PixiJS scene manager for the Blueprint renderer.
//
// Owns the Application, a single panned/zoomed `world` Container (the
// camera), an infinite dot-grid background, a batched wire layer, an
// animated flow layer, and a card layer of natively-painted cards. The Vue
// component (BlueprintPixiRenderer.vue) drives it with the same culled scene
// NbBlueprint feeds every renderer; this module has all the PixiJS specifics.
//
// PixiJS is passed in (not imported) so it stays a dynamically-loaded,
// externalized optional peer dependency; only `import type` references reach
// this module statically, and those are erased at build time.

import type * as PIXI from 'pixi.js'
import type { IBlueprintCard } from '../Blueprint.types'
import type { IBlueprintWire } from '../Blueprint.renderer'
import { makeColorResolver } from './pixi-color'
import { CardNode, type ICardTheme, type TCardLod } from './card-paint'
import { parseCubicPath, cubicAt, type ICubicBezier } from './wire-path'

const GRID_TILE = 24
const FLOW_SPEED = 0.45 // fraction of a wire traversed per second
const FLOW_DOT_R = 2.5

export interface IPixiSceneOptions {
  canvas: HTMLCanvasElement
  /** Reference element for resolving CSS custom properties (the container). */
  el: HTMLElement
  width: number
  height: number
  resolution: number
}

interface IFlowWire {
  bezier: ICubicBezier
  color: number
}

export class PixiScene {
  private app: PIXI.Application
  private world!: PIXI.Container
  private grid!: PIXI.TilingSprite
  private wireGfx!: PIXI.Graphics
  private flowGfx!: PIXI.Graphics
  private cardLayer!: PIXI.Container
  private theme!: ICardTheme
  private resolveColor!: ReturnType<typeof makeColorResolver>
  private cards = new Map<string, CardNode>()
  private flowWires: IFlowWire[] = []
  private flowPhase = 0
  private destroyed = false

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
    })
    if (this.destroyed) {
      this.app.destroy({ removeView: false }, { children: true })
      return
    }

    this.resolveColor = makeColorResolver(this.Pixi, opts.el)
    this.theme = {
      surface: this.resolveColor('var(--nb-c-layer-1)', 0x1a1a24),
      border: this.resolveColor('var(--nb-c-border)', 0x2a2a38),
      text: this.resolveColor('var(--nb-c-text)', 0xe8e8f0),
      textMuted: this.resolveColor('var(--nb-c-text-muted)', 0x9090a0),
      connected: this.resolveColor('var(--nb-c-primary)', 0x6366f1),
    }

    this.grid = this.buildGrid(opts.width, opts.height)
    this.app.stage.addChild(this.grid)

    this.world = new this.Pixi.Container()
    this.app.stage.addChild(this.world)

    this.wireGfx = new this.Pixi.Graphics()
    this.flowGfx = new this.Pixi.Graphics()
    this.cardLayer = new this.Pixi.Container()
    this.world.addChild(this.wireGfx, this.cardLayer, this.flowGfx)

    this.app.ticker.add(this.onTick)
  }

  private buildGrid(width: number, height: number): PIXI.TilingSprite {
    // One dot rendered to a small texture, tiled across the screen. The grid
    // lives in stage (screen) space; panning/zooming maps to the tiling
    // sprite's tilePosition/tileScale, which is far cheaper than redrawing a
    // world-space dot field every camera change.
    const dot = new this.Pixi.Graphics()
      .circle(1, 1, 1)
      .fill({ color: this.theme.border, alpha: 1 })
    const texture = this.app.renderer.generateTexture(dot)
    dot.destroy()
    const sprite = new this.Pixi.TilingSprite({
      texture,
      width,
      height,
    })
    sprite.tileScale.set(GRID_TILE / texture.width)
    sprite.alpha = 0.4
    return sprite
  }

  setCamera(panX: number, panY: number, zoom: number): void {
    if (this.destroyed) return
    this.world.position.set(panX, panY)
    this.world.scale.set(zoom)
    // Grid follows the camera: dots scale with zoom and slide with pan.
    this.grid.tilePosition.set(panX, panY)
    this.grid.tileScale.set((GRID_TILE * zoom) / GRID_TILE) // = zoom
  }

  /** Redraw the static wire layer and rebuild the flow set. */
  setWires(
    wires: IBlueprintWire[],
    shouldFlow: (conn: IBlueprintWire['conn']) => boolean,
  ): void {
    if (this.destroyed) return
    const g = this.wireGfx
    g.clear()
    const flow: IFlowWire[] = []
    for (const wire of wires) {
      const b = parseCubicPath(wire.path)
      if (!b) continue
      const color = this.resolveColor(wire.color, this.theme.connected)
      const dim = wire.conn.active === false
      g.moveTo(b.p0[0], b.p0[1])
        .bezierCurveTo(b.c1[0], b.c1[1], b.c2[0], b.c2[1], b.p3[0], b.p3[1])
        .stroke({
          width: 1.5,
          color,
          alpha: dim ? 0.25 : 0.55,
          cap: 'round',
        })
      if (!dim && shouldFlow(wire.conn)) flow.push({ bezier: b, color })
    }
    this.flowWires = flow
    if (!flow.length) this.flowGfx.clear()
  }

  /** Reconcile the card layer against the visible cards at the given LOD. */
  setCards(cards: IBlueprintCard[], lod: TCardLod): void {
    if (this.destroyed) return
    const seen = new Set<string>()
    for (const card of cards) {
      seen.add(card.id)
      let node = this.cards.get(card.id)
      if (!node) {
        node = new CardNode(this.Pixi, this.theme, this.resolveColor)
        this.cards.set(card.id, node)
        this.cardLayer.addChild(node.container)
      }
      node.update(card, lod)
    }
    for (const [id, node] of this.cards) {
      if (seen.has(id)) continue
      node.destroy()
      this.cards.delete(id)
    }
  }

  /** Show/hide the natively-painted card layer. Hidden at rest when the DOM
   *  overlay of real cards is shown; visible during gestures and far zoom. */
  setCardLayerVisible(visible: boolean): void {
    if (this.destroyed) return
    this.cardLayer.visible = visible
  }

  resize(width: number, height: number, resolution: number): void {
    if (this.destroyed) return
    this.app.renderer.resolution = resolution
    this.app.renderer.resize(width, height)
    this.grid.width = width
    this.grid.height = height
  }

  private onTick = (ticker: PIXI.Ticker): void => {
    if (this.destroyed || !this.flowWires.length) return
    this.flowPhase = (this.flowPhase + FLOW_SPEED * (ticker.deltaMS / 1000)) % 1
    const g = this.flowGfx
    g.clear()
    for (const fw of this.flowWires) {
      const [x, y] = cubicAt(fw.bezier, this.flowPhase)
      g.circle(x, y, FLOW_DOT_R).fill({ color: fw.color, alpha: 0.9 })
    }
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.app.ticker?.remove(this.onTick)
    for (const node of this.cards.values()) node.destroy()
    this.cards.clear()
    // removeView:false — the <canvas> is Vue-owned and unmounts with the
    // component; we only tear down the GPU scene + textures.
    this.app.destroy({ removeView: false }, { children: true, texture: true })
  }
}
