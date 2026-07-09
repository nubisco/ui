import type { IBlueprintCard } from './Blueprint.types'
import type { IBlueprintPort } from './BlueprintCard.types'

// Native-card port geometry. A card the Pixi renderer paints (rather than
// mounting as DOM) has no `[data-port]` element to measure, so its port centres
// are computed from the card box + the port list. The SAME function drives both
// the painter (where it draws each pin) and the wire resolver (where a wire
// attaches), so pins and wire endpoints always line up.

const HEADER_PX = 30

/** The card's ports, from the paint descriptor or the documented top-level
 *  fallback (`title`/`color`/`ports` on the card object). */
export function cardPorts(card: IBlueprintCard): IBlueprintPort[] {
  const top = (card as unknown as { ports?: IBlueprintPort[] }).ports
  return card.paint?.ports ?? top ?? []
}

/**
 * Port centre in CARD-LOCAL coordinates (relative to the card's top-left).
 * Inputs sit on the left edge, outputs on the right, evenly spread below the
 * header band. Returns null if the port id is not found.
 */
export function portLocalCenter(
  card: IBlueprintCard,
  portId: string,
): { x: number; y: number } | null {
  const ports = cardPorts(card)
  const inputs = ports.filter((p) => p.type === 'input')
  const outputs = ports.filter((p) => p.type === 'output')
  const w = card.width ?? 200
  const h = card.height ?? 120
  const spread = (n: number, i: number): number =>
    HEADER_PX + ((h - HEADER_PX) * (i + 1)) / (n + 1)

  const ii = inputs.findIndex((p) => p.id === portId)
  if (ii >= 0) return { x: 0, y: spread(inputs.length, ii) }
  const oi = outputs.findIndex((p) => p.id === portId)
  if (oi >= 0) return { x: w, y: spread(outputs.length, oi) }
  return null
}
