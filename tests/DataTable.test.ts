import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import DataTable from '../src/components/DataTable.vue'
import type {
  IDataTableColumn,
  IDataTableSortState,
} from '../src/components/DataTable.d'

interface Row {
  id: number
  name: string
  role: string
}

const columns: IDataTableColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role' },
]

const rows: Row[] = [
  { id: 1, name: 'Ada', role: 'Engineer' },
  { id: 2, name: 'Grace', role: 'Admiral' },
  { id: 3, name: 'Alan', role: 'Researcher' },
]

function mountTable(props: Record<string, unknown> = {}, options = {}) {
  return mount(DataTable, {
    props: { columns, rows, rowKey: 'id', ...props },
    ...options,
  })
}

describe('NbDataTable', () => {
  it('renders a table with a header per visible column', () => {
    const wrapper = mountTable()
    expect(wrapper.find('table').exists()).toBe(true)
    const headers = wrapper.findAll('thead th')
    expect(headers).toHaveLength(2)
    expect(headers[0].text()).toBe('Name')
    expect(headers[1].text()).toBe('Role')
  })

  it('renders a row per data item using rowKey identity', () => {
    const wrapper = mountTable()
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    expect(wrapper.find('tbody tr').text()).toContain('Ada')
  })

  it('supports a function rowKey', () => {
    const wrapper = mountTable({ rowKey: (r: Row) => `row-${r.id}` })
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })

  it('skips hidden columns', () => {
    const wrapper = mountTable({
      columns: [...columns, { key: 'x', header: 'Hidden', hidden: true }],
    })
    expect(wrapper.findAll('thead th')).toHaveLength(2)
  })

  it('applies scope="col" to header cells', () => {
    const wrapper = mountTable()
    wrapper.findAll('thead th').forEach((th) => {
      expect(th.attributes('scope')).toBe('col')
    })
  })

  describe('sorting', () => {
    it('exposes aria-sort="none" on sortable, unsorted headers', () => {
      const wrapper = mountTable()
      const [name, role] = wrapper.findAll('thead th')
      expect(name.attributes('aria-sort')).toBe('none')
      // Non-sortable columns get no aria-sort attribute.
      expect(role.attributes('aria-sort')).toBeUndefined()
    })

    it('reflects controlled sortState in aria-sort', () => {
      const sortState: IDataTableSortState = { key: 'name', direction: 'asc' }
      const wrapper = mountTable({ sortState })
      expect(wrapper.find('thead th').attributes('aria-sort')).toBe('ascending')
    })

    it('emits sort cycling none → asc on first activation', async () => {
      const wrapper = mountTable()
      await wrapper.find('thead th button').trigger('click')
      expect(wrapper.emitted('sort')![0]).toEqual([
        { key: 'name', direction: 'asc' },
      ])
    })

    it('cycles asc → desc → none', async () => {
      const wrapper = mountTable({
        sortState: { key: 'name', direction: 'asc' },
      })
      await wrapper.find('thead th button').trigger('click')
      expect(wrapper.emitted('sort')![0]).toEqual([
        { key: 'name', direction: 'desc' },
      ])

      await wrapper.setProps({ sortState: { key: 'name', direction: 'desc' } })
      await wrapper.find('thead th button').trigger('click')
      expect(wrapper.emitted('sort')![1]).toEqual([
        { key: 'name', direction: 'none' },
      ])
    })

    it('renders no sort button for non-sortable columns', () => {
      const wrapper = mountTable()
      const buttons = wrapper.findAll('thead th button')
      expect(buttons).toHaveLength(1)
    })
  })

  describe('selection', () => {
    it('renders no select column when selectable is none', () => {
      const wrapper = mountTable()
      expect(wrapper.find('.nb-data-table__select-cell').exists()).toBe(false)
    })

    it('renders a leading checkbox column for multiple selection', () => {
      const wrapper = mountTable({ selectable: 'multiple' })
      // header select-all + one per row
      expect(
        wrapper.findAll('.nb-data-table__select-cell input[type="checkbox"]')
          .length,
      ).toBe(4)
    })

    it('emits update:selected when a row checkbox is toggled', async () => {
      const wrapper = mountTable({ selectable: 'multiple', selected: [] })
      const rowCheckbox = wrapper.findAll(
        'tbody .nb-data-table__select-cell input[type="checkbox"]',
      )[0]
      await rowCheckbox.setValue(true)
      expect(wrapper.emitted('update:selected')![0]).toEqual([[1]])
    })

    it('select-all adds every page row key', async () => {
      const wrapper = mountTable({ selectable: 'multiple', selected: [] })
      const selectAll = wrapper.find(
        'thead .nb-data-table__select-cell input[type="checkbox"]',
      )
      await selectAll.setValue(true)
      expect(wrapper.emitted('update:selected')![0]).toEqual([[1, 2, 3]])
    })

    it('renders radios for single selection and replaces the selection', async () => {
      const wrapper = mountTable({ selectable: 'single', selected: [] })
      const radios = wrapper.findAll('input[type="radio"]')
      expect(radios).toHaveLength(3)
      await radios[1].trigger('change')
      expect(wrapper.emitted('update:selected')![0]).toEqual([[2]])
    })

    it('marks selected rows with aria-selected and a class', () => {
      const wrapper = mountTable({ selectable: 'multiple', selected: [2] })
      const selectedRow = wrapper.findAll('tbody tr')[1]
      expect(selectedRow.classes()).toContain('nb-data-table__row--selected')
      expect(selectedRow.attributes('aria-selected')).toBe('true')
    })
  })

  describe('states', () => {
    it('renders skeleton rows while loading', () => {
      const wrapper = mountTable({ loading: true, skeletonRows: 4 })
      expect(wrapper.findAll('.nb-data-table__row--skeleton')).toHaveLength(4)
      expect(wrapper.find('table').attributes('aria-busy')).toBe('true')
    })

    it('renders an error state spanning all columns', () => {
      const wrapper = mountTable({ error: 'Boom' })
      const cell = wrapper.find('.nb-data-table__state--error')
      expect(cell.text()).toContain('Boom')
      expect(cell.attributes('colspan')).toBe('2')
    })

    it('renders the empty state when there are no rows', () => {
      const wrapper = mountTable({ rows: [], emptyMessage: 'Nothing here' })
      expect(wrapper.find('.nb-data-table__state--empty').text()).toContain(
        'Nothing here',
      )
    })

    it('prefers the error state over the empty state', () => {
      const wrapper = mountTable({ rows: [], error: 'Failed' })
      expect(wrapper.find('.nb-data-table__state--error').exists()).toBe(true)
      expect(wrapper.find('.nb-data-table__state--empty').exists()).toBe(false)
    })
  })

  describe('custom cells', () => {
    it('renders a column render function', () => {
      const wrapper = mountTable({
        columns: [
          {
            key: 'name',
            header: 'Name',
            render: (row: Row) => h('strong', { class: 'boom' }, row.name),
          },
        ],
      })
      expect(wrapper.find('td .boom').text()).toBe('Ada')
    })

    it('renders a per-column cell slot, overriding render', () => {
      const wrapper = mountTable(
        {},
        {
          slots: {
            'cell-name': ({ row }: { row: Row }) =>
              h('span', { class: 'slotted' }, row.role),
          },
        },
      )
      expect(wrapper.find('td .slotted').text()).toBe('Engineer')
    })
  })

  describe('density', () => {
    it('applies the size modifier class', () => {
      expect(mountTable({ size: 'sm' }).classes()).toContain(
        'nb-data-table--sm',
      )
      expect(mountTable({ size: 'lg' }).classes()).toContain(
        'nb-data-table--lg',
      )
    })
  })

  it('emits row-click with the row and index', async () => {
    const wrapper = mountTable()
    await wrapper.findAll('tbody tr')[2].trigger('click')
    expect(wrapper.emitted('row-click')![0]).toEqual([rows[2], 2])
  })

  it('renders a row-actions column when the slot is provided', () => {
    const wrapper = mountTable(
      {},
      { slots: { 'row-actions': () => h('button', { class: 'act' }, '⋯') } },
    )
    expect(wrapper.findAll('.act')).toHaveLength(3)
    expect(wrapper.find('.nb-data-table__actions-cell').exists()).toBe(true)
  })

  it('renders batch actions when rows are selected', () => {
    const wrapper = mountTable(
      { selectable: 'multiple', selected: [1, 2] },
      {
        slots: {
          'batch-actions': () => h('button', { class: 'del' }, 'Delete'),
        },
      },
    )
    expect(wrapper.find('.nb-data-table__batch').text()).toContain('2 selected')
    expect(wrapper.find('.del').exists()).toBe(true)
  })
})
