import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import SidebarMenuItem from '../src/components/SidebarMenuItem.vue'
import { provideNbStrings } from '../src/composables/useNbStrings.composable'

enableAutoUnmount(afterEach)

const VARIANT_KEY = 'nb-shell-sidebar-variant'

function withVariant(variant: 'compact' | 'verbose') {
  return { global: { provide: { [VARIANT_KEY]: ref(variant) } } }
}

describe('NbSidebarMenuItem live', () => {
  it('is absent by default, and the row is unchanged', () => {
    const plain = mount(SidebarMenuItem, {
      props: { label: 'Runs', icon: 'play', href: '#' },
      ...withVariant('verbose'),
    })
    const off = mount(SidebarMenuItem, {
      props: { label: 'Runs', icon: 'play', href: '#', live: false },
      ...withVariant('verbose'),
    })
    expect(plain.find('[data-nb-sidebar-live]').exists()).toBe(false)
    expect(off.html()).toBe(plain.html())
  })

  it('draws a dot after the label, named for assistive technology', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Runs', icon: 'play', href: '#', live: true, badge: 2 },
      ...withVariant('verbose'),
    })
    const dot = w.find('.nb-sidebar-menu-item__live')
    expect(dot.exists()).toBe(true)
    expect(w.find('.nb-sidebar-menu-item__live-text').text()).toBe('Running')
    // After the label, before the badge.
    const row = w.find('.nb-sidebar-menu-item__row').element
    const order = Array.from(row.children).map((el) => el.className)
    const label = order.findIndex((c) => c.includes('__label'))
    const live = order.findIndex((c) => c.includes('__live'))
    const badge = order.findIndex((c) => c.includes('__badge'))
    expect(label).toBeLessThan(live)
    expect(live).toBeLessThan(badge)
    expect(w.find('.nb-sidebar-menu-item__row').text()).toContain('Running')
  })

  it('sits on the icon corner when collapsed, and the row names it', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Runs', icon: 'play', href: '#', live: true },
      ...withVariant('compact'),
    })
    const dot = w.find('.nb-sidebar-menu-item__live--compact')
    expect(dot.exists()).toBe(true)
    expect(dot.attributes('aria-hidden')).toBe('true')
    expect(dot.classes()).not.toContain('nb-sidebar-menu-item__live--below')
    expect(w.find('.nb-sidebar-menu-item__row').attributes('aria-label')).toBe(
      'Runs, Running',
    )
  })

  it('moves below the corner when a badge holds it', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Runs', icon: 'play', href: '#', live: true, badge: 3 },
      ...withVariant('compact'),
    })
    expect(w.find('.nb-sidebar-menu-item__badge-count').exists()).toBe(true)
    expect(w.find('.nb-sidebar-menu-item__live--compact').classes()).toContain(
      'nb-sidebar-menu-item__live--below',
    )
    expect(w.find('.nb-sidebar-menu-item__row').attributes('aria-label')).toBe(
      'Runs (3), Running',
    )
  })

  it('takes its words from liveLabel, then the catalogue', () => {
    const own = mount(SidebarMenuItem, {
      props: { label: 'Runs', live: true, liveLabel: 'Agent working' },
      ...withVariant('verbose'),
    })
    expect(own.find('.nb-sidebar-menu-item__live-text').text()).toBe(
      'Agent working',
    )

    const Host = defineComponent({
      setup() {
        provideNbStrings({ sidebarMenuItemLive: 'Em curso' })
        return () => h(SidebarMenuItem, { label: 'Runs', live: true })
      },
    })
    const translated = mount(Host, withVariant('verbose'))
    expect(translated.find('.nb-sidebar-menu-item__live-text').text()).toBe(
      'Em curso',
    )
  })
})
