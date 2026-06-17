import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import SidebarBrand from '../src/components/SidebarBrand.vue'
import SidebarMenu from '../src/components/SidebarMenu.vue'
import SidebarMenuGroup from '../src/components/SidebarMenuGroup.vue'
import SidebarMenuItem from '../src/components/SidebarMenuItem.vue'

const VARIANT_KEY = 'nb-shell-sidebar-variant'

// Mounts a component with the shell sidebar variant injected, mirroring how
// NbShell provides it to its sidebar descendants.
function withVariant(
  variant: 'compact' | 'verbose',
  extra: Record<string, unknown> = {},
) {
  return {
    global: {
      provide: { [VARIANT_KEY]: ref(variant) },
      ...(extra.global as object | undefined),
    },
    ...extra,
  }
}

describe('NbSidebarBrand', () => {
  it('renders the title and subtitle in verbose mode', () => {
    const w = mount(SidebarBrand, {
      props: { title: 'Acme', subtitle: 'Console' },
      ...withVariant('verbose'),
    })
    expect(w.find('.nb-sidebar-brand__title').text()).toBe('Acme')
    expect(w.find('.nb-sidebar-brand__subtitle').text()).toBe('Console')
  })

  it('hides the text block in compact mode', () => {
    const w = mount(SidebarBrand, {
      props: { title: 'Acme', subtitle: 'Console', icon: 'cube' },
      ...withVariant('compact'),
    })
    expect(w.classes()).toContain('nb-sidebar-brand--compact')
    expect(w.find('.nb-sidebar-brand__text').exists()).toBe(false)
    expect(w.find('.nb-sidebar-brand__icon').exists()).toBe(true)
  })

  it('renders a custom icon slot over the icon prop', () => {
    const w = mount(SidebarBrand, {
      props: { title: 'Acme', icon: 'cube' },
      slots: { icon: '<svg class="custom-mark" />' },
      ...withVariant('verbose'),
    })
    expect(w.find('.custom-mark').exists()).toBe(true)
  })
})

describe('NbSidebarMenu', () => {
  it('renders a menu role and the default density class', () => {
    const w = mount(SidebarMenu, { slots: { default: '<li>item</li>' } })
    expect(w.attributes('role')).toBe('menu')
    expect(w.classes()).toContain('nb-sidebar-menu--comfortable')
  })

  it('applies the compact density modifier', () => {
    const w = mount(SidebarMenu, { props: { density: 'compact' } })
    expect(w.classes()).toContain('nb-sidebar-menu--compact')
  })
})

describe('NbSidebarMenuGroup', () => {
  it('renders a labelled header in verbose mode', () => {
    const w = mount(SidebarMenuGroup, {
      props: { label: 'Workspace' },
      ...withVariant('verbose'),
    })
    expect(w.find('.nb-sidebar-menu-group__label').text()).toBe('Workspace')
    expect(w.find('.nb-sidebar-menu-group__items').exists()).toBe(true)
  })

  it('renders a divider instead of a header in compact mode', () => {
    const w = mount(SidebarMenuGroup, {
      props: { label: 'Workspace' },
      ...withVariant('compact'),
    })
    expect(w.find('.nb-sidebar-menu-group__divider').exists()).toBe(true)
    expect(w.find('.nb-sidebar-menu-group__header').exists()).toBe(false)
    expect(
      w.find('.nb-sidebar-menu-group__divider').attributes('aria-label'),
    ).toBe('Workspace')
  })

  it('toggles collapsed state when the collapsible header is clicked', async () => {
    const w = mount(SidebarMenuGroup, {
      props: { label: 'Workspace', collapsible: true },
      slots: { default: '<li class="child">item</li>' },
      ...withVariant('verbose'),
    })
    const header = w.find('.nb-sidebar-menu-group__header')
    expect(header.attributes('aria-expanded')).toBe('true')
    await header.trigger('click')
    expect(header.attributes('aria-expanded')).toBe('false')
  })

  it('honours defaultCollapsed when collapsible', () => {
    const w = mount(SidebarMenuGroup, {
      props: { label: 'Workspace', collapsible: true, defaultCollapsed: true },
      ...withVariant('verbose'),
    })
    expect(
      w.find('.nb-sidebar-menu-group__header').attributes('aria-expanded'),
    ).toBe('false')
  })
})

describe('NbSidebarMenuItem', () => {
  it('renders the label and icon in verbose mode', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Dashboard', icon: 'gauge' },
      ...withVariant('verbose'),
    })
    expect(w.find('.nb-sidebar-menu-item__label').text()).toBe('Dashboard')
    expect(w.find('.nb-sidebar-menu-item__icon').exists()).toBe(true)
  })

  it('renders a button when no navigation target is given', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Action' },
      ...withVariant('verbose'),
    })
    expect(w.find('button.nb-sidebar-menu-item__row').exists()).toBe(true)
  })

  it('renders an anchor for a string href when vue-router is absent', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Docs', href: 'https://example.com' },
      ...withVariant('verbose'),
    })
    const row = w.find('a.nb-sidebar-menu-item__row')
    expect(row.exists()).toBe(true)
    expect(row.attributes('href')).toBe('https://example.com')
  })

  it('renders an anchor for a string `to` when vue-router is absent', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Home', to: '/home' },
      ...withVariant('verbose'),
    })
    const row = w.find('a.nb-sidebar-menu-item__row')
    expect(row.exists()).toBe(true)
    expect(row.attributes('href')).toBe('/home')
  })

  it('falls back to a button (no dead anchor) for an object `to` without vue-router', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Home', to: { name: 'home' } },
      ...withVariant('verbose'),
    })
    expect(w.find('a.nb-sidebar-menu-item__row').exists()).toBe(false)
    expect(w.find('button.nb-sidebar-menu-item__row').exists()).toBe(true)
  })

  it('renders a RouterLink and passes `to` through when vue-router is installed', () => {
    const RouterLink = defineComponent({
      name: 'RouterLink',
      props: { to: { type: [String, Object], required: true } },
      setup(props, { slots }) {
        return () =>
          h(
            'a',
            { class: 'router-link-stub', 'data-to': JSON.stringify(props.to) },
            slots.default?.(),
          )
      },
    })
    const w = mount(SidebarMenuItem, {
      props: { label: 'Home', to: { name: 'home' } },
      global: {
        provide: { [VARIANT_KEY]: ref('verbose') },
        components: { RouterLink },
      },
    })
    const link = w.find('.router-link-stub')
    expect(link.exists()).toBe(true)
    expect(link.attributes('data-to')).toBe(JSON.stringify({ name: 'home' }))
  })

  it('toggles its submenu instead of navigating when it has children (verbose)', async () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Group', to: '/group' },
      slots: { default: '<li class="child">child</li>' },
      ...withVariant('verbose'),
    })
    // A parent with children is always a button, never a link.
    const row = w.find('.nb-sidebar-menu-item__row')
    expect(row.element.tagName).toBe('BUTTON')
    expect(row.attributes('aria-expanded')).toBe('false')
    await row.trigger('click')
    expect(row.attributes('aria-expanded')).toBe('true')
  })

  it('emits click for a leaf row and not when disabled', async () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Action' },
      ...withVariant('verbose'),
    })
    await w.find('.nb-sidebar-menu-item__row').trigger('click')
    expect(w.emitted('click')).toHaveLength(1)

    const disabled = mount(SidebarMenuItem, {
      props: { label: 'Action', disabled: true },
      ...withVariant('verbose'),
    })
    await disabled.find('.nb-sidebar-menu-item__row').trigger('click')
    expect(disabled.emitted('click')).toBeUndefined()
    expect(disabled.find('.nb-sidebar-menu-item__row').classes()).toContain(
      'nb-sidebar-menu-item__row--disabled',
    )
  })

  it('marks the active row with the active modifier', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Dashboard', active: true },
      ...withVariant('verbose'),
    })
    expect(w.find('.nb-sidebar-menu-item__row').classes()).toContain(
      'nb-sidebar-menu-item__row--active',
    )
  })

  it('renders a badge with its variant in verbose mode', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'AI', badge: 'NEW', badgeVariant: 'accent' },
      ...withVariant('verbose'),
    })
    const badge = w.find('.nb-sidebar-menu-item__badge')
    expect(badge.text()).toBe('NEW')
    expect(badge.classes()).toContain('nb-sidebar-menu-item__badge--accent')
  })

  it('uses an icon-only compact row with an aria-label and a badge dot', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Dashboard', icon: 'gauge', badge: 3 },
      ...withVariant('compact'),
    })
    const row = w.find('.nb-sidebar-menu-item__row')
    expect(row.classes()).toContain('nb-sidebar-menu-item__row--compact')
    expect(row.attributes('aria-label')).toBe('Dashboard')
    // No text label in compact, but a badge dot pip instead of a pill.
    expect(w.find('.nb-sidebar-menu-item__label').exists()).toBe(false)
    expect(w.find('.nb-sidebar-menu-item__badge-dot').exists()).toBe(true)
  })

  it('opens a teleported flyout on hover in compact mode', async () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Dashboard', icon: 'gauge' },
      attachTo: document.body,
      ...withVariant('compact'),
    })
    expect(document.querySelector('.nb-sidebar-menu-item__flyout')).toBeNull()
    await w.find('.nb-sidebar-menu-item').trigger('mouseenter')
    const flyout = document.querySelector('.nb-sidebar-menu-item__flyout')
    expect(flyout).not.toBeNull()
    expect(flyout?.textContent).toContain('Dashboard')
    w.unmount()
  })
})
