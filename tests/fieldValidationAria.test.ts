import { describe, it, expect, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { config } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import NbMessage from '../src/components/Message.vue'
import NbLabel from '../src/components/Label.vue'

// The real message and label: what is under test is their ids and roles.
beforeAll(() => {
  config.global.stubs = {
    ...config.global.stubs,
    NbMessage,
    NbLabel,
  }
})
import TextInput from '../src/components/TextInput.vue'
import NumberInput from '../src/components/NumberInput.vue'
import Select from '../src/components/Select.vue'
import Radio from '../src/components/Radio.vue'
import Slider from '../src/components/Slider.vue'
import Checkbox from '../src/components/Checkbox.vue'
import CheckboxGroup from '../src/components/CheckboxGroup.vue'
import Field from '../src/components/Field.vue'
import FileUploader from '../src/components/FileUploader.vue'

/*
 * Form validation ARIA, across every field that shows a message.
 *
 * Three guarantees per field, mounted with the real NbMessage:
 * 1. the control carries aria-invalid="true" while an error shows;
 * 2. aria-describedby on the control names the id of the message showing;
 * 3. the message is not a live region on first render (a form loaded with a
 *    server error must not shout), and an error that arrives later mounts
 *    with role="alert".
 */

function describedText(root: Element, control: Element): string {
  const ids = (control.getAttribute('aria-describedby') ?? '').split(/\s+/)
  return ids
    .map((id) => root.ownerDocument.getElementById(id)?.textContent ?? '')
    .join(' ')
    .trim()
}

interface ICase {
  name: string
  mount: (props: Record<string, unknown>) => ReturnType<typeof mount>
  control: (w: ReturnType<typeof mount>) => Element
}

const cases: ICase[] = [
  {
    name: 'NbTextInput',
    mount: (props) =>
      mount(TextInput, {
        props: { label: 'Email', ...props },
        attachTo: document.body,
      }),
    control: (w) => w.find('input').element,
  },
  {
    name: 'NbTextInput (fluid)',
    mount: (props) =>
      mount(TextInput, {
        props: { label: 'Email', variant: 'fluid', ...props },
        attachTo: document.body,
      }),
    control: (w) => w.find('input').element,
  },
  {
    name: 'NbTextInput (multiline)',
    mount: (props) =>
      mount(TextInput, {
        props: { label: 'Notes', multiline: true, ...props },
        attachTo: document.body,
      }),
    control: (w) => w.find('textarea').element,
  },
  {
    name: 'NbNumberInput',
    mount: (props) =>
      mount(NumberInput, {
        props: { label: 'Seats', ...props },
        attachTo: document.body,
      }),
    control: (w) => w.find('input').element,
  },
  {
    name: 'NbSelect',
    mount: (props) =>
      mount(Select, {
        props: {
          label: 'Country',
          options: [{ label: 'Portugal', value: 'pt' }],
          ...props,
        },
        attachTo: document.body,
      }),
    control: (w) => w.find('[role="combobox"]').element,
  },
  {
    name: 'NbRadio',
    mount: (props) =>
      mount(Radio, {
        props: {
          label: 'Plan',
          name: 'plan',
          options: [
            { label: 'Free', value: 'free' },
            { label: 'Pro', value: 'pro' },
          ],
          ...props,
        },
        attachTo: document.body,
      }),
    control: (w) => w.find('[role="radiogroup"]').element,
  },
  {
    name: 'NbSlider',
    mount: (props) =>
      mount(Slider, {
        props: { label: 'Volume', modelValue: 10, ...props },
        attachTo: document.body,
      }),
    control: (w) => w.find('[role="slider"]').element,
  },
]

describe.each(cases)(
  '$name validation ARIA',
  ({ mount: mountField, control }) => {
    it('is not invalid and describes nothing without a message', () => {
      const w = mountField({})
      expect(control(w).getAttribute('aria-invalid')).toBeNull()
      expect(control(w).getAttribute('aria-describedby')).toBeNull()
      w.unmount()
    })

    it('links the helper text by id', () => {
      const w = mountField({ helper: 'We never share it' })
      expect(control(w).getAttribute('aria-invalid')).toBeNull()
      expect(control(w).getAttribute('aria-describedby')).toMatch(/-helper$/)
      expect(describedText(w.element, control(w))).toContain(
        'We never share it',
      )
      w.unmount()
    })

    it('links the warning text by id', () => {
      const w = mountField({ warning: 'Looks unusual' })
      expect(control(w).getAttribute('aria-invalid')).toBeNull()
      expect(control(w).getAttribute('aria-describedby')).toMatch(/-warning$/)
      expect(describedText(w.element, control(w))).toContain('Looks unusual')
      w.unmount()
    })

    it('marks the control invalid and links the error', () => {
      const w = mountField({ error: 'Required', helper: 'Hint' })
      expect(control(w).getAttribute('aria-invalid')).toBe('true')
      expect(control(w).getAttribute('aria-describedby')).toMatch(/-error$/)
      expect(describedText(w.element, control(w))).toContain('Required')
      w.unmount()
    })

    it('does not announce an error present on first render', () => {
      const w = mountField({ error: 'Required' })
      expect(w.find('[role="alert"]').exists()).toBe(false)
      expect(w.find('[aria-live="assertive"]').exists()).toBe(false)
      w.unmount()
    })

    it('announces an error that arrives after mount with role="alert"', async () => {
      const w = mountField({})
      await w.setProps({ error: 'Required' })
      await nextTick()
      const alert = w.find('[role="alert"]')
      expect(alert.exists()).toBe(true)
      expect(alert.text()).toContain('Required')
      w.unmount()
    })

    it('remounts the alert when the error text changes', async () => {
      const w = mountField({ error: 'Required' })
      await w.setProps({ error: 'Too short' })
      const first = w.find('[role="alert"]').element
      await w.setProps({ error: 'Too long' })
      const second = w.find('[role="alert"]').element
      expect(second).not.toBe(first)
      expect(second.textContent).toContain('Too long')
      w.unmount()
    })
  },
)

describe('NbTextInput describedby merging', () => {
  it("keeps a consumer's own aria-describedby beside the message id", () => {
    const w = mount(TextInput, {
      props: { error: 'Required' },
      attrs: { 'aria-describedby': 'my-note' },
    })
    const ids = w.find('input').attributes('aria-describedby')!.split(' ')
    expect(ids).toContain('my-note')
    expect(ids.some((id) => id.endsWith('-error'))).toBe(true)
  })

  it('renders the helper prop', () => {
    const w = mount(TextInput, { props: { helper: 'Use dot notation' } })
    expect(w.text()).toContain('Use dot notation')
  })
})

describe('NbCheckboxGroup validation ARIA', () => {
  const Harness = defineComponent({
    props: { error: { type: String, default: undefined } },
    setup(props) {
      return () =>
        h(
          CheckboxGroup,
          { label: 'Topics', error: props.error, helper: 'Pick any' },
          () => [h(Checkbox, { label: 'A' }), h(Checkbox, { label: 'B' })],
        )
    },
  })

  it('marks each checkbox invalid and describes it by the group message', async () => {
    const w = mount(Harness, { attachTo: document.body })
    const boxes = () => w.findAll('input[type="checkbox"]')
    expect(boxes()[0].attributes('aria-invalid')).toBeUndefined()
    expect(boxes()[0].attributes('aria-describedby')).toMatch(/-helper$/)
    await w.setProps({ error: 'Pick one' })
    for (const b of boxes()) {
      expect(b.attributes('aria-invalid')).toBe('true')
      expect(describedText(w.element, b.element)).toContain('Pick one')
    }
    expect(w.find('[role="alert"]').text()).toContain('Pick one')
    w.unmount()
  })
})

describe('NbSlider keyboard', () => {
  it('moves by step, by ten steps and to the ends', async () => {
    const w = mount(Slider, { props: { modelValue: 10, label: 'Volume' } })
    const handle = w.find('[role="slider"]')
    expect(handle.attributes('tabindex')).toBe('0')
    expect(handle.attributes('aria-valuenow')).toBe('10')
    await handle.trigger('keydown', { key: 'ArrowRight' })
    await handle.trigger('keydown', { key: 'PageDown' })
    await handle.trigger('keydown', { key: 'End' })
    await handle.trigger('keydown', { key: 'Home' })
    expect(w.emitted('update:modelValue')!.map((e) => e[0])).toEqual([
      11, 0, 100, 0,
    ])
  })

  it('keeps range handles from crossing', async () => {
    const w = mount(Slider, { props: { modelValue: [20, 30], range: true } })
    const [low, high] = w.findAll('[role="slider"]')
    expect(low.attributes('aria-label')).toBe('Minimum')
    await low.trigger('keydown', { key: 'End' })
    await high.trigger('keydown', { key: 'Home' })
    expect(w.emitted('update:modelValue')!.map((e) => e[0])).toEqual([
      [30, 30],
      [20, 20],
    ])
  })
})

describe('NbField hint', () => {
  it('hands the hint id to the slot as describedby', () => {
    const w = mount(Field, {
      props: { label: 'Name', hint: 'As on your passport' },
      slots: {
        default: `<template #default="{ id, describedby }"><input :id="id" :aria-describedby="describedby" /></template>`,
      },
      attachTo: document.body,
    })
    const input = w.find('input').element
    expect(describedText(w.element, input)).toBe('As on your passport')
    w.unmount()
  })
})

describe('NbFileUploader refused file', () => {
  it('announces the refusal and describes the remove button by it', async () => {
    const w = mount(FileUploader, {
      props: { accept: '.png' },
      attachTo: document.body,
    })
    expect(w.find('[role="alert"]').exists()).toBe(false)
    const input = w.find('input[type="file"]')
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' })
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    const alert = w.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    const remove = w.find('.nb-file-uploader__remove')
    expect(describedText(w.element, remove.element)).toBe(alert.text().trim())
    w.unmount()
  })
})
