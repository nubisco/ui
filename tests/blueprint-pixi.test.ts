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
