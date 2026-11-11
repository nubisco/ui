import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineComponent, h, nextTick } from 'vue'
import InputGroup from '../src/components/InputGroup.vue'
import TextInput from '../src/components/TextInput.vue'
import Select from '../src/components/Select.vue'
import NumberInput from '../src/components/NumberInput.vue'
import Button from '../src/components/Button.vue'
import DatePicker from '../src/components/DatePicker.vue'

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

describe('NbInputGroup with a date picker', () => {
  it('takes the group size over its own, the calendar button too', () => {
    const w = group({ size: 'sm' }, () => [
      h(DatePicker, { modelValue: null, size: 'lg' }),
      h(Button, { variant: 'primary', size: 'sm' }, () => 'Apply'),
    ])
    expect(w.find('.nb-date-picker').classes()).toContain('nb-date-picker--sm')
    expect(w.find('.nb-date-picker').classes()).not.toContain(
      'nb-date-picker--lg',
    )
    expect(w.find('.nb-date-picker__icon').classes()).toContain('nb-button--sm')
    w.unmount()
  })

  it('shows the group error state and points at the group message', () => {
    const w = group({ id: 'due', error: 'Pick a later date.' }, () => [
      h(DatePicker, { modelValue: null }),
    ])
    const input = w.find('.nb-date-picker__field')
    expect(input.attributes('id')).toBe('due')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toContain('due-error')
    expect(w.find('.nb-date-picker__input-wrapper').classes()).toContain(
      'nb-date-picker__input-wrapper--error',
    )
    expect(w.find('.nb-date-picker').classes()).toContain(
      'nb-date-picker--error',
    )
    w.unmount()
  })

  it('shows the group warning state', () => {
    const w = group({ warning: 'That is a weekend.' }, () => [
      h(DatePicker, { modelValue: null }),
    ])
    expect(w.find('.nb-date-picker__input-wrapper').classes()).toContain(
      'nb-date-picker__input-wrapper--warning',
    )
    w.unmount()
  })

  it('renders no label or message of its own', () => {
    const w = group({ label: 'Due date', error: 'Required.' }, () => [
      h(DatePicker, {
        modelValue: null,
        label: 'Ignored',
        helper: 'Ignored',
        error: 'Ignored',
      }),
    ])
    expect(w.findAll('label')).toHaveLength(1)
    expect(w.find('label').text()).toContain('Due date')
    expect(w.findAll('.nb-date-picker__message')).toHaveLength(0)
    expect(w.text()).not.toContain('Ignored')
    w.unmount()
  })

  it('takes the group disabled state', () => {
    const w = group({ disabled: true }, () => [
      h(DatePicker, { modelValue: null }),
    ])
    expect(
      w.find('.nb-date-picker__field').attributes('disabled'),
    ).toBeDefined()
    expect(w.find('.nb-date-picker').classes()).toContain(
      'nb-date-picker--disabled',
    )
    w.unmount()
  })

  it('lines up with a button beside it: both are the group height', () => {
    const w = group({ size: 'md' }, () => [
      h(DatePicker, { modelValue: null }),
      h(Button, { variant: 'primary' }, () => 'Apply'),
    ])
    // The picker's root is the only box in its cell: no label above it and
    // no message below, so its top and bottom are its field's.
    const root = w.find('.nb-date-picker').element
    expect(root.firstElementChild?.classList).toContain(
      'nb-date-picker__fields',
    )
    expect(root.children).toHaveLength(1)
    // Its box is --field-h tall, the height the group holds a button to.
    const picker = readFileSync(
      resolve(__dirname, '../src/components/DatePicker.vue'),
      'utf8',
    )
    expect(picker).toContain(
      'height: calc(var(--field-h) - 1px - var(--nb-field-border-width, 0px))',
    )
    const groupCss = readFileSync(
      resolve(__dirname, '../src/components/InputGroup.vue'),
      'utf8',
    )
    expect(groupCss).toMatch(
      /> :deep\(\.nb-button\) \{[^}]*height: var\(--field-h\);/,
    )
    w.unmount()
  })

  it('leaves a picker outside a group exactly as it was', () => {
    const w = mount(DatePicker, {
      props: { modelValue: null, size: 'lg', label: 'Due', helper: 'Hint' },
    })
    expect(w.find('.nb-date-picker').classes()).toContain('nb-date-picker--lg')
    expect(w.find('label').text()).toContain('Due')
    expect(w.find('.nb-date-picker__message').text()).toContain('Hint')
    expect(
      w.find('.nb-date-picker__field').attributes('aria-describedby'),
    ).toMatch(/-helper$/)
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

describe('NbInputGroup owns the label and message', () => {
  it('hides a member field’s own label and message, and says so', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(
      defineComponent({
        components: { InputGroup, TextInput, Select },
        template: `
          <InputGroup label="Address">
            <TextInput label="Street" error="Required" />
            <Select label="Country" helper="Pick one" :options="[]" />
          </InputGroup>`,
      }),
    )
    await nextTick()
    expect(w.text()).not.toContain('Street')
    expect(w.text()).not.toContain('Required')
    expect(w.text()).not.toContain('Country')
    expect(w.text()).not.toContain('Pick one')
    expect(
      warn.mock.calls.filter((c) => String(c[0]).includes('[NbInputGroup]')),
    ).toHaveLength(2)
    warn.mockRestore()
  })

  // The fluid variant draws its label inside the box, and every member
  // used to keep it there. NumberInput kept its label and message in both.
  it.each([
    ['TextInput', TextInput, { modelValue: '' }],
    ['NumberInput', NumberInput, { modelValue: 1 }],
    ['Select', Select, { modelValue: null, options }],
    ['DatePicker', DatePicker, { modelValue: '' }],
  ])(
    'hides the label and message of a %s in either variant',
    async (_name, field, extra) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      for (const variant of ['default', 'fluid']) {
        const w = group({ label: 'Group', id: 'g' }, () => [
          h(field as never, {
            ...extra,
            variant,
            label: 'Own label',
            helper: 'Own helper',
            error: 'Own error',
          }),
        ])
        await nextTick()
        expect(w.text(), variant).not.toContain('Own label')
        expect(w.text(), variant).not.toContain('Own helper')
        expect(w.text(), variant).not.toContain('Own error')
        expect(w.findAll('label'), variant).toHaveLength(1)
        w.unmount()
      }
      warn.mockRestore()
    },
  )

  it('names a grouped range picker’s end field, which has no label shown', async () => {
    const w = group({ label: 'Stay', id: 'stay' }, () => [
      h(DatePicker, { modelValue: '', type: 'range', variant: 'fluid' }),
    ])
    await nextTick()
    const [start, end] = w.findAll('.nb-date-picker__field')
    expect(start.attributes('id')).toBe('stay')
    expect(start.attributes('aria-label')).toBeUndefined()
    expect(end.attributes('aria-label')).toBe('End date')
    w.unmount()
  })
})
