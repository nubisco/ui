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

describe('NbSpreadsheet keyboard entry', () => {
  const sheetColumns = [
    { id: 'jan', label: 'Jan', type: 'number' as const },
    { id: 'feb', label: 'Feb', type: 'number' as const },
  ]
  const sheetRows = () => [
    { id: 'd-1', label: '1', values: { jan: null, feb: null } },
    { id: 'd-2', label: '2', values: { jan: null, feb: null } },
    { id: 'd-3', label: '3', values: { jan: null, feb: null } },
    {
      id: 'sum',
      label: 'Total hours',
      pinned: 'bottom' as const,
      computed: true,
      values: {},
    },
    {
      id: 'grand',
      label: 'TOTAL',
      pinned: 'bottom' as const,
      computed: true,
      values: {},
    },
  ]

  async function mountSheet() {
    const w = mount(Spreadsheet, {
      props: { columns: sheetColumns, rows: sheetRows(), gutterWidth: 104 },
      attachTo: document.body,
    })
    const scroller = w.find('.nb-spreadsheet__scroller')
    const cell = (id: string) => w.find(`[data-cell="${id}"]`)
    const focusedId = () =>
      w.find('.nb-spreadsheet__cell--focused').attributes('data-cell')
    return { w, scroller, cell, focusedId }
  }

  it('commits a typed value and moves down on ArrowDown', async () => {
    const { w, scroller, cell, focusedId } = await mountSheet()
    await cell('d-1::jan').trigger('mousedown')
    await scroller.trigger('keydown', { key: '8' })
    await w.vm.$nextTick()
    const editor = w.find('.nb-spreadsheet__editor')
    expect((editor.element as HTMLInputElement).value).toBe('8')
    await editor.trigger('keydown', { key: 'ArrowDown' })
    const commits = w.emitted('commit')!
    expect(commits[0][0]).toMatchObject({
      rowId: 'd-1',
      columnId: 'jan',
      after: 8,
    })
    expect(w.find('.nb-spreadsheet__editor').exists()).toBe(false)
    expect(focusedId()).toBe('d-2::jan')
    w.unmount()
  })

  it('moves with the arrows, Tab and Enter when not editing', async () => {
    const { w, scroller, cell, focusedId } = await mountSheet()
    await cell('d-1::jan').trigger('mousedown')
    await scroller.trigger('keydown', { key: 'Enter' })
    expect(focusedId()).toBe('d-2::jan')
    expect(w.find('.nb-spreadsheet__editor').exists()).toBe(false)
    await scroller.trigger('keydown', { key: 'Tab' })
    expect(focusedId()).toBe('d-2::feb')
    await scroller.trigger('keydown', { key: 'ArrowUp' })
    expect(focusedId()).toBe('d-1::feb')
    await scroller.trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(focusedId()).toBe('d-1::feb')
    w.unmount()
  })

  it('keeps Left and Right for the caret in a cell opened with F2', async () => {
    const { w, scroller, cell, focusedId } = await mountSheet()
    await cell('d-1::jan').trigger('mousedown')
    await scroller.trigger('keydown', { key: 'F2' })
    await w.vm.$nextTick()
    const editor = w.find('.nb-spreadsheet__editor')
    await editor.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('.nb-spreadsheet__editor').exists()).toBe(true)
    expect(focusedId()).toBe('d-1::jan')
    await editor.setValue('7,5')
    await editor.trigger('keydown', { key: 'ArrowDown' })
    expect(w.emitted('commit')![0][0]).toMatchObject({ after: 7.5 })
    expect(focusedId()).toBe('d-2::jan')
    w.unmount()
  })

  it('moves Left and Right out of a cell that was typed into', async () => {
    const { w, scroller, cell, focusedId } = await mountSheet()
    await cell('d-1::jan').trigger('mousedown')
    await scroller.trigger('keydown', { key: '4' })
    await w.vm.$nextTick()
    await w.find('.nb-spreadsheet__editor').trigger('keydown', {
      key: 'ArrowRight',
    })
    expect(w.emitted('commit')![0][0]).toMatchObject({ after: 4 })
    expect(focusedId()).toBe('d-1::feb')
    w.unmount()
  })

  it('keeps keys typed before the editor has focus', async () => {
    const { w, scroller, cell } = await mountSheet()
    await cell('d-1::jan').trigger('mousedown')
    await scroller.trigger('keydown', { key: '7' })
    // The editor is not focused yet: the next keys still reach the scroller.
    await scroller.trigger('keydown', { key: '.' })
    await scroller.trigger('keydown', { key: '5' })
    await scroller.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('commit')![0][0]).toMatchObject({ after: 7.5 })
    w.unmount()
  })

  it('places the editor in content coordinates, so a scrolled sheet stays put', async () => {
    const { w, scroller, cell } = await mountSheet()
    const el = scroller.element as HTMLElement
    el.scrollTop = 240
    await scroller.trigger('scroll')
    await cell('d-3::jan').trigger('mousedown')
    await scroller.trigger('keydown', { key: '8' })
    await w.vm.$nextTick()
    const editor = w.find('.nb-spreadsheet__editor').element as HTMLElement
    // jsdom lays nothing out, so every rect is zero and the offset is the
    // scroll position alone (bringing the cell into view may have moved it).
    expect(el.scrollTop).toBeGreaterThan(0)
    expect(editor.style.top).toBe(`${el.scrollTop}px`)
    w.unmount()
  })

  it('focuses without scrolling', async () => {
    const { w, scroller, cell } = await mountSheet()
    const el = scroller.element as HTMLElement
    const calls: Array<FocusOptions | undefined> = []
    const original = el.focus.bind(el)
    el.focus = (opts?: FocusOptions) => {
      calls.push(opts)
      original(opts)
    }
    await cell('d-1::jan').trigger('mousedown')
    expect(calls.length).toBeGreaterThan(0)
    expect(calls.every((o) => o?.preventScroll === true)).toBe(true)
    w.unmount()
  })

  it('shows row labels in the gutter, at the given width', async () => {
    const { w } = await mountSheet()
    const gutter = w.findAll('.nb-spreadsheet__gutter').map((g) => g.text())
    expect(gutter).toEqual(['1', '2', '3', 'Total hours', 'TOTAL'])
    const grid = w.find('.nb-spreadsheet__grid').element as HTMLElement
    expect(grid.style.gridTemplateColumns.startsWith('104px')).toBe(true)
    w.unmount()
  })

  it('stacks rows pinned to the same edge', async () => {
    const { w, cell } = await mountSheet()
    const sum = cell('sum::jan').element as HTMLElement
    const grand = cell('grand::jan').element as HTMLElement
    expect(sum.style.bottom).toBe('calc(var(--nbss-row-height) * 1)')
    expect(grand.style.bottom).toBe('calc(var(--nbss-row-height) * 0)')
    w.unmount()
  })

  it('opens the active cell for editing on a second tap', async () => {
    const { w, cell } = await mountSheet()
    const target = cell('d-2::feb')
    await target.trigger('pointerdown', { pointerType: 'touch' })
    await target.trigger('mousedown')
    expect(w.find('.nb-spreadsheet__editor').exists()).toBe(false)
    await target.trigger('pointerdown', { pointerType: 'touch' })
    await target.trigger('mousedown')
    expect(w.find('.nb-spreadsheet__editor').exists()).toBe(true)
    w.unmount()
  })
})
