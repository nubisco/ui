import { describe, it, expect, vi } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import DataTable from '../src/components/DataTable.vue'
import type { IDataTableColumn } from '../src/components/DataTable.d'

/*
 * A table with a row-click listener is not a grid (keyboard.md "Tables"),
 * but each row is a button: in the tab order, Enter on keydown, Space on
 * keyup with the keydown cancelled, and keys typed into a control inside the
 * row left to that control. The accessibility tab states all of this.
 */

interface Row {
  id: number
  name: string
}

const columns: IDataTableColumn<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'action', header: 'Action' },
]
const rows: Row[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
]

function mountTable(onRowClick?: (row: Row, i: number) => void) {
  return mount(DataTable, {
    props: {
      columns,
      rows,
      rowKey: 'id',
      ...(onRowClick ? { onRowClick } : {}),
    },
    slots: {
      'cell-action': () => h('button', { class: 'inner' }, 'Edit'),
    },
  })
}

const bodyRows = (w: ReturnType<typeof mountTable>) => w.findAll('tbody tr')

describe('NbDataTable row keyboard', () => {
  it('leaves rows out of the tab order when nothing listens for clicks', () => {
    const w = mountTable()
    for (const r of bodyRows(w)) {
      expect(r.attributes('tabindex')).toBeUndefined()
    }
  })

  it('puts every row in the tab order when row-click is listened for', () => {
    const w = mountTable(vi.fn())
    for (const r of bodyRows(w)) expect(r.attributes('tabindex')).toBe('0')
  })

  it('activates a row with Enter on keydown, once per press', async () => {
    const onRowClick = vi.fn()
    const w = mountTable(onRowClick)
    const row = bodyRows(w)[1]
    await row.trigger('keydown', { key: 'Enter' })
    await row.trigger('keydown', { key: 'Enter', repeat: true })
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick).toHaveBeenCalledWith(rows[1], 1)
  })

  it('activates a row with Space on keyup and cancels the keydown scroll', async () => {
    const onRowClick = vi.fn()
    const w = mountTable(onRowClick)
    const row = bodyRows(w)[0]
    const down = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })
    row.element.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    expect(onRowClick).not.toHaveBeenCalled()
    await row.trigger('keyup', { key: ' ' })
    expect(onRowClick).toHaveBeenCalledWith(rows[0], 0)
  })

  it('ignores keys typed into a control inside the row', async () => {
    const onRowClick = vi.fn()
    const w = mountTable(onRowClick)
    const inner = bodyRows(w)[0].find('.inner')
    await inner.trigger('keydown', { key: 'Enter' })
    await inner.trigger('keyup', { key: ' ' })
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('ignores Enter with a modifier', async () => {
    const onRowClick = vi.fn()
    const w = mountTable(onRowClick)
    await bodyRows(w)[0].trigger('keydown', { key: 'Enter', metaKey: true })
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
