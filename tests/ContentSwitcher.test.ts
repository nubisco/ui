import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NbContentSwitcher from '../src/components/ContentSwitcher.vue'
import type { IContentSwitcherItem } from '../src/components/ContentSwitcher.d'

enableAutoUnmount(afterEach)
afterEach(() => {
  document.body.innerHTML = ''
})

const items = (): IContentSwitcherItem[] => [
  { id: 'day', label: 'Day', icon: 'sun' },
  { id: 'week', label: 'Week', icon: 'calendar' },
  { id: 'month', label: 'Month', icon: 'calendar-blank', disabled: true },
  { id: 'year', label: 'Year', icon: 'calendar-dots' },
]

function mountSwitcher(props: Record<string, unknown> = {}) {
  return mount(NbContentSwitcher, {
    props: {
      label: 'Period',
      items: items(),
      modelValue: 'week',
      ...props,
    },
    attachTo: document.body,
  })
}

describe('NbContentSwitcher', () => {
  it('is a labelled radio group, not a tab list', () => {
    const w = mountSwitcher()
    expect(w.attributes('role')).toBe('radiogroup')
    expect(w.attributes('aria-label')).toBe('Period')
    const radios = w.findAll('[role="radio"]')
    expect(radios).toHaveLength(4)
    expect(radios.map((r) => r.attributes('aria-checked'))).toEqual([
      'false',
      'true',
      'false',
      'false',
    ])
    expect(w.find('[role="tab"]').exists()).toBe(false)
  })

  it('is one tab stop, on the selected option', () => {
    const w = mountSwitcher()
    const stops = w
      .findAll('[role="radio"]')
      .map((r) => r.attributes('tabindex'))
    expect(stops).toEqual(['-1', '0', '-1', '-1'])
  })

  it('selects on click', async () => {
    const w = mountSwitcher()
    await w.findAll('[role="radio"]')[0].trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['day']])
  })

  it('moves the selection with the arrows, skipping disabled and wrapping', async () => {
    const w = mount(NbContentSwitcher, {
      props: { label: 'Period', items: items(), modelValue: 'week' },
      attachTo: document.body,
    })
    const group = w.find('[role="radiogroup"]')
    await group.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['year'])
    await w.setProps({ modelValue: 'year' })
    await group.trigger('keydown', { key: 'ArrowRight' })
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['day'])
    await w.setProps({ modelValue: 'day' })
    await group.trigger('keydown', { key: 'End' })
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['year'])
    await nextTick()
    await nextTick()
    expect(document.activeElement?.getAttribute('data-id')).toBe('year')
  })

  it('names icon-only options by their label, as tooltips', () => {
    const w = mountSwitcher({ iconOnly: true })
    const first = w.findAll('[role="radio"]')[0]
    expect(first.classes()).toContain('nb-button--icon-only')
    expect(first.attributes('aria-label')).toBe('Day')
    expect(first.text()).toBe('')
  })

  it('marks the selected option and sizes every option', () => {
    const w = mountSwitcher({ size: 'sm' })
    const radios = w.findAll('[role="radio"]')
    expect(radios[1].classes()).toContain('nb-content-switcher__item--selected')
    expect(radios[0].classes()).toContain('nb-button--sm')
  })
})
