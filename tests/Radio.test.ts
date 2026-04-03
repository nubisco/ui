import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Radio from '../src/components/Radio.vue'

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

const options = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
]

describe('Radio', () => {
  const createWrapper = (props = {}) =>
    mount(Radio, {
      props: { name: 'choice', options, ...props },
      global: {
        stubs: { NbLabel: NbLabelStub, NbMessage: NbMessageStub },
      },
    })

  it('renders all options', () => {
    const wrapper = createWrapper()
    expect(wrapper.findAll('.nb-radio__option')).toHaveLength(3)
  })

  it('renders option labels', () => {
    const wrapper = createWrapper()
    const texts = wrapper.findAll('.nb-radio__text').map((el) => el.text())
    expect(texts).toEqual(['Option A', 'Option B', 'Option C'])
  })

  it('renders group label when provided', () => {
    const wrapper = createWrapper({ label: 'Choose one' })
    expect(wrapper.find('[data-testid="nb-label"]').text()).toBe('Choose one')
  })

  it('shows dot on selected option', () => {
    const wrapper = createWrapper({ modelValue: 'b' })
    const options = wrapper.findAll('.nb-radio__option')
    expect(options[1].find('.nb-radio__dot').exists()).toBe(true)
    expect(options[0].find('.nb-radio__dot').exists()).toBe(false)
  })

  it('emits update:modelValue when option is selected', async () => {
    const wrapper = createWrapper({ modelValue: 'a' })
    const input = wrapper.findAll('input[type="radio"]')[1]
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })

  it('applies vertical direction class by default', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-radio__group').classes()).toContain(
      'nb-radio__group--vertical',
    )
  })

  it('applies horizontal direction class', () => {
    const wrapper = createWrapper({ direction: 'horizontal' })
    expect(wrapper.find('.nb-radio__group').classes()).toContain(
      'nb-radio__group--horizontal',
    )
  })

  it('applies disabled class when disabled', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.classes()).toContain('nb-radio--disabled')
  })

  it('applies readonly class when readonly', () => {
    const wrapper = createWrapper({ readonly: true })
    expect(wrapper.classes()).toContain('nb-radio--readonly')
  })

  it('applies error class and renders error message', () => {
    const wrapper = createWrapper({ error: 'Required field' })
    expect(wrapper.classes()).toContain('nb-radio--error')
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('error')
    expect(msg.text()).toBe('Required field')
  })

  it('renders warning message when warning provided', () => {
    const wrapper = createWrapper({ warning: 'Double-check this' })
    expect(wrapper.classes()).toContain('nb-radio--warning')
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('warning')
  })

  it('renders helper message', () => {
    const wrapper = createWrapper({ helper: 'Select one option' })
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('helper')
  })

  it('does not emit when readonly', async () => {
    const wrapper = createWrapper({ readonly: true, modelValue: 'a' })
    const input = wrapper.findAll('input[type="radio"]')[1]
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('disables individual option', () => {
    const optionsWithDisabled = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b', disabled: true },
    ]
    const wrapper = createWrapper({ options: optionsWithDisabled })
    expect(wrapper.findAll('.nb-radio__option')[1].classes()).toContain(
      'nb-radio__option--disabled',
    )
  })
})
