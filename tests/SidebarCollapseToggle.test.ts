import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { createI18n } from 'vue-i18n'
import SidebarCollapseToggle from '../src/components/SidebarCollapseToggle.vue'

function inRail(
  variant: Ref<'compact' | 'verbose'>,
  props: Record<string, unknown> = {},
  plugins: unknown[] = [],
  onToggle: () => void = () => {},
) {
  const Host = defineComponent({
    provide: { 'nb-shell-sidebar-variant': variant },
    render: () => h('ul', [h(SidebarCollapseToggle, { ...props, onToggle })]),
  })
  return mount(Host, {
    global: { plugins: plugins as never[] },
    attachTo: document.body,
  })
}

const en = () =>
  createI18n({ legacy: false, locale: 'en', messages: { en: {} } })

describe('NbSidebarCollapseToggle', () => {
  it('offers to collapse an expanded rail, as a labelled row', () => {
    const w = inRail(ref('verbose'), {}, [en()])
    expect(w.text()).toContain('Collapse sidebar')
    w.unmount()
  })

  it('offers to expand a collapsed rail, with that as its accessible name', () => {
    const w = inRail(ref('compact'), {}, [en()])
    expect(w.find('[role="menuitem"]').attributes('aria-label')).toBe(
      'Expand sidebar',
    )
    w.unmount()
  })

  it('follows the rail it sits in, so its label cannot disagree with it', async () => {
    const variant = ref<'compact' | 'verbose'>('verbose')
    const w = inRail(variant, {}, [en()])
    variant.value = 'compact'
    await nextTick()
    expect(w.find('[role="menuitem"]').attributes('aria-label')).toBe(
      'Expand sidebar',
    )
    w.unmount()
  })

  it('emits toggle when chosen, holding no state of its own', async () => {
    let toggles = 0
    const w = inRail(ref('verbose'), {}, [en()], () => toggles++)
    await w.find('[role="menuitem"]').trigger('click')
    expect(toggles).toBe(1)
    w.unmount()
  })

  it('takes product labels over the built-in ones', () => {
    const w = inRail(ref('verbose'), { collapseLabel: 'Hide navigation' }, [
      en(),
    ])
    expect(w.text()).toContain('Hide navigation')
    w.unmount()
  })

  it('uses the built-in Portuguese for a pt locale', () => {
    const pt = createI18n({
      legacy: false,
      locale: 'pt-PT',
      messages: { 'pt-PT': {} },
    })
    const w = inRail(ref('verbose'), {}, [pt])
    expect(w.text()).toContain('Recolher barra lateral')
    w.unmount()
  })

  it('works in a product with no vue-i18n at all, falling back to English', () => {
    // A rail toggle must not add a hard dependency to every product.
    const w = inRail(ref('verbose'))
    expect(w.text()).toContain('Collapse sidebar')
    w.unmount()
  })
})
