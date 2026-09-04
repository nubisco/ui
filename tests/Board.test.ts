import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Board from '../src/components/Board.vue'
import type { IBoardColumn, IBoardItem } from '../src/components/Board.d'

const columns = (): IBoardColumn[] => [
  { id: 'todo', label: 'To Do' },
  { id: 'doing', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

const items = (): IBoardItem[] => [
  { id: 'a', columnId: 'todo', title: 'Alpha' },
  { id: 'b', columnId: 'todo', title: 'Beta' },
  { id: 'c', columnId: 'todo', title: 'Gamma' },
  { id: 'd', columnId: 'doing', title: 'Delta' },
]

const mountBoard = (props = {}, options = {}) =>
  mount(Board, {
    props: { columns: columns(), items: items(), ...props },
    slots: { card: '<i>{{ params.item.title }}</i>' },
    ...options,
  })

const cards = (w: ReturnType<typeof mountBoard>) => w.findAll('.nb-board__card')

const card = (w: ReturnType<typeof mountBoard>, id: string) =>
  w.find(`[data-item-id="${id}"]`)

const lastMove = (w: ReturnType<typeof mountBoard>) =>
  w.emitted('move')?.at(-1)?.[0]

describe('NbBoard rendering', () => {
  it('renders an item count in the default column header', () => {
    const w = mountBoard()
    const counts = w.findAll('.nb-board__col-count')
    expect(counts.map((c) => c.text())).toEqual(['3', '1', '0'])
  })

  it('replaces the default header with the column-header slot', () => {
    const w = mountBoard(
      {},
      {
        slots: {
          card: '<i>{{ params.item.title }}</i>',
          'column-header':
            '<b class="hdr">{{ params.column.label }} ({{ params.count }})</b>',
        },
      },
    )
    expect(w.find('.nb-board__col-title').exists()).toBe(false)
    expect(w.find('.nb-board__col-count').exists()).toBe(false)
    expect(w.findAll('.hdr')[0].text()).toBe('To Do (3)')
  })

  it('keeps the color accent when the header slot is used', () => {
    const w = mountBoard(
      { columns: [{ id: 'todo', label: 'To Do', color: 'rgb(1, 2, 3)' }] },
      {
        slots: {
          card: '<i />',
          'column-header': '<b class="hdr">{{ params.column.label }}</b>',
        },
      },
    )
    const header = w.find('.nb-board__col-header')
    expect(header.attributes('style')).toContain('border-top-color')
  })

  it('renders the column-footer slot at the bottom of each cell', () => {
    const w = mountBoard(
      {},
      {
        slots: {
          card: '<i />',
          'column-footer':
            '<button class="add">Add to {{ params.column.id }}</button>',
        },
      },
    )
    const footers = w.findAll('.nb-board__cell-footer .add')
    expect(footers).toHaveLength(3)
    expect(footers[1].text()).toBe('Add to doing')
  })

  it('renders no footer wrapper when the slot is not provided', () => {
    const w = mountBoard()
    expect(w.find('.nb-board__cell-footer').exists()).toBe(false)
  })

  it('passes the lane to the column-footer slot when lanes are used', () => {
    const w = mountBoard(
      {
        lanes: [{ id: 'l1', label: 'Lane One' }],
        items: [{ id: 'a', columnId: 'todo', laneId: 'l1', title: 'Alpha' }],
      },
      {
        slots: {
          card: '<i />',
          'column-footer': '<em class="add">{{ params.lane.label }}</em>',
        },
      },
    )
    expect(w.findAll('.add')[0].text()).toBe('Lane One')
  })
})

describe('NbBoard accessibility', () => {
  it('makes each card a focusable listitem with a positional name', () => {
    const w = mountBoard()
    const first = cards(w)[0]
    expect(first.attributes('tabindex')).toBe('0')
    expect(first.attributes('role')).toBe('listitem')
    expect(first.attributes('aria-label')).toBe('Alpha, 1 of 3 in To Do')
  })

  it('points each card at the pick-up instructions', () => {
    const w = mountBoard()
    const hintId = cards(w)[0].attributes('aria-describedby')
    expect(w.find(`[id="${hintId}"]`).text()).toContain(
      'Space or Enter to pick up',
    )
  })

  it('announces pick-up through the live region', async () => {
    const w = mountBoard()
    await card(w, 'a').trigger('keydown', { key: ' ' })
    expect(w.find('[aria-live]').text()).toContain('Alpha picked up')
  })
})

describe('NbBoard keyboard drag', () => {
  it('picks up, moves down and drops within the same column', async () => {
    const w = mountBoard()
    const a = card(w, 'a')
    await a.trigger('keydown', { key: ' ' })
    await a.trigger('keydown', { key: 'ArrowDown' })
    await a.trigger('keydown', { key: 'Enter' })
    expect(lastMove(w)).toEqual({
      itemId: 'a',
      fromColumnId: 'todo',
      toColumnId: 'todo',
      fromLaneId: null,
      toLaneId: null,
      toIndex: 1,
      beforeItemId: 'b',
      afterItemId: 'c',
    })
  })

  it('moves the ghost into the next column with ArrowRight', async () => {
    const w = mountBoard()
    const a = card(w, 'a')
    await a.trigger('keydown', { key: 'Enter' })
    await a.trigger('keydown', { key: 'ArrowRight' })
    await a.trigger('keydown', { key: ' ' })
    expect(lastMove(w)).toEqual({
      itemId: 'a',
      fromColumnId: 'todo',
      toColumnId: 'doing',
      fromLaneId: null,
      toLaneId: null,
      toIndex: 0,
      beforeItemId: null,
      afterItemId: 'd',
    })
  })

  it('emits nothing when dropped back where it started', async () => {
    const w = mountBoard()
    const a = card(w, 'a')
    await a.trigger('keydown', { key: ' ' })
    await a.trigger('keydown', { key: ' ' })
    expect(w.emitted('move')).toBeUndefined()
  })

  it('cancels a pick-up with Escape', async () => {
    const w = mountBoard()
    const a = card(w, 'a')
    await a.trigger('keydown', { key: ' ' })
    await a.trigger('keydown', { key: 'ArrowDown' })
    await a.trigger('keydown', { key: 'Escape' })
    expect(w.emitted('move')).toBeUndefined()
    expect(w.find('[aria-live]').text()).toBe('Move cancelled')
  })

  it('does not move the ghost past the ends of the board', async () => {
    const w = mountBoard()
    const a = card(w, 'a')
    await a.trigger('keydown', { key: ' ' })
    await a.trigger('keydown', { key: 'ArrowUp' })
    await a.trigger('keydown', { key: 'ArrowLeft' })
    await a.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('move')).toBeUndefined()
  })

  it('browses without picking up when arrows are pressed on a resting card', async () => {
    const w = mountBoard({}, { attachTo: document.body })
    await card(w, 'a').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(w.emitted('move')).toBeUndefined()
    expect(document.activeElement).toBe(card(w, 'b').element)
    w.unmount()
  })

  it('carries the lane through a keyboard move', async () => {
    const w = mountBoard({
      lanes: [
        { id: 'front', label: 'Frontend' },
        { id: 'back', label: 'Backend' },
      ],
      items: [
        { id: 'a', columnId: 'todo', laneId: 'front', title: 'Alpha' },
        { id: 'b', columnId: 'todo', laneId: 'back', title: 'Beta' },
      ],
    })
    const a = card(w, 'a')
    await a.trigger('keydown', { key: ' ' })
    // Past the end of its own (otherwise empty) cell: continues into the next
    // lane's cell in the same column.
    await a.trigger('keydown', { key: 'ArrowDown' })
    await a.trigger('keydown', { key: ' ' })
    expect(lastMove(w)).toEqual({
      itemId: 'a',
      fromColumnId: 'todo',
      toColumnId: 'todo',
      fromLaneId: 'front',
      toLaneId: 'back',
      toIndex: 0,
      beforeItemId: null,
      afterItemId: 'b',
    })
  })
})

describe('NbBoard pointer drag', () => {
  const cells = (w: ReturnType<typeof mountBoard>) =>
    w.findAll('.nb-board__cell')

  it('reports the target index and neighbours on a cross-column drop', async () => {
    const w = mountBoard()
    await card(w, 'd').trigger('dragstart')
    await cells(w)[0].trigger('dragover')
    await cells(w)[0].trigger('drop')
    expect(lastMove(w)).toEqual({
      itemId: 'd',
      fromColumnId: 'doing',
      toColumnId: 'todo',
      fromLaneId: null,
      toLaneId: null,
      toIndex: 3,
      beforeItemId: 'c',
      afterItemId: null,
    })
  })

  it('fires for a reorder within the same column', async () => {
    const w = mountBoard()
    await card(w, 'a').trigger('dragstart')
    // jsdom rects are zero-sized, so a dragover at clientY 0 lands in the
    // lower half of Gamma: insertion after it.
    await card(w, 'c').trigger('dragover', { clientY: 0 })
    await cells(w)[0].trigger('drop')
    expect(lastMove(w)).toEqual({
      itemId: 'a',
      fromColumnId: 'todo',
      toColumnId: 'todo',
      fromLaneId: null,
      toLaneId: null,
      toIndex: 2,
      beforeItemId: 'c',
      afterItemId: null,
    })
  })

  it('still emits nothing when a card is dropped where it already sits', async () => {
    const w = mountBoard()
    await card(w, 'c').trigger('dragstart')
    await cells(w)[0].trigger('dragover')
    await cells(w)[0].trigger('drop')
    expect(w.emitted('move')).toBeUndefined()
  })
})

describe('NbBoard column reorder', () => {
  const headers = (w: ReturnType<typeof mountBoard>) =>
    w.findAll('.nb-board__col-header')

  it('is off by default: headers are not draggable', () => {
    const w = mountBoard()
    expect(headers(w)[0].attributes('draggable')).toBeUndefined()
  })

  it('emits column-move with the destination index', async () => {
    const w = mountBoard({ reorderableColumns: true })
    expect(headers(w)[0].attributes('draggable')).toBe('true')
    await headers(w)[0].trigger('dragstart')
    // Zero-sized rects put clientX 0 in the right half: insertion after Done.
    await headers(w)[2].trigger('dragover', { clientX: 0 })
    await headers(w)[2].trigger('drop')
    expect(w.emitted('column-move')?.at(-1)?.[0]).toEqual({
      columnId: 'todo',
      toIndex: 2,
    })
  })

  it('emits nothing when the column lands where it started', async () => {
    const w = mountBoard({ reorderableColumns: true })
    await headers(w)[1].trigger('dragstart')
    await headers(w)[1].trigger('drop')
    expect(w.emitted('column-move')).toBeUndefined()
  })
})
