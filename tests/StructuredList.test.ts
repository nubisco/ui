import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StructuredList from '../src/components/StructuredList.vue'

const columns = [
  { key: 'name', label: 'Role' },
  { key: 'people', label: 'People', width: 'auto', align: 'end' as const },
  { key: 'note', label: 'Note' },
]
const rows = [
  { id: 'a', name: 'Owner', people: 1, note: 'Can delete the project' },
  { id: 'b', name: 'Editor', people: 6, note: '' },
]

describe('NbStructuredList', () => {
  it('is a table of rows and cells with a header row', () => {
    const w = mount(StructuredList, {
      props: { columns, rows, ariaLabel: 'Roles' },
    })
    expect(w.attributes('role')).toBe('table')
    expect(w.attributes('aria-label')).toBe('Roles')
    const headers = w.findAll('[role="columnheader"]')
    expect(headers.map((h) => h.text())).toEqual(['Role', 'People', 'Note'])
    const bodyRows = w.findAll('.nb-structured-list__body [role="row"]')
    expect(bodyRows).toHaveLength(2)
    expect(bodyRows[0].findAll('[role="cell"]').map((c) => c.text())).toEqual([
      'Owner',
      '1',
      'Can delete the project',
    ])
  })

  it('lays every row on one shared template, row by row', () => {
    const w = mount(StructuredList, { props: { columns, rows } })
    expect(w.attributes('style')).toContain(
      '--nb-structured-list-columns: minmax(0, 1fr) auto minmax(0, 1fr)',
    )
    // The grid is on each row, never on the list.
    expect(w.findAll('.nb-structured-list__row')).toHaveLength(3)
  })

  it('shows a dash for an empty value', () => {
    const w = mount(StructuredList, { props: { columns, rows } })
    expect(w.findAll('.nb-structured-list__empty')).toHaveLength(1)
    expect(w.find('.nb-structured-list__empty').text()).toBe('–')
  })

  it('aligns end columns and labels every cell for the phone layout', () => {
    const w = mount(StructuredList, { props: { columns, rows } })
    const cell = w.findAll('.nb-structured-list__body [role="cell"]')[1]
    expect(cell.classes()).toContain('nb-structured-list__cell--end')
    expect(cell.attributes('data-label')).toBe('People')
  })

  it('takes a cell slot per column', () => {
    const w = mount(StructuredList, {
      props: { columns, rows },
      slots: {
        'cell-name': `<template #cell-name="{ row, value }"><strong>{{ value }}!</strong></template>`,
      },
    })
    expect(w.find('[role="cell"] strong').text()).toBe('Owner!')
  })

  it('takes condensed and flush', () => {
    const w = mount(StructuredList, {
      props: { columns, rows, condensed: true, flush: true },
    })
    expect(w.classes()).toContain('nb-structured-list--condensed')
    expect(w.classes()).toContain('nb-structured-list--flush')
  })

  it('keys rows by rowKey when given a function', () => {
    const w = mount(StructuredList, {
      props: { columns, rows, rowKey: (row) => String(row.name) },
    })
    expect(w.findAll('.nb-structured-list__body [role="row"]')).toHaveLength(2)
  })
})
