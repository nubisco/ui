// GPU painter for a card's inner controls.
//
// Turns a card's declarative content list (TCardPrimitive[], card-local px) into
// a PixiJS Container of drawn display objects. Static primitives (fader
// positions, knob angles, labels, curves) are drawn once; live primitives
// (meters, needles) register a cheap per-tick updater the scene calls on its
// throttled render cadence, reading the non-reactive live channel. One painter
// serves the whole board, so every card's body composites on a single GPU
// surface instead of a DOM layer per card.

import type * as PIXI from 'pixi.js'
import type { makeColorResolver } from './pixi-color'
import type { BlueprintLiveData } from './live-data'
import { levelToColorNumber } from './level-color'
import {
  isLive,
  type TCardPrimitive,
  type ICardBar,
  type ICardKnob,
  type ICardLed,
  type ICardNeedle,
  type ICardPoly,
  type ICardText,
  type ICardRect,
  type ICardIcon,
  type TCardValue,
} from '../blueprint-card-content'

type TColorResolver = ReturnType<typeof makeColorResolver>

const MONO = 'Geist Mono, Fira Code, ui-monospace, SFMono-Regular, monospace'
const SANS = 'system-ui, -apple-system, sans-serif'
// Rotary sweep: a 270° arc with the gap at the bottom (start down-left, sweep
// clockwise to down-right). Matches the DOM knob's travel.
const KNOB_START = Math.PI * 0.75
const KNOB_SWEEP = Math.PI * 1.5

/** A live primitive's per-tick updater, bound to its live-channel key. */
export interface ILiveContentObj {
  key: string
  apply: (v: number) => void
}

/** The drawn result for one card: a positioned container plus the live updaters
 *  the scene ticks. */
export interface IBuiltContent {
  container: PIXI.Container
  live: ILiveContentObj[]
}

export class CardContentPainter {
  constructor(
    private readonly Pixi: typeof PIXI,
    private readonly resolveColor: TColorResolver,
    private readonly trackColor: number,
    private readonly liveData: BlueprintLiveData | undefined,
  ) {}

  /** Build a container of drawn primitives for one card, positioned at the
   *  card's world origin. Caller owns adding it to a layer and destroying it. */
  build(
    content: TCardPrimitive[],
    originX: number,
    originY: number,
  ): IBuiltContent {
    const container = new this.Pixi.Container()
    container.position.set(originX, originY)
    const live: ILiveContentObj[] = []
    for (const p of content) {
      switch (p.kind) {
        case 'rect':
          this.drawRect(container, p)
          break
        case 'text':
          this.drawText(container, p)
          break
        case 'bar':
          this.drawBar(container, p, live)
          break
        case 'knob':
          this.drawKnob(container, p)
          break
        case 'led':
          this.drawLed(container, p, live)
          break
        case 'needle':
          this.drawNeedle(container, p, live)
          break
        case 'poly':
          this.drawPoly(container, p)
          break
        case 'icon':
          this.drawIcon(container, p)
          break
      }
    }
    return { container, live }
  }

  private col(css: string | undefined, fallback: number): number {
    return css ? this.resolveColor(css, fallback) : fallback
  }

  /** A live value's initial magnitude (0 for a channel key until first tick). */
  private initial(v: TCardValue): number {
    if (isLive(v)) return this.liveData ? this.liveData.get(v.live) : 0
    return v
  }

  private drawRect(c: PIXI.Container, p: ICardRect): void {
    const g = new this.Pixi.Graphics()
    g.roundRect(p.x, p.y, p.w, p.h, p.radius ?? 0)
    if (p.color)
      g.fill({ color: this.col(p.color, 0x000000), alpha: p.alpha ?? 1 })
    if (p.stroke)
      g.stroke({
        width: p.strokeWidth ?? 1,
        color: this.col(p.stroke, this.trackColor),
        alignment: 1,
      })
    c.addChild(g)
  }

  private drawText(c: PIXI.Container, p: ICardText): void {
    const t = new this.Pixi.Text({
      text: p.text,
      style: {
        fontFamily: p.mono ? MONO : SANS,
        fontSize: p.size ?? 11,
        fontWeight: (p.weight as PIXI.TextStyleFontWeight) ?? 'normal',
        fill: this.col(p.color, 0xf5f5f5),
      },
      resolution: 2,
    })
    const align = p.align ?? 'left'
    t.anchor.set(align === 'center' ? 0.5 : align === 'right' ? 1 : 0, 0)
    t.position.set(p.x, p.y)
    c.addChild(t)
  }

  private drawBar(
    c: PIXI.Container,
    p: ICardBar,
    live: ILiveContentObj[],
  ): void {
    const horizontal = p.orient === 'h'
    const track = new this.Pixi.Sprite(this.Pixi.Texture.WHITE)
    track.tint = this.col(p.track, this.trackColor)
    track.position.set(p.x, p.y)
    track.width = p.w
    track.height = p.h
    c.addChild(track)

    const fill = new this.Pixi.Sprite(this.Pixi.Texture.WHITE)
    // Anchor the fill so it grows from the correct edge / centre.
    if (horizontal) {
      fill.anchor.set(p.centered ? 0.5 : 0, 0)
      fill.position.set(p.centered ? p.x + p.w / 2 : p.x, p.y)
      fill.height = p.h
    } else {
      fill.anchor.set(0, p.centered ? 0.5 : 1)
      fill.position.set(p.x, p.centered ? p.y + p.h / 2 : p.y + p.h)
      fill.width = p.w
    }
    c.addChild(fill)

    const solid = this.col(
      p.color,
      this.resolveColor('var(--nb-c-primary)', 0x6366f1),
    )
    const apply = (v: number): void => {
      const t = Math.max(0, Math.min(1, v))
      if (horizontal) {
        fill.width = p.centered ? Math.abs(t - 0.5) * p.w : t * p.w
      } else {
        fill.height = p.centered ? Math.abs(t - 0.5) * p.h : t * p.h
      }
      fill.tint = p.level ? levelToColorNumber(t) : solid
    }
    apply(this.initial(p.value))

    // LED-ladder gaps: static dark rungs drawn over track + fill.
    if (p.segments && p.segments > 1) {
      const gaps = new this.Pixi.Graphics()
      const gapColor = this.col(p.track, this.trackColor)
      const span = horizontal ? p.w : p.h
      for (let i = 1; i < p.segments; i++) {
        const at = (span * i) / p.segments
        if (horizontal) gaps.rect(p.x + at - 0.5, p.y, 1, p.h)
        else gaps.rect(p.x, p.y + at - 0.5, p.w, 1)
      }
      gaps.fill({ color: gapColor })
      c.addChild(gaps)
    }

    if (isLive(p.value)) live.push({ key: p.value.live, apply })
  }

  private drawKnob(c: PIXI.Container, p: ICardKnob): void {
    const g = new this.Pixi.Graphics()
    const accent = this.col(
      p.color,
      this.resolveColor('var(--nb-c-primary)', 0x6366f1),
    )
    const v = Math.max(0, Math.min(1, this.initial(p.value)))
    // Bezel ring + inner cap.
    g.circle(p.cx, p.cy, p.r).stroke({ width: 1.5, color: this.trackColor })
    g.circle(p.cx, p.cy, p.r * 0.62).fill({
      color: this.trackColor,
      alpha: 0.5,
    })
    // Value arc. A balance knob fills from 12 o'clock toward the value.
    const end = KNOB_START + v * KNOB_SWEEP
    if (p.centered) {
      const mid = KNOB_START + 0.5 * KNOB_SWEEP
      g.arc(
        p.cx,
        p.cy,
        p.r * 0.86,
        Math.min(mid, end),
        Math.max(mid, end),
      ).stroke({
        width: 2.5,
        color: accent,
      })
    } else {
      g.arc(p.cx, p.cy, p.r * 0.86, KNOB_START, end).stroke({
        width: 2.5,
        color: accent,
      })
    }
    // Pointer notch from centre outward at the value angle.
    const nx = p.cx + Math.cos(end) * p.r * 0.55
    const ny = p.cy + Math.sin(end) * p.r * 0.55
    g.moveTo(p.cx, p.cy).lineTo(nx, ny).stroke({ width: 1.5, color: accent })
    c.addChild(g)
  }

  private drawLed(
    c: PIXI.Container,
    p: ICardLed,
    live: ILiveContentObj[],
  ): void {
    const color = this.col(
      p.color,
      this.resolveColor('var(--nb-c-success, #4ade80)', 0x4ade80),
    )
    const g = new this.Pixi.Graphics()
    g.circle(p.cx, p.cy, p.r).fill({ color })
    g.circle(p.cx, p.cy, p.r).stroke({ width: 1, color, alignment: 0 })
    c.addChild(g)
    const apply = (v: number): void => {
      g.alpha = v >= 0.5 ? 1 : 0.22
    }
    apply(this.initial(p.on))
    if (isLive(p.on)) live.push({ key: p.on.live, apply })
  }

  private drawNeedle(
    c: PIXI.Container,
    p: ICardNeedle,
    live: ILiveContentObj[],
  ): void {
    // Faint track so the needle reads even at rest.
    const track = new this.Pixi.Sprite(this.Pixi.Texture.WHITE)
    track.tint = this.trackColor
    if (p.vertical) {
      track.position.set(p.x + p.w / 2 - 0.5, p.y)
      track.width = 1
      track.height = p.h
    } else {
      track.position.set(p.x, p.y + p.h / 2 - 0.5)
      track.width = p.w
      track.height = 1
    }
    c.addChild(track)

    const needle = new this.Pixi.Sprite(this.Pixi.Texture.WHITE)
    needle.tint = this.col(p.color, 0xf5f5f5)
    if (p.vertical) {
      needle.width = p.w
      needle.height = 3
      needle.anchor.set(0, 0.5)
    } else {
      needle.width = 3
      needle.height = p.h
      needle.anchor.set(0.5, 0)
    }
    c.addChild(needle)

    const apply = (v: number): void => {
      const t = Math.max(0, Math.min(1, v))
      if (p.vertical) needle.position.set(p.x, p.y + t * p.h)
      else needle.position.set(p.x + t * p.w, p.y)
    }
    apply(this.initial(p.pos))
    if (isLive(p.pos)) live.push({ key: p.pos.live, apply })
  }

  private drawPoly(c: PIXI.Container, p: ICardPoly): void {
    if (p.points.length < 2) return
    const g = new this.Pixi.Graphics()
    const [x0, y0] = p.points[0]!
    g.moveTo(x0, y0)
    for (let i = 1; i < p.points.length; i++)
      g.lineTo(p.points[i]![0], p.points[i]![1])
    if (p.closed) g.closePath()
    if (p.fill) g.fill({ color: this.col(p.fill, 0x000000), alpha: 0.5 })
    g.stroke({
      width: p.width ?? 1.5,
      color: this.col(
        p.color,
        this.resolveColor('var(--nb-c-primary)', 0x6366f1),
      ),
    })
    c.addChild(g)
  }

  private drawIcon(c: PIXI.Container, p: ICardIcon): void {
    const g = new this.Pixi.Graphics()
    const color = this.col(p.color, 0xf5f5f5)
    const { x, y, size: s } = p
    switch (p.icon) {
      case 'play':
        g.moveTo(x, y)
          .lineTo(x, y + s)
          .lineTo(x + s * 0.9, y + s / 2)
          .closePath()
          .fill({ color })
        break
      case 'stop':
        g.rect(x, y, s, s).fill({ color })
        break
      case 'pause':
        g.rect(x, y, s * 0.32, s)
          .rect(x + s * 0.6, y, s * 0.32, s)
          .fill({ color })
        break
      case 'mono':
        g.circle(x + s / 2, y + s / 2, s * 0.42).stroke({ width: 1.5, color })
        break
      case 'stereo':
        g.circle(x + s * 0.34, y + s / 2, s * 0.32)
          .circle(x + s * 0.66, y + s / 2, s * 0.32)
          .stroke({ width: 1.5, color })
        break
    }
    c.addChild(g)
  }
}
