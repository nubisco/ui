// Alignment + distribution actually moving cards.
//
// blueprint-chrome.test.ts covers the TOOLBAR, but with a stubbed controller:
// it asserts that clicking "align left" calls `bp.alignLeft()`, and a vi.fn()
// always answers that happily. Nothing exercised the real implementations, so
// "the toolbar does nothing" was invisible to the suite.
import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import Blueprint from '../src/components/Blueprint.vue'
import BlueprintCard from '../src/components/BlueprintCard.vue'

const cardSlot = (props: { card: { id: string } }) =>
  h(BlueprintCard, { id: props.card.id, title: props.card.id, ports: [] })

/** Mount with cards inside the cull window (jsdom viewport is 0×0, so the
 *  visible band at zoom 1 / pan 0 is local [-400, 400] on each axis). */
function mountBoard(cards: Array<{ id: string; x: number; y: number }>) {
  return mount(Blueprint, {
    props: {
      cards: cards.map((c) => ({ ...c, width: 200, height: 120 })),
      editable: true,
    },
    slots: { card: cardSlot },
  })
}

type Vm = {
  selectedIds: Set<string>
  alignLeft: () => void
  alignTop: () => void
  distributeHorizontally: () => void
}

// Consumers commonly wrap the card in their own element inside the #card slot
// (Stagewright renders <div class="node-wrap"><NbBlueprintCard/></div>), which
// puts an extra level between the [data-card-id] element and the positioned
// wrapper that positionWrapperOf() walks up to find.
const nestedCardSlot = (props: { card: { id: string } }) =>
  h('div', { class: 'host-node-wrap' }, [
    h(BlueprintCard, { id: props.card.id, title: props.card.id, ports: [] }),
  ])

describe('chrome clicks do not destroy the selection they act on', () => {
  // The bug behind "the align toolbar does nothing".
  //
  // onCanvasMouseDown treats anything that is not a port and not a card as
  // empty canvas and starts a marquee, and startMarquee deselects immediately.
  // The chrome layer (controls toolbar, minimap) lives INSIDE the container, so
  // pressing an align button deselected every card on mousedown, and the click
  // that followed ran alignLeft() against an empty selection: nothing moved,
  // and the alignment cluster vanished because it needs 2+ selected. Both
  // symptoms, one cause.
  it('a mousedown on the chrome layer leaves the selection intact', async () => {
    const w = mount(Blueprint, {
      props: {
        cards: [
          { id: 'a', x: 100, y: 10, width: 200, height: 120 },
          { id: 'b', x: 300, y: 60, width: 200, height: 120 },
        ],
        editable: true,
      },
      slots: {
        card: cardSlot,
        chrome: () => h('button', { class: 'host-chrome-button' }, 'align'),
      },
    })
    const vm = w.vm as unknown as Vm
    vm.selectedIds.add('a')
    vm.selectedIds.add('b')
    await w.vm.$nextTick()

    await w.find('.host-chrome-button').trigger('mousedown')
    await w.vm.$nextTick()

    expect(vm.selectedIds.size, 'chrome mousedown wiped the selection').toBe(2)
  })

  it('aligns from a chrome button press: mousedown then the action', async () => {
    const w = mount(Blueprint, {
      props: {
        cards: [
          { id: 'a', x: 100, y: 10, width: 200, height: 120 },
          { id: 'b', x: 300, y: 60, width: 200, height: 120 },
        ],
        editable: true,
      },
      slots: {
        card: cardSlot,
        chrome: () => h('button', { class: 'host-chrome-button' }, 'align'),
      },
    })
    const vm = w.vm as unknown as Vm
    vm.selectedIds.add('a')
    vm.selectedIds.add('b')
    await w.vm.$nextTick()

    // Exactly what a real button press does: mousedown, then the click action.
    await w.find('.host-chrome-button').trigger('mousedown')
    vm.alignLeft()
    await w.vm.$nextTick()

    const moves = w.emitted('move')
    expect(moves, 'align after a chrome mousedown emitted no move').toBeTruthy()
    const payload = moves![0]![0] as Array<{ id: string; x: number }>
    expect(payload.map((m) => m.x)).toEqual([100, 100])
  })
})

describe('blueprint alignment moves cards', () => {
  it('aligns cards the host wrapped in its own element', async () => {
    const w = mount(Blueprint, {
      props: {
        cards: [
          { id: 'a', x: 100, y: 10, width: 200, height: 120 },
          { id: 'b', x: 300, y: 60, width: 200, height: 120 },
        ],
        editable: true,
      },
      slots: { card: nestedCardSlot },
    })
    const vm = w.vm as unknown as Vm
    vm.selectedIds.add('a')
    vm.selectedIds.add('b')
    await w.vm.$nextTick()

    vm.alignLeft()
    await w.vm.$nextTick()

    const moves = w.emitted('move')
    expect(
      moves,
      'align left emitted no move for host-wrapped cards',
    ).toBeTruthy()
    const payload = moves![0]![0] as Array<{ id: string; x: number }>
    expect(payload.map((m) => m.x)).toEqual([100, 100])
  })

  it('align left emits a move putting every selected card on the leftmost x', async () => {
    const w = mountBoard([
      { id: 'a', x: 100, y: 10 },
      { id: 'b', x: 300, y: 60 },
    ])
    const vm = w.vm as unknown as Vm
    vm.selectedIds.add('a')
    vm.selectedIds.add('b')
    await w.vm.$nextTick()

    vm.alignLeft()
    await w.vm.$nextTick()

    const moves = w.emitted('move')
    expect(moves, 'align left emitted no move at all').toBeTruthy()
    const payload = moves![0]![0] as Array<{ id: string; x: number; y: number }>
    expect(payload.map((m) => m.x)).toEqual([100, 100])
  })

  it('align top emits a move putting every selected card on the topmost y', async () => {
    const w = mountBoard([
      { id: 'a', x: 100, y: 10 },
      { id: 'b', x: 300, y: 60 },
    ])
    const vm = w.vm as unknown as Vm
    vm.selectedIds.add('a')
    vm.selectedIds.add('b')
    await w.vm.$nextTick()

    vm.alignTop()
    await w.vm.$nextTick()

    const moves = w.emitted('move')
    expect(moves, 'align top emitted no move at all').toBeTruthy()
    const payload = moves![0]![0] as Array<{ id: string; x: number; y: number }>
    expect(payload.map((m) => m.y)).toEqual([10, 10])
  })

  it('distribute horizontally spaces three cards evenly between the outer two', async () => {
    const w = mountBoard([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 10, y: 0 },
      { id: 'c', x: 300, y: 0 },
    ])
    const vm = w.vm as unknown as Vm
    ;['a', 'b', 'c'].forEach((id) => vm.selectedIds.add(id))
    await w.vm.$nextTick()

    vm.distributeHorizontally()
    await w.vm.$nextTick()

    const moves = w.emitted('move')
    expect(moves, 'distribute emitted no move at all').toBeTruthy()
    const payload = moves![0]![0] as Array<{ id: string; x: number }>
    const byId = Object.fromEntries(payload.map((m) => [m.id, m.x]))
    // Outer cards pinned, middle one centred between them.
    expect(byId.a).toBe(0)
    expect(byId.c).toBe(300)
    expect(byId.b).toBe(150)
  })
})
