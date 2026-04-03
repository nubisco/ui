import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Switch from '../src/components/Switch.vue'

const NbGridStub = {
  name: 'NbGrid',
  props: ['is', 'align', 'gap'],
  template: '<div v-bind="$attrs"><slot /></div>',
}

describe('Switch', () => {
  const createWrapper = (props = {}) =>
    mount(Switch, {
      props: { name: 'toggle', ...props },
      global: { stubs: { NbGrid: NbGridStub } },
    })

  it('renders a checkbox input', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
  })

  it('renders unchecked by default', () => {
    const wrapper = createWrapper({ modelValue: false })
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(false)
  })

  it('renders checked when modelValue is true', () => {
    const wrapper = createWrapper({ modelValue: true })
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(true)
  })

  it('renders label when provided', () => {
    const wrapper = createWrapper({ label: 'Dark mode' })
    expect(wrapper.find('.nb-switch-label').text()).toBe('Dark mode')
  })

  it('does not render label element when label is empty', () => {
    const wrapper = createWrapper({ label: '' })
    expect(wrapper.find('.nb-switch-label').exists()).toBe(false)
  })

  it('applies disabled attribute on input', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.find('input[type="checkbox"]').element.disabled).toBe(true)
  })

  it('applies size class to wrapper', () => {
    const wrapper = createWrapper({ size: 'lg' })
    expect(wrapper.find('.nb-switch-wrapper').classes()).toContain('lg')
  })

  it('applies default medium size class', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-switch-wrapper').classes()).toContain('md')
  })

  it('applies verbose class when verbose is true', () => {
    const wrapper = createWrapper({ verbose: true })
    expect(wrapper.find('.nb-switch-wrapper').classes()).toContain('verbose')
  })

  it('sets input name attribute', () => {
    const wrapper = createWrapper({ name: 'my-switch' })
    expect(wrapper.find('input[type="checkbox"]').attributes('name')).toBe(
      'my-switch',
    )
  })

  it('applies disabled class to root', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.classes()).toContain('disabled')
  })

  it('applies variant class to wrapper', () => {
    const wrapper = createWrapper({ variant: 'secondary' })
    expect(wrapper.find('.nb-switch-wrapper').classes()).toContain(
      'nb-secondary',
    )
  })
})
