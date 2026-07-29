import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import Field from '../src/components/Field.vue'

describe('Field', () => {
  it('renders the label text', () => {
    const wrapper = mount(Field, { props: { label: 'Name' } })
    expect(wrapper.find('.nb-field__label').text()).toBe('Name')
  })

  it('renders slotted control content in the control cell', () => {
    const wrapper = mount(Field, {
      props: { label: 'Name' },
      slots: { default: '<input class="ctl" />' },
    })
    expect(wrapper.find('.nb-field__control .ctl').exists()).toBe(true)
  })

  it('associates the label with an auto-generated control id', () => {
    const wrapper = mount(Field, { props: { label: 'Name' } })
    expect(wrapper.find('.nb-field__label').attributes('for')).toBeTruthy()
  })

  it('uses labelFor for the association when provided', () => {
    const wrapper = mount(Field, {
      props: { label: 'Name', labelFor: 'my-id' },
    })
    expect(wrapper.find('.nb-field__label').attributes('for')).toBe('my-id')
  })

  it('exposes the control id to the default slot', () => {
    const wrapper = mount(Field, {
      props: { label: 'Name', labelFor: 'x9' },
      slots: {
        default: (params: { id: string }) =>
          h('input', { id: params.id, class: 'c' }),
      },
    })
    expect(wrapper.find('input.c').attributes('id')).toBe('x9')
  })

  it('defaults to row orientation and a filling control', () => {
    const wrapper = mount(Field, { props: { label: 'X' } })
    expect(wrapper.classes()).toContain('nb-field--row')
    expect(wrapper.classes()).toContain('nb-field--control-fill')
    expect(wrapper.classes()).toContain('nb-field--align-center')
  })

  it('applies the stack orientation modifier', () => {
    const wrapper = mount(Field, {
      props: { label: 'X', orientation: 'stack' },
    })
    expect(wrapper.classes()).toContain('nb-field--stack')
  })

  it('applies the control="fit" modifier', () => {
    const wrapper = mount(Field, { props: { label: 'X', control: 'fit' } })
    expect(wrapper.classes()).toContain('nb-field--control-fit')
  })

  it('applies the align="start" modifier', () => {
    const wrapper = mount(Field, { props: { label: 'X', align: 'start' } })
    expect(wrapper.classes()).toContain('nb-field--align-start')
  })

  it('renders a hint when provided', () => {
    const wrapper = mount(Field, { props: { label: 'X', hint: 'helper' } })
    expect(wrapper.find('.nb-field__hint').text()).toBe('helper')
  })

  it('omits the hint element when no hint is given', () => {
    const wrapper = mount(Field, { props: { label: 'X' } })
    expect(wrapper.find('.nb-field__hint').exists()).toBe(false)
  })

  it('prefers a custom #label slot over the label prop', () => {
    const wrapper = mount(Field, {
      props: { label: 'Prop' },
      slots: { label: '<span class="custom">Custom</span>' },
    })
    expect(wrapper.find('.custom').exists()).toBe(true)
    expect(wrapper.find('.nb-field__label').exists()).toBe(false)
  })
})
