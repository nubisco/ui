import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Calendar from '../src/components/Calendar.vue'
import {
  provideNbStrings,
  resetNbStrings,
} from '../src/composables/useNbStrings.composable'

afterEach(() => resetNbStrings())

describe('NbCalendar header', () => {
  it('names the month arrows and types every header button', () => {
    const w = mount(Calendar, { props: { month: '2026-03', locale: 'en-US' } })
    const nav = w.findAll('.nb-calendar__nav')
    expect(nav.map((b) => b.attributes('aria-label'))).toEqual([
      'Previous month',
      'Next month',
    ])
    for (const b of w.findAll('.nb-calendar__header button')) {
      expect(b.attributes('type')).toBe('button')
      expect(b.classes()).toContain('nb-button--ghost')
    }
    expect(w.find('.nb-calendar__header svg path').exists()).toBe(false)
  })

  it('moves between months and back to today', async () => {
    const w = mount(Calendar, { props: { month: '2026-03', locale: 'en-US' } })
    const title = () => w.find('.nb-calendar__title').text()
    expect(title()).toContain('March')
    await w.findAll('.nb-calendar__nav')[1].trigger('click')
    expect(title()).toContain('April')
    await w.findAll('.nb-calendar__nav')[0].trigger('click')
    await w.findAll('.nb-calendar__nav')[0].trigger('click')
    expect(title()).toContain('February')

    await w.find('.nb-calendar__today-btn').trigger('click')
    const now = new Date().toLocaleString('en-US', { month: 'long' })
    expect(title()).toContain(now)
  })

  it('takes its words from the catalogue', () => {
    const w = mount(
      defineComponent({
        setup() {
          provideNbStrings({
            calendarToday: 'Heute',
            calendarPreviousMonth: 'Vorheriger Monat',
            calendarNextMonth: 'Nächster Monat',
          })
          return () => h(Calendar, { locale: 'de-DE' })
        },
      }),
    )
    expect(w.find('.nb-calendar__today-btn').text()).toBe('Heute')
    expect(
      w.findAll('.nb-calendar__nav').map((b) => b.attributes('aria-label')),
    ).toEqual(['Vorheriger Monat', 'Nächster Monat'])
  })

  it('announces the month it lands on', () => {
    const w = mount(Calendar)
    expect(w.find('.nb-calendar__title').attributes('aria-live')).toBe('polite')
  })
})
