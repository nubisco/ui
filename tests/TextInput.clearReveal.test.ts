import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import TextInput from '../src/components/TextInput.vue'
import {
  provideNbStrings,
  resetNbStrings,
} from '../src/composables/useNbStrings.composable'

afterEach(() => resetNbStrings())

describe('NbTextInput clearable', () => {
  it('shows no clear button while the field is empty', () => {
    const w = mount(TextInput, { props: { clearable: true, modelValue: '' } })
    expect(w.find('.nb-text-input__clear').exists()).toBe(false)
  })

  it('is a named, ghost, icon-only NbButton the size of the field', () => {
    const w = mount(TextInput, {
      props: { clearable: true, modelValue: 'abc', size: 'sm' },
    })
    const clear = w.find('.nb-text-input__clear')
    expect(clear.classes()).toEqual(
      expect.arrayContaining([
        'nb-button--ghost',
        'nb-button--icon-only',
        'nb-button--sm',
      ]),
    )
    expect(clear.attributes('aria-label')).toBe('Clear')
  })

  it('empties the field, emits clear and keeps focus in the field', async () => {
    const w = mount(TextInput, {
      props: { clearable: true, modelValue: 'abc' },
      attachTo: document.body,
    })
    await w.find('.nb-text-input__clear').trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(w.emitted('clear')).toHaveLength(1)
    expect(document.activeElement).toBe(w.find('input').element)
    w.unmount()
  })

  it('clears on Escape and stops the key, only when there is a value', async () => {
    const outer: KeyboardEvent[] = []
    const w = mount(
      defineComponent({
        props: { value: { type: String, default: '' } },
        setup(p) {
          return () =>
            h('div', { onKeydown: (e: KeyboardEvent) => outer.push(e) }, [
              h(TextInput, { clearable: true, modelValue: p.value }),
            ])
        },
      }),
      { props: { value: 'abc' } },
    )
    const field = w.findComponent(TextInput)
    await w.find('input').trigger('keydown', { key: 'Escape' })
    expect(field.emitted('clear')).toHaveLength(1)
    expect(outer).toHaveLength(0)

    await w.setProps({ value: '' })
    await w.find('input').trigger('keydown', { key: 'Escape' })
    expect(field.emitted('clear')).toHaveLength(1)
    expect(outer).toHaveLength(1)
  })

  it('has no clear button when disabled or read-only', () => {
    for (const p of [{ disabled: true }, { readonly: true }]) {
      const w = mount(TextInput, {
        props: { clearable: true, modelValue: 'abc', ...p },
      })
      expect(w.find('.nb-text-input__clear').exists()).toBe(false)
    }
  })
})

describe('NbTextInput revealable', () => {
  it('only applies to a password field', () => {
    const w = mount(TextInput, { props: { revealable: true, type: 'text' } })
    expect(w.find('.nb-text-input__reveal').exists()).toBe(false)
  })

  it('toggles the characters and its own name, at the far right', async () => {
    const w = mount(TextInput, {
      props: {
        revealable: true,
        clearable: true,
        type: 'password',
        modelValue: 'secret',
      },
    })
    const controls = w.findAll('.nb-text-input__controls .nb-button')
    expect(controls.at(-1)?.classes()).toContain('nb-text-input__reveal')
    const reveal = w.find('.nb-text-input__reveal')
    expect(w.find('input').attributes('type')).toBe('password')
    expect(reveal.attributes('aria-label')).toBe('Show password')
    await reveal.trigger('click')
    expect(w.find('input').attributes('type')).toBe('text')
    expect(w.find('.nb-text-input__reveal').attributes('aria-label')).toBe(
      'Hide password',
    )
  })

  it('takes its names from the string catalogue', () => {
    const w = mount(
      defineComponent({
        setup() {
          provideNbStrings({ textInputShowPassword: 'Mostrar senha' })
          return () => h(TextInput, { revealable: true, type: 'password' })
        },
      }),
    )
    expect(w.find('.nb-text-input__reveal').attributes('aria-label')).toBe(
      'Mostrar senha',
    )
  })
})
