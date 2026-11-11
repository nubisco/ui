import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { h } from 'vue'
import InputGroup from '../src/components/InputGroup.vue'
import TextInput from '../src/components/TextInput.vue'
import Select from '../src/components/Select.vue'
import NumberInput from '../src/components/NumberInput.vue'
import Button from '../src/components/Button.vue'

const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
]

function group(props: Record<string, unknown>, children: () => unknown) {
  return mount(InputGroup, {
    props,
    slots: { default: children },
    attachTo: document.body,
  })
}

describe('NbInputGroup', () => {
  it('owns the label and points it at the first field', () => {
    const w = group({ label: 'Invite', id: 'invite' }, () => [
      h(TextInput, { modelValue: '' }),
      h(Button, { variant: 'primary' }, () => 'Invite'),
    ])
    const label = w.find('label')
    expect(label.attributes('for')).toBe('invite')
    expect(w.find('input').attributes('id')).toBe('invite')
    // The fields inside render no label of their own.
    expect(w.findAll('label')).toHaveLength(1)
    w.unmount()
  })

  it('names the row as a group by its label', () => {
    const w = group({ label: 'Invite', id: 'invite' }, () => [
      h(TextInput, { modelValue: '' }),
    ])
    const row = w.find('.nb-input-group__row')
    expect(row.attributes('role')).toBe('group')
    expect(row.attributes('aria-labelledby')).toBe('invite-label')
    expect(w.find('#invite-label').exists()).toBe(true)
    w.unmount()
  })

  it('gives its size to every field over their own', () => {
    const w = group({ size: 'xs' }, () => [
      h(TextInput, { modelValue: '', size: 'lg' }),
      h(Select, { modelValue: null, options }),
      h(NumberInput, { modelValue: 1 }),
    ])
    expect(w.find('.nb-text-input').classes()).toContain('nb-text-input--xs')
    expect(w.find('.nb-select').classes()).toContain('nb-select--xs')
    expect(w.find('.nb-number-input').classes()).toContain(
      'nb-number-input--xs',
    )
    expect(w.find('.nb-number-input__stepper').classes()).toContain(
      'nb-button--xs',
    )
    w.unmount()
  })

  it('hands its size and disabled state to the slot for buttons', () => {
    const w = mount(InputGroup, {
      props: { size: 'sm', disabled: true },
      slots: {
        default: (p: { size: string; disabled: boolean }) =>
          h(
            Button,
            { size: p.size as 'sm', disabled: p.disabled },
            () => 'Apply',
          ),
      },
    })
    const button = w.find('.nb-button')
    expect(button.classes()).toContain('nb-button--sm')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('shows one message and wires the fields to it', () => {
    const w = group({ id: 'url', error: 'Taken.' }, () => [
      h(TextInput, { modelValue: 'x' }),
      h(Button, { icon: 'copy', label: 'Copy', variant: 'ghost' }),
    ])
    const message = w.find('#url-error')
    expect(message.exists()).toBe(true)
    expect(message.text()).toContain('Taken.')
    const input = w.find('input')
    expect(input.attributes('aria-describedby')).toContain('url-error')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(w.find('.nb-text-input__field-wrapper').classes()).toContain(
      'nb-text-input__field-wrapper--error',
    )
    w.unmount()
  })

  it('wires a select to the group message too', () => {
    const w = group({ id: 'unit', warning: 'Check it.' }, () => [
      h(Select, { modelValue: null, options }),
    ])
    const trigger = w.find('.nb-select__trigger')
    expect(trigger.attributes('aria-describedby')).toContain('unit-warning')
    expect(w.find('.nb-select').classes()).toContain('nb-select--warning')
    w.unmount()
  })

  it('disables the fields inside', () => {
    const w = group({ disabled: true }, () => [
      h(TextInput, { modelValue: '' }),
    ])
    expect(w.find('input').attributes('disabled')).toBeDefined()
    w.unmount()
  })

  it('leaves a field outside a group exactly as it was', () => {
    const w = mount(TextInput, { props: { modelValue: '', size: 'lg' } })
    expect(w.classes()).toContain('nb-text-input--lg')
    expect(w.find('input').attributes('aria-describedby')).toBeUndefined()
  })
})

describe('NbInputGroup styles', () => {
  const src = readFileSync(
    resolve(__dirname, '../src/components/InputGroup.vue'),
    'utf8',
  )

  it('squares the inner corners of fields and buttons', () => {
    expect(src).toContain('--nb-field-radius-start: 0')
    expect(src).toContain('--nb-field-radius-end: 0')
    expect(src).toContain('border-start-start-radius: 0')
    expect(src).toContain('border-start-end-radius: 0')
  })

  it('every field draws its corners through the shared mixin', () => {
    for (const file of [
      'TextInput.vue',
      'Select.vue',
      'NumberInput.vue',
      'DatePicker.vue',
    ]) {
      const css = readFileSync(
        resolve(__dirname, '../src/components', file),
        'utf8',
      )
      expect(css, file).toContain('@include field.radius')
    }
  })
})
