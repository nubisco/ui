import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Spreadsheet from '../src/components/labs/Spreadsheet.vue'

const columns = [
  {
    id: 'day',
    label: 'Day',
    pinned: 'left' as const,
    type: 'text' as const,
    readOnly: true,
  },
  { id: 'jan', label: 'Jan', type: 'number' as const },
  { id: 'feb', label: 'Feb', type: 'number' as const, sortable: true },
]

const rows = [
  { id: 'r1', values: { day: '1', jan: 8, feb: 0 } },
  { id: 'r2', values: { day: '2', jan: 4, feb: 6 } },
  {
    id: 'totals',
    pinned: 'bottom' as const,
    computed: true,
    values: { day: 'Total', jan: 12, feb: 6 },
  },
]

describe('NbSpreadsheet', () => {
  it('renders header labels', () => {
    const w = mount(Spreadsheet, { props: { columns, rows } })
    expect(w.text()).toContain('Day')
    expect(w.text()).toContain('Jan')
    expect(w.text()).toContain('Feb')
  })

  it('renders cell values', () => {
    const w = mount(Spreadsheet, { props: { columns, rows } })
    expect(w.text()).toContain('1')
    expect(w.text()).toContain('8')
    expect(w.text()).toContain('Total')
  })

  it('marks pinned-bottom row cells as computed', () => {
    const w = mount(Spreadsheet, { props: { columns, rows } })
    const totals = w.findAll('.nb-spreadsheet__cell--computed')
    expect(totals.length).toBeGreaterThan(0)
  })

  it('honours cellAttrs callback className', () => {
    const cellAttrs = (rowId: string, columnId: string) =>
      rowId === 'r1' && columnId === 'jan'
        ? { className: 'weekend' }
        : undefined
    const w = mount(Spreadsheet, { props: { columns, rows, cellAttrs } })
    expect(w.html()).toContain('weekend')
  })

  it('emits commit when a cell value is typed and Enter pressed', async () => {
    const w = mount(Spreadsheet, {
      props: { columns, rows },
      attachTo: document.body,
    })
    const cells = w.findAll('.nb-spreadsheet__cell')
    // Find the second data cell (skip header, gutter); easiest: the one with text "8"
    const jan1 = cells.find((c) => c.text() === '8')
    expect(jan1).toBeTruthy()
    await jan1!.trigger('mousedown')
    await jan1!.trigger('dblclick')
    const input = w.find<HTMLInputElement>('.nb-spreadsheet__editor')
    expect(input.exists()).toBe(true)
    await input.setValue('10')
    await input.trigger('keydown', { key: 'Enter' })
    const commits = w.emitted('commit')
    expect(commits).toBeTruthy()
    expect((commits![0][0] as { after: unknown }).after).toBe(10)
    w.unmount()
  })

  it('sorts when a sortable header is clicked', async () => {
    const w = mount(Spreadsheet, { props: { columns, rows } })
    const headers = w.findAll('.nb-spreadsheet__header')
    const feb = headers.find((h) => h.text().includes('Feb'))
    expect(feb).toBeTruthy()
    await feb!.trigger('click')
    expect(w.html()).toContain('▲')
    await feb!.trigger('click')
    expect(w.html()).toContain('▼')
  })
})
