// fitToView(padding, ids) — framing one cluster instead of the whole board.
//
// jsdom reports a 0×0 container, so absolute zoom/pan maths is not meaningful
// here. What IS meaningful and worth pinning is which cards the camera decides
// to frame, and the refusal behaviour when a subset matches nothing.
import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import Blueprint from '../src/components/Blueprint.vue'
import BlueprintCard from '../src/components/BlueprintCard.vue'

const cardSlot = (props: { card: { id: string } }) =>
  h(BlueprintCard, { id: props.card.id, title: props.card.id, ports: [] })

type Vm = {
  fitToView: (padding?: number, ids?: readonly string[]) => void
  resetView: () => void
  panX: number
  panY: number
  zoom: number
}

function board() {
  return mount(Blueprint, {
    props: {
      cards: [
        { id: 'a', x: 0, y: 0, width: 200, height: 120 },
        { id: 'b', x: 4000, y: 3000, width: 200, height: 120 },
        { id: 'c', x: 4200, y: 3100, width: 200, height: 120 },
      ],
      editable: true,
    },
    slots: { card: cardSlot },
  })
}

describe('fitToView subset', () => {
  it('frames a subset differently from the whole board', () => {
    const all = board()
    ;(all.vm as unknown as Vm).fitToView(40)
    const allZoom = (all.vm as unknown as Vm).zoom
    const allPan = (all.vm as unknown as Vm).panX

    const some = board()
    // The far cluster only: a much smaller box than a+b+c, so the camera must
    // land somewhere different.
    ;(some.vm as unknown as Vm).fitToView(40, ['b', 'c'])
    const someZoom = (some.vm as unknown as Vm).zoom
    const somePan = (some.vm as unknown as Vm).panX

    expect(
      someZoom !== allZoom || somePan !== allPan,
      'framing two of three cards produced the same camera as framing all of them',
    ).toBe(true)
  })

  it('frames a single card', () => {
    const w = board()
    const vm = w.vm as unknown as Vm
    expect(() => vm.fitToView(40, ['b'])).not.toThrow()
  })

  it('ignores ids that match no card, framing the ones that do', () => {
    const known = board()
    ;(known.vm as unknown as Vm).fitToView(40, ['b', 'c'])
    const knownPan = (known.vm as unknown as Vm).panX

    const mixed = board()
    ;(mixed.vm as unknown as Vm).fitToView(40, ['b', 'c', 'does-not-exist'])
    expect((mixed.vm as unknown as Vm).panX).toBe(knownPan)
  })

  // Refusing beats resetting: "frame this group" answered by throwing the user
  // back to the origin loses their place for no reason.
  it('leaves the camera alone when no id in the subset exists', () => {
    const w = board()
    const vm = w.vm as unknown as Vm
    vm.fitToView(40, ['b'])
    const pan = { x: vm.panX, y: vm.panY, zoom: vm.zoom }

    vm.fitToView(40, ['nope', 'also-nope'])

    expect(vm.panX).toBe(pan.x)
    expect(vm.panY).toBe(pan.y)
    expect(vm.zoom).toBe(pan.zoom)
  })

  it('still frames everything when no subset is given', () => {
    const w = board()
    const vm = w.vm as unknown as Vm
    expect(() => vm.fitToView()).not.toThrow()
  })
})
