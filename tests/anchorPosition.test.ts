import { describe, it, expect } from 'vitest'
import { placeAnchored } from '../src/utils/anchorPosition.helper'

const viewport = { width: 1000, height: 800 }
const floating = { width: 200, height: 100 }

const rect = (top: number, left: number, width = 40, height = 20) => ({
  top,
  left,
  width,
  height,
})

describe('placeAnchored', () => {
  it('keeps the requested side when it fits', () => {
    const placement = placeAnchored(rect(400, 480), floating, {
      side: 'bottom',
      viewport,
    })
    expect(placement.side).toBe('bottom')
    expect(placement.top).toBe(400 + 20 + 8)
  })

  it('centers the surface on the anchor along the cross axis', () => {
    const placement = placeAnchored(rect(400, 480), floating, {
      side: 'bottom',
      viewport,
    })
    // anchor centre 500, surface half-width 100
    expect(placement.left).toBe(400)
    expect(placement.arrowOffset).toBeCloseTo(50)
  })

  it('flips to the opposite side when the requested one overflows', () => {
    const placement = placeAnchored(rect(10, 480), floating, {
      side: 'top',
      viewport,
    })
    expect(placement.side).toBe('bottom')
  })

  it('falls back to an orthogonal side in a viewport corner', () => {
    // Anchor pinned to the top edge and tall enough that neither top nor
    // bottom fits: only a left/right placement can work.
    const placement = placeAnchored(rect(0, 480, 40, 780), floating, {
      side: 'top',
      viewport,
    })
    expect(['left', 'right']).toContain(placement.side)
  })

  it('clamps a surface that fits on no side back inside the viewport', () => {
    const tight = { width: 300, height: 300 }
    const placement = placeAnchored(rect(20, 20), tight, {
      side: 'left',
      viewport: { width: 320, height: 320 },
    })
    expect(placement.left).toBeGreaterThanOrEqual(0)
    expect(placement.top).toBeGreaterThanOrEqual(0)
    expect(placement.left + tight.width).toBeLessThanOrEqual(320)
  })

  it('re-aims the arrow after a horizontal clamp', () => {
    // A surface too wide to fit on any side, anchored hard against the left
    // edge: it gets clamped to the inset, so an arrow left at 50% would point
    // well past the anchor.
    const wide = { width: 990, height: 100 }
    const placement = placeAnchored(rect(400, 0, 20, 20), wide, {
      side: 'bottom',
      viewport,
    })
    expect(placement.side).toBe('bottom')
    expect(placement.left).toBe(12) // the inset
    expect(placement.arrowOffset).toBeLessThan(50)
    expect(placement.arrowOffset).toBeGreaterThan(0)
  })

  it('does not flip on an unmeasured (zero-size) surface', () => {
    const placement = placeAnchored(
      rect(0, 0),
      { width: 0, height: 0 },
      { side: 'top', viewport },
    )
    expect(placement.side).toBe('top')
    expect(placement.arrowOffset).toBe(50)
  })

  it('honours a custom gap', () => {
    const placement = placeAnchored(rect(400, 480), floating, {
      side: 'bottom',
      gap: 24,
      viewport,
    })
    expect(placement.top).toBe(400 + 20 + 24)
  })
})
