/**
 * Viewport-aware placement for floating surfaces (hint popovers, walkthrough
 * coach-marks) anchored to an element.
 *
 * Deliberately a pure function over plain rectangles rather than a method on a
 * component: placement is the part of a popover that is easy to get subtly
 * wrong and impossible to eyeball in a unit test, so it is kept free of DOM
 * access. Callers pass `getBoundingClientRect()` output and the viewport size;
 * everything else is arithmetic.
 */

export type TAnchorSide = 'top' | 'bottom' | 'left' | 'right'

/** The subset of DOMRect this module needs. Any DOMRect satisfies it. */
export interface IAnchorRect {
  top: number
  left: number
  width: number
  height: number
}

export interface IAnchorSize {
  width: number
  height: number
}

export interface IAnchorOptions {
  /** Preferred side. Flipped only when it does not fit. */
  side: TAnchorSide
  /** Distance between the anchor edge and the floating surface. */
  gap?: number
  /** Minimum distance kept between the surface and the viewport edge. */
  inset?: number
  viewport: IAnchorSize
}

export interface IAnchorPlacement {
  /** Viewport (`position: fixed`) coordinates. */
  top: number
  left: number
  /** The side actually used, after any flip. Drives the arrow direction. */
  side: TAnchorSide
  /**
   * Where the anchor's centre sits along the surface's cross axis, as a
   * percentage of the surface's size on that axis. After a viewport clamp the
   * surface and the anchor are no longer centred on each other, so an arrow
   * pinned at a fixed 50% points at nothing; consumers feed this into a CSS
   * custom property to re-aim it.
   */
  arrowOffset: number
}

/**
 * Order in which sides are tried when the requested one does not fit: the
 * opposite side first (visually the least surprising fallback), then the
 * orthogonal pair, which is what rescues anchors sitting in a viewport corner
 * where both sides of the requested axis overflow.
 */
const FALLBACK_ORDER: Record<TAnchorSide, readonly TAnchorSide[]> = {
  top: ['bottom', 'right', 'left'],
  bottom: ['top', 'right', 'left'],
  left: ['right', 'bottom', 'top'],
  right: ['left', 'bottom', 'top'],
}

const ARROW_MARGIN = 10

function placeFor(
  side: TAnchorSide,
  anchor: IAnchorRect,
  floating: IAnchorSize,
  gap: number,
): { top: number; left: number } {
  const centerX = anchor.left + anchor.width / 2 - floating.width / 2
  const centerY = anchor.top + anchor.height / 2 - floating.height / 2

  switch (side) {
    case 'top':
      return { top: anchor.top - floating.height - gap, left: centerX }
    case 'bottom':
      return { top: anchor.top + anchor.height + gap, left: centerX }
    case 'left':
      return { top: centerY, left: anchor.left - floating.width - gap }
    case 'right':
    default:
      return { top: centerY, left: anchor.left + anchor.width + gap }
  }
}

function fits(
  top: number,
  left: number,
  floating: IAnchorSize,
  inset: number,
  viewport: IAnchorSize,
): boolean {
  return (
    left >= inset &&
    top >= inset &&
    left + floating.width <= viewport.width - inset &&
    top + floating.height <= viewport.height - inset
  )
}

export function placeAnchored(
  anchor: IAnchorRect,
  floating: IAnchorSize,
  { side, gap = 8, inset = 12, viewport }: IAnchorOptions,
): IAnchorPlacement {
  let chosen = side
  let placed = placeFor(side, anchor, floating, gap)

  // Zero-size floating surfaces show up on the first frame, before layout has
  // measured them. Flipping on those numbers would pick a side at random, so
  // the preferred side is kept until a real measurement arrives.
  if (
    floating.width > 0 &&
    floating.height > 0 &&
    !fits(placed.top, placed.left, floating, inset, viewport)
  ) {
    for (const candidate of FALLBACK_ORDER[side]) {
      const next = placeFor(candidate, anchor, floating, gap)
      if (fits(next.top, next.left, floating, inset, viewport)) {
        chosen = candidate
        placed = next
        break
      }
    }
  }

  // Backstop for the case where no side fits at all (tiny viewport, long
  // body copy): keep the surface onscreen even if it now overlaps the anchor.
  let { top, left } = placed
  if (floating.width > 0 && floating.height > 0) {
    left = Math.min(
      Math.max(left, inset),
      Math.max(inset, viewport.width - floating.width - inset),
    )
    top = Math.min(
      Math.max(top, inset),
      Math.max(inset, viewport.height - floating.height - inset),
    )
  }

  const horizontal = chosen === 'top' || chosen === 'bottom'
  const extent = horizontal ? floating.width : floating.height
  const anchorCenter = horizontal
    ? anchor.left + anchor.width / 2 - left
    : anchor.top + anchor.height / 2 - top
  const arrowOffset =
    extent > 0
      ? (Math.min(Math.max(anchorCenter, ARROW_MARGIN), extent - ARROW_MARGIN) /
          extent) *
        100
      : 50

  return { top, left, side: chosen, arrowOffset }
}

/** Live viewport size, guarded for SSR / non-DOM environments. */
export function viewportSize(): IAnchorSize {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  return { width: window.innerWidth, height: window.innerHeight }
}
