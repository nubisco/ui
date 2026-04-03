import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from '../src/components/Icon.vue'

// virtual:icons is aliased to tests/__mocks__/virtual-icons.ts in vitest.config.ts

describe('Icon', () => {
  const createWrapper = (props = {}) =>
    mount(Icon, { props: { name: 'home', ...props } })

  it('renders an i element', () => {
    const wrapper = createWrapper()
    expect(wrapper.element.tagName.toLowerCase()).toBe('i')
  })

  it('applies nb-icon class', () => {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('nb-icon')
  })

  it('applies the icon name as a class', () => {
    const wrapper = createWrapper({ name: 'home' })
    expect(wrapper.classes()).toContain('home')
  })

  it('applies size class for named sizes', () => {
    const wrapper = createWrapper({ name: 'home', size: 'md' })
    expect(wrapper.classes()).toContain('nb-icon-md')
  })

  it('applies width and height attributes for named sizes', () => {
    const wrapper = createWrapper({ name: 'home', size: 'md' })
    expect(wrapper.attributes('width')).toBeTruthy()
    expect(wrapper.attributes('height')).toBeTruthy()
  })

  it('applies color style when color is provided', () => {
    const wrapper = createWrapper({ name: 'home', color: 'red' })
    expect(wrapper.attributes('style')).toContain('color: red')
  })

  it('applies role button when clickable', () => {
    const wrapper = createWrapper({ name: 'home', clickable: true })
    expect(wrapper.attributes('role')).toBe('button')
  })

  it('does not apply role button when not clickable', () => {
    const wrapper = createWrapper({ name: 'home' })
    expect(wrapper.attributes('role')).toBeUndefined()
  })

  it('emits click when clickable and clicked', async () => {
    const wrapper = createWrapper({ name: 'home', clickable: true })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click when not clickable', async () => {
    const wrapper = createWrapper({ name: 'home' })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('applies title attribute', () => {
    const wrapper = createWrapper({ name: 'home', title: 'Go home' })
    expect(wrapper.attributes('title')).toBe('Go home')
  })

  it('applies hoverable class', () => {
    const wrapper = createWrapper({ name: 'home', hoverable: true })
    expect(wrapper.classes()).toContain('hoverable')
  })

  it('applies box-clickable class when clickable', () => {
    const wrapper = createWrapper({ name: 'home', clickable: true })
    expect(wrapper.classes()).toContain('box-clickable')
  })

  it('renders the icon svg component', () => {
    const wrapper = createWrapper({ name: 'home' })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
