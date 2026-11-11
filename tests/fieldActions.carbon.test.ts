import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, type Component } from 'vue'
import NumberInput from '../src/components/NumberInput.vue'
import Select from '../src/components/Select.vue'
import DatePicker from '../src/components/DatePicker.vue'
import FileUploader from '../src/components/FileUploader.vue'
import InlineEdit from '../src/components/InlineEdit.vue'
import {
  provideNbStrings,
  resetNbStrings,
} from '../src/composables/useNbStrings.composable'

afterEach(() => resetNbStrings())

/** Mounts `child` under a string catalogue override. */
function withStrings(
  overrides: Parameters<typeof provideNbStrings>[0],
  child: Component,
  props: Record<string, unknown> = {},
) {
  return mount(
    defineComponent({
      setup() {
        provideNbStrings(overrides)
        return () => h(child, props)
      },
    }),
    { attachTo: document.body },
  )
}

describe('NbNumberInput steppers', () => {
  it('are ghost icon-only NbButtons the size of the field', () => {
    const w = mount(NumberInput, { props: { modelValue: 1, size: 'sm' } })
    const steppers = w.findAll('.nb-number-input__stepper')
    expect(steppers).toHaveLength(2)
    for (const s of steppers) {
      expect(s.classes()).toContain('nb-button')
      expect(s.classes()).toContain('nb-button--ghost')
      expect(s.classes()).toContain('nb-button--icon-only')
      expect(s.classes()).toContain('nb-button--sm')
    }
    expect(steppers.map((s) => s.attributes('aria-label'))).toEqual([
      'Decrease',
      'Increase',
    ])
  })

  it('is aria-disabled at a limit, and only there', () => {
    const w = mount(NumberInput, { props: { modelValue: 0, min: 0, max: 5 } })
    const [dec, inc] = w.findAll('.nb-number-input__stepper')
    expect(dec.attributes('aria-disabled')).toBe('true')
    expect(inc.attributes('aria-disabled')).toBeUndefined()
    // Still a real, focusable button: at a limit, not disabled outright.
    expect(dec.attributes('disabled')).toBeUndefined()
  })

  it('keeps a native number input, which steps on ArrowUp and ArrowDown', () => {
    const w = mount(NumberInput, { props: { modelValue: 1 } })
    expect(w.find('input').attributes('type')).toBe('number')
  })
})

describe('NbSelect clear', () => {
  it('is an icon-only NbButton named from the string catalogue', () => {
    const w = withStrings({ selectClear: 'Limpar' }, Select, {
      clearable: true,
      modelValue: 'a',
      options: [{ value: 'a', label: 'A' }],
    })
    const clear = w.find('.nb-select__clear')
    expect(clear.classes()).toContain('nb-button--ghost')
    expect(clear.classes()).toContain('nb-button--icon-only')
    expect(clear.attributes('aria-label')).toBe('Limpar')
    w.unmount()
  })
})

describe('NbDatePicker buttons', () => {
  it('styles xs, which it used to accept and ignore', () => {
    const w = mount(DatePicker, { props: { size: 'xs' } })
    expect(w.find('.nb-date-picker').classes()).toContain('nb-date-picker--xs')
    const icon = w.find('.nb-date-picker__icon')
    expect(icon.classes()).toContain('nb-button--xs')
    expect(icon.attributes('tabindex')).toBe('-1')
    expect(icon.attributes('aria-label')).toBe('Choose date')
  })

  it('draws the calendar navigation as ghost icon-only NbButtons', async () => {
    const w = mount(DatePicker, { attachTo: document.body })
    await w.find('input').trigger('focus')
    const nav = document.querySelectorAll('.nb-date-picker__cal-nav')
    expect(nav).toHaveLength(4)
    for (const b of nav) {
      expect(b.classList.contains('nb-button--ghost')).toBe(true)
      expect(b.classList.contains('nb-button--sm')).toBe(true)
    }
    w.unmount()
  })
})

describe('NbFileUploader remove', () => {
  it('says which file in its name, from the string catalogue', async () => {
    const w = withStrings(
      {
        fileUploaderRemove: 'Remover',
        fileUploaderRemoveFile: (name: string) => `Remover ${name}`,
        fileUploaderDropHint: 'Largue aqui',
      },
      FileUploader,
    )
    const input = w.find('input[type="file"]')
    const file = new File(['x'], 'invoice.pdf', { type: 'application/pdf' })
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    const remove = w.find('.nb-file-uploader__remove')
    expect(remove.classes()).toContain('nb-button--xs')
    expect(remove.attributes('aria-label')).toBe('Remover invoice.pdf')
    w.unmount()
  })
})

describe('NbInlineEdit name', () => {
  it('comes from the string catalogue', () => {
    const w = withStrings(
      {
        inlineEditEmpty: 'vazio',
        inlineEditName: (label: string, value: string) =>
          `${label}: ${value}. Enter para editar.`,
      },
      InlineEdit,
      { modelValue: '', label: 'Title' },
    )
    expect(w.find('button').attributes('aria-label')).toBe(
      'Title: vazio. Enter para editar.',
    )
    w.unmount()
  })
})
