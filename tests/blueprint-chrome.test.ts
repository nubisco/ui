import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import BlueprintControls from '../src/components/BlueprintControls.vue'
import BlueprintMinimap from '../src/components/BlueprintMinimap.vue'
import { NB_BLUEPRINT_CONTROLLER } from '../src/components/Blueprint.context'
import type { IBlueprintController } from '../src/components/Blueprint.types'

function stubController(
  overrides: Partial<IBlueprintController> = {},
): IBlueprintController {
  return {
    panX: ref(0),
    panY: ref(0),
    zoom: ref(1),
    selectedIds: ref(new Set<string>()),
    focusedId: ref(null),
    selectAll: vi.fn(),
    deselectAll: vi.fn(),
    centerView: vi.fn(),
    fitToView: vi.fn(),
    resetView: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    alignLeft: vi.fn(),
    alignCenter: vi.fn(),
    alignRight: vi.fn(),
    alignTop: vi.fn(),
    alignMiddle: vi.fn(),
    alignBottom: vi.fn(),
    distributeHorizontally: vi.fn(),
    distributeVertically: vi.fn(),
    autoLayout: vi.fn(),
    screenToCanvas: vi.fn(() => ({ x: 0, y: 0 })),
    canvasToScreen: vi.fn(() => ({ clientX: 0, clientY: 0 })),
    isEditMode: ref(false),
    viewportSize: ref({ w: 800, h: 600 }),
    onPortDown: vi.fn(),
    onPortUp: vi.fn(),
    ...overrides,
  }
}

function mountWith(
  component: Parameters<typeof mount>[0],
  ctrl: IBlueprintController,
  props: Record<string, unknown> = {},
) {
  return mount(component, {
    props,
    global: { provide: { [NB_BLUEPRINT_CONTROLLER as symbol]: ctrl } },
  })
}

describe('NbBlueprintControls', () => {
  it('drives the controller from toolbar buttons', async () => {
    const ctrl = stubController()
    const w = mountWith(BlueprintControls, ctrl)
    await w.find('[aria-label="Zoom in"]').trigger('click')
    await w.find('[aria-label="Fit to view"]').trigger('click')
    expect(ctrl.zoomIn).toHaveBeenCalled()
    expect(ctrl.fitToView).toHaveBeenCalled()
  })

  it('shows the alignment cluster only when 2+ cards are selected', async () => {
    const selectedIds = ref(new Set<string>(['a']))
    const ctrl = stubController({ selectedIds })
    const w = mountWith(BlueprintControls, ctrl)
    expect(w.find('[aria-label="Align left"]').exists()).toBe(false)
    selectedIds.value = new Set(['a', 'b'])
    await w.vm.$nextTick()
    expect(w.find('[aria-label="Align left"]').exists()).toBe(true)
  })

  it('hides itself in show="edit" until edit mode is on', async () => {
    const isEditMode = ref(false)
    const ctrl = stubController({ isEditMode })
    const w = mountWith(BlueprintControls, ctrl, { show: 'edit' })
    expect(w.find('.nb-blueprint-controls').exists()).toBe(false)
    isEditMode.value = true
    await w.vm.$nextTick()
    expect(w.find('.nb-blueprint-controls').exists()).toBe(true)
  })
})

describe('NbBlueprintMinimap', () => {
  const cards = [
    { id: 'a', x: 0, y: 0, width: 100, height: 60 },
    { id: 'b', x: 300, y: 200, width: 100, height: 60 },
  ]

  it('renders a node rect per card plus the viewport rectangle', () => {
    const ctrl = stubController()
    const w = mountWith(BlueprintMinimap, ctrl, { cards })
    expect(w.findAll('.nb-blueprint-minimap__node')).toHaveLength(2)
    expect(w.find('.nb-blueprint-minimap__viewport').exists()).toBe(true)
  })

  // test-utils' trigger() can't set read-only clientX, so dispatch a native
  // event on the svg (which is the handler's currentTarget).
  function pointerDown(el: Element, clientX: number, clientY: number): void {
    el.dispatchEvent(
      new MouseEvent('pointerdown', { clientX, clientY, bubbles: true }),
    )
  }

  it('recenters the camera on pointer drag', () => {
    const ctrl = stubController()
    const w = mountWith(BlueprintMinimap, ctrl, { cards })
    pointerDown(w.find('svg').element, 50, 40)
    // A click maps to a world point and rewrites pan to center it.
    expect(ctrl.panX.value !== 0 || ctrl.panY.value !== 0).toBe(true)
  })

  it('does not pan when pannable is false', () => {
    const ctrl = stubController()
    const w = mountWith(BlueprintMinimap, ctrl, { cards, pannable: false })
    pointerDown(w.find('svg').element, 50, 40)
    expect(ctrl.panX.value).toBe(0)
    expect(ctrl.panY.value).toBe(0)
  })
})
