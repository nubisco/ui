import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Card from '../src/components/Card.vue'
import ChipGroup from '../src/components/ChipGroup.vue'
import SuggestionList from '../src/components/SuggestionList.vue'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('NbCard hoverEffect draw', () => {
  it('draws only on an interactive card', () => {
    const link = mount(Card, {
      props: { title: 'Guides', href: '/guides', hoverEffect: 'draw' },
    })
    expect(link.classes()).toContain('nb-card--draw')

    const plain = mount(Card, {
      props: { title: 'Guides', hoverEffect: 'draw' },
    })
    expect(plain.classes()).not.toContain('nb-card--draw')
  })

  it('leaves a static card exactly as it was', () => {
    const before = mount(Card, { props: { title: 'Guides' } }).html()
    const after = mount(Card, {
      props: { title: 'Guides', hoverEffect: 'draw' },
    }).html()
    expect(after).toBe(before)
  })

  it('does not draw on a disabled card, or with the default effect', () => {
    expect(
      mount(Card, {
        props: {
          title: 'Guides',
          clickable: true,
          hoverEffect: 'draw',
          disabled: true,
        },
      }).classes(),
    ).not.toContain('nb-card--draw')
    expect(
      mount(Card, { props: { title: 'Guides', clickable: true } }).classes(),
    ).not.toContain('nb-card--draw')
  })

  it('writes the horizontal share of the path from the card size', async () => {
    let callback: ResizeObserverCallback = () => {}
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: ResizeObserverCallback) {
          callback = cb
        }
        observe() {}
        disconnect() {}
      },
    )
    const w = mount(Card, {
      props: { title: 'Guides', clickable: true, hoverEffect: 'draw' },
    })
    await nextTick()
    callback(
      [{ contentRect: { width: 300, height: 100 } } as ResizeObserverEntry],
      {} as ResizeObserver,
    )
    expect(
      (w.element as HTMLElement).style.getPropertyValue('--nb-card-draw-ratio'),
    ).toBe('0.75')
  })
})

describe('NbChipGroup', () => {
  const items = [
    { value: 'all', label: 'All products' },
    { value: 'docs', label: 'Docs' },
    { value: 'guides', label: 'Guides', disabled: true },
    { value: 'api', label: 'API' },
  ]

  it('is a named radio group with the chosen chip checked', () => {
    const w = mount(ChipGroup, {
      props: { items, label: 'Limit search', modelValue: 'docs' },
    })
    expect(w.attributes('role')).toBe('radiogroup')
    expect(w.attributes('aria-label')).toBe('Limit search')
    const chips = w.findAll('[role="radio"]')
    expect(chips.map((c) => c.attributes('aria-checked'))).toEqual([
      'false',
      'true',
      'false',
      'false',
    ])
  })

  it('has one tab stop, on the chosen chip', () => {
    const w = mount(ChipGroup, {
      props: { items, label: 'Limit search', modelValue: 'docs' },
    })
    expect(
      w.findAll('[role="radio"]').map((c) => c.attributes('tabindex')),
    ).toEqual(['-1', '0', '-1', '-1'])
  })

  it('chooses on click and ignores a disabled chip', async () => {
    const w = mount(ChipGroup, {
      props: { items, label: 'Limit search', modelValue: 'all' },
    })
    await w.findAll('[role="radio"]')[1].trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['docs']])
    await w.findAll('[role="radio"]')[2].trigger('click')
    expect(w.emitted('update:modelValue')).toHaveLength(1)
  })

  it('moves and chooses with the arrow keys, skipping disabled chips', async () => {
    const w = mount(ChipGroup, {
      props: { items, label: 'Limit search', modelValue: 'docs' },
      attachTo: document.body,
    })
    const chips = w.findAll('[role="radio"]')
    ;(chips[1].element as HTMLElement).focus()
    await chips[1].trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['api'])
    expect(document.activeElement).toBe(chips[3].element)
    await chips[3].trigger('keydown', { key: 'Home' })
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['all'])
    w.unmount()
  })
})

describe('NbSuggestionList itemGroup', () => {
  type THit = { label: string; product: string }
  const hits: THit[] = [
    { label: 'Install', product: 'Docs' },
    { label: 'Theming', product: 'Docs' },
    { label: 'First steps', product: 'Guides' },
  ]

  it('draws one heading per run and keeps the options in order', () => {
    const w = mount(SuggestionList, {
      props: {
        items: hits,
        itemGroup: (item: THit) => item.product,
      },
    })
    const groups = w.findAll('[role="group"]')
    expect(groups).toHaveLength(2)
    expect(groups[0].find('.nb-suggestion-list__group').text()).toBe('Docs')
    expect(groups[1].find('.nb-suggestion-list__group').text()).toBe('Guides')
    const headingId = groups[1]
      .find('.nb-suggestion-list__group')
      .attributes('id')
    expect(groups[1].attributes('aria-labelledby')).toBe(headingId)
    expect(w.findAll('[role="option"]').map((o) => o.text())).toEqual([
      'Install',
      'Theming',
      'First steps',
    ])
  })

  it('draws no heading or group without itemGroup', () => {
    const w = mount(SuggestionList, { props: { items: hits } })
    expect(w.findAll('[role="group"]')).toHaveLength(0)
    expect(w.find('.nb-suggestion-list__group').exists()).toBe(false)
    expect(w.findAll('[role="option"]')).toHaveLength(3)
  })
})
