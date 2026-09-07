import { describe, it, expect, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Icon from '../src/components/Icon.vue'
import * as house from '@nubisco/ui/icons/house'
import { registerIcons, unregisterIcon } from '../src/composables/iconRegistry'

// These specs cover the three ways an icon reaches NbIcon. Everything below
// the first describe passes the module, which is what the compile-time plugin
// injects for a literal `name="house"`, so the assertions run against the same
// input a built app produces.

describe('Icon', () => {
  const createWrapper = (props = {}) =>
    mount(Icon, { props: { name: house, ...props } })

  it('renders an i element', () => {
    const wrapper = createWrapper()
    expect(wrapper.element.tagName.toLowerCase()).toBe('i')
  })

  it('applies nb-icon class', () => {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('nb-icon')
  })

  it('applies the icon name as a class, read off the linked module', () => {
    const wrapper = createWrapper({ name: house })
    expect(wrapper.classes()).toContain('house')
  })

  it('applies size class for named sizes', () => {
    const wrapper = createWrapper({ name: house, size: 'md' })
    expect(wrapper.classes()).toContain('nb-icon-md')
  })

  it('applies width and height attributes for named sizes', () => {
    const wrapper = createWrapper({ name: house, size: 'md' })
    expect(wrapper.attributes('width')).toBeTruthy()
    expect(wrapper.attributes('height')).toBeTruthy()
  })

  it('applies color style when color is provided', () => {
    const wrapper = createWrapper({ name: house, color: 'red' })
    expect(wrapper.attributes('style')).toContain('color: red')
  })

  it('applies role button when clickable', () => {
    const wrapper = createWrapper({ name: house, clickable: true })
    expect(wrapper.attributes('role')).toBe('button')
  })

  it('does not apply role button when not clickable', () => {
    const wrapper = createWrapper({ name: house })
    expect(wrapper.attributes('role')).toBeUndefined()
  })

  it('emits click when clickable and clicked', async () => {
    const wrapper = createWrapper({ name: house, clickable: true })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click when not clickable', async () => {
    const wrapper = createWrapper({ name: house })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('applies title attribute', () => {
    const wrapper = createWrapper({ name: house, title: 'Go home' })
    expect(wrapper.attributes('title')).toBe('Go home')
  })

  it('applies hoverable class', () => {
    const wrapper = createWrapper({ name: house, hoverable: true })
    expect(wrapper.classes()).toContain('hoverable')
  })

  it('applies box-clickable class when clickable', () => {
    const wrapper = createWrapper({ name: house, clickable: true })
    expect(wrapper.classes()).toContain('box-clickable')
  })

  it('renders the icon svg component', () => {
    const wrapper = createWrapper({ name: house })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})

describe('Icon: how the glyph is resolved', () => {
  afterEach(() => unregisterIcon('house'))

  it('accepts a module on `icon`, which wins over `name`', () => {
    const wrapper = mount(Icon, { props: { name: 'not-an-icon', icon: house } })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.classes()).toContain('house')
  })

  it('resolves a registered name without any catalogue', () => {
    registerIcons({ house })
    const wrapper = mount(Icon, { props: { name: 'house' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('fails loudly when a runtime name is used and no catalogue is loaded', () => {
    expect(() => mount(Icon, { props: { name: 'house' } })).toThrow(
      /icon catalogue is not loaded/,
    )
  })

  it('resolves a runtime name once the catalogue is imported', async () => {
    await import('@nubisco/ui/icons/all')
    const wrapper = mount(Icon, { props: { name: 'house' } })
    await flushPromises()
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})
