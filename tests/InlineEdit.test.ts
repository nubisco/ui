import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InlineEdit from '../src/components/InlineEdit.vue'

const base = { modelValue: 'Hello', label: 'Title' }

describe('InlineEdit', () => {
  it('renders the value as text, not as an input', () => {
    const wrapper = mount(InlineEdit, { props: base })
    expect(wrapper.find('button').text()).toContain('Hello')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('renders the placeholder muted when the value is empty', () => {
    const wrapper = mount(InlineEdit, {
      props: { ...base, modelValue: '', placeholder: 'Add a title...' },
    })
    const placeholder = wrapper.find('.nb-inline-edit__placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.text()).toBe('Add a title...')
  })

  it('swaps to an input on click and focuses it', async () => {
    const wrapper = mount(InlineEdit, { props: base, attachTo: document.body })
    await wrapper.find('button').trigger('click')
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('Hello')
    expect(document.activeElement).toBe(input.element)
    wrapper.unmount()
  })

  it('emits live updates while typing and commit on enter', async () => {
    const wrapper = mount(InlineEdit, { props: base })
    await wrapper.find('button').trigger('click')
    const input = wrapper.find('input')
    await input.setValue('Hello world')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
      'Hello world',
    ])
    await wrapper.setProps({ modelValue: 'Hello world' })
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('commit')?.at(-1)).toEqual(['Hello world'])
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('commits on blur', async () => {
    const wrapper = mount(InlineEdit, { props: base })
    await wrapper.find('button').trigger('click')
    await wrapper.find('input').trigger('blur')
    expect(wrapper.emitted('commit')?.length).toBe(1)
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('reverts to the original value on escape', async () => {
    const wrapper = mount(InlineEdit, { props: base })
    await wrapper.find('button').trigger('click')
    const input = wrapper.find('input')
    await input.setValue('Changed')
    await wrapper.setProps({ modelValue: 'Changed' })
    await input.trigger('keydown.esc')
    expect(wrapper.emitted('cancel')?.length).toBe(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Hello'])
    expect(wrapper.emitted('commit')).toBeUndefined()
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('does not enter edit mode while disabled', async () => {
    const wrapper = mount(InlineEdit, { props: { ...base, disabled: true } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('names the edit affordance for assistive tech', () => {
    const wrapper = mount(InlineEdit, { props: base })
    const name = wrapper.find('button').attributes('aria-label') ?? ''
    expect(name).toContain('Title')
    expect(name).toContain('Hello')
  })
})
