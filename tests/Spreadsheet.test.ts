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

  it('keeps labels, the browser menu and every column by default', async () => {
    const w = mountGrid()
    expect(w.find('.nb-spreadsheet__header--letters').exists()).toBe(false)
    const ev = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    })
    w.find('[data-cell="d-3::1"]').element.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    expect(document.querySelector('.nb-menu')).toBeNull()
    expect(w.find('.nb-spreadsheet__unhide').exists()).toBe(false)
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

describe('NbSpreadsheet column letters', () => {
  const cols = [
    { id: 'name', label: 'Name' },
    { id: 'qty', label: 'Quantity', type: 'number' as const, sortable: true },
    { id: 'price', label: 'Price', type: 'number' as const },
  ]
  const data = [
    { id: 'a', values: { name: 'Bolt', qty: 2, price: 1 } },
    { id: 'b', values: { name: 'Nut', qty: 1, price: 2 } },
  ]

  it('shows A, B, C in place of the labels', () => {
    const w = mount(Spreadsheet, {
      props: { columns: cols, rows: data, columnHeaders: 'letters' },
    })
    const headers = w.findAll('.nb-spreadsheet__header')
    expect(headers.map((h) => h.text())).toEqual(['A', 'B', 'C'])
    // The label stays as the header's name and tooltip.
    expect(headers[1].attributes('aria-label')).toBe('B Quantity')
    expect(headers[1].find('span').attributes('title')).toBe('Quantity')
  })

  it('counts past Z as spreadsheets do', () => {
    const many = Array.from({ length: 28 }, (_, i) => ({
      id: `c${i}`,
      label: `C${i}`,
    }))
    const w = mount(Spreadsheet, {
      props: { columns: many, rows: data, columnHeaders: 'letters' },
    })
    const text = w.findAll('.nb-spreadsheet__header').map((h) => h.text())
    expect(text.slice(24)).toEqual(['Y', 'Z', 'AA', 'AB'])
  })

  it('puts a row of letters above the labels with both', async () => {
    const w = mount(Spreadsheet, {
      props: { columns: cols, rows: data, columnHeaders: 'both' },
    })
    const rowEls = w.findAll('[role="row"]')
    expect(rowEls.map((r) => r.attributes('aria-rowindex'))).toEqual([
      '1',
      '2',
      '3',
      '4',
    ])
    expect(
      rowEls[0].findAll('[role="columnheader"]').map((h) => h.text()),
    ).toEqual(['', 'A', 'B', 'C'])
    expect(
      rowEls[1].findAll('[role="columnheader"]').map((h) => h.text()),
    ).toEqual(['Name', 'Quantity', 'Price'])
    // The letter selects, the label under it sorts.
    await rowEls[0].findAll('[role="columnheader"]')[2].trigger('mousedown')
    expect(w.findAll('.nb-spreadsheet__cell--selected')).toHaveLength(2)
    expect(
      rowEls[1].find('[data-header-col="qty"]').attributes('aria-sort'),
    ).toBe('none')
    await w.find('[data-header-col="qty"]').trigger('mousedown')
    expect(w.find('[data-header-col="qty"]').attributes('aria-sort')).toBe(
      'ascending',
    )
  })

  it("keeps a hidden column's letter", () => {
    const w = mount(Spreadsheet, {
      props: {
        columns: cols,
        rows: data,
        columnHeaders: 'letters',
        hiddenColumns: ['qty'],
      },
    })
    expect(w.findAll('.nb-spreadsheet__header').map((h) => h.text())).toEqual([
      'A',
      'C',
    ])
  })
})

describe('NbSpreadsheet hidden columns and rows', () => {
  const cols = [
    { id: 'a', label: 'A1' },
    { id: 'b', label: 'B1' },
    { id: 'c', label: 'C1' },
  ]
  const data = () => [
    { id: 'r1', values: { a: 1, b: 2, c: 3 } },
    { id: 'r2', values: { a: 4, b: 5, c: 6 } },
    { id: 'r3', values: { a: 7, b: 8, c: 9 } },
  ]

  it('leaves hidden columns and rows out, and keeps the row numbers', () => {
    const w = mount(Spreadsheet, {
      props: {
        columns: cols,
        rows: data(),
        hiddenColumns: ['b'],
        hiddenRows: ['r2'],
      },
    })
    expect(w.find('[data-cell="r1::b"]').exists()).toBe(false)
    expect(w.find('[data-cell="r2::a"]').exists()).toBe(false)
    expect(w.findAll('.nb-spreadsheet__gutter').map((g) => g.text())).toEqual([
      '1',
      '3',
    ])
    const grid = w.find('[role="grid"]')
    expect(grid.attributes('aria-rowcount')).toBe('3')
    expect(grid.attributes('aria-colcount')).toBe('3')
  })

  it('skips hidden cells when moving, copying and clearing', async () => {
    const w = mount(Spreadsheet, {
      props: { columns: cols, rows: data(), hiddenColumns: ['b'] },
      attachTo: document.body,
    })
    const scroller = w.find('.nb-spreadsheet__scroller')
    await w.find('[data-cell="r1::a"]').trigger('mousedown')
    await scroller.trigger('keydown', { key: 'ArrowRight' })
    expect(
      w.find('.nb-spreadsheet__cell--focused').attributes('data-cell'),
    ).toBe('r1::c')
    await w.find('.nb-spreadsheet__gutter').trigger('mousedown')
    const setData = vi.fn()
    const copy = new Event('copy', { bubbles: true, cancelable: true })
    Object.assign(copy, { clipboardData: { setData } })
    scroller.element.dispatchEvent(copy)
    expect(setData).toHaveBeenCalledWith('text/plain', '1\t3')
    await scroller.trigger('keydown', { key: 'Delete' })
    const batch = w.emitted('change')!.at(-1)![0] as Array<{ columnId: string }>
    expect(batch.map((c) => c.columnId)).toEqual(['a', 'c'])
    w.unmount()
  })

  it('marks where columns and rows are hidden, and shows them on a click', async () => {
    const w = mount(Spreadsheet, {
      props: {
        columns: cols,
        rows: data(),
        hiddenColumns: ['b', 'c'],
        hiddenRows: ['r2'],
        'onUpdate:hiddenColumns': (v: string[]) =>
          w.setProps({ hiddenColumns: v }),
        'onUpdate:hiddenRows': (v: string[]) => w.setProps({ hiddenRows: v }),
      },
    })
    const colMark = w.find('.nb-spreadsheet__unhide--col-end')
    expect(colMark.attributes('aria-label')).toBe('Show 2 hidden columns')
    const rowMark = w.find('.nb-spreadsheet__unhide--row-start')
    expect(rowMark.attributes('aria-label')).toBe('Show hidden row')
    await colMark.trigger('click')
    await rowMark.trigger('click')
    expect(w.emitted('update:hiddenColumns')!.at(-1)).toEqual([[]])
    expect(w.emitted('update:hiddenRows')!.at(-1)).toEqual([[]])
    expect(w.find('.nb-spreadsheet__unhide').exists()).toBe(false)
    expect(w.findAll('.nb-spreadsheet__gutter')).toHaveLength(3)
  })

  it('moves the focus off a column as it is hidden', async () => {
    const w = mount(Spreadsheet, {
      props: { columns: cols, rows: data() },
      attachTo: document.body,
    })
    await w.find('[data-cell="r2::b"]').trigger('mousedown')
    ;(w.vm as unknown as { hideColumns: (ids: string[]) => void }).hideColumns([
      'b',
    ])
    await nextTick()
    await nextTick()
    expect(
      w.find('.nb-spreadsheet__cell--focused').attributes('data-cell'),
    ).toBe('r2::c')
    w.unmount()
  })

  it('never hides the last column', async () => {
    const w = mount(Spreadsheet, {
      props: { columns: cols, rows: data(), hiddenColumns: ['a', 'b'] },
    })
    ;(w.vm as unknown as { hideColumns: (ids: string[]) => void }).hideColumns([
      'c',
    ])
    expect(w.emitted('update:hiddenColumns')).toBeUndefined()
  })
})

describe('NbSpreadsheet context menu', () => {
  const cols = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta', sortable: true },
  ]
  const data = () => [
    { id: 'r1', values: { a: 1, b: 2 } },
    { id: 'r2', values: { a: 3, b: 4 } },
  ]
  const menuLabels = () =>
    Array.from(document.querySelectorAll('.nb-menu [role="menuitem"]')).map(
      (el) => el.querySelector('.nb-menu-item__label')?.textContent?.trim(),
    )

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('opens on a column header with the column actions', async () => {
    const w = mount(Spreadsheet, {
      props: { columns: cols, rows: data(), contextMenu: true },
      attachTo: document.body,
    })
    const ev = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    })
    w.find('[data-header-col="b"]').element.dispatchEvent(ev)
    await nextTick()
    await nextTick()
    expect(ev.defaultPrevented).toBe(true)
    expect(menuLabels()).toEqual([
      'Cut',
      'Copy',
      'Paste',
      'Clear contents',
      'Sort ascending',
      'Sort descending',
      'Hide column',
    ])
    // The right click selected the column it landed on.
    expect(w.findAll('.nb-spreadsheet__cell--selected')).toHaveLength(2)
    const hide = Array.from(
      document.querySelectorAll<HTMLElement>('.nb-menu [role="menuitem"]'),
    ).find((el) => el.textContent?.includes('Hide column'))!
    hide.click()
    expect(w.emitted('update:hiddenColumns')!.at(-1)).toEqual([['b']])
    w.unmount()
  })

  it('keeps a selection it is opened inside, and offers rows from the gutter', async () => {
    const w = mount(Spreadsheet, {
      props: {
        columns: cols,
        rows: data(),
        contextMenu: true,
        hiddenRows: [],
      },
      attachTo: document.body,
    })
    await w.find('.nb-spreadsheet__corner').trigger('mousedown')
    const gutter = w.findAll('.nb-spreadsheet__gutter')[0]
    gutter.element.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true }),
    )
    await nextTick()
    await nextTick()
    // A whole-sheet selection is not a row selection, so the row is chosen.
    expect(w.findAll('.nb-spreadsheet__cell--selected')).toHaveLength(2)
    expect(menuLabels()).toContain('Hide row')
    expect(menuLabels()).not.toContain('Hide column')
    w.unmount()
  })

  it('opens from the keyboard at the active cell', async () => {
    const w = mount(Spreadsheet, {
      props: { columns: cols, rows: data(), contextMenu: true },
      attachTo: document.body,
    })
    await w.find('[data-cell="r1::a"]').trigger('mousedown')
    await w
      .find('.nb-spreadsheet__scroller')
      .trigger('keydown', { key: 'F10', shiftKey: true })
    await nextTick()
    await nextTick()
    expect(menuLabels()).toContain('Hide column')
    expect(menuLabels()).toContain('Hide row')
    w.unmount()
  })
})

describe('NbSpreadsheet column resize', () => {
  const cols = [
    { id: 'a', label: 'Alpha', width: 100, minWidth: 90 },
    { id: 'b', label: 'Beta' },
  ]
  const data = [{ id: 'r1', values: { a: 1, b: 2 } }]

  it('resizes the active column from the keyboard and says so', async () => {
    const w = mount(Spreadsheet, { props: { columns: cols, rows: data } })
    await w.find('[data-cell="r1::a"]').trigger('mousedown')
    const scroller = w.find('.nb-spreadsheet__scroller')
    await scroller.trigger('keydown', {
      key: 'ArrowRight',
      altKey: true,
      shiftKey: true,
    })
    expect(w.emitted('column-resize')![0][0]).toEqual({
      columnId: 'a',
      width: 108,
    })
    // It did not move the active cell or grow the selection.
    expect(
      w.find('.nb-spreadsheet__cell--focused').attributes('data-cell'),
    ).toBe('r1::a')
    for (let i = 0; i < 4; i++)
      await scroller.trigger('keydown', {
        key: 'ArrowLeft',
        altKey: true,
        shiftKey: true,
      })
    // Never under the column's minWidth, and silent once it is there.
    const sizes = w
      .emitted('column-resize')!
      .map((e) => (e[0] as { width: number }).width)
    expect(sizes).toEqual([108, 100, 92, 90])
  })

  it('reports a drag once, when it ends', async () => {
    const w = mount(Spreadsheet, { props: { columns: cols, rows: data } })
    await w
      .find('.nb-spreadsheet__resize-handle')
      .trigger('mousedown', { clientX: 100 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 130 }))
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 140 }))
    expect(w.emitted('column-resize')).toBeUndefined()
    window.dispatchEvent(new MouseEvent('mouseup'))
    expect(w.emitted('column-resize')).toEqual([
      [{ columnId: 'a', width: 140 }],
    ])
  })
})

describe('NbSpreadsheet sheet mode', () => {
  type TCells = Record<string, string | number | boolean | null>
  // Mounts a sheet with v-model:cells bound, as a host would.
  function sheet(cells: TCells, props: Record<string, unknown> = {}) {
    const w = mount(Spreadsheet, {
      props: {
        cells,
        locale: 'en-GB',
        'onUpdate:cells': (v: TCells) => w.setProps({ cells: v }),
        ...props,
      },
      attachTo: document.body,
    })
    return w
  }
  const model = (w: ReturnType<typeof sheet>) => w.props('cells') as TCells
  const headers = (w: ReturnType<typeof sheet>) =>
    w.findAll('.nb-spreadsheet__header').map((h) => h.text())
  const gutter = (w: ReturnType<typeof sheet>) =>
    w.findAll('.nb-spreadsheet__gutter').map((g) => g.text())

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('lays out letters and numbers as far as the data reaches', () => {
    const w = sheet({ A1: 'Rent', B3: 1250.5 })
    expect(headers(w)).toEqual(['A', 'B'])
    expect(gutter(w)).toEqual(['1', '2', '3'])
    expect(w.find('[data-cell="1::A"]').text()).toBe('Rent')
    const b3 = w.find('[data-cell="3::B"]')
    expect(b3.text()).toBe('1,250.5')
    expect(b3.classes()).toContain('nb-spreadsheet__cell--right')
    expect(w.find('[data-cell="1::A"]').classes()).toContain(
      'nb-spreadsheet__cell--left',
    )
  })

  it('writes what is typed into the cells, as a number when it reads as one', async () => {
    const w = sheet({}, { extent: { minRows: 3, minColumns: 3 } })
    const scroller = w.find('.nb-spreadsheet__scroller')
    await w.find('[data-cell="1::A"]').trigger('mousedown')
    await scroller.trigger('keydown', { key: '4' })
    const input = w.find<HTMLInputElement>('.nb-spreadsheet__editor')
    expect(input.attributes('aria-label')).toBe('A1')
    await input.setValue('42')
    await input.trigger('keydown', { key: 'Enter' })
    await scroller.trigger('keydown', { key: 'R' })
    await w.find('.nb-spreadsheet__editor').setValue('Rent')
    await w.find('.nb-spreadsheet__editor').trigger('keydown', { key: 'Tab' })
    expect(model(w)).toEqual({ A1: 42, A2: 'Rent' })
    const change = w.emitted('change')!.at(-1)![0] as Array<{ cell: string }>
    expect(change[0].cell).toBe('A2')
    // Clearing a cell drops its key, and undo puts it back.
    await w.find('[data-cell="1::A"]').trigger('mousedown')
    await scroller.trigger('keydown', { key: 'Delete' })
    expect(model(w)).toEqual({ A2: 'Rent' })
    await scroller.trigger('keydown', { key: 'z', ctrlKey: true })
    expect(model(w)).toEqual({ A1: 42, A2: 'Rent' })
  })

  it('reads a decimal comma in a locale that writes one', async () => {
    const w = sheet({}, { locale: 'pt-PT' })
    await w.find('[data-cell="1::A"]').trigger('mousedown')
    await w.find('.nb-spreadsheet__scroller').trigger('keydown', { key: '1' })
    await w.find('.nb-spreadsheet__editor').setValue('1,5')
    await w.find('.nb-spreadsheet__editor').trigger('keydown', { key: 'Enter' })
    expect(model(w)).toEqual({ A1: 1.5 })
  })

  it('shows at least the bounds it is given, and grows no further', async () => {
    const w = sheet(
      { A1: 1 },
      { extent: { minRows: 4, minColumns: 3, maxRows: 5, maxColumns: 3 } },
    )
    expect(headers(w)).toEqual(['A', 'B', 'C'])
    expect(gutter(w)).toEqual(['1', '2', '3', '4'])
    await w.find('[data-cell="4::B"]').trigger('mousedown')
    const paste = new Event('paste', { bubbles: true, cancelable: true })
    Object.assign(paste, {
      clipboardData: { getData: () => 'a\tb\tc\nd\te\tf\ng\th\ti' },
    })
    w.find('.nb-spreadsheet__scroller').element.dispatchEvent(paste)
    await nextTick()
    // Row 5 is the most it reaches, and column C the widest.
    expect(model(w)).toEqual({ A1: 1, B4: 'a', C4: 'b', B5: 'd', C5: 'e' })
    expect(gutter(w)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('grows to take a paste past its end', async () => {
    const w = sheet({ A1: 'x' })
    await w.find('[data-cell="1::A"]').trigger('mousedown')
    const paste = new Event('paste', { bubbles: true, cancelable: true })
    Object.assign(paste, { clipboardData: { getData: () => '1\t2\n3\t4' } })
    w.find('.nb-spreadsheet__scroller').element.dispatchEvent(paste)
    await nextTick()
    expect(model(w)).toEqual({ A1: 1, B1: 2, A2: 3, B2: 4 })
    expect(headers(w)).toEqual(['A', 'B'])
    expect(gutter(w)).toEqual(['1', '2'])
  })

  it('starts an infinite sheet at A to Z and a hundred rows', () => {
    const w = sheet({}, { extent: 'infinite' })
    const grid = w.find('[role="grid"]')
    expect(grid.attributes('aria-colcount')).toBe('27')
    expect(grid.attributes('aria-rowcount')).toBe('101')
    expect(headers(w).at(-1)).toBe('Z')
  })

  it('renders only the columns in view on a wide sheet', () => {
    const w = sheet({}, { extent: { minColumns: 400 } })
    const rendered = headers(w)
    expect(rendered.length).toBeLessThan(400)
    expect(rendered[0]).toBe('A')
    // Every column keeps its track, so the grid is its full width.
    const style = w.find('.nb-spreadsheet__grid').attributes('style')
    expect(style.match(/120px/g)?.length).toBe(400)
  })

  it('carries a series on with the fill handle', async () => {
    const w = sheet({ A1: 1, A2: 2, B1: 'x' }, { extent: { minRows: 5 } })
    await w.find('[data-cell="1::A"]').trigger('mousedown')
    await w.find('[data-cell="2::B"]').trigger('mousedown', { shiftKey: true })
    const handle = w.find('[data-cell="2::B"] .nb-spreadsheet__fill-handle')
    expect(handle.exists()).toBe(true)
    await handle.trigger('mousedown')
    await w.find('[data-cell="5::A"]').trigger('mouseenter')
    expect(w.find('[data-cell="4::B"]').classes()).toContain(
      'nb-spreadsheet__cell--fill',
    )
    document.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()
    // Numbers that step evenly carry on, anything else repeats.
    expect(model(w)).toEqual({
      A1: 1,
      A2: 2,
      A3: 3,
      A4: 4,
      A5: 5,
      B1: 'x',
      B3: 'x',
      B5: 'x',
    })
    const sel = w.emitted('selection')!.at(-1)![0] as { endRowId: string }
    expect(sel.endRowId).toBe('5')
  })

  it('fills down and right from the keyboard', async () => {
    const w = sheet({ A1: 7 }, { extent: { minRows: 3, minColumns: 2 } })
    const scroller = w.find('.nb-spreadsheet__scroller')
    await w.find('[data-cell="1::A"]').trigger('mousedown')
    await w.find('[data-cell="3::A"]').trigger('mousedown', { shiftKey: true })
    await scroller.trigger('keydown', { key: 'd', ctrlKey: true })
    expect(model(w)).toEqual({ A1: 7, A2: 7, A3: 7 })
    await w.find('[data-cell="1::B"]').trigger('mousedown')
    await scroller.trigger('keydown', { key: 'r', ctrlKey: true })
    expect(model(w)).toEqual({ A1: 7, A2: 7, A3: 7, B1: 7 })
  })

  it('keeps the fill handle and its keys out of table mode by default', async () => {
    const w = mount(Spreadsheet, {
      props: { columns, rows },
      attachTo: document.body,
    })
    await w.find('[data-cell="r1::jan"]').trigger('mousedown')
    expect(w.find('.nb-spreadsheet__fill-handle').exists()).toBe(false)
    const key = new KeyboardEvent('keydown', {
      key: 'd',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    w.find('.nb-spreadsheet__scroller').element.dispatchEvent(key)
    expect(key.defaultPrevented).toBe(false)
    expect(w.emitted('change')).toBeFalsy()
    w.unmount()
  })
})

describe('NbSpreadsheet range boxes', () => {
  type TCells = Record<string, string | number | boolean | null>
  const grid: TCells = { D4: 1 }
  function sheet() {
    const w = mount(Spreadsheet, {
      props: {
        cells: grid,
        locale: 'en-GB',
        'onUpdate:cells': (v: TCells) => w.setProps({ cells: v }),
      },
      attachTo: document.body,
    })
    return w
  }
  const edges = (w: ReturnType<typeof sheet>, ref: string) =>
    w
      .find(`[data-cell="${ref.slice(1)}::${ref[0]}"]`)
      .classes()
      .filter((c) => c.startsWith('nb-spreadsheet__cell--edge-'))
      .map((c) => c.replace('nb-spreadsheet__cell--edge-', ''))
      .sort()

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('boxes a range on the grid lines around it', async () => {
    const w = sheet()
    await w.find('[data-cell="2::B"]').trigger('mousedown')
    await w.find('[data-cell="3::C"]').trigger('mousedown', { shiftKey: true })
    expect(edges(w, 'B2')).toEqual([])
    expect(edges(w, 'C2')).toEqual(['right'])
    expect(edges(w, 'B3')).toEqual(['bottom'])
    expect(edges(w, 'C3')).toEqual(['bottom', 'right'])
    // The cells before the range draw its left and top edges.
    expect(edges(w, 'A2')).toEqual(['right'])
    expect(edges(w, 'B1')).toEqual(['bottom'])
    expect(edges(w, 'D2')).toEqual([])
    w.unmount()
  })

  it('adds a range with Cmd or Ctrl, boxes each, and clears both', async () => {
    const w = sheet()
    await w.find('[data-cell="1::A"]').trigger('mousedown')
    await w.find('[data-cell="3::C"]').trigger('mousedown', { metaKey: true })
    expect(w.findAll('.nb-spreadsheet__cell--selected')).toHaveLength(2)
    expect(edges(w, 'A1').sort()).toEqual(['bottom', 'left', 'right', 'top'])
    expect(edges(w, 'C3')).toEqual(['bottom', 'right'])
    expect(edges(w, 'B3')).toEqual(['right'])
    expect(edges(w, 'C2')).toEqual(['bottom'])
    expect(w.find('.nb-spreadsheet__fill-handle').exists()).toBe(false)
    expect(
      (w.vm as unknown as { getSelections(): unknown[] }).getSelections(),
    ).toHaveLength(2)

    await w.find('[data-cell="2::B"]').trigger('mousedown', { ctrlKey: true })
    w.setProps({ cells: { A1: 1, B2: 2, C3: 3, D4: 4 } })
    await nextTick()
    await w.find('.nb-spreadsheet__scroller').trigger('keydown', {
      key: 'Delete',
    })
    expect(w.props('cells')).toEqual({ D4: 4 })

    await w.find('[data-cell="4::D"]').trigger('mousedown')
    expect(w.findAll('.nb-spreadsheet__cell--selected')).toHaveLength(1)
    w.unmount()
  })

  it('drops the ring around the whole grid once a cell is active', async () => {
    const w = sheet()
    const scroller = w.find('.nb-spreadsheet__scroller')
    expect(scroller.classes()).not.toContain('nb-spreadsheet__scroller--active')
    await w.find('[data-cell="1::A"]').trigger('mousedown')
    expect(scroller.classes()).toContain('nb-spreadsheet__scroller--active')
    w.unmount()
  })
})
