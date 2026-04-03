import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TextInput from '../src/components/TextInput.vue'

const NbGridStub = {
  name: 'NbGrid',
  props: ['dir', 'gap'],
  template: '<div v-bind="$attrs"><slot /></div>',
}

const NbLabelStub = {
  name: 'NbLabel',
  props: ['for', 'required', 'disabled'],
  template:
    '<label data-testid="nb-label" :for="$props.for" v-bind="$attrs"><slot /></label>',
}

const NbMessageStub = {
  name: 'NbMessage',
  props: ['variant', 'iconOnly'],
  template:
    '<span data-testid="nb-message" :data-variant="variant"><slot /></span>',
}

describe('TextInput', () => {
  const createWrapper = (props = {}, slots = {}) =>
    mount(TextInput, {
      props,
      slots,
      global: {
        stubs: {
          NbGrid: NbGridStub,
          NbLabel: NbLabelStub,
          NbMessage: NbMessageStub,
        },
      },
    })

  it('renders an input element', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('renders with text type by default', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('input').attributes('type')).toBe('text')
  })

  it('renders label when provided', () => {
    const wrapper = createWrapper({ label: 'Username' })
    expect(wrapper.find('[data-testid="nb-label"]').text()).toBe('Username')
  })

  it('sets placeholder on the input', () => {
    const wrapper = createWrapper({ placeholder: 'Enter text...' })
    expect(wrapper.find('input').attributes('placeholder')).toBe(
      'Enter text...',
    )
  })

  it('renders with provided modelValue', () => {
    const wrapper = createWrapper({ modelValue: 'hello' })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe(
      'hello',
    )
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = createWrapper({ modelValue: '' })
    const input = wrapper.find('input')
    await input.setValue('new value')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('applies disabled attribute', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.find('input').element.disabled).toBe(true)
  })

  it('applies readonly attribute', () => {
    const wrapper = createWrapper({ readonly: true })
    expect(wrapper.find('input').attributes('readonly')).toBeDefined()
  })

  it('shows error message', () => {
    const wrapper = createWrapper({ error: 'Invalid email' })
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('error')
    expect(msg.text()).toBe('Invalid email')
  })

  it('applies warning class to field wrapper', () => {
    const wrapper = createWrapper({ warning: 'Check format' })
    expect(wrapper.find('.nb-text-input__field-wrapper').classes()).toContain(
      'nb-text-input__field-wrapper--warning',
    )
  })

  it('does not apply warning wrapper class when error is present', () => {
    const wrapper = createWrapper({ error: 'Bad', warning: 'Also bad' })
    expect(
      wrapper.find('.nb-text-input__field-wrapper').classes(),
    ).not.toContain('nb-text-input__field-wrapper--warning')
  })

  it('does not render message when no message props provided', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('[data-testid="nb-message"]').exists()).toBe(false)
  })

  it('renders textarea when multiline is true', () => {
    const wrapper = createWrapper({ multiline: true })
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('applies error class to field wrapper', () => {
    const wrapper = createWrapper({ error: 'Error' })
    expect(wrapper.find('.nb-text-input__field-wrapper').classes()).toContain(
      'nb-text-input__field-wrapper--error',
    )
  })

  it('applies warning class to field wrapper', () => {
    const wrapper = createWrapper({ warning: 'Warning' })
    expect(wrapper.find('.nb-text-input__field-wrapper').classes()).toContain(
      'nb-text-input__field-wrapper--warning',
    )
  })

  it('applies size class', () => {
    const wrapper = createWrapper({ size: 'lg' })
    expect(wrapper.classes()).toContain('nb-text-input--lg')
  })

  it('renders fluid variant', () => {
    const wrapper = createWrapper({ variant: 'fluid' })
    expect(wrapper.classes()).toContain('nb-text-input--fluid')
  })

  it('renders fluid variant label inline', () => {
    const wrapper = createWrapper({ variant: 'fluid', label: 'Email' })
    expect(wrapper.find('.nb-text-input__inner-label').text()).toContain(
      'Email',
    )
  })
})
