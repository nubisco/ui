import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { ref } from 'vue'
import SidebarBrand from '../src/components/SidebarBrand.vue'

enableAutoUnmount(afterEach)

const VARIANT_KEY = 'nb-shell-sidebar-variant'

function withVariant(variant: 'compact' | 'verbose') {
  return { global: { provide: { [VARIANT_KEY]: ref(variant) } } }
}

describe('NbSidebarBrand monogram', () => {
  it('renders no mark without an icon when not asked, as before', () => {
    const w = mount(SidebarBrand, {
      props: { title: 'Acme Cloud' },
      ...withVariant('verbose'),
    })
    expect(w.find('.nb-sidebar-brand__icon').exists()).toBe(false)
    const off = mount(SidebarBrand, {
      props: { title: 'Acme Cloud', monogram: false },
      ...withVariant('verbose'),
    })
    expect(off.html()).toBe(w.html())
  })

  it('draws the initials of the first two words in a tile', () => {
    const w = mount(SidebarBrand, {
      props: { title: 'acme cloud console', monogram: true },
      ...withVariant('verbose'),
    })
    const tile = w.find('.nb-sidebar-brand__monogram')
    expect(tile.text()).toBe('AC')
    // The title beside it names the brand.
    expect(tile.attributes('aria-hidden')).toBe('true')
  })

  it('uses one initial for a one-word title', () => {
    const w = mount(SidebarBrand, {
      props: { title: 'Ledger', monogram: true },
      ...withVariant('verbose'),
    })
    expect(w.find('.nb-sidebar-brand__monogram').text()).toBe('L')
  })

  it('takes the letters from a string, at most two', () => {
    const w = mount(SidebarBrand, {
      props: { title: 'Ledger', monogram: 'Lgr' },
      ...withVariant('verbose'),
    })
    expect(w.find('.nb-sidebar-brand__monogram').text()).toBe('Lg')
  })

  it('carries the name when collapsed, where no title is shown', () => {
    const w = mount(SidebarBrand, {
      props: { title: 'Acme Cloud', monogram: true },
      ...withVariant('compact'),
    })
    const tile = w.find('.nb-sidebar-brand__monogram')
    expect(tile.attributes('role')).toBe('img')
    expect(tile.attributes('aria-label')).toBe('Acme Cloud')
    expect(w.find('.nb-sidebar-brand__text').exists()).toBe(false)
  })

  it('gives way to an icon or the icon slot', () => {
    const withIcon = mount(SidebarBrand, {
      props: { title: 'Acme', icon: 'cube', monogram: true },
      ...withVariant('verbose'),
    })
    expect(withIcon.find('.nb-sidebar-brand__monogram').exists()).toBe(false)
    expect(withIcon.find('.nb-sidebar-brand__icon').exists()).toBe(true)

    const withSlot = mount(SidebarBrand, {
      props: { title: 'Acme', monogram: true },
      slots: { icon: '<svg class="custom-mark" />' },
      ...withVariant('verbose'),
    })
    expect(withSlot.find('.custom-mark').exists()).toBe(true)
    expect(withSlot.find('.nb-sidebar-brand__monogram').exists()).toBe(false)
  })
})
