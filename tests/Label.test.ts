import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Label from '../src/components/Label.vue'

describe('Label', () => {
  it('renders slot content', () => {
    const wrapper = mount(Label, { slots: { default: 'My Label' } })
    expect(wrapper.text()).toContain('My Label')
  })

  it('renders as a label element', () => {
    const wrapper = mount(Label)
    expect(wrapper.element.tagName.toLowerCase()).toBe('label')
  })

  it('sets for attribute via htmlFor prop', () => {
    const wrapper = mount(Label, { props: { htmlFor: 'my-input' } })
    expect(wrapper.attributes('for')).toBe('my-input')
  })

  it('applies default medium size class', () => {
    const wrapper = mount(Label)
    expect(wrapper.classes()).toContain('nb-label--md')
  })

  it('applies small size class', () => {
    const wrapper = mount(Label, { props: { size: 'sm' } })
    expect(wrapper.classes()).toContain('nb-label--sm')
  })

  it('shows asterisk and required class when required', () => {
    const wrapper = mount(Label, { props: { required: true } })
    expect(wrapper.classes()).toContain('nb-label--required')
    expect(wrapper.find('.nb-label__asterisk').exists()).toBe(true)
  })

  it('does not show asterisk when not required', () => {
    const wrapper = mount(Label)
    expect(wrapper.find('.nb-label__asterisk').exists()).toBe(false)
  })

  it('applies disabled class when disabled', () => {
    const wrapper = mount(Label, { props: { disabled: true } })
    expect(wrapper.classes()).toContain('nb-label--disabled')
  })

  it('renders suffix slot content', () => {
    const wrapper = mount(Label, {
      slots: {
        default: 'Label',
        suffix: '<span class="badge">New</span>',
      },
    })
    expect(wrapper.find('.badge').exists()).toBe(true)
  })
})
