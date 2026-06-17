import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SidebarLink from '../src/components/SidebarLink.vue'

describe('NbSidebarLink', () => {
  it('renders a button when no navigation target is given', () => {
    const w = mount(SidebarLink)
    expect(w.element.tagName.toLowerCase()).toBe('button')
  })

  it('renders an anchor for a string href', () => {
    const w = mount(SidebarLink, { props: { href: 'https://example.com' } })
    expect(w.element.tagName.toLowerCase()).toBe('a')
    expect(w.attributes('href')).toBe('https://example.com')
  })

  it('renders an anchor for a string `to` when vue-router is absent', () => {
    const w = mount(SidebarLink, { props: { to: '/home' } })
    expect(w.element.tagName.toLowerCase()).toBe('a')
    expect(w.attributes('href')).toBe('/home')
  })

  it('falls back to a button (no dead anchor) for an object `to` without vue-router', () => {
    const w = mount(SidebarLink, { props: { to: { name: 'home' } } })
    expect(w.element.tagName.toLowerCase()).toBe('button')
    expect(w.attributes('href')).toBeUndefined()
  })

  it('renders a RouterLink and passes `to` through when vue-router is installed', () => {
    const RouterLink = {
      name: 'RouterLink',
      props: { to: { type: [String, Object], required: true } },
      template: '<a class="rl" :data-to="JSON.stringify(to)"><slot /></a>',
    }
    const w = mount(SidebarLink, {
      props: { to: { name: 'home' } },
      global: { components: { RouterLink } },
    })
    const link = w.find('.rl')
    expect(link.exists()).toBe(true)
    expect(link.attributes('data-to')).toBe(JSON.stringify({ name: 'home' }))
  })

  it('marks active and danger states with modifier classes', () => {
    const w = mount(SidebarLink, { props: { active: true, danger: true } })
    expect(w.classes()).toContain('nb-sidebar-link--active')
    expect(w.classes()).toContain('nb-sidebar-link--danger')
  })

  it('does not emit click when disabled', async () => {
    const w = mount(SidebarLink, { props: { disabled: true } })
    await w.trigger('click')
    expect(w.emitted('click')).toBeUndefined()
  })

  it('exposes the tooltip via data-tooltip', () => {
    const w = mount(SidebarLink, { props: { tooltip: 'Home' } })
    expect(w.attributes('data-tooltip')).toBe('Home')
  })
})
