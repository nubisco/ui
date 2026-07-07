import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CheckboxGroup from '../src/components/CheckboxGroup.vue'
import Checkbox from '../src/components/Checkbox.vue'

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

describe('CheckboxGroup', () => {
  const createWrapper = (props = {}, slotContent = '') =>
    mount(CheckboxGroup, {
      props,
      slots: slotContent ? { default: slotContent } : {},
      global: {
        components: { NbCheckbox: Checkbox },
        stubs: { NbLabel: NbLabelStub, NbMessage: NbMessageStub },
      },
    })

  it('renders slotted checkboxes', () => {
    const wrapper = createWrapper(
      {},
      '<NbCheckbox label="A" /><NbCheckbox label="B" />',
    )
    expect(wrapper.findAllComponents(Checkbox)).toHaveLength(2)
  })

  it('renders the group label', () => {
    const wrapper = createWrapper({ label: 'Interests' })
    expect(wrapper.find('[data-testid="nb-label"]').text()).toBe('Interests')
  })

  it('omits the label element when no label is given', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('[data-testid="nb-label"]').exists()).toBe(false)
  })

  it('stacks vertically by default and applies horizontal class', () => {
    expect(
      createWrapper().find('.nb-checkbox-group__items--vertical').exists(),
    ).toBe(true)
    expect(
      createWrapper({ direction: 'horizontal' })
        .find('.nb-checkbox-group__items--horizontal')
        .exists(),
    ).toBe(true)
  })

  it('shows error over warning and helper', () => {
    const wrapper = createWrapper({ error: 'E', warning: 'W', helper: 'H' })
    const message = wrapper.find('[data-testid="nb-message"]')
    expect(message.attributes('data-variant')).toBe('error')
    expect(message.text()).toBe('E')
    expect(wrapper.classes()).toContain('nb-checkbox-group--error')
  })

  it('shows warning when no error is set', () => {
    const wrapper = createWrapper({ warning: 'W', helper: 'H' })
    expect(
      wrapper.find('[data-testid="nb-message"]').attributes('data-variant'),
    ).toBe('warning')
  })

  it('shows helper when neither error nor warning is set', () => {
    const wrapper = createWrapper({ helper: 'H' })
    expect(
      wrapper.find('[data-testid="nb-message"]').attributes('data-variant'),
    ).toBe('helper')
  })

  it('disables child checkboxes when the group is disabled', () => {
    const wrapper = createWrapper(
      { disabled: true },
      '<NbCheckbox label="A" />',
    )
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.nb-checkbox--disabled').exists()).toBe(true)
  })

  it('keeps child checkboxes enabled when the group is not disabled', () => {
    const wrapper = createWrapper({}, '<NbCheckbox label="A" />')
    expect(
      wrapper.find('input[type="checkbox"]').attributes('disabled'),
    ).toBeUndefined()
  })
})
