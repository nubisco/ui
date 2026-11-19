import { afterEach, describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Spreadsheet from '../src/components/Spreadsheet.vue'
import {
  formatNumber,
  parseRange,
  ruleMatches,
} from '../src/components/spreadsheet/sheetLook'

type TCells = Record<string, string | number | boolean | null>

interface ISheetApi {
  applyStyle(patch: Record<string, unknown>): void
  clearStyles(): void
  merge(): void
  unmerge(): void
  undo(): void
  redo(): void
  exportCsv(options?: Record<string, unknown>): string
  importCsv(text: string, delimiter?: string): void
}

// Mounts a sheet with every sheet-mode model bound, as a host would.
function sheet(cells: TCells, props: Record<string, unknown> = {}) {
  const w = mount(Spreadsheet, {
    props: {
      cells,
      styles: {},
      merges: [],
      locale: 'en-GB',
      'onUpdate:cells': (v: TCells) => w.setProps({ cells: v }),
      'onUpdate:styles': (v: unknown) => w.setProps({ styles: v as never }),
      'onUpdate:merges': (v: string[]) => w.setProps({ merges: v }),
      ...props,
    },
    attachTo: document.body,
  })
  return w
}
type TWrapper = ReturnType<typeof sheet>
const api = (w: TWrapper) => w.vm as unknown as ISheetApi
const cell = (w: TWrapper, ref: string) => {
  const m = /^([A-Z]+)(\d+)$/.exec(ref)!
  return w.find(`[data-cell="${m[2]}::${m[1]}"]`)
}
const select = async (w: TWrapper, from: string, to?: string) => {
  await cell(w, from).trigger('mousedown')
  if (to) await cell(w, to).trigger('mousedown', { shiftKey: true })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('sheetLook helpers', () => {
  it('reads cells, ranges, whole columns and rows', () => {
    expect(parseRange('b2')).toEqual({ r1: 1, c1: 1, r2: 1, c2: 1 })
    expect(parseRange('$D$9:B2')).toEqual({ r1: 1, c1: 1, r2: 8, c2: 3 })
    expect(parseRange('C:C')).toEqual({ r1: 0, r2: Infinity, c1: 2, c2: 2 })
    expect(parseRange('3:5')).toEqual({ r1: 2, r2: 4, c1: 0, c2: Infinity })
    expect(parseRange('A0')).toBeNull()
    expect(parseRange('nonsense')).toBeNull()
  })

  it('formats numbers, percentages and currencies', () => {
    expect(formatNumber(1234.5, { type: 'number', decimals: 2 }, 'en-GB')).toBe(
      '1,234.50',
    )
    expect(
      formatNumber(1234.5, { type: 'number', grouping: false }, 'en-GB'),
    ).toBe('1234.5')
    expect(formatNumber(0.125, { type: 'percent', decimals: 1 }, 'en-GB')).toBe(
      '12.5%',
    )
    expect(
      formatNumber(9.5, { type: 'currency', currency: 'EUR' }, 'en-GB'),
    ).toBe('€9.50')
    // An unknown currency falls back to the plain number.
    expect(
      formatNumber(9.5, { type: 'currency', currency: '??' }, 'en-GB'),
    ).toBe('9.5')
  })

  it('matches rules on values', () => {
    expect(ruleMatches({ when: 'greaterThan', value: 10 }, 11)).toBe(true)
    expect(ruleMatches({ when: 'greaterThan', value: 10 }, '11')).toBe(true)
    expect(ruleMatches({ when: 'greaterThan', value: 10 }, null)).toBe(false)
    expect(ruleMatches({ when: 'equal', value: 'apples' }, 'Apples')).toBe(true)
    expect(ruleMatches({ when: 'notEqual', value: 3 }, 'x')).toBe(true)
    expect(ruleMatches({ when: 'between', min: 5, max: 1 }, 3)).toBe(true)
    expect(ruleMatches({ when: 'notBetween', min: 1, max: 5 }, 3)).toBe(false)
    expect(ruleMatches({ when: 'contains', text: 'PP' }, 'apple')).toBe(true)
    expect(ruleMatches({ when: 'startsWith', text: 'ap' }, 'Apple')).toBe(true)
    expect(ruleMatches({ when: 'endsWith', text: 'le' }, 'Apple')).toBe(true)
    expect(ruleMatches({ when: 'notContains', text: 'x' }, null)).toBe(true)
    expect(ruleMatches({ when: 'empty' }, '')).toBe(true)
    expect(ruleMatches({ when: 'notEmpty' }, 0)).toBe(true)
    const error = { error: '#DIV/0!', message: 'Division by zero' }
    expect(ruleMatches({ when: 'error' }, error)).toBe(true)
    expect(ruleMatches({ when: 'greaterThan', value: 0 }, error)).toBe(false)
    expect(ruleMatches({ when: 'formula', formula: '=1' }, 0, true)).toBe(true)
    expect(ruleMatches({ when: 'formula', formula: '=1' }, 0, 0)).toBe(false)
  })
})

describe('NbSpreadsheet cell styles', () => {
  it('toggles bold, italic and underline from the keyboard, with undo', async () => {
    const w = sheet({ A1: 'Item', B1: 'Qty' })
    await select(w, 'A1', 'B1')
    const scroller = w.find('.nb-spreadsheet__scroller')
    await scroller.trigger('keydown', { key: 'b', metaKey: true })
    expect(w.props('styles')).toEqual({
      A1: { bold: true },
      B1: { bold: true },
    })
    expect(cell(w, 'A1').classes()).toContain('nb-spreadsheet__cell--bold')
    await scroller.trigger('keydown', { key: 'i', ctrlKey: true })
    await scroller.trigger('keydown', { key: 'b', metaKey: true })
    expect(w.props('styles')).toEqual({
      A1: { italic: true },
      B1: { italic: true },
    })
    await scroller.trigger('keydown', { key: 'z', metaKey: true })
    expect(w.props('styles')).toEqual({
      A1: { bold: true, italic: true },
      B1: { bold: true, italic: true },
    })
    await scroller.trigger('keydown', {
      key: 'z',
      metaKey: true,
      shiftKey: true,
    })
    expect(cell(w, 'A1').classes()).not.toContain('nb-spreadsheet__cell--bold')
    w.unmount()
  })

  it('applies an intent, an alignment and a number format', async () => {
    const w = sheet({ A1: 0.256, B1: 1200 })
    await select(w, 'A1')
    api(w).applyStyle({
      intent: 'success',
      align: 'center',
      format: { type: 'percent', decimals: 1 },
    })
    await nextTick()
    const a1 = cell(w, 'A1')
    expect(a1.text()).toBe('25.6%')
    expect(a1.classes()).toContain('nb-spreadsheet__cell--center')
    // The active cell is selected, which keeps the selection's tint.
    await select(w, 'B1')
    expect(cell(w, 'A1').classes()).toContain(
      'nb-spreadsheet__cell--intent-success',
    )
    api(w).applyStyle({ format: { type: 'currency', currency: 'EUR' } })
    await nextTick()
    expect(cell(w, 'B1').text()).toBe('€1,200.00')
    await select(w, 'A1', 'B1')
    api(w).clearStyles()
    await nextTick()
    expect(w.props('styles')).toEqual({})
    expect(cell(w, 'A1').text()).toBe('0.256')
    w.unmount()
  })

  it('leaves Cmd+B to the browser in table mode', async () => {
    const w = mount(Spreadsheet, {
      props: {
        columns: [{ id: 'a', label: 'A' }],
        rows: [{ id: 'r1', values: { a: 1 } }],
      },
      attachTo: document.body,
    })
    await w.find('[data-cell="r1::a"]').trigger('mousedown')
    const key = new KeyboardEvent('keydown', {
      key: 'b',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })
    w.find('.nb-spreadsheet__scroller').element.dispatchEvent(key)
    expect(key.defaultPrevented).toBe(false)
    w.unmount()
  })
})

describe('NbSpreadsheet merged cells', () => {
  it('spans the first cell over the range and hides the rest', () => {
    const w = sheet({ A1: 'Totals', C2: 1 }, { merges: ['A1:B2'] })
    const a1 = cell(w, 'A1')
    expect(a1.attributes('style')).toContain('grid-row: 2 / span 2')
    expect(a1.attributes('style')).toContain('grid-column: 2 / span 2')
    expect(cell(w, 'B1').exists()).toBe(false)
    expect(cell(w, 'A2').exists()).toBe(false)
    expect(cell(w, 'C2').exists()).toBe(true)
    w.unmount()
  })

  it('grows the sheet to an empty merge', () => {
    const w = sheet({ A1: 1 }, { merges: ['B2:C3'] })
    expect(w.findAll('.nb-spreadsheet__gutter')).toHaveLength(3)
    w.unmount()
  })

  it('merges and unmerges the selection, with undo', async () => {
    const w = sheet({ A1: 'a', B2: 'b', C3: 'c' })
    await select(w, 'A1', 'B2')
    api(w).merge()
    await nextTick()
    expect(w.props('merges')).toEqual(['A1:B2'])
    // A merge that overlaps an old one replaces it.
    await select(w, 'A1', 'C1')
    api(w).merge()
    await nextTick()
    expect(w.props('merges')).toEqual(['A1:C2'])
    api(w).undo()
    await nextTick()
    expect(w.props('merges')).toEqual(['A1:B2'])
    await select(w, 'A1')
    api(w).unmerge()
    await nextTick()
    expect(w.props('merges')).toEqual([])
    w.unmount()
  })

  it('takes the whole merge into a selection and moves around it', async () => {
    const w = sheet({ A1: 1, C3: 1 }, { merges: ['B1:B2'] })
    await select(w, 'A2')
    await w
      .find('.nb-spreadsheet__scroller')
      .trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    // The range grew to cover the merge, so row 1 is selected too.
    expect(cell(w, 'B1').classes()).toContain('nb-spreadsheet__cell--selected')
    expect(cell(w, 'A1').classes()).toContain('nb-spreadsheet__cell--selected')
    await select(w, 'A2')
    const scroller = w.find('.nb-spreadsheet__scroller')
    await scroller.trigger('keydown', { key: 'ArrowRight' })
    expect(cell(w, 'B1').classes()).toContain('nb-spreadsheet__cell--focused')
    // Down from the merged cell leaves from its last row.
    await scroller.trigger('keydown', { key: 'ArrowDown' })
    expect(cell(w, 'B3').classes()).toContain('nb-spreadsheet__cell--focused')
    w.unmount()
  })
})

describe('NbSpreadsheet conditional formats', () => {
  it('styles the cells that pass, later rules winning', () => {
    const w = sheet(
      { A1: 5, A2: 15, A3: 25, A4: 'x' },
      {
        conditionalFormats: [
          {
            range: 'A1:A4',
            rule: { when: 'greaterThan', value: 10 },
            style: { intent: 'warning' },
          },
          {
            range: 'A:A',
            rule: { when: 'greaterThan', value: 20 },
            style: { intent: 'danger', bold: true },
          },
        ],
      },
    )
    expect(cell(w, 'A1').classes().join(' ')).not.toContain('intent')
    expect(cell(w, 'A2').classes()).toContain(
      'nb-spreadsheet__cell--intent-warning',
    )
    expect(cell(w, 'A3').classes()).toContain(
      'nb-spreadsheet__cell--intent-danger',
    )
    expect(cell(w, 'A3').classes()).toContain('nb-spreadsheet__cell--bold')
    expect(cell(w, 'A4').classes().join(' ')).not.toContain('intent')
    w.unmount()
  })

  it('moves a formula rule with each cell of its range', () => {
    const w = sheet(
      { A1: 1, B1: 2, A2: 5, B2: 3 },
      {
        conditionalFormats: [
          {
            range: 'B1:B2',
            rule: { when: 'formula', formula: '=B1>A1' },
            style: { intent: 'success' },
          },
        ],
      },
    )
    expect(cell(w, 'B1').classes()).toContain(
      'nb-spreadsheet__cell--intent-success',
    )
    expect(cell(w, 'B2').classes().join(' ')).not.toContain('intent')
    w.unmount()
  })
})

describe('NbSpreadsheet formulas', () => {
  it('shows results, keeps the text, and marks errors', async () => {
    const w = sheet({ A1: 2, A2: 3, A3: '=SUM(A1:A2)', B1: '=1/0' })
    expect(cell(w, 'A3').text()).toBe('5')
    expect(cell(w, 'A3').classes()).toContain('nb-spreadsheet__cell--right')
    expect(cell(w, 'B1').text()).toBe('#DIV/0!')
    expect(cell(w, 'B1').classes()).toContain('nb-spreadsheet__cell--error')
    expect(cell(w, 'B1').attributes('title')).toBeTruthy()
    w.setProps({ cells: { A1: 10, A2: 3, A3: '=SUM(A1:A2)' } })
    await nextTick()
    expect(cell(w, 'A3').text()).toBe('13')
    expect(api(w).exportCsv()).toBe('10\r\n3\r\n=SUM(A1:A2)')
    expect(api(w).exportCsv({ values: 'display' })).toBe('10\r\n3\r\n13')
    w.unmount()
  })

  it('treats formulas as text when they are off', () => {
    const w = sheet({ A1: '=1+1' }, { formulas: false })
    expect(cell(w, 'A1').text()).toBe('=1+1')
    w.unmount()
  })
})

describe('NbSpreadsheet CSV', () => {
  it('imports CSV as one step undo takes back', async () => {
    const w = sheet({ A1: 'old', D9: 1 })
    api(w).importCsv('Item,Qty\nApples,3\nPears,"1,250.5"')
    await nextTick()
    expect(w.props('cells')).toEqual({
      A1: 'Item',
      B1: 'Qty',
      A2: 'Apples',
      B2: 3,
      A3: 'Pears',
      B3: '1,250.5',
    })
    api(w).undo()
    await nextTick()
    expect(w.props('cells')).toEqual({ A1: 'old', D9: 1 })
    w.unmount()
  })

  it('reads a semicolon file with decimal commas in a comma locale', async () => {
    const w = sheet({}, { locale: 'pt-PT' })
    api(w).importCsv('Item;Price\nPears;1,5')
    await nextTick()
    expect(w.props('cells')).toMatchObject({ B2: 1.5 })
    w.unmount()
  })

  it('exports a table with its labels and every row', () => {
    const w = mount(Spreadsheet, {
      props: {
        columns: [
          { id: 'item', label: 'Item' },
          { id: 'qty', label: 'Qty', type: 'number' as const },
        ],
        rows: [
          { id: 'r1', values: { item: 'Apples, red', qty: 1200 } },
          { id: 'r2', values: { item: 'Pears', qty: 3 } },
        ],
        hiddenRows: ['r2'],
        locale: 'en-GB',
      },
    })
    const csv = (w.vm as unknown as ISheetApi).exportCsv
    expect(csv()).toBe('Item,Qty\r\n"Apples, red",1200\r\nPears,3')
    expect(csv({ values: 'display', delimiter: ';' })).toBe(
      'Item;Qty\r\nApples, red;1,200\r\nPears;3',
    )
  })
})
