import { describe, it, expect, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import Select from '../src/components/Select.vue'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

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

const NbGridStub = {
  name: 'NbGrid',
  props: ['is', 'dir', 'align', 'justify', 'gap', 'flex', 'distributed'],
  template: '<div v-bind="$attrs"><slot /></div>',
}

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
]

describe('Select', () => {
  const createWrapper = (props = {}) =>
    mount(Select, {
      props: { options, ...props },
      global: {
        stubs: {
          NbLabel: NbLabelStub,
          NbMessage: NbMessageStub,
          NbIcon: NbIconStub,
          NbGrid: NbGridStub,
          Teleport: { template: '<div><slot /></div>' },
        },
      },
      attachTo: document.body,
    })

  it('renders the trigger button', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-select__trigger').exists()).toBe(true)
  })

  it('shows placeholder when no value is selected', () => {
    const wrapper = createWrapper({ placeholder: 'Pick one' })
    expect(wrapper.find('.nb-select__value').text()).toBe('Pick one')
  })

  it('shows selected option label', () => {
    const wrapper = createWrapper({ modelValue: 'banana' })
    expect(wrapper.find('.nb-select__value').text()).toBe('Banana')
  })

  it('renders label when provided', () => {
    const wrapper = createWrapper({ label: 'Fruit' })
    expect(wrapper.find('[data-testid="nb-label"]').text()).toBe('Fruit')
  })

  it('opens dropdown on trigger click', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.nb-select__trigger').trigger('click')
    expect(wrapper.find('.nb-select__dropdown').exists()).toBe(true)
  })

  it('renders options in dropdown when open', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.nb-select__trigger').trigger('click')
    const opts = wrapper.findAll('.nb-select__option')
    expect(opts).toHaveLength(3)
    expect(opts[0].text()).toContain('Apple')
  })

  it('emits update:modelValue when option is clicked', async () => {
    const wrapper = createWrapper({ modelValue: null })
    await wrapper.find('.nb-select__trigger').trigger('click')
    const opts = wrapper.findAll('.nb-select__option')
    await opts[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['banana'])
  })

  it('emits change when option is clicked', async () => {
    const wrapper = createWrapper({ modelValue: null })
    await wrapper.find('.nb-select__trigger').trigger('click')
    await wrapper.findAll('.nb-select__option')[0].trigger('click')
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('closes dropdown after single selection', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.nb-select__trigger').trigger('click')
    expect(wrapper.find('.nb-select__dropdown').exists()).toBe(true)
    await wrapper.findAll('.nb-select__option')[0].trigger('click')
    expect(wrapper.find('.nb-select__dropdown').exists()).toBe(false)
  })

  it('applies error class and shows error message', () => {
    // Select has two root nodes (div + Teleport), so classes() on wrapper is empty
    const wrapper = createWrapper({ error: 'Required' })
    expect(wrapper.find('.nb-select').classes()).toContain('nb-select--error')
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('error')
    expect(msg.text()).toBe('Required')
  })

  it('applies warning class and shows warning message', () => {
    const wrapper = createWrapper({
      error: undefined,
      warning: 'Check selection',
    })
    expect(wrapper.find('.nb-select').classes()).toContain('nb-select--warning')
  })

  it('shows helper message', () => {
    const wrapper = createWrapper({ helper: 'Select an option' })
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('helper')
  })

  it('disables the trigger button when disabled', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.find('.nb-select__trigger').element.disabled).toBe(true)
  })

  it('does not open dropdown when disabled', async () => {
    const wrapper = createWrapper({ disabled: true })
    await wrapper.find('.nb-select__trigger').trigger('click')
    expect(wrapper.find('.nb-select__dropdown').exists()).toBe(false)
  })

  it('shows empty message when options array is empty', async () => {
    const wrapper = createWrapper({ options: [] })
    await wrapper.find('.nb-select__trigger').trigger('click')
    expect(wrapper.find('.nb-select__empty').text()).toBe('No options')
  })

  it('marks selected option as selected', async () => {
    const wrapper = createWrapper({ modelValue: 'apple' })
    await wrapper.find('.nb-select__trigger').trigger('click')
    const opts = wrapper.findAll('.nb-select__option')
    expect(opts[0].classes()).toContain('nb-select__option--selected')
    expect(opts[1].classes()).not.toContain('nb-select__option--selected')
  })

  it('supports multiple selection mode', async () => {
    const wrapper = createWrapper({ multiple: true, modelValue: ['apple'] })
    await wrapper.find('.nb-select__trigger').trigger('click')
    await wrapper.findAll('.nb-select__option')[1].trigger('click')
    const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0] as string[]
    expect(emitted).toContain('apple')
    expect(emitted).toContain('banana')
  })

  it('displays count for 3+ selections', () => {
    const wrapper = createWrapper({
      multiple: true,
      modelValue: ['apple', 'banana', 'cherry'],
    })
    expect(wrapper.find('.nb-select__value').text()).toBe('3 selected')
  })

  it('shows disabled option as disabled', async () => {
    const optsWithDisabled = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b', disabled: true },
    ]
    const wrapper = createWrapper({ options: optsWithDisabled })
    await wrapper.find('.nb-select__trigger').trigger('click')
    const opts = wrapper.findAll('.nb-select__option')
    expect(opts[1].classes()).toContain('nb-select__option--disabled')
  })
})
