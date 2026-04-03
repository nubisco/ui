import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Breadcrumbs from '../src/components/Breadcrumbs.vue'

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  template: '<i data-testid="nb-icon" :data-name="name"></i>',
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
