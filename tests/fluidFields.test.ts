import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import TextInput from '../src/components/TextInput.vue'
import Select from '../src/components/Select.vue'
import NumberInput from '../src/components/NumberInput.vue'
import DatePicker from '../src/components/DatePicker.vue'

const options = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
]

const read = (file: string) =>
  readFileSync(resolve(__dirname, '../src', file), 'utf8')

describe('fluid fields: the label rests in place, then floats', () => {
  it('NbTextInput floats on a value and on focus', async () => {
    const w = mount(TextInput, {
      props: { variant: 'fluid', label: 'Name', modelValue: '' },
    })
    const box = () => w.find('.nb-text-input__field-wrapper')
    expect(box().classes()).not.toContain(
      'nb-text-input__field-wrapper--floated',
    )
    await w.find('input').trigger('focus')
    expect(box().classes()).toContain('nb-text-input__field-wrapper--floated')
    await w.find('input').trigger('blur')
    expect(box().classes()).not.toContain(
      'nb-text-input__field-wrapper--floated',
    )
    await w.setProps({ modelValue: 'Ada' })
    expect(box().classes()).toContain('nb-text-input__field-wrapper--floated')
  })

  it('NbTextInput keeps the label as the accessible name', () => {
    const w = mount(TextInput, {
      props: { variant: 'fluid', label: 'Name', id: 'n' },
    })
    expect(w.find('label').attributes('for')).toBe('n')
    expect(w.find('input').attributes('id')).toBe('n')
  })

  it('NbSelect floats once an option is chosen', async () => {
    const w = mount(Select, {
      props: { variant: 'fluid', label: 'Status', options, modelValue: null },
      attachTo: document.body,
    })
    expect(w.find('.nb-select').classes()).not.toContain('nb-select--floated')
    await w.setProps({ modelValue: 'open' })
    expect(w.find('.nb-select').classes()).toContain('nb-select--floated')
    w.unmount()
  })

  it('NbSelect floats on focus while nothing is chosen', async () => {
    const w = mount(Select, {
      props: { variant: 'fluid', label: 'Status', options, modelValue: null },
      attachTo: document.body,
    })
    await w.find('.nb-select__trigger').trigger('focus')
    expect(w.find('.nb-select').classes()).toContain('nb-select--floated')
    w.unmount()
  })

  it('NbSelect names its combobox by the label inside it', () => {
    const w = mount(Select, {
      props: {
        variant: 'fluid',
        label: 'Status',
        options,
        modelValue: 'open',
        id: 's',
      },
    })
    const trigger = w.find('.nb-select__trigger')
    const label = w.find('.nb-select__inner-label')
    expect(label.attributes('id')).toBe('s-label')
    expect(trigger.attributes('aria-labelledby')).toBe('s-label')
    expect(label.text()).toBe('Status')
  })

  it('NbNumberInput floats on a value', async () => {
    const w = mount(NumberInput, {
      props: { variant: 'fluid', label: 'Count', modelValue: null },
    })
    const box = () => w.find('.nb-number-input__field-wrapper')
    expect(box().classes()).not.toContain(
      'nb-number-input__field-wrapper--floated',
    )
    await w.setProps({ modelValue: 0 })
    expect(box().classes()).toContain('nb-number-input__field-wrapper--floated')
  })

  it('NbDatePicker floats on a value', async () => {
    const w = mount(DatePicker, {
      props: { variant: 'fluid', label: 'Due', modelValue: '' },
    })
    const box = () => w.find('.nb-date-picker__input-wrapper')
    expect(box().classes()).not.toContain(
      'nb-date-picker__input-wrapper--floated',
    )
    await w.setProps({ modelValue: '2026-11-24' })
    expect(box().classes()).toContain('nb-date-picker__input-wrapper--floated')
  })
})

describe('fluid fields: one geometry, shared', () => {
  it.each([
    ['components/TextInput.vue', 'nb-text-input'],
    ['components/Select.vue', 'nb-select'],
    ['components/NumberInput.vue', 'nb-number-input'],
    ['components/DatePicker.vue', 'nb-date-picker'],
  ])('%s uses field.fluid-box and draws xs at sm', (file, block) => {
    const src = read(file)
    expect(src).toContain('@include field.fluid-box(')
    // The box honours size: no fixed 64px floor any more.
    expect(src).not.toMatch(/min-height: calc\(var\(--nb-base-unit\) \* 8\)/)
    const xs = src.includes(`&--fluid#{&}--xs`)
      ? true
      : src.includes(`.${block}--fluid.${block}--xs`)
    expect(xs).toBe(true)
  })

  it('keeps the box at the size height and moves the label on transform', () => {
    const mixin = read('styles/logic/_field.scss')
    const body = mixin.slice(mixin.indexOf('@mixin fluid-box'))
    expect(body).toContain('height: var(--field-h);')
    expect(body).toContain('transform: scale(0.75);')
    expect(body).toMatch(/transform var\(--nb-motion-quick\)/)
    // Reduced motion drops the travel and keeps the tint.
    const reduced = body.slice(body.indexOf('@include motion.reduced'))
    expect(reduced).toContain('transition: color var(--nb-motion-quick)')
    expect(reduced).not.toContain('transform var(')
  })
})
