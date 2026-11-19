import { afterEach, describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Spreadsheet from '../src/components/Spreadsheet.vue'

type TCells = Record<string, string | number | boolean | null>

function sheet(cells: TCells, props: Record<string, unknown> = {}) {
  const w = mount(Spreadsheet, {
    props: {
      cells,
      locale: 'en-GB',
      extent: { minRows: 4, minColumns: 4 },
      'onUpdate:cells': (v: TCells) => w.setProps({ cells: v }),
      ...props,
    },
    attachTo: document.body,
  })
  return w
}
type TWrapper = ReturnType<typeof sheet>
const cell = (w: TWrapper, ref: string) => {
  const m = /^([A-Z]+)(\d+)$/.exec(ref)!
  return w.find(`[data-cell="${m[2]}::${m[1]}"]`)
}
const model = (w: TWrapper) => w.props('cells') as TCells
const editor = (w: TWrapper) =>
  w.find<HTMLInputElement>(
    '.nb-spreadsheet__editor:not(.nb-spreadsheet__mirror)',
  )
const scroller = (w: TWrapper) => w.find('.nb-spreadsheet__scroller')

// Types into the open editor as a person would: the value, the caret at its
// end, then the input event.
async function type(w: TWrapper, text: string) {
  const input = editor(w)
  input.element.value = text
  input.element.setSelectionRange(text.length, text.length)
  await input.trigger('input')
  await nextTick()
}

async function startTyping(w: TWrapper, ref: string, first: string) {
  await cell(w, ref).trigger('mousedown')
  await scroller(w).trigger('keydown', { key: first })
  await nextTick()
  await nextTick()
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('NbSpreadsheet formula bar', () => {
  it('shows the reference and the formula as written', async () => {
    const w = sheet({ A1: 2, A2: '=A1*2' })
    await cell(w, 'A2').trigger('mousedown')
    expect(w.find('.nb-spreadsheet__name-box').text()).toBe('A2')
    expect(
      w.find<HTMLInputElement>('.nb-spreadsheet__bar-input').element.value,
    ).toBe('=A1*2')
    expect(cell(w, 'A2').text()).toBe('4')
    await cell(w, 'B2').trigger('mousedown', { shiftKey: true })
    expect(w.find('.nb-spreadsheet__name-box').text()).toBe('A2:B2')
    w.unmount()
  })

  it('edits the active cell from the bar', async () => {
    const w = sheet({ A1: 1 })
    await cell(w, 'A1').trigger('mousedown')
    const bar = w.find<HTMLInputElement>('.nb-spreadsheet__bar-input')
    await bar.trigger('focus')
    bar.element.value = '=1+2'
    await bar.trigger('input')
    expect(editor(w).element.value).toBe('=1+2')
    await bar.trigger('keydown', { key: 'Enter' })
    expect(model(w)).toEqual({ A1: '=1+2' })
    expect(cell(w, 'A1').text()).toBe('3')
    w.unmount()
  })

  it('is off in table mode and can be turned off in sheet mode', () => {
    const t = mount(Spreadsheet, {
      props: { columns: [{ id: 'a', label: 'A' }], rows: [] },
    })
    expect(t.find('.nb-spreadsheet__formula-bar').exists()).toBe(false)
    const w = sheet({ A1: 1 }, { formulaBar: false })
    expect(w.find('.nb-spreadsheet__formula-bar').exists()).toBe(false)
    w.unmount()
  })
})

describe('NbSpreadsheet formula syntax by locale', () => {
  it('takes semicolons and decimal commas in pt-PT and stores canonical text', async () => {
    const w = sheet({ A1: 2 }, { locale: 'pt-PT' })
    await startTyping(w, 'B1', '=')
    await type(w, '=SUM(A1;1,5)')
    await editor(w).trigger('keydown', { key: 'Enter' })
    expect(model(w).B1).toBe('=SUM(A1,1.5)')
    expect(cell(w, 'B1').text()).toBe('3,5')
    await cell(w, 'B1').trigger('mousedown')
    await scroller(w).trigger('keydown', { key: 'F2' })
    await nextTick()
    expect(editor(w).element.value).toBe('=SUM(A1;1,5)')
    w.unmount()
  })
})

describe('NbSpreadsheet references while editing', () => {
  it('colours references and boxes them on the grid', async () => {
    const w = sheet({ A1: 1, B2: 2 })
    await startTyping(w, 'C3', '=')
    await type(w, '=A1+B1:B2+a1')
    const runs = w.findAll(
      '.nb-spreadsheet__mirror:not(.nb-spreadsheet__mirror--bar) [class*="ref--"]',
    )
    expect(runs.map((r) => [r.text(), r.classes()[0]])).toEqual([
      ['A1', 'nb-spreadsheet__ref--1'],
      ['B1:B2', 'nb-spreadsheet__ref--2'],
      ['a1', 'nb-spreadsheet__ref--1'],
    ])
    const boxes = w.findAll('.nb-spreadsheet__ref-box')
    expect(boxes).toHaveLength(3)
    // B1:B2 sits under the header row, in the second column after the gutter.
    expect(boxes[1].attributes('style')).toContain('grid-row: 2 / span 2')
    expect(boxes[1].attributes('style')).toContain('grid-column: 3 / span 1')
    w.unmount()
  })

  it('writes a clicked cell, or a dragged range, into the formula', async () => {
    const w = sheet({ A1: 1, A2: 2, A3: 3 })
    await startTyping(w, 'B1', '=')
    await type(w, '=SUM(')
    await cell(w, 'A1').trigger('mousedown')
    await cell(w, 'A3').trigger('mouseenter')
    document.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()
    expect(editor(w).element.value).toBe('=SUM(A1:A3')
    // The edit is still open on B1.
    expect(cell(w, 'B1').classes()).toContain('nb-spreadsheet__cell--focused')
    await type(w, '=SUM(A1:A3)')
    await editor(w).trigger('keydown', { key: 'Enter' })
    expect(cell(w, 'B1').text()).toBe('6')
    w.unmount()
  })

  it('points with the arrow keys in a cell opened by typing', async () => {
    const w = sheet({ A1: 5, B1: 7 })
    await startTyping(w, 'C2', '=')
    await type(w, '=')
    const input = editor(w)
    await input.trigger('keydown', { key: 'ArrowUp' })
    await nextTick()
    expect(input.element.value).toBe('=C1')
    await input.trigger('keydown', { key: 'ArrowLeft' })
    await nextTick()
    expect(input.element.value).toBe('=B1')
    await input.trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
    await nextTick()
    expect(input.element.value).toBe('=A1:B1')
    await input.trigger('keydown', { key: 'Enter' })
    expect(model(w).C2).toBe('=A1:B1')
    w.unmount()
  })

  it('commits and moves on with the arrows when no operand is wanted', async () => {
    const w = sheet({ A1: 5 })
    await startTyping(w, 'B1', '=')
    await type(w, '=A1')
    await editor(w).trigger('keydown', { key: 'ArrowDown' })
    expect(model(w).B1).toBe('=A1')
    expect(cell(w, 'B2').classes()).toContain('nb-spreadsheet__cell--focused')
    w.unmount()
  })
})

describe('NbSpreadsheet function list', () => {
  it('offers functions for a name being typed and writes the chosen one', async () => {
    const w = sheet({ A1: 1 })
    await startTyping(w, 'B1', '=')
    await type(w, '=SU')
    const input = editor(w)
    expect(input.attributes('aria-expanded')).toBe('true')
    const names = w.findAll('.nb-spreadsheet__assist-name').map((n) => n.text())
    expect(names).toContain('SUM')
    expect(names.every((n) => n.startsWith('SU'))).toBe(true)
    const sum = names.indexOf('SUM')
    for (let i = 0; i < sum; i++)
      await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe(
      w.findAll('[role="option"]')[sum].attributes('id'),
    )
    await input.trigger('keydown', { key: 'Tab' })
    await nextTick()
    expect(input.element.value).toBe('=SUM(')
    // Inside the brackets, the call's syntax shows instead of the list.
    expect(w.find('.nb-spreadsheet__signature').text()).toContain('SUM(')
    expect(input.attributes('aria-expanded')).toBe('false')
    w.unmount()
  })

  it('closes the list with Escape and keeps the edit', async () => {
    const w = sheet({})
    await startTyping(w, 'A1', '=')
    await type(w, '=AV')
    expect(w.find('[role="listbox"]').exists()).toBe(true)
    await editor(w).trigger('keydown', { key: 'Escape' })
    expect(w.find('[role="listbox"]').exists()).toBe(false)
    expect(editor(w).exists()).toBe(true)
    w.unmount()
  })
})

describe('NbSpreadsheet moving formulas', () => {
  it('moves relative references as a formula is filled', async () => {
    const w = sheet({ A1: 1, A2: 2, A3: 3, B1: '=A1*2', C1: '=$A$1+A1' })
    await cell(w, 'B1').trigger('mousedown')
    await cell(w, 'C3').trigger('mousedown', { shiftKey: true })
    await scroller(w).trigger('keydown', { key: 'd', ctrlKey: true })
    expect(model(w)).toMatchObject({
      B2: '=A2*2',
      B3: '=A3*2',
      C2: '=$A$1+A2',
      C3: '=$A$1+A3',
    })
    expect(cell(w, 'B3').text()).toBe('6')
    w.unmount()
  })

  it('moves formulas pasted from the sheet, and not ones that were cut', async () => {
    const w = sheet({ A1: 1, B1: 10, A2: '=A1+1' })
    const copy = (type: 'copy' | 'cut') => {
      const data = new Map<string, string>()
      const e = new Event(type, { bubbles: true, cancelable: true })
      Object.assign(e, {
        clipboardData: {
          setData: (k: string, v: string) => data.set(k, v),
          getData: (k: string) => data.get(k) ?? '',
        },
      })
      scroller(w).element.dispatchEvent(e)
      return data.get('text/plain') ?? ''
    }
    const paste = (text: string) => {
      const e = new Event('paste', { bubbles: true, cancelable: true })
      Object.assign(e, { clipboardData: { getData: () => text } })
      scroller(w).element.dispatchEvent(e)
    }
    await cell(w, 'A2').trigger('mousedown')
    const text = copy('copy')
    expect(text).toBe('=A1+1')
    await cell(w, 'B2').trigger('mousedown')
    paste(text)
    await nextTick()
    expect(model(w).B2).toBe('=B1+1')
    expect(cell(w, 'B2').text()).toBe('11')
    await cell(w, 'B2').trigger('mousedown')
    const cut = copy('cut')
    await nextTick()
    await cell(w, 'C3').trigger('mousedown')
    paste(cut)
    await nextTick()
    expect(model(w).C3).toBe('=B1+1')
    w.unmount()
  })
})

describe('NbSpreadsheet focus', () => {
  it('leaves the focus where it is when it mounts, and takes it when asked', async () => {
    const w = sheet({ A1: 1 })
    expect(document.activeElement).toBe(document.body)
    ;(w.vm as unknown as { focus(r: string, c: string): void }).focus('1', 'A')
    await nextTick()
    expect(document.activeElement).toBe(scroller(w).element)
    expect(cell(w, 'A1').classes()).toContain('nb-spreadsheet__cell--focused')
    w.unmount()
  })
})
