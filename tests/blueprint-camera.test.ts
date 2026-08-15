// getCamera / setCamera — saving a viewpoint and putting it back.
//
// The motivating use is "go look at that, then return me to where I was": a
// consumer reads the camera, calls fitToView() to frame something, and later
// restores what the user had. So the property that matters is an exact
// round-trip, including viewpoints that fitToView would never produce.
import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import Blueprint from '../src/components/Blueprint.vue'
import BlueprintCard from '../src/components/BlueprintCard.vue'

const cardSlot = (props: { card: { id: string } }) =>
  h(BlueprintCard, { id: props.card.id, title: props.card.id, ports: [] })

type Vm = {
  getCamera: () => { panX: number; panY: number; zoom: number }
  setCamera: (c: Partial<{ panX: number; panY: number; zoom: number }>) => void
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
      ],
      editable: true,
    },
    slots: { card: cardSlot },
  })
}

describe('camera save / restore', () => {
  it('round-trips a viewpoint exactly', () => {
    const vm = board().vm as unknown as Vm
    vm.setCamera({ panX: -1234.5, panY: 678.25, zoom: 0.375 })
    const saved = vm.getCamera()

    vm.fitToView(40) // move the camera somewhere else entirely
    vm.setCamera(saved)

    expect(vm.getCamera()).toEqual(saved)
  })

  it('applies fields independently', () => {
    const vm = board().vm as unknown as Vm
    vm.setCamera({ panX: 100, panY: 200, zoom: 2 })

    vm.setCamera({ zoom: 1 })
    expect(vm.getCamera()).toEqual({ panX: 100, panY: 200, zoom: 1 })

    vm.setCamera({ panX: -50 })
    expect(vm.getCamera()).toEqual({ panX: -50, panY: 200, zoom: 1 })
  })

  it('ignores absent and non-numeric fields rather than writing NaN', () => {
    const vm = board().vm as unknown as Vm
    vm.setCamera({ panX: 10, panY: 20, zoom: 1.5 })

    vm.setCamera({})
    expect(vm.getCamera()).toEqual({ panX: 10, panY: 20, zoom: 1.5 })

    vm.setCamera({ zoom: undefined })
    expect(vm.getCamera()).toEqual({ panX: 10, panY: 20, zoom: 1.5 })
  })

  // Restoring a viewpoint the user genuinely had must reproduce it, even one
  // looking at empty canvas. Clamping to content would quietly relocate them.
  it('restores a viewpoint that looks away from every card', () => {
    const vm = board().vm as unknown as Vm
    const offInSpace = { panX: -99999, panY: -99999, zoom: 0.05 }
    vm.setCamera(offInSpace)
    expect(vm.getCamera()).toEqual(offInSpace)
  })

  it('reads back what resetView and fitToView leave behind', () => {
    const vm = board().vm as unknown as Vm
    vm.resetView()
    expect(vm.getCamera()).toEqual({ panX: 0, panY: 0, zoom: 1 })

    vm.setCamera({ panX: 5, panY: 5, zoom: 3 })
    vm.fitToView(40, ['b'])
    // Whatever the fit chose, getCamera must report the live values.
    const after = vm.getCamera()
    expect(after.panX).toBe(vm.panX)
    expect(after.panY).toBe(vm.panY)
    expect(after.zoom).toBe(vm.zoom)
  })
})
