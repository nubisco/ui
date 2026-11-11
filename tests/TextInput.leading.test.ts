import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TextInput from '../src/components/TextInput.vue'

describe('NbTextInput leading slot', () => {
  it('wraps the leading slot in a padded element', () => {
    const w = mount(TextInput, {
      props: { modelValue: '' },
      slots: { leading: '<i class="probe" />' },
    })
    const leading = w.find('.nb-text-input__leading')
    expect(leading.exists()).toBe(true)
    expect(leading.find('.probe').exists()).toBe(true)
    expect(w.find('.nb-text-input__field-wrapper').classes()).toContain(
      'nb-text-input__field-wrapper--leading',
    )
  })

  it('renders nothing extra without the slot, so the field does not move', () => {
    const w = mount(TextInput, { props: { modelValue: '' } })
    expect(w.find('.nb-text-input__leading').exists()).toBe(false)
    expect(w.find('.nb-text-input__field-wrapper').classes()).not.toContain(
      'nb-text-input__field-wrapper--leading',
    )
  })

  it('places the leading slot before the field', () => {
    const w = mount(TextInput, {
      props: { modelValue: '' },
      slots: { leading: '<i class="probe" />' },
    })
    const wrapper = w.find('.nb-text-input__field-wrapper').element
    expect(wrapper.firstElementChild?.className).toContain(
      'nb-text-input__leading',
    )
  })
})
