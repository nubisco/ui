import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DatePicker from '../src/components/DatePicker.vue'

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

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  template: '<i :data-icon="name" />',
}

describe('DatePicker', () => {
  const createWrapper = (props = {}, slots = {}) =>
    mount(DatePicker, {
      props,
      slots,
      global: {
        stubs: {
          NbGrid: NbGridStub,
          NbLabel: NbLabelStub,
          NbMessage: NbMessageStub,
          NbIcon: NbIconStub,
          teleport: true,
        },
      },
    })

  it('renders a text input', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('input').attributes('type')).toBe('text')
  })

  it('renders label when provided', () => {
    const wrapper = createWrapper({ label: 'Departure' })
    expect(wrapper.find('[data-testid="nb-label"]').text()).toBe('Departure')
  })

  it('renders a calendar icon button for single type', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-date-picker__icon').exists()).toBe(true)
  })

  it('does not render a calendar icon button for simple type', () => {
    const wrapper = createWrapper({ type: 'simple' })
    expect(wrapper.find('.nb-date-picker__icon').exists()).toBe(false)
  })

  it('renders two inputs for range type', () => {
    const wrapper = createWrapper({ type: 'range' })
    expect(wrapper.findAll('input').length).toBe(2)
  })

  it('renders per-field labels when endLabel is set on range type', () => {
    const wrapper = createWrapper({
      type: 'range',
      label: 'Start date',
      endLabel: 'End date',
    })
    const labels = wrapper.findAll('[data-testid="nb-label"]')
    expect(labels.length).toBe(2)
    expect(labels[0].text()).toBe('Start date')
    expect(labels[1].text()).toBe('End date')
    const inputs = wrapper.findAll('input')
    expect(labels[0].attributes('for')).toBe(inputs[0].attributes('id'))
    expect(labels[1].attributes('for')).toBe(inputs[1].attributes('id'))
  })

  it('emits update:modelValue and change when a valid ISO date is typed', async () => {
    const wrapper = createWrapper()
    await wrapper.find('input').setValue('2026-04-15')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2026-04-15'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['2026-04-15'])
  })

  it('emits null when the input is cleared', async () => {
    const wrapper = createWrapper({ modelValue: '2026-04-15' })
    await wrapper.find('input').setValue('')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })

  it('does not emit when a typed date is outside min/max bounds', async () => {
    const wrapper = createWrapper({ min: '2026-04-10', max: '2026-04-20' })
    await wrapper.find('input').setValue('2026-05-01')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not emit when a typed date is in disabledDates', async () => {
    const wrapper = createWrapper({ disabledDates: ['2026-04-15'] })
    await wrapper.find('input').setValue('2026-04-15')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('shows error message with error variant', () => {
    const wrapper = createWrapper({ error: 'A valid date is required' })
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('error')
    expect(msg.text()).toBe('A valid date is required')
  })

  it('gives error precedence over warning and helper', () => {
    const wrapper = createWrapper({
      error: 'Bad',
      warning: 'Careful',
      helper: 'Hint',
    })
    const msgs = wrapper.findAll('[data-testid="nb-message"]')
    expect(msgs.length).toBe(1)
    expect(msgs[0].attributes('data-variant')).toBe('error')
  })

  it('shows helper text when no error or warning is set', () => {
    const wrapper = createWrapper({ helper: 'Format: dd/mm/yyyy' })
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('helper')
    expect(msg.text()).toBe('Format: dd/mm/yyyy')
  })

  it('applies error class to the wrapper and aria-invalid to the input', () => {
    const wrapper = createWrapper({ error: 'Bad' })
    expect(wrapper.find('.nb-date-picker__input-wrapper').classes()).toContain(
      'nb-date-picker__input-wrapper--error',
    )
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('applies warning class only when no error is present', () => {
    const wrapper = createWrapper({ error: 'Bad', warning: 'Careful' })
    expect(
      wrapper.find('.nb-date-picker__input-wrapper').classes(),
    ).not.toContain('nb-date-picker__input-wrapper--warning')
  })

  it('marks only the end field invalid with endError', () => {
    const wrapper = createWrapper({
      type: 'range',
      endError: 'End date must be after the start date',
    })
    const wrappers = wrapper.findAll('.nb-date-picker__input-wrapper')
    expect(wrappers[0].classes()).not.toContain(
      'nb-date-picker__input-wrapper--error',
    )
    expect(wrappers[1].classes()).toContain(
      'nb-date-picker__input-wrapper--error',
    )
    const inputs = wrapper.findAll('input')
    expect(inputs[0].attributes('aria-invalid')).toBeUndefined()
    expect(inputs[1].attributes('aria-invalid')).toBe('true')
  })

  it('applies disabled attribute to input and icon button', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.find('input').element.disabled).toBe(true)
    expect(
      wrapper.find('.nb-date-picker__icon').attributes('disabled'),
    ).toBeDefined()
  })

  it('applies readonly attribute and required attribute', () => {
    const wrapper = createWrapper({ readonly: true, required: true })
    const input = wrapper.find('input')
    expect(input.attributes('readonly')).toBeDefined()
    expect(input.attributes('required')).toBeDefined()
  })

  it('does not open the calendar on focus when readonly', async () => {
    const wrapper = createWrapper({ readonly: true })
    await wrapper.find('input').trigger('focus')
    expect(wrapper.find('.nb-date-picker__calendar').exists()).toBe(false)
  })

  it('opens the calendar on focus for single type', async () => {
    const wrapper = createWrapper()
    await wrapper.find('input').trigger('focus')
    expect(wrapper.find('.nb-date-picker__calendar').exists()).toBe(true)
  })

  it('closes the calendar on Escape', async () => {
    const wrapper = createWrapper()
    await wrapper.find('input').trigger('focus')
    expect(wrapper.find('.nb-date-picker__calendar').exists()).toBe(true)
    await wrapper.find('input').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.nb-date-picker__calendar').exists()).toBe(false)
  })

  it('renders month and year navigation buttons in the calendar header', async () => {
    const wrapper = createWrapper()
    await wrapper.find('input').trigger('focus')
    const navLabels = wrapper
      .findAll('.nb-date-picker__cal-nav')
      .map((b) => b.attributes('aria-label'))
    expect(navLabels).toEqual([
      'Previous year',
      'Previous month',
      'Next month',
      'Next year',
    ])
  })

  it('disables calendar days outside min/max bounds', async () => {
    const wrapper = createWrapper({
      modelValue: '2026-04-15',
      min: '2026-04-10',
      max: '2026-04-20',
    })
    await wrapper.find('input').trigger('focus')
    const day9 = wrapper.find('[data-date="2026-04-09"]')
    const day15 = wrapper.find('[data-date="2026-04-15"]')
    expect((day9.element as HTMLButtonElement).disabled).toBe(true)
    expect((day15.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('disables calendar days matching the disabledDates predicate', async () => {
    const wrapper = createWrapper({
      modelValue: '2026-04-15',
      disabledDates: (iso: string) => iso === '2026-04-16',
    })
    await wrapper.find('input').trigger('focus')
    const blocked = wrapper.find('[data-date="2026-04-16"]')
    expect((blocked.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('anchors the calendar under the focused field in a range', async () => {
    const wrapper = createWrapper({ type: 'range' })
    const fieldWrappers = wrapper.findAll('.nb-date-picker__input-wrapper')
    fieldWrappers[0].element.getBoundingClientRect = () =>
      ({ left: 10, bottom: 40 }) as unknown as DOMRect
    fieldWrappers[1].element.getBoundingClientRect = () =>
      ({ left: 300, bottom: 40 }) as unknown as DOMRect
    const inputs = wrapper.findAll('input')

    await inputs[0].trigger('focus')
    expect(
      wrapper.find('.nb-date-picker__calendar').attributes('style'),
    ).toContain('left: 10px')

    // Moving focus to the end input re-anchors the already-open calendar
    await inputs[1].trigger('focus')
    expect(
      wrapper.find('.nb-date-picker__calendar').attributes('style'),
    ).toContain('left: 300px')
  })

  it('emits update:modelValue when a calendar day is clicked', async () => {
    const wrapper = createWrapper({ modelValue: '2026-04-15' })
    await wrapper.find('input').trigger('focus')
    await wrapper.find('[data-date="2026-04-20"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2026-04-20'])
    expect(wrapper.find('.nb-date-picker__calendar').exists()).toBe(false)
  })

  it('marks the selected day in the calendar', async () => {
    const wrapper = createWrapper({ modelValue: '2026-04-15' })
    await wrapper.find('input').trigger('focus')
    expect(wrapper.find('[data-date="2026-04-15"]').classes()).toContain(
      'nb-date-picker__cal-day--selected',
    )
  })

  it('applies size class to the root', () => {
    const wrapper = createWrapper({ size: 'lg' })
    expect(wrapper.find('.nb-date-picker').classes()).toContain(
      'nb-date-picker--lg',
    )
  })

  it('renders fluid variant with inner label', () => {
    const wrapper = createWrapper({ variant: 'fluid', label: 'Delivery' })
    expect(wrapper.find('.nb-date-picker').classes()).toContain(
      'nb-date-picker--fluid',
    )
    expect(wrapper.find('.nb-date-picker__inner-label').text()).toContain(
      'Delivery',
    )
  })

  it('shows an icon-only message in the fluid header when error is set', () => {
    const wrapper = createWrapper({
      variant: 'fluid',
      label: 'Delivery',
      error: 'Bad date',
    })
    const msg = wrapper.find(
      '.nb-date-picker__inner-header [data-testid="nb-message"]',
    )
    expect(msg.exists()).toBe(true)
    expect(msg.attributes('data-variant')).toBe('error')
  })

  it('uses endLabel as the end field inner label in fluid range', () => {
    const wrapper = createWrapper({
      variant: 'fluid',
      type: 'range',
      label: 'Start',
      endLabel: 'End',
    })
    const innerLabels = wrapper.findAll('.nb-date-picker__inner-label')
    expect(innerLabels[1].text()).toContain('End')
  })
})
