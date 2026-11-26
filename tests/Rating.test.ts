import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NbRating from '../src/components/Rating.vue'

enableAutoUnmount(afterEach)
afterEach(() => {
  document.body.innerHTML = ''
})

function mountRating(props: Record<string, unknown> = {}) {
  return mount(NbRating, {
    props: { label: 'Quality', modelValue: 3, ...props },
    attachTo: document.body,
  })
}

const lastEmit = (w: ReturnType<typeof mountRating>) =>
  w.emitted('update:modelValue')?.at(-1)

describe('NbRating', () => {
  it('is a labelled radio group with one radio per star', () => {
    const w = mountRating()
    expect(w.attributes('role')).toBe('radiogroup')
    expect(w.attributes('aria-label')).toBe('Quality')
    const radios = w.findAll('[role="radio"]')
    expect(radios).toHaveLength(5)
    expect(radios.map((r) => r.attributes('aria-label'))).toEqual([
      '1 star',
      '2 stars',
      '3 stars',
      '4 stars',
      '5 stars',
    ])
    expect(radios.map((r) => r.attributes('aria-checked'))).toEqual([
      'false',
      'false',
      'true',
      'false',
      'false',
    ])
  })

  it('follows max', () => {
    const w = mountRating({ max: 3 })
    expect(w.findAll('[role="radio"]')).toHaveLength(3)
  })

  it('is one tab stop, on the checked star or the first', async () => {
    const w = mountRating()
    const stops = () =>
      w.findAll('[role="radio"]').map((r) => r.attributes('tabindex'))
    expect(stops()).toEqual(['-1', '-1', '0', '-1', '-1'])
    await w.setProps({ modelValue: null })
    expect(stops()).toEqual(['0', '-1', '-1', '-1', '-1'])
  })

  it('draws filled stars up to the value and outlines after it', () => {
    const w = mountRating()
    const stars = w.findAll('.nb-rating__star')
    expect(stars.map((s) => s.classes('nb-rating__star--full'))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ])
    expect(stars[3].classes()).toContain('nb-rating__star--empty')
  })

  it('selects on click (v-model)', async () => {
    const w = mountRating()
    await w.findAll('[role="radio"]')[4].trigger('click')
    expect(lastEmit(w)).toEqual([5])
  })

  it('moves the rating with the arrows, wrapping, and Home and End', async () => {
    const w = mountRating()
    await w.trigger('keydown', { key: 'ArrowRight' })
    expect(lastEmit(w)).toEqual([4])
    await w.setProps({ modelValue: 5 })
    await w.trigger('keydown', { key: 'ArrowUp' })
    expect(lastEmit(w)).toEqual([1])
    await w.setProps({ modelValue: 1 })
    await w.trigger('keydown', { key: 'ArrowLeft' })
    expect(lastEmit(w)).toEqual([5])
    await w.setProps({ modelValue: 5 })
    await w.trigger('keydown', { key: 'ArrowDown' })
    expect(lastEmit(w)).toEqual([4])
    await w.trigger('keydown', { key: 'Home' })
    expect(lastEmit(w)).toEqual([1])
    await w.setProps({ modelValue: 1 })
    await w.trigger('keydown', { key: 'End' })
    expect(lastEmit(w)).toEqual([5])
    await nextTick()
    await nextTick()
    expect(document.activeElement?.getAttribute('data-value')).toBe('5')
  })

  it('starts the arrows from not rated at one star, or at all of them going back', async () => {
    const w = mountRating({ modelValue: null })
    await w.trigger('keydown', { key: 'ArrowRight' })
    expect(lastEmit(w)).toEqual([1])
    await w.trigger('keydown', { key: 'ArrowLeft' })
    expect(lastEmit(w)).toEqual([5])
  })

  it('does not clear unless clearable', async () => {
    const w = mountRating()
    expect(w.find('.nb-rating__clear').exists()).toBe(false)
    await w.trigger('keydown', { key: 'Delete' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('clears to null with the button, Delete and Backspace when clearable', async () => {
    const w = mountRating({ clearable: true })
    const button = w.find('.nb-rating__clear')
    expect(button.attributes('aria-label')).toBe('Clear rating')
    await button.trigger('click')
    expect(lastEmit(w)).toEqual([null])
    await w.trigger('keydown', { key: 'Backspace' })
    expect(lastEmit(w)).toEqual([null])
    await w.trigger('keydown', { key: 'Delete' })
    expect(lastEmit(w)).toEqual([null])
    expect(w.emitted('update:modelValue')).toHaveLength(3)
    await w.setProps({ modelValue: null })
    expect(w.find('.nb-rating__clear').exists()).toBe(false)
  })

  it('is an image named by its value when read only, with no input', async () => {
    const w = mountRating({ readonly: true, modelValue: 4 })
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('Quality, 4 of 5 stars')
    expect(w.find('[role="radio"]').exists()).toBe(false)
    expect(w.find('button').exists()).toBe(false)
    await w.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await w.setProps({ modelValue: null })
    expect(w.attributes('aria-label')).toBe('Quality, Not rated')
  })

  it('draws a half star for a fraction when read only', () => {
    const w = mountRating({ readonly: true, modelValue: 3.5 })
    expect(w.attributes('aria-label')).toBe('Quality, 3.5 of 5 stars')
    const stars = w.findAll('.nb-rating__star')
    expect(stars[2].classes()).toContain('nb-rating__star--full')
    expect(stars[3].classes()).toContain('nb-rating__star--half')
    expect(stars[4].classes()).toContain('nb-rating__star--empty')
  })

  it('takes no input when disabled', async () => {
    const w = mountRating({ disabled: true, clearable: true })
    expect(w.attributes('aria-disabled')).toBe('true')
    const radios = w.findAll('[role="radio"]')
    expect(radios.every((r) => r.attributes('disabled') !== undefined)).toBe(
      true,
    )
    await w.trigger('keydown', { key: 'ArrowRight' })
    await w.trigger('keydown', { key: 'Delete' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.find('.nb-rating__clear').exists()).toBe(false)
  })

  it('names itself from the catalogue without a label', () => {
    const w = mount(NbRating, { props: { modelValue: 2, readonly: true } })
    expect(w.attributes('aria-label')).toBe('Rating, 2 of 5 stars')
  })

  it('applies the size', () => {
    const w = mountRating({ size: 'lg' })
    expect(w.classes()).toContain('nb-rating--lg')
  })
})
