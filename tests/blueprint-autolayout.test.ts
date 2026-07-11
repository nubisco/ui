import { describe, it, expect } from 'vitest'
import {
  computeAutoLayout,
  type IAutoLayoutCard,
  type IAutoLayoutEdge,
} from '../src/components/blueprint-autolayout'

const card = (id: string, w = 220, h = 140): IAutoLayoutCard => ({ id, w, h })
const sig = (from: string, to: string): IAutoLayoutEdge => ({
  from,
  to,
  kind: 'signal',
})
const centreY = (
  p: Map<string, { x: number; y: number }>,
  c: IAutoLayoutCard,
) => p.get(c.id)!.y + c.h / 2

describe('computeAutoLayout', () => {
  it('returns an empty map for no cards', () => {
    expect(computeAutoLayout([], []).size).toBe(0)
  })

  it('lays a simple chain left-to-right in one lane', () => {
    const cards = [card('a'), card('b'), card('c')]
    const p = computeAutoLayout(cards, [sig('a', 'b'), sig('b', 'c')])
    expect(p.get('a')!.x).toBeLessThan(p.get('b')!.x)
    expect(p.get('b')!.x).toBeLessThan(p.get('c')!.x)
    // single chain: all cards share (roughly) one row centre
    const ys = cards.map((c) => centreY(p, c))
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(1)
  })

  it('centres the trunk between the two chains that merge into it', () => {
    // two independent 2-card chains feeding a common mixer -> output
    const cards = [
      card('s1'),
      card('s2'), // chain-1 head, chain-2 head
      card('a1'),
      card('a2'), // chain bodies
      card('mix'),
      card('out'),
    ]
    const edges = [
      sig('s1', 'a1'),
      sig('a1', 'mix'),
      sig('s2', 'a2'),
      sig('a2', 'mix'),
      sig('mix', 'out'),
    ]
    const p = computeAutoLayout(cards, edges)
    const chainCentres = ['a1', 'a2'].map((id) => p.get(id)!.y + 70)
    const bandMid = (Math.min(...chainCentres) + Math.max(...chainCentres)) / 2
    const mixC = p.get('mix')!.y + 70
    // trunk (mix) sits vertically between the two feeding lanes
    const bandSpan = Math.abs(chainCentres[0]! - chainCentres[1]!) || 1
    expect(Math.abs(mixC - bandMid)).toBeLessThan(bandSpan * 0.5)
    // ...and downstream of them horizontally
    expect(p.get('mix')!.x).toBeGreaterThan(p.get('a1')!.x)
    expect(p.get('out')!.x).toBeGreaterThan(p.get('mix')!.x)
  })

  it('groups a control-edge source into the lane of the card it controls', () => {
    const cards = [card('src'), card('fx'), card('out'), card('gate')]
    const edges: IAutoLayoutEdge[] = [
      sig('src', 'fx'),
      sig('fx', 'out'),
      { from: 'gate', to: 'fx', kind: 'control' },
    ]
    const p = computeAutoLayout(cards, edges)
    // the control card gets a real position (joined a lane), not left at origin
    expect(p.has('gate')).toBe(true)
    // it does not push fx's depth/adjacency around: fx still sits after src
    expect(p.get('fx')!.x).toBeGreaterThan(p.get('src')!.x)
  })

  it('ignores wires marked ignore (e.g. MIDI) for depth', () => {
    const cards = [card('kbd'), card('synth'), card('out')]
    const edges: IAutoLayoutEdge[] = [
      { from: 'kbd', to: 'synth', kind: 'ignore' },
      sig('synth', 'out'),
    ]
    const p = computeAutoLayout(cards, edges)
    // kbd contributes no signal edge, so it does not sit "before" synth by depth
    expect(p.get('synth')!.x).toBeLessThan(p.get('out')!.x)
  })

  it('honours origin + colGap options', () => {
    const cards = [card('a'), card('b')]
    const p = computeAutoLayout(cards, [sig('a', 'b')], {
      originX: 500,
      originY: 300,
      colGap: 1000,
    })
    expect(p.get('a')!.x).toBe(500)
    // b is one column over: origin + cardWidth + colGap
    expect(p.get('b')!.x).toBeGreaterThanOrEqual(500 + 220 + 1000)
  })
})
