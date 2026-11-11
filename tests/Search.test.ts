import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Search from '../src/components/Search.vue'

const tick = async () => {
  await nextTick()
  await nextTick()
}

describe('NbSearch', () => {
  it('is a search landmark with a glass at the start and a named field', () => {
    const w = mount(Search)
    expect(w.attributes('role')).toBe('search')
    expect(w.find('.nb-search__icon').exists()).toBe(true)
    const input = w.find('input')
    expect(input.attributes('type')).toBe('search')
    expect(input.attributes('aria-label')).toBe('Search')
    expect(input.attributes('placeholder')).toBe('Search')
  })

  it('takes the field sizes', () => {
    const w = mount(Search, { props: { size: 'sm' } })
    expect(w.classes()).toContain('nb-search--sm')
    expect(w.find('.nb-text-input').classes()).toContain('nb-text-input--sm')
  })

  it('is clearable, and emits clear', async () => {
    const w = mount(Search, {
      props: {
        modelValue: 'invoice',
        'onUpdate:modelValue': (v: string) => w.setProps({ modelValue: v }),
      },
      attachTo: document.body,
    })
    await w.find('.nb-text-input__clear').trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(w.emitted('clear')).toHaveLength(1)
    w.unmount()
  })

  it('emits search on Enter', async () => {
    const w = mount(Search, { props: { modelValue: 'members' } })
    await w.find('input').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('search')?.[0]).toEqual(['members'])
  })
})

describe('NbSearch expandable', () => {
  it('starts as a square icon-only button the size of the field', () => {
    const w = mount(Search, { props: { expandable: true, size: 'sm' } })
    const toggle = w.find('.nb-search__toggle')
    expect(toggle.classes()).toEqual(
      expect.arrayContaining([
        'nb-button--ghost',
        'nb-button--icon-only',
        'nb-button--sm',
      ]),
    )
    expect(toggle.attributes('aria-label')).toBe('Search')
    expect(w.find('input').exists()).toBe(false)
  })

  it('opens on click and moves focus into the field', async () => {
    const w = mount(Search, {
      props: { expandable: true },
      attachTo: document.body,
    })
    await w.find('.nb-search__toggle').trigger('click')
    await tick()
    expect(w.classes()).toContain('nb-search--expanded')
    expect(document.activeElement).toBe(w.find('input').element)
    expect(w.emitted('update:expanded')?.[0]).toEqual([true])
    w.unmount()
  })

  it('folds back when focus leaves an empty field', async () => {
    const w = mount(Search, {
      props: {
        expandable: true,
        expanded: true,
        'onUpdate:expanded': (v: boolean) => w.setProps({ expanded: v }),
      },
      attachTo: document.body,
    })
    await w.find('input').trigger('focusout', { relatedTarget: null })
    await tick()
    expect(w.find('.nb-search__toggle').exists()).toBe(true)
    w.unmount()
  })

  it('stays open while it holds a query', async () => {
    const w = mount(Search, {
      props: { expandable: true, modelValue: 'draft' },
      attachTo: document.body,
    })
    await w.find('input').trigger('focusout', { relatedTarget: null })
    await tick()
    expect(w.find('input').exists()).toBe(true)
    w.unmount()
  })

  it('Escape clears, folds, and hands focus back to the button', async () => {
    const outer: Event[] = []
    document.body.addEventListener('keydown', (e) => outer.push(e))
    const w = mount(Search, {
      props: {
        expandable: true,
        expanded: true,
        modelValue: 'draft',
        'onUpdate:modelValue': (v: string) => w.setProps({ modelValue: v }),
        'onUpdate:expanded': (v: boolean) => w.setProps({ expanded: v }),
      },
      attachTo: document.body,
    })
    await w.find('input').trigger('keydown', { key: 'Escape' })
    await tick()
    expect(w.emitted('clear')).toHaveLength(1)
    const toggle = w.find('.nb-search__toggle')
    expect(toggle.exists()).toBe(true)
    expect(document.activeElement).toBe(toggle.element)
    // Focus coming back does not open it again.
    expect(w.find('input').exists()).toBe(false)
    // The key stops here, so a dialog around the search stays open.
    expect(outer).toHaveLength(0)
    w.unmount()
  })
})
