import { glyphStubComputed } from './__mocks__/glyphStub'
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Breadcrumbs from '../src/components/Breadcrumbs.vue'

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  computed: glyphStubComputed,
  template: '<i data-testid="nb-icon" :data-name="resolvedName"></i>',
}

describe('Breadcrumbs', () => {
  const createWrapper = (props = {}, slots = {}) =>
    mount(Breadcrumbs, {
      props,
      slots,
      global: { stubs: { NbIcon: NbIconStub } },
    })

  it('renders as a nav element', () => {
    const wrapper = createWrapper()
    expect(wrapper.element.tagName.toLowerCase()).toBe('nav')
  })

  it('has aria-label breadcrumb', () => {
    const wrapper = createWrapper()
    expect(wrapper.attributes('aria-label')).toBe('breadcrumb')
  })

  it('renders title text', () => {
    const wrapper = createWrapper({ title: 'Settings' })
    expect(wrapper.find('.nb-breadcrumbs__title').text()).toBe('Settings')
  })

  it('renders subtitle text', () => {
    const wrapper = createWrapper({ subtitle: 'Profile' })
    expect(wrapper.find('.nb-breadcrumbs__subtitle').text()).toBe('Profile')
  })

  it('renders both title and subtitle', () => {
    const wrapper = createWrapper({ title: 'Admin', subtitle: 'Users' })
    expect(wrapper.find('.nb-breadcrumbs__title').text()).toBe('Admin')
    expect(wrapper.find('.nb-breadcrumbs__subtitle').text()).toBe('Users')
  })

  it('renders crumbs slot', () => {
    const wrapper = createWrapper({}, { default: '<a href="/home">Home</a>' })
    expect(wrapper.find('.nb-breadcrumbs__crumbs').exists()).toBe(true)
    expect(wrapper.text()).toContain('Home')
  })

  it('shows separator when both brand and crumbs are present', () => {
    const wrapper = createWrapper({ title: 'App' }, { default: '<a>Page</a>' })
    const sep = wrapper.find('[data-testid="nb-icon"]')
    expect(sep.exists()).toBe(true)
    expect(sep.attributes('data-name')).toBe('caret-right')
  })

  it('does not show separator when only brand present', () => {
    const wrapper = createWrapper({ title: 'App' })
    expect(wrapper.find('[data-testid="nb-icon"]').exists()).toBe(false)
  })

  it('does not show separator when only crumbs present', () => {
    const wrapper = createWrapper({}, { default: '<a>Home</a>' })
    expect(wrapper.find('[data-testid="nb-icon"]').exists()).toBe(false)
  })
})

describe('Breadcrumbs with an empty slot', () => {
  // A v-for over an empty list still returns a Fragment, and a v-if that fails
  // still returns a Comment. Neither renders anything, and neither should draw
  // the separator after the brand.
  it('draws no separator when the slot renders nothing', () => {
    const wrapper = mount(Breadcrumbs, {
      props: { title: 'Nubisco', subtitle: 'CMS' },
      slots: { default: () => [] },
    })
    expect(wrapper.find('.nb-breadcrumbs__sep').exists()).toBe(false)
  })

  it('draws the separator when the slot renders a crumb', () => {
    const wrapper = mount(Breadcrumbs, {
      props: { title: 'Nubisco', subtitle: 'CMS' },
      slots: { default: '<span>Releases</span>' },
    })
    expect(wrapper.find('.nb-breadcrumbs__sep').exists()).toBe(true)
  })
})

describe('Breadcrumbs from items', () => {
  const RouterLink = {
    name: 'RouterLink',
    props: { to: { type: [String, Object], required: true } },
    template: '<a class="rl" :href="String(to)"><slot /></a>',
  }

  const mountItems = (
    props: Record<string, unknown>,
    attrs: Record<string, unknown> = {},
    withRouter = false,
  ) =>
    mount(Breadcrumbs, {
      props,
      attrs,
      global: {
        stubs: { NbIcon: NbIconStub },
        components: withRouter ? { RouterLink } : {},
      },
    })

  it('renders a RouterLink for `to`, an anchor for `href`, the last as the page', () => {
    const wrapper = mountItems(
      {
        items: [
          { label: 'Sites', to: '/sites' },
          { label: 'Docs', href: 'https://example.com/docs' },
          { label: 'Releases' },
        ],
      },
      {},
      true,
    )
    const crumbs = wrapper.findAll('.nb-breadcrumbs__item')
    expect(crumbs).toHaveLength(3)
    expect(crumbs[0]!.find('.rl').attributes('href')).toBe('/sites')
    const anchor = crumbs[1]!.find('a')
    expect(anchor.attributes('href')).toBe('https://example.com/docs')
    const current = crumbs[2]!.find('[aria-current="page"]')
    expect(current.text()).toBe('Releases')
    expect(crumbs[2]!.find('a, button').exists()).toBe(false)
  })

  it('falls back to a plain anchor for a string `to` without a router', () => {
    const wrapper = mountItems({
      items: [{ label: 'Sites', to: '/sites' }, { label: 'Here' }],
    })
    expect(wrapper.find('a').attributes('href')).toBe('/sites')
  })

  it('renders a crumb with onClick as a button that calls it and emits select', async () => {
    const onClick = vi.fn()
    const item = { label: 'Back to the list', onClick }
    const wrapper = mountItems({ items: [item, { label: 'Entry' }] })
    const button = wrapper.find('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.text()).toBe('Back to the list')
    await button.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    const [emitted] = wrapper.emitted('select') ?? []
    expect(emitted?.[0]).toEqual(item)
    expect(emitted?.[1]).toBe(0)
  })

  it('makes plain crumbs buttons when the trail listens for select', async () => {
    const onSelect = vi.fn()
    const wrapper = mountItems(
      { items: [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }] },
      { onSelect },
    )
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    await buttons[1]!.trigger('click')
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Two' }),
      1,
      expect.anything(),
    )
  })

  it('leaves a crumb with nothing to do as text', () => {
    const wrapper = mountItems({
      items: [{ label: 'Section' }, { label: 'Page' }],
    })
    expect(wrapper.find('a, button').exists()).toBe(false)
    expect(wrapper.text()).toContain('Section')
  })

  it('never makes the current crumb interactive, even with a link', () => {
    const wrapper = mountItems({
      items: [
        { label: 'Sites', to: '/sites', current: true },
        { label: 'Later', href: '/later' },
      ],
    })
    const crumbs = wrapper.findAll('.nb-breadcrumbs__item')
    expect(crumbs[0]!.find('[aria-current="page"]').exists()).toBe(true)
    expect(crumbs[0]!.find('a, button').exists()).toBe(false)
    expect(crumbs[1]!.find('a').attributes('href')).toBe('/later')
  })

  it('draws the brand separator for items, and replaces the slot', () => {
    const wrapper = mount(Breadcrumbs, {
      props: { title: 'Acme', subtitle: 'App', items: [{ label: 'Page' }] },
      slots: { default: '<span class="slotted">ignored</span>' },
      global: { stubs: { NbIcon: NbIconStub } },
    })
    expect(wrapper.find('.nb-breadcrumbs__sep').exists()).toBe(true)
    expect(wrapper.find('.slotted').exists()).toBe(false)
  })

  it('renders linked crumbs as the link variant, so they keep its focus ring', () => {
    const wrapper = mountItems({
      items: [{ label: 'Sites', href: '/sites' }, { label: 'Here' }],
    })
    expect(wrapper.find('a').classes()).toContain('nb-button--link')
  })
})

describe('Breadcrumbs item styles', () => {
  it('never wraps a crumb, linked or not', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const { pathToFileURL } = await import('node:url')
    const { parse } = await import('vue/compiler-sfc')
    const { compileString } = await import('sass-embedded')
    const path = join(__dirname, '../src/components/Breadcrumbs.vue')
    const { descriptor } = parse(readFileSync(path, 'utf8'))
    const css = descriptor.styles
      .map((s) => compileString(s.content, { url: pathToFileURL(path) }).css)
      .join('\n')
    expect(css).toMatch(
      /\.nb-breadcrumbs__item > \.nb-breadcrumbs__link\s*\{[^}]*white-space:\s*nowrap/,
    )
    expect(css).toMatch(/\.nb-breadcrumbs__item\s*\{[^}]*white-space:\s*nowrap/)
  })
})
