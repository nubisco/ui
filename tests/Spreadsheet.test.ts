import { afterEach, describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Spreadsheet from '../src/components/Spreadsheet.vue'
import {
  NB_PHONE_TOUCH_QUERY,
  resetPhoneLayoutForTests,
} from '../src/composables/usePhoneLayout.composable'

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
    expect(feb!.attributes('aria-sort')).toBe('none')
    await feb!.trigger('mousedown')
    expect(feb!.attributes('aria-sort')).toBe('ascending')
    await feb!.trigger('mousedown')
    expect(feb!.attributes('aria-sort')).toBe('descending')
    await feb!.trigger('mousedown')
    expect(feb!.attributes('aria-sort')).toBe('none')
  })

  it('leaves aria-sort off a column that does not sort', () => {
    const w = mount(Spreadsheet, { props: { columns, rows } })
    const jan = w.find('[data-header-col="jan"]')
    expect(jan.attributes('aria-sort')).toBeUndefined()
  })

  it('applies a size, with the header as tall as a row', () => {
    const w = mount(Spreadsheet, { props: { columns, rows } })
    expect(w.classes()).toContain('nb-spreadsheet--sm')
    const lg = mount(Spreadsheet, { props: { columns, rows, size: 'lg' } })
    expect(lg.classes()).toContain('nb-spreadsheet--lg')
  })
})

describe('NbSpreadsheet grid semantics', () => {
  it('exposes a grid of rows, headers and cells', () => {
    const w = mount(Spreadsheet, {
      props: { columns, rows, ariaLabel: 'Hours' },
    })
    const grid = w.find('[role="grid"]')
    expect(grid.attributes('aria-label')).toBe('Hours')
    // A header row and three data rows; the gutter counts as a column.
    expect(grid.attributes('aria-rowcount')).toBe('4')
    expect(grid.attributes('aria-colcount')).toBe('4')
    const rowEls = w.findAll('[role="row"]')
    expect(rowEls.map((r) => r.attributes('aria-rowindex'))).toEqual([
      '1',
      '2',
      '3',
      '4',
    ])
    expect(w.findAll('[role="columnheader"]')).toHaveLength(4)
    expect(w.findAll('[role="rowheader"]')).toHaveLength(3)
    const cells = rowEls[1].findAll('[role="gridcell"]')
    expect(cells.map((c) => c.attributes('aria-colindex'))).toEqual([
      '2',
      '3',
      '4',
    ])
    // The pinned read-only column says so.
    expect(cells[0].attributes('aria-readonly')).toBe('true')
    expect(cells[1].attributes('aria-readonly')).toBeUndefined()
  })

  it('names the active cell through aria-activedescendant', async () => {
    const w = mount(Spreadsheet, { props: { columns, rows } })
    const grid = w.find('[role="grid"]')
    expect(grid.attributes('aria-activedescendant')).toBeUndefined()
    await w.find('[data-cell="r2::jan"]').trigger('mousedown')
    const id = grid.attributes('aria-activedescendant')
    expect(id).toBeTruthy()
    const active = w.find(`[id="${id}"]`)
    expect(active.attributes('data-cell')).toBe('r2::jan')
    expect(active.attributes('aria-selected')).toBe('true')
  })
})

describe('NbSpreadsheet header selection', () => {
  const lastSelection = (w: ReturnType<typeof mount>) => {
    const events = w.emitted('selection') ?? []
    return events[events.length - 1]?.[0]
  }

  it('selects a column from its header', async () => {
    const w = mount(Spreadsheet, { props: { columns, rows } })
    await w.find('[data-header-col="jan"]').trigger('mousedown')
    expect(lastSelection(w)).toEqual({
      startRowId: 'r1',
      startColumnId: 'jan',
      endRowId: 'totals',
      endColumnId: 'jan',
    })
    expect(w.findAll('.nb-spreadsheet__cell--selected')).toHaveLength(3)
    expect(w.find('[data-header-col="jan"]').classes()).toContain(
      'nb-spreadsheet__header--selected',
    )
  })

  it('grows a column selection with Shift', async () => {
    const w = mount(Spreadsheet, { props: { columns, rows } })
    await w.find('[data-header-col="day"]').trigger('mousedown')
    await w
      .find('[data-header-col="jan"]')
      .trigger('mousedown', { shiftKey: true })
    expect(lastSelection(w)).toMatchObject({
      startColumnId: 'day',
      endColumnId: 'jan',
    })
    expect(w.findAll('.nb-spreadsheet__cell--selected')).toHaveLength(6)
  })

  it('selects a row from the gutter, and everything from the corner', async () => {
    const w = mount(Spreadsheet, { props: { columns, rows } })
    await w.findAll('.nb-spreadsheet__gutter')[1].trigger('mousedown')
    expect(lastSelection(w)).toEqual({
      startRowId: 'r2',
      startColumnId: 'day',
      endRowId: 'r2',
      endColumnId: 'feb',
    })
    expect(w.findAll('.nb-spreadsheet__gutter')[1].classes()).toContain(
      'nb-spreadsheet__gutter--selected',
    )
    await w.find('.nb-spreadsheet__corner').trigger('mousedown')
    expect(w.findAll('.nb-spreadsheet__cell--selected')).toHaveLength(9)
  })

  it('selects with Ctrl+A, Ctrl+Space and Shift+Space', async () => {
    const w = mount(Spreadsheet, { props: { columns, rows } })
    const scroller = w.find('.nb-spreadsheet__scroller')
    await w.find('[data-cell="r2::jan"]').trigger('mousedown')
    await scroller.trigger('keydown', { key: ' ', ctrlKey: true })
    expect(lastSelection(w)).toMatchObject({
      startRowId: 'r1',
      endRowId: 'totals',
      startColumnId: 'jan',
      endColumnId: 'jan',
    })
    await w.find('[data-cell="r2::jan"]').trigger('mousedown')
    await scroller.trigger('keydown', { key: ' ', shiftKey: true })
    expect(lastSelection(w)).toMatchObject({
      startRowId: 'r2',
      endRowId: 'r2',
      startColumnId: 'day',
      endColumnId: 'feb',
    })
    // Shift+Space selected the row; it did not open the cell.
    expect(w.find('.nb-spreadsheet__editor').exists()).toBe(false)
    await scroller.trigger('keydown', { key: 'a', metaKey: true })
    expect(w.findAll('.nb-spreadsheet__cell--selected')).toHaveLength(9)
  })

  it('clears a selected column, skipping read-only cells', async () => {
    const w = mount(Spreadsheet, { props: { columns, rows } })
    await w.find('[data-header-col="jan"]').trigger('mousedown')
    await w.find('.nb-spreadsheet__scroller').trigger('keydown', {
      key: 'Delete',
    })
    const batches = w.emitted('change') ?? []
    expect(batches[batches.length - 1]?.[0]).toEqual([
      { rowId: 'r1', columnId: 'jan', before: 8, after: null },
      { rowId: 'r2', columnId: 'jan', before: 4, after: null },
    ])
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

describe('NbSpreadsheet fit', () => {
  // jsdom has no layout: give the sheet a height and the header its own.
  function stubLayout(sheetHeight: number, touch = false) {
    resetPhoneLayoutForTests()
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: touch && query === NB_PHONE_TOUCH_QUERY,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains('nb-spreadsheet') ? sheetHeight : 0
      },
    )
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains('nb-spreadsheet__header') ? 36 : 0
      },
    )
  }

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    resetPhoneLayoutForTests()
  })

  it('lets unpinned columns share the width and keeps pinned ones fixed', async () => {
    stubLayout(600)
    const w = mount(Spreadsheet, { props: { columns, rows, fit: true } })
    await nextTick()
    const grid = w.find('.nb-spreadsheet__grid').attributes('style')
    expect(grid).toContain('44px 120px minmax(120px, 1fr) minmax(120px, 1fr)')
  })

  it('shrinks the rows until every row fits the height', async () => {
    // (126 - 36) / 3 rows = 30px each
    stubLayout(126)
    const w = mount(Spreadsheet, { props: { columns, rows, fit: true } })
    await nextTick()
    expect(w.find('.nb-spreadsheet').attributes('style')).toContain(
      '--nbss-row-height: 30px',
    )
  })

  it('never grows a row past the default, nor shrinks it under 20px', async () => {
    stubLayout(2000)
    const tall = mount(Spreadsheet, { props: { columns, rows, fit: true } })
    await nextTick()
    expect(tall.find('.nb-spreadsheet').attributes('style')).toContain(
      '--nbss-row-height: 32px',
    )
    stubLayout(60)
    const short = mount(Spreadsheet, { props: { columns, rows, fit: true } })
    await nextTick()
    expect(short.find('.nb-spreadsheet').attributes('style')).toContain(
      '--nbss-row-height: 20px',
    )
  })

  it('keeps the full row height on a touch phone', async () => {
    stubLayout(126, true)
    const w = mount(Spreadsheet, { props: { columns, rows, fit: true } })
    await nextTick()
    expect(w.find('.nb-spreadsheet').attributes('style') ?? '').not.toContain(
      '--nbss-row-height',
    )
  })

  it('renders as before without fit', async () => {
    stubLayout(126)
    const w = mount(Spreadsheet, { props: { columns, rows } })
    await nextTick()
    expect(w.classes()).not.toContain('nb-spreadsheet--fit')
    expect(w.find('.nb-spreadsheet').attributes('style')).toBeUndefined()
    expect(w.find('.nb-spreadsheet__grid').attributes('style')).toContain(
      '44px 120px 120px 120px',
    )
  })

  it('shows every short label while any full one does not fit', async () => {
    stubLayout(600)
    // jsdom has no layout: "February" needs 90px, every label gets 60px.
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.textContent === 'February' ? 90 : 40
      },
    )
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(60)
    const months = [
      { id: 'jan', label: 'Jan', shortLabel: 'J', type: 'number' as const },
      {
        id: 'feb',
        label: 'February',
        shortLabel: 'Feb',
        type: 'number' as const,
      },
    ]
    const w = mount(Spreadsheet, { props: { columns: months, rows } })
    await nextTick()
    await nextTick()
    const labels = w.findAll('.nb-spreadsheet__header-label')
    expect(labels.map((l) => l.text())).toEqual(['J', 'Feb'])
    expect(labels[1]!.attributes('title')).toBe('February')
  })
})

// The shape of an app that adopted the sheet in labs: a fixed grid of twelve
// numeric columns and a row per day, each named in the gutter, with derived
// totals pinned underneath. Nothing it relies on may change by default.
describe('NbSpreadsheet fixed grid adopter', () => {
  const months = Array.from({ length: 12 }, (_, i) => ({
    id: String(i + 1),
    label: `Month ${i + 1}`,
    width: 96,
    type: 'number' as const,
    align: 'right' as const,
  }))
  const grid: Record<string, number> = { '1:1': 8, '2:1': 7.5, '1:2': 4 }
  const dayRows = () => [
    ...Array.from({ length: 31 }, (_, d) => ({
      id: `d-${d + 1}`,
      label: String(d + 1),
      values: Object.fromEntries(
        months.map((m) => [m.id, grid[`${d + 1}:${m.id}`] ?? null]),
      ),
    })),
    ...['hours', 'extra', 'total'].map((id) => ({
      id: `total-${id}`,
      label: id,
      pinned: 'bottom' as const,
      computed: true,
      className: 'totals',
      values: {},
    })),
  ]
  const computeCell = (rowId: string, columnId: string) =>
    rowId.startsWith('total-')
      ? Object.entries(grid)
          .filter(([k]) => k.endsWith(`:${columnId}`))
          .reduce((s, [, v]) => s + v, 0)
      : undefined

  function mountGrid() {
    return mount(Spreadsheet, {
      props: {
        columns: months,
        rows: dayRows(),
        gutterWidth: 104,
        cellAttrs: (rowId: string) =>
          rowId === 'd-6' ? { readOnly: true, className: 'weekend' } : {},
        computed: computeCell,
      },
      attachTo: document.body,
    })
  }

  it('renders the grid it was given, and no more', () => {
    const w = mountGrid()
    expect(w.findAll('.nb-spreadsheet__header')).toHaveLength(12)
    const gutter = w.findAll('.nb-spreadsheet__gutter').map((g) => g.text())
    expect(gutter.slice(0, 3)).toEqual(['1', '2', '3'])
    expect(gutter.slice(-3)).toEqual(['hours', 'extra', 'total'])
    expect(w.find('[role="grid"]').attributes('aria-rowcount')).toBe('35')
    w.unmount()
  })

  it('formats with the default locale and shows the derived totals', () => {
    const w = mountGrid()
    expect(w.find('[data-cell="d-2::1"]').text()).toBe('7,5')
    expect(w.find('[data-cell="total-hours::1"]').text()).toBe('15,5')
    expect(w.find('[data-cell="d-6::1"]').classes()).toContain('weekend')
    w.unmount()
  })

  it('keys in a value and emits it for the app to store', async () => {
    const w = mountGrid()
    await w.find('[data-cell="d-3::1"]').trigger('mousedown')
    const scroller = w.find('.nb-spreadsheet__scroller')
    await scroller.trigger('keydown', { key: '8' })
    await nextTick()
    await w.find('.nb-spreadsheet__editor').trigger('keydown', {
      key: 'ArrowDown',
    })
    expect(w.emitted('commit')?.[0]?.[0]).toEqual({
      rowId: 'd-3',
      columnId: '1',
      before: null,
      after: 8,
    })
    w.unmount()
  })

  it('is still registered by the labs plugin', async () => {
    const { createApp } = await import('vue')
    const { default: labs } = await import('../src/labs')
    const app = createApp({})
    app.use(labs)
    expect(app.component('NbSpreadsheet')).toBe(Spreadsheet)
  })
})
