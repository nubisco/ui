import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NumberInput from '../src/components/NumberInput.vue'

const NbLabelStub = {
  name: 'NbLabel',
  props: ['for', 'required', 'disabled'],
  template: '<label data-testid="nb-label" v-bind="$attrs"><slot /></label>',
}

const NbMessageStub = {
  name: 'NbMessage',
  props: ['variant', 'iconOnly'],
  template:
    '<span data-testid="nb-message" :data-variant="variant"><slot /></span>',
}

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  template: '<i data-testid="nb-icon" :data-name="name"></i>',
}

describe('NumberInput', () => {
  const createWrapper = (props = {}) =>
    mount(NumberInput, {
      props,
      global: {
        stubs: {
          NbLabel: NbLabelStub,
          NbMessage: NbMessageStub,
          NbIcon: NbIconStub,
        },
      },
    })

  it('renders a number input', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('input[type="number"]').exists()).toBe(true)
  })

  it('renders label when provided', () => {
    const wrapper = createWrapper({ label: 'Quantity' })
    expect(wrapper.find('[data-testid="nb-label"]').text()).toBe('Quantity')
  })

  it('renders increment and decrement buttons', () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
  })

  it('increment button has aria-label Increase', () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    expect(buttons[1].attributes('aria-label')).toBe('Increase')
  })

  it('decrement button has aria-label Decrease', () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    expect(buttons[0].attributes('aria-label')).toBe('Decrease')
  })

  it('emits update:modelValue and change on increment', async () => {
    const wrapper = createWrapper({ modelValue: 5 })
    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([6])
    expect(wrapper.emitted('change')?.[0]).toEqual([6])
  })

  it('emits update:modelValue and change on decrement', async () => {
    const wrapper = createWrapper({ modelValue: 5 })
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([4])
  })

  it('respects step on increment', async () => {
    const wrapper = createWrapper({ modelValue: 0, step: 5 })
    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([5])
  })

  it('does not go below min', async () => {
    const wrapper = createWrapper({ modelValue: 0, min: 0 })
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0])
  })

  it('does not go above max', async () => {
    const wrapper = createWrapper({ modelValue: 10, max: 10 })
    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([10])
  })

  it('applies at-limit class to decrement button at min', () => {
    const wrapper = createWrapper({ modelValue: 0, min: 0 })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].classes()).toContain('nb-number-input__stepper--at-limit')
  })

  it('applies at-limit class to increment button at max', () => {
    const wrapper = createWrapper({ modelValue: 100, max: 100 })
    const buttons = wrapper.findAll('button')
    expect(buttons[1].classes()).toContain('nb-number-input__stepper--at-limit')
  })

  it('disables buttons when disabled prop is set', () => {
    const wrapper = createWrapper({ disabled: true })
    const buttons = wrapper.findAll('button')
    for (const btn of buttons) {
      expect(btn.element.disabled).toBe(true)
    }
  })

  it('shows error message', () => {
    const wrapper = createWrapper({ error: 'Value required' })
    const messages = wrapper.findAll('[data-testid="nb-message"]')
    const errorMsg = messages.find(
      (m) => m.attributes('data-variant') === 'error',
    )
    expect(errorMsg?.text()).toBe('Value required')
  })

  it('shows warning message', () => {
    const wrapper = createWrapper({ warning: 'Out of range' })
    const messages = wrapper.findAll('[data-testid="nb-message"]')
    const warnMsg = messages.find(
      (m) => m.attributes('data-variant') === 'warning',
    )
    expect(warnMsg).toBeTruthy()
  })

  it('shows helper message', () => {
    const wrapper = createWrapper({ helper: 'Enter a number' })
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('helper')
  })

  it('applies disabled class to root', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.classes()).toContain('nb-number-input--disabled')
  })

  it('applies size class', () => {
    const wrapper = createWrapper({ size: 'sm' })
    expect(wrapper.classes()).toContain('nb-number-input--sm')
  })
})
