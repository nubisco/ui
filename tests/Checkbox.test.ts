import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Checkbox from '../src/components/Checkbox.vue'

describe('Checkbox', () => {
  it('renders as a label element', () => {
    const wrapper = mount(Checkbox)
    expect(wrapper.element.tagName.toLowerCase()).toBe('label')
  })

  it('renders unchecked by default', () => {
    const wrapper = mount(Checkbox)
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.element.checked).toBe(false)
  })

  it('renders checked when modelValue is true', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } })
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.element.checked).toBe(true)
  })

  it('shows check svg when checked and not indeterminate', () => {
    const wrapper = mount(Checkbox, { props: { modelValue: true } })
    expect(wrapper.find('.nb-checkbox__check').exists()).toBe(true)
    expect(wrapper.find('.nb-checkbox__dash').exists()).toBe(false)
  })

  it('shows dash when indeterminate', () => {
    const wrapper = mount(Checkbox, {
      props: { modelValue: false, indeterminate: true },
    })
    expect(wrapper.find('.nb-checkbox__dash').exists()).toBe(true)
    expect(wrapper.find('.nb-checkbox__check').exists()).toBe(false)
  })

  it('shows label when label prop is provided', () => {
    const wrapper = mount(Checkbox, { props: { label: 'Accept terms' } })
    expect(wrapper.find('.nb-checkbox__label').text()).toBe('Accept terms')
  })

  it('renders slot content when no label prop', () => {
    const wrapper = mount(Checkbox, {
      slots: { default: '<span class="custom">Custom</span>' },
    })
    expect(wrapper.find('.custom').exists()).toBe(true)
  })

  it('applies disabled class when disabled', () => {
    const wrapper = mount(Checkbox, { props: { disabled: true } })
    expect(wrapper.classes()).toContain('nb-checkbox--disabled')
  })

  it('emits update:modelValue with true on check', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })
    const input = wrapper.find('input[type="checkbox"]')
    input.element.checked = true
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([true])
  })

  it('does not emit when disabled', async () => {
    const wrapper = mount(Checkbox, {
      props: { modelValue: false, disabled: true },
    })
    const input = wrapper.find('input[type="checkbox"]')
    input.element.checked = true
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
