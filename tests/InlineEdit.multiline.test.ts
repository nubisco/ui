import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InlineEdit from '../src/components/InlineEdit.vue'

/**
 * `multiline`: the editor is a textarea that grows with its text. Enter
 * commits, Shift+Enter is a newline, Escape cancels. Off by default, and off
 * means the one-line input exactly as before.
 */

const base = { modelValue: 'A long title', label: 'Title' }

async function startEditing(props: Record<string, unknown> = {}) {
  const wrapper = mount(InlineEdit, {
    props: { ...base, ...props },
    attachTo: document.body,
  })
  await wrapper.find('button').trigger('click')
  return wrapper
}

describe('InlineEdit multiline', () => {
  it('edits in a one-line input by default', async () => {
    const wrapper = await startEditing()
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(false)
    wrapper.unmount()
  })

  it('edits in a focused textarea when multiline', async () => {
    const wrapper = await startEditing({ multiline: true })
    const area = wrapper.find('textarea')
    expect(area.exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(false)
    expect(area.classes()).toContain('nb-inline-edit__input--multiline')
    expect((area.element as HTMLTextAreaElement).value).toBe('A long title')
    expect(document.activeElement).toBe(area.element)
    wrapper.unmount()
  })

  it('commits on Enter', async () => {
    const wrapper = await startEditing({ multiline: true })
    await wrapper.find('textarea').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('commit')).toEqual([['A long title']])
    expect(wrapper.find('textarea').exists()).toBe(false)
    wrapper.unmount()
  })

  it('leaves Shift+Enter to the textarea as a newline', async () => {
    const wrapper = await startEditing({ multiline: true })
    const area = wrapper.find('textarea')
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      shiftKey: true,
      cancelable: true,
    })
    area.element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(wrapper.emitted('commit')).toBeUndefined()
    expect(wrapper.find('textarea').exists()).toBe(true)
    wrapper.unmount()
  })

  it('does not commit on the Enter that confirms an IME composition', async () => {
    const wrapper = await startEditing({ multiline: true })
    await wrapper
      .find('textarea')
      .trigger('keydown', { key: 'Enter', isComposing: true })
    expect(wrapper.emitted('commit')).toBeUndefined()
    wrapper.unmount()
  })

  it('cancels on Escape and restores the starting value', async () => {
    const wrapper = await startEditing({ multiline: true })
    await wrapper.find('textarea').setValue('Changed\nover two lines')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
      'Changed\nover two lines',
    ])
    await wrapper.find('textarea').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
      'A long title',
    ])
    wrapper.unmount()
  })

  it('grows to fit its text', async () => {
    const wrapper = await startEditing({ multiline: true })
    const area = wrapper.find('textarea').element as HTMLTextAreaElement
    Object.defineProperty(area, 'scrollHeight', {
      configurable: true,
      get: () => 72,
    })
    await wrapper.find('textarea').setValue('One\nTwo\nThree')
    expect(area.style.height).toBe('72px')
    wrapper.unmount()
  })
})
