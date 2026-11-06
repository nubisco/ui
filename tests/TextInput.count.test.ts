import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NbTextInput from '../src/components/TextInput.vue'

describe('NbTextInput showCount', () => {
  it('shows used out of maxlength', async () => {
    const w = mount(NbTextInput, {
      props: { label: 'Bio', maxlength: 200, showCount: true, modelValue: '' },
    })
    expect(w.find('.nb-text-input__count').text()).toBe('0/200')
    await w.setProps({ modelValue: 'Twelve chars' })
    expect(w.find('.nb-text-input__count').text()).toBe('12/200')
  })

  it('shows nothing without maxlength', () => {
    const w = mount(NbTextInput, { props: { label: 'Bio', showCount: true } })
    expect(w.find('.nb-text-input__count').exists()).toBe(false)
  })

  it('shows nothing unless asked', () => {
    const w = mount(NbTextInput, { props: { label: 'Bio', maxlength: 200 } })
    expect(w.find('.nb-text-input__count').exists()).toBe(false)
  })

  it('shows in the fluid header too', () => {
    const w = mount(NbTextInput, {
      props: {
        label: 'Bio',
        variant: 'fluid',
        maxlength: 10,
        showCount: true,
        modelValue: 'abc',
      },
    })
    expect(w.find('.nb-text-input__count').text()).toBe('3/10')
  })
})
