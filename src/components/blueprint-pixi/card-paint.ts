// Native PixiJS painter for the standard NbBlueprintCard anatomy.
//
// The PixiJS renderer cannot run the Vue `#card` component on the GPU, so it
// paints cards itself from the structured `IBlueprintCardPaint` descriptor
// (or well-known top-level fields on the card object). This is only what the
// user sees while panning/zooming and at far zoom; at rest and near zoom the
// real DOM card is shown on top (see BlueprintPixiRenderer.vue). The painter
// therefore aims for a faithful silhouette (box, accent, title, ports), not
// pixel-parity with every CSS detail.

import type * as PIXI from 'pixi.js'
import type { IBlueprintCard, IBlueprintCardPaint } from '../Blueprint.types'
import type { TColorResolver } from './pixi-color'

/** Level of detail for a painted card. */
export type TCardLod = 'box' | 'full'

const DEFAULT_W = 220
const DEFAULT_H = 120
const RADIUS = 8
const ACCENT_H = 4
const HEADER_Y = 16
const PORT_R = 4
const PORT_TOP = 40
const PORT_GAP = 18

/** Theme colors the painter needs, resolved once per scene from tokens. */
export interface ICardTheme {
  surface: number
  border: number
  text: number
  textMuted: number
  connected: number
}

const STATUS_COLORS: Record<string, number> = {
  valid: 0x22c55e,
  warning: 0xf59e0b,
  error: 0xef4444,
}

/**
 * Resolve the paint descriptor for a card: explicit `card.paint` wins, else
 * fall back to well-known top-level fields many hosts already set on their
 * card objects (title, color, ports, ...). Returns a plain object so the
 * painter never reaches into the raw card again.
 */
export function resolveCardPaint(card: IBlueprintCard): IBlueprintCardPaint {
  if (card.paint) return card.paint
  const loose = card as IBlueprintCard & Partial<IBlueprintCardPaint>
  return {
    title: loose.title,
    color: loose.color,
    category: loose.category,
    status: loose.status,
    collapsed: loose.collapsed,
    ports: loose.ports,
    connectedPorts: loose.connectedPorts,
    activePorts: loose.activePorts,
  }
}

/**
 * One painted card: a Container holding the box Graphics and (at full LOD) a
 * title/category Text. Reconciles against a cached signature so a card only
 * re-draws when its geometry, LOD, or paint data actually change, which keeps
 * the per-frame cost near zero when only the camera moves.
 */
export class CardNode {
  readonly container: PIXI.Container
  private readonly gfx: PIXI.Graphics
  private title: PIXI.Text | null = null
  private sig = ''

  constructor(
    private readonly Pixi: typeof PIXI,
    private readonly theme: ICardTheme,
    private readonly resolveColor: TColorResolver,
  ) {
    this.container = new Pixi.Container()
    this.gfx = new Pixi.Graphics()
    this.container.addChild(this.gfx)
  }

  /** Position + redraw this card if anything visible changed. */
  update(card: IBlueprintCard, lod: TCardLod): void {
    this.container.position.set(card.x, card.y)
    const paint = resolveCardPaint(card)
    const w = card.width ?? DEFAULT_W
    const h = paint.collapsed ? HEADER_Y + 12 : (card.height ?? DEFAULT_H)
    const sig = this.signature(card.id, w, h, lod, paint)
    if (sig === this.sig) return
    this.sig = sig
    this.draw(w, h, lod, paint)
  }

  private signature(
    id: string,
    w: number,
    h: number,
    lod: TCardLod,
    paint: IBlueprintCardPaint,
  ): string {
    const ports = (paint.ports ?? []).map((p) => `${p.id}:${p.type}`).join(',')
    return [
      id,
      Math.round(w),
      Math.round(h),
      lod,
      paint.title ?? '',
      paint.category ?? '',
      paint.color ?? '',
      paint.status ?? '',
      paint.collapsed ? 1 : 0,
      ports,
      (paint.connectedPorts ?? []).join(','),
      (paint.activePorts ?? []).join(','),
    ].join('|')
  }

  private draw(
    w: number,
    h: number,
    lod: TCardLod,
    paint: IBlueprintCardPaint,
  ): void {
    const accent = this.resolveColor(paint.color, this.theme.border)
    const g = this.gfx
    g.clear()
    // Body
    g.roundRect(0, 0, w, h, RADIUS)
      .fill({ color: this.theme.surface, alpha: 1 })
      .stroke({ width: 1, color: this.theme.border, alpha: 1 })
    // Top accent bar
    g.roundRect(0, 0, w, ACCENT_H + RADIUS, RADIUS).fill({
      color: accent,
      alpha: 1,
    })
    g.rect(0, ACCENT_H, w, RADIUS).fill({ color: this.theme.surface, alpha: 1 })
    // Status dot
    if (paint.status && paint.status !== 'none') {
      const c = STATUS_COLORS[paint.status] ?? this.theme.textMuted
      g.circle(w - 12, HEADER_Y, 3).fill({ color: c, alpha: 1 })
    }
    // Ports
    this.drawPorts(g, w, h, paint)
    // Title / category (full LOD only)
    if (lod === 'full') this.drawText(paint)
    else this.clearText()
  }

  private drawPorts(
    g: PIXI.Graphics,
    w: number,
    h: number,
    paint: IBlueprintCardPaint,
  ): void {
    const ports = paint.ports ?? []
    const connected = new Set(paint.connectedPorts ?? [])
    const active = new Set(paint.activePorts ?? [])
    let li = 0
    let ri = 0
    for (const p of ports) {
      const onLeft = p.type === 'input'
      const idx = onLeft ? li++ : ri++
      const y = Math.min(PORT_TOP + idx * PORT_GAP, h - 8)
      const x = onLeft ? 0 : w
      const isActive = active.has(p.id)
      const isConn = connected.has(p.id) || isActive
      const color = this.resolveColor(p.color, this.theme.connected)
      g.circle(x, y, PORT_R).fill({
        color: isConn ? color : this.theme.surface,
        alpha: 1,
      })
      g.circle(x, y, PORT_R).stroke({
        width: 1.5,
        color,
        alpha: isConn ? 1 : 0.7,
      })
    }
  }

  private drawText(paint: IBlueprintCardPaint): void {
    const label = paint.title ?? ''
    if (!this.title) {
      this.title = new this.Pixi.Text({
        text: label,
        style: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12,
          fontWeight: '600',
          fill: this.theme.text,
        },
      })
      this.title.position.set(10, 9)
      this.container.addChild(this.title)
    } else {
      this.title.text = label
      this.title.visible = true
    }
  }

  private clearText(): void {
    if (this.title) this.title.visible = false
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
