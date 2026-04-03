import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Panel from '../src/components/Panel.vue'

describe('Panel', () => {
  it('renders with nb-panel class', () => {
    const wrapper = mount(Panel)
    expect(wrapper.classes()).toContain('nb-panel')
  })

  it('renders slot content', () => {
    const wrapper = mount(Panel, {
      slots: { default: '<p class="content">Hello</p>' },
    })
    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.text()).toBe('Hello')
  })

  it('renders as a div element', () => {
    const wrapper = mount(Panel)
    expect(wrapper.element.tagName.toLowerCase()).toBe('div')
  })
})
