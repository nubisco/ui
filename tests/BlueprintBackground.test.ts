import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import BlueprintBackground from '../src/components/BlueprintBackground.vue'
import { NB_BLUEPRINT_CONTROLLER } from '../src/components/Blueprint.context'
import type { IBlueprintController } from '../src/components/Blueprint.types'

// Minimal controller stub: NbBlueprintBackground only reads the camera refs.
// The rest of IBlueprintController is unused here, so cast the partial.
function makeController(over: Partial<IBlueprintController> = {}) {
  return {
    panX: ref(0),
    panY: ref(0),
    zoom: ref(1),
    isTransforming: ref(false),
    ...over,
  } as unknown as IBlueprintController
}

function createWrapper(
  props: Record<string, unknown> = {},
  controller = makeController(),
) {
  return mount(BlueprintBackground, {
    props,
    global: { provide: { [NB_BLUEPRINT_CONTROLLER]: controller } },
  })
}

const root = (w: ReturnType<typeof createWrapper>) =>
  w.find('.nb-blueprint-background')

describe('NbBlueprintBackground', () => {
  it('throws when used outside a NbBlueprint subtree', () => {
    expect(() => mount(BlueprintBackground)).toThrow(
      /must be called from inside/,
    )
  })

  it('renders the dots variant by default', () => {
    const w = createWrapper()
    const el = root(w)
    expect(el.exists()).toBe(true)
    expect(el.classes()).toContain('nb-blueprint-background--dots')
  })

  it('applies the variant modifier class', () => {
    for (const variant of ['grid', 'lines', 'dots'] as const) {
      const el = root(createWrapper({ variant }))
      expect(el.classes()).toContain(`nb-blueprint-background--${variant}`)
    }
  })

  it('renders nothing for variant="none"', () => {
    const w = createWrapper({ variant: 'none' })
    expect(root(w).exists()).toBe(false)
  })

  it('transforms with the injected camera and reacts to changes', async () => {
    const controller = makeController({
      panX: ref(10),
      panY: ref(20),
      zoom: ref(2),
    })
    const w = createWrapper({}, controller)
    const el = root(w).element as HTMLElement
    expect(el.style.transform).toBe('translate(10px, 20px) scale(2)')

    controller.panX.value = 40
    controller.zoom.value = 0.5
    await nextTick()
    expect(el.style.transform).toBe('translate(40px, 20px) scale(0.5)')
  })

  it('promotes a GPU layer only while the camera is transforming', async () => {
    const controller = makeController({ isTransforming: ref(false) })
    const w = createWrapper({}, controller)
    const el = root(w).element as HTMLElement
    expect(el.style.willChange).toBe('')

    controller.isTransforming.value = true
    await nextTick()
    expect(el.style.willChange).toBe('transform')
  })

  it('wires color, gap and thickness to CSS custom properties', () => {
    const el = root(createWrapper({ color: 'tomato', gap: 30, thickness: 2 }))
      .element as HTMLElement
    expect(el.style.getPropertyValue('--_grid-color')).toBe('tomato')
    expect(el.style.getPropertyValue('--_grid-gap')).toBe('30px')
    expect(el.style.getPropertyValue('--_thickness')).toBe('2px')
  })

  it('wires the secondary grid controls for the grid variant', () => {
    const el = root(
      createWrapper({
        variant: 'grid',
        secondaryColor: 'rebeccapurple',
        secondaryGap: 100,
      }),
    ).element as HTMLElement
    expect(el.style.getPropertyValue('--_grid-major-color')).toBe(
      'rebeccapurple',
    )
    expect(el.style.getPropertyValue('--_grid-major-gap')).toBe('100px')
  })

  it('leaves colour custom properties unset when no colour prop is given', () => {
    const el = root(createWrapper()).element as HTMLElement
    // Unset props fall through to the themeable --nb-blueprint-grid-* defaults
    // in the stylesheet rather than pinning an inline value.
    expect(el.style.getPropertyValue('--_grid-color')).toBe('')
    expect(el.style.getPropertyValue('--_grid-major-color')).toBe('')
    expect(el.style.getPropertyValue('--_grid-major-gap')).toBe('')
  })
})
