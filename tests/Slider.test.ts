import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Slider from '../src/components/Slider.vue'

const NbLabelStub = {
  name: 'NbLabel',
  template: '<label data-testid="nb-label" v-bind="$attrs"><slot /></label>',
}

const NbMessageStub = {
  name: 'NbMessage',
  props: ['variant'],
  template:
    '<span data-testid="nb-message" :data-variant="variant"><slot /></span>',
}

const NbGridStub = {
  name: 'NbGrid',
  props: ['is', 'dir', 'align', 'justify', 'gap', 'grow', 'flex'],
  template: '<div v-bind="$attrs"><slot /></div>',
}

const NbNumberInputStub = {
  name: 'NbNumberInput',
  props: ['modelValue', 'min', 'max', 'step', 'disabled', 'size'],
  template:
    '<input data-testid="nb-number-input" type="number" :value="modelValue" :min="min" :max="max" :disabled="disabled" />',
  emits: ['update:modelValue', 'change'],
}

describe('Slider', () => {
  const createWrapper = (props = {}) =>
    mount(Slider, {
      props,
      global: {
        stubs: {
          NbLabel: NbLabelStub,
          NbMessage: NbMessageStub,
          NbGrid: NbGridStub,
          NbNumberInput: NbNumberInputStub,
        },
      },
    })

  it('renders the track', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-slider__track').exists()).toBe(true)
  })

  it('renders min and max labels', () => {
    const wrapper = createWrapper({ min: 10, max: 90 })
    const labels = wrapper.findAll('.nb-slider__track-label')
    expect(labels[0].text()).toBe('10')
    expect(labels[1].text()).toBe('90')
  })

  it('renders label when provided', () => {
    const wrapper = createWrapper({ label: 'Volume' })
    expect(wrapper.find('[data-testid="nb-label"]').text()).toBe('Volume')
  })

  it('renders number input by default', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('[data-testid="nb-number-input"]').exists()).toBe(true)
  })

  it('does not render number input when showInput is false', () => {
    const wrapper = createWrapper({ showInput: false })
    expect(wrapper.find('[data-testid="nb-number-input"]').exists()).toBe(false)
  })

  it('applies disabled class', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.classes()).toContain('nb-slider--disabled')
  })

  it('applies error class', () => {
    const wrapper = createWrapper({ error: 'Out of range' })
    expect(wrapper.classes()).toContain('nb-slider--error')
  })

  it('applies warning class', () => {
    const wrapper = createWrapper({ warning: 'Near limit' })
    expect(wrapper.classes()).toContain('nb-slider--warning')
  })

  it('shows error message', () => {
    const wrapper = createWrapper({ error: 'Invalid value' })
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('error')
    expect(msg.text()).toBe('Invalid value')
  })

  it('shows helper message', () => {
    const wrapper = createWrapper({ helper: 'Drag to adjust' })
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('helper')
  })

  it('renders single handle when not range', () => {
    const wrapper = createWrapper({ modelValue: 50 })
    expect(wrapper.findAll('.nb-slider__track__handle')).toHaveLength(1)
    expect(wrapper.find('.nb-slider__track__handle--low').exists()).toBe(false)
  })

  it('renders two handles when range is true', () => {
    const wrapper = createWrapper({ range: true, modelValue: [20, 80] })
    expect(wrapper.find('.nb-slider__track__handle--low').exists()).toBe(true)
    expect(wrapper.find('.nb-slider__track__handle--high').exists()).toBe(true)
  })

  it('renders two number inputs when range is true', () => {
    const wrapper = createWrapper({ range: true, modelValue: [20, 80] })
    expect(wrapper.findAll('[data-testid="nb-number-input"]')).toHaveLength(2)
  })

  it('applies range class when range is true', () => {
    const wrapper = createWrapper({ range: true })
    expect(wrapper.classes()).toContain('nb-slider--range')
  })

  it('applies size class', () => {
    const wrapper = createWrapper({ size: 'sm' })
    expect(wrapper.classes()).toContain('nb-slider--sm')
  })

  it('renders fluid variant label inside box', () => {
    const wrapper = createWrapper({ variant: 'fluid', label: 'Speed' })
    expect(wrapper.find('.nb-slider__inner-label').text()).toBe('Speed')
  })
})
