import { describe, it, expect, vi } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'

// The component's DOM contract is what we test here; stub the PixiJS scene so
// mounting never reaches a (nonexistent) WebGL context in jsdom. The scene
// rejects, the component catches it, emits `unavailable`, and keeps rendering
// the DOM overlay, which is exactly what these tests assert on.
vi.mock('../src/components/blueprint-pixi/pixi-scene', () => ({
  PixiScene: { create: () => Promise.reject(new Error('no webgl in test')) },
}))
import {
  parseCubicPath,
  cubicAt,
  sampleCubic,
  cubicLength,
  resampleUniformArc,
  vibrateOffset,
} from '../src/components/blueprint-pixi/wire-path'
import BlueprintPixiRenderer from '../src/components/BlueprintPixiRenderer.vue'
import BlueprintCard from '../src/components/BlueprintCard.vue'
import type { IBlueprintCard } from '../src/components/Blueprint.types'

describe('wire-path', () => {
  it('parses a M..C cubic path string into control points', () => {
    const b = parseCubicPath('M 0 0 C 5 0, 5 10, 10 10')
    expect(b).toEqual({
      p0: [0, 0],
      c1: [5, 0],
      c2: [5, 10],
      p3: [10, 10],
    })
  })

  it('handles negative and decimal coordinates', () => {
    const b = parseCubicPath('M -1.5 2 C 0 0, 3.25 -4, 10 10')
    expect(b?.p0).toEqual([-1.5, 2])
    expect(b?.c2).toEqual([3.25, -4])
  })

  it('returns null for a non-cubic / malformed path', () => {
    expect(parseCubicPath('M 0 0 L 10 10')).toBeNull()
    expect(parseCubicPath('garbage')).toBeNull()
  })

  it('evaluates endpoints and midpoint of a cubic', () => {
    const b = parseCubicPath('M 0 0 C 0 10, 10 10, 10 0')!
    expect(cubicAt(b, 0)).toEqual([0, 0])
    expect(cubicAt(b, 1)).toEqual([10, 0])
    const [mx, my] = cubicAt(b, 0.5)
    expect(mx).toBeCloseTo(5)
    expect(my).toBeCloseTo(7.5)
  })

  it('samples segments+1 points', () => {
    const b = parseCubicPath('M 0 0 C 0 10, 10 10, 10 0')!
    expect(sampleCubic(b, 8)).toHaveLength(9)
  })
})

describe("'vibrate' wire wave", () => {
  // The shape Blueprint.vue emits: control points at |dx| * 0.4, sharing the
  // endpoints' y.
  const wire = (dx: number, dy: number) => {
    const cpx = Math.abs(dx) * 0.4
    return parseCubicPath(`M 0 0 C ${cpx} 0, ${dx - cpx} ${dy}, ${dx} ${dy}`)!
  }
  const SPW = 8

  const segmentLengths = (pts: Float32Array, n: number) => {
    const out: number[] = []
    for (let i = 1; i <= n; i++)
      out.push(
        Math.hypot(
          pts[i * 4]! - pts[(i - 1) * 4]!,
          pts[i * 4 + 1]! - pts[(i - 1) * 4 + 1]!,
        ),
      )
    return out
  }

  it('spaces samples evenly by arc length, unlike t-uniform sampling', () => {
    const b = wire(900, 140)
    const n = 64
    const seg = segmentLengths(resampleUniformArc(b, n), n)
    expect(Math.max(...seg) / Math.min(...seg)).toBeLessThan(1.02)

    // The t-uniform sampling this replaced varies far more along one wire.
    const tPts = sampleCubic(b, n)
    const tSeg = tPts
      .slice(1)
      .map((p, i) => Math.hypot(p[0] - tPts[i]![0], p[1] - tPts[i]![1]))
    expect(Math.max(...tSeg) / Math.min(...tSeg)).toBeGreaterThan(1.25)
  })

  it('keeps wavelength constant in world px regardless of wire length', () => {
    // The old scheme fixed the wave COUNT per wire, so wavelength scaled with
    // card distance (~20px on a short wire, ~330px on a long one). Sample
    // count now scales with length instead, holding wavelength fixed.
    const wavelength = 48
    const lengths = [120, 260, 500, 900, 1400, 2000].map((dx) => {
      const b = wire(dx, 40)
      const n = Math.round((cubicLength(b) / wavelength) * SPW)
      const seg = segmentLengths(resampleUniformArc(b, n), n)
      const mean = seg.reduce((a, c) => a + c, 0) / seg.length
      return mean * SPW // rendered wavelength, world px
    })
    // Sample count rounds to a whole number, so the shortest wires quantise a
    // few percent off nominal. That is the entire remaining variation: the old
    // scheme spread the same set of wires across a 16x range.
    for (const l of lengths)
      expect(Math.abs(l / wavelength - 1)).toBeLessThan(0.1)
    expect(Math.max(...lengths) / Math.min(...lengths)).toBeLessThan(1.15)
  })

  it('travels from the source port toward the destination port', () => {
    // Sample 0 is the path's `M` point = the SOURCE (output) port. A crest
    // must move toward higher indices as the phase advances, so the wave runs
    // output -> input, with the signal. Regression: the time term used to be
    // added rather than subtracted, running every wire backwards.
    const n = 240
    const crestIndex = (phase: number) => {
      let best = 0
      let bestV = -Infinity
      // Look near the middle, where the envelope is widest and unambiguous.
      for (let i = n * 0.4; i < n * 0.6; i += 0.01) {
        const v = vibrateOffset(i, n, SPW, phase)
        if (v > bestV) {
          bestV = v
          best = i
        }
      }
      return best
    }
    const before = crestIndex(0.2)
    const after = crestIndex(0.2 + 0.4) // phase advances with time
    expect(after).toBeGreaterThan(before)
  })

  it('pins both ends to the ports so the wire still meets its plugs', () => {
    for (const phase of [0, 1, 2, 3, 4, 5, 6]) {
      expect(vibrateOffset(0, 64, SPW, phase)).toBeCloseTo(0)
      expect(vibrateOffset(64, 64, SPW, phase)).toBeCloseTo(0)
    }
  })

  it('renders at least 95% of the true crest at 8 samples per wave', () => {
    // Undersampling clips the crests of the polyline. Guards the sampling
    // density against being lowered until the wave visibly flattens.
    const n = 8 * 20
    let worst = Infinity
    for (let p = 0; p < 40; p++) {
      const phase = (p / 40) * Math.PI * 2
      let drawn = 0
      for (let i = 0; i <= n; i++)
        drawn = Math.max(drawn, Math.abs(vibrateOffset(i, n, SPW, phase)))
      let truePeak = 0
      for (let i = 0; i <= n; i += 0.01)
        truePeak = Math.max(truePeak, Math.abs(vibrateOffset(i, n, SPW, phase)))
      worst = Math.min(worst, drawn / truePeak)
    }
    expect(worst).toBeGreaterThan(0.95)
  })
})

describe('BlueprintPixiRenderer DOM contract', () => {
  const baseProps = {
    panX: 0,
    panY: 0,
    zoom: 1,
    isTransforming: false,
    windowed: false,
    visibleCards: [],
    dragWire: null,
    shouldFlow: () => false,
    background: 'dots' as const,
  }
  const conn = { fromNode: 'a', fromPort: 'out', toNode: 'b', toPort: 'in' }
  const wire = {
    path: 'M 0 0 C 5 0, 5 10, 10 10',
    conn,
    color: '#fff',
    isMidi: false,
  }

  it('renders a Pixi canvas and the interactive overlay with wire hit-regions', () => {
    const w = mount(BlueprintPixiRenderer, {
      props: { ...baseProps, wires: [wire, wire] },
    })
    expect(w.find('canvas.nb-blueprint-pixi__canvas').exists()).toBe(true)
    expect(w.find('.nb-blueprint__canvas').exists()).toBe(true)
    expect(w.findAll('.nb-blueprint__wire-hitregion')).toHaveLength(2)
  })

  it('emits wire events from the hit-regions', async () => {
    const w = mount(BlueprintPixiRenderer, {
      props: { ...baseProps, wires: [wire] },
    })
    await w.find('.nb-blueprint__wire-hitregion').trigger('mousedown')
    const ev = w.emitted('wire-mousedown')
    expect(ev).toBeTruthy()
    expect(ev![0][1]).toEqual(conn)
  })

  it('renders cards via the #card slot in windowed mode', () => {
    const w = mount(BlueprintPixiRenderer, {
      props: {
        ...baseProps,
        wires: [],
        windowed: true,
        visibleCards: [{ id: 'n1', x: 0, y: 0 }],
      },
      slots: {
        card: ({ card }: { card: { id: string } }) =>
          h(BlueprintCard, { id: card.id, title: card.id }),
      },
    })
    expect(w.find('[data-card-id="n1"]').exists()).toBe(true)
  })
})
