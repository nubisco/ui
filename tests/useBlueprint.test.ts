import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Blueprint from '../src/components/Blueprint.vue'
import { useBlueprint } from '../src/composables/useBlueprint.composable'
import type { IBlueprintController } from '../src/components/Blueprint.types'

// A probe rendered inside the Blueprint default slot that captures the
// injected controller so the test can drive and read it. jsdom reports a
// 0x0 container, so getBoundingClientRect origin is (0, 0) and the
// coordinate transforms reduce to pan/zoom only.
let captured: IBlueprintController | null = null
const Probe = defineComponent({
  name: 'Probe',
  setup() {
    captured = useBlueprint()
    return () => h('div', { class: 'probe' })
  },
})

beforeEach(() => {
  captured = null
})

describe('useBlueprint', () => {
  it('throws when used outside a NbBlueprint subtree', () => {
    expect(() => mount(Probe)).toThrow(/must be called from inside/)
  })

  it('exposes the live camera and reflects edit mode from the prop', async () => {
    const w = mount(Blueprint, {
      props: { editable: true },
      slots: { default: () => h(Probe) },
      attachTo: document.body,
    })
    expect(captured).not.toBeNull()
    const bp = captured!

    expect(bp.zoom.value).toBe(1)
    expect(bp.panX.value).toBe(0)
    expect(bp.isEditMode.value).toBe(true)

    await w.setProps({ editable: false })
    expect(bp.isEditMode.value).toBe(false)

    w.unmount()
  })

  it('round-trips screenToCanvas and canvasToScreen under pan/zoom', () => {
    mount(Blueprint, {
      slots: { default: () => h(Probe) },
      attachTo: document.body,
    })
    const bp = captured!

    // Identity at pan 0 / zoom 1.
    expect(bp.screenToCanvas(100, 50)).toEqual({ x: 100, y: 50 })

    bp.panX.value = 10
    bp.panY.value = 20
    bp.zoom.value = 2
    // canvas = (client - pan) / zoom
    expect(bp.screenToCanvas(110, 60)).toEqual({ x: 50, y: 20 })
    // inverse maps back to the same client point
    const back = bp.canvasToScreen(50, 20)
    expect(back.clientX).toBe(110)
    expect(back.clientY).toBe(60)
  })

  it('drives view state through the controller', async () => {
    mount(Blueprint, {
      slots: { default: () => h(Probe) },
      attachTo: document.body,
    })
    const bp = captured!

    bp.zoom.value = 2.5
    bp.panX.value = 99
    await nextTick()
    bp.resetView()
    expect(bp.zoom.value).toBe(1)
    expect(bp.panX.value).toBe(0)
    expect(bp.panY.value).toBe(0)
  })
})
