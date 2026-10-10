import { describe, it, expect, afterEach } from 'vitest'
import { stubPhone, unstubPhone } from './__mocks__/phoneLayout'
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

/**
 * Dropping a card ONTO another, when `nestable`.
 *
 * Off by default, and off has to be exactly what every board did before this
 * existed: twelve products consume this component and none of them asked for
 * a second meaning for a drop.
 *
 * jsdom gives every element a zero-sized rect, so the zone arithmetic cannot
 * run on its own here. Each of these stubs the target card's rect, which is
 * also the only way to aim at a specific third of it.
 */
describe('NbBoard nesting', () => {
  const cells = (w: ReturnType<typeof mountBoard>) =>
    w.findAll('.nb-board__cell')

  /** Aim a pointer at `fraction` of the way down a card of `height` px. */
  const dragOverCard = async (
    w: ReturnType<typeof mountBoard>,
    id: string,
    fraction: number,
    height = 60,
  ) => {
    const target = card(w, id)
    ;(target.element as HTMLElement).getBoundingClientRect = () =>
      ({
        top: 0,
        height,
        bottom: height,
        left: 0,
        right: 100,
        width: 100,
      }) as DOMRect
    await target.trigger('dragover', { clientY: height * fraction })
  }

  const nestable = () => mountBoard({ nestable: true })

  it('says nothing about nesting unless it is asked to', async () => {
    const w = mountBoard()
    await card(w, 'a').trigger('dragstart')
    await dragOverCard(w, 'c', 0.5)

    // The middle of a card is still an insertion point on an ordinary board.
    expect(card(w, 'c').classes()).not.toContain('nb-board__card--drop-into')
    await cells(w)[0].trigger('drop')
    expect(w.emitted('nest')).toBeUndefined()
    expect(w.emitted('move')).toHaveLength(1)
  })

  it('nests from the middle of a card', async () => {
    const w = nestable()
    await card(w, 'a').trigger('dragstart')
    await dragOverCard(w, 'c', 0.5)

    expect(card(w, 'c').classes()).toContain('nb-board__card--drop-into')
    await cells(w)[0].trigger('drop')

    expect(w.emitted('nest')?.at(-1)?.[0]).toMatchObject({
      itemId: 'a',
      ontoItemId: 'c',
      fromColumnId: 'todo',
    })
  })

  it('does not also move the card it nested', async () => {
    const w = nestable()
    await card(w, 'a').trigger('dragstart')
    await dragOverCard(w, 'c', 0.5)
    await cells(w)[0].trigger('drop')

    // A card dropped onto another has not been given a position. Emitting
    // both would have the host reorder it as well as reparent it.
    expect(w.emitted('move')).toBeUndefined()
  })

  it('still inserts from the top and bottom quarters', async () => {
    const w = nestable()
    await card(w, 'a').trigger('dragstart')
    await dragOverCard(w, 'c', 0.1)
    expect(card(w, 'c').classes()).not.toContain('nb-board__card--drop-into')

    await dragOverCard(w, 'c', 0.9)
    expect(card(w, 'c').classes()).not.toContain('nb-board__card--drop-into')

    await cells(w)[0].trigger('drop')
    expect(w.emitted('nest')).toBeUndefined()
    expect(w.emitted('move')).toHaveLength(1)
  })

  it('refuses to nest a card into itself', async () => {
    const w = nestable()
    await card(w, 'a').trigger('dragstart')
    await dragOverCard(w, 'a', 0.5)

    expect(card(w, 'a').classes()).not.toContain('nb-board__card--drop-into')
    await cells(w)[0].trigger('drop')
    expect(w.emitted('nest')).toBeUndefined()
  })

  it('goes back to two zones on a card too small to hold three', async () => {
    const w = nestable()
    await card(w, 'a').trigger('dragstart')
    // Below the minimum a middle band would be a few pixels tall, which is a
    // target nobody can hit on purpose and everybody hits by accident.
    await dragOverCard(w, 'c', 0.5, 20)

    expect(card(w, 'c').classes()).not.toContain('nb-board__card--drop-into')
    await cells(w)[0].trigger('drop')
    expect(w.emitted('nest')).toBeUndefined()
  })

  it('shows one answer at a time, never a line and a ring together', async () => {
    const w = nestable()
    await card(w, 'a').trigger('dragstart')
    await dragOverCard(w, 'c', 0.1)
    expect(card(w, 'c').classes()).toContain('nb-board__card--drop-before')

    await dragOverCard(w, 'c', 0.5)
    const classes = card(w, 'c').classes()
    expect(classes).toContain('nb-board__card--drop-into')
    expect(classes).not.toContain('nb-board__card--drop-before')
    expect(classes).not.toContain('nb-board__card--drop-after')
  })

  it('nests with the keyboard, and only with Shift', async () => {
    const w = nestable()
    await card(w, 'a').trigger('keydown', { key: ' ' })
    await card(w, 'a').trigger('keydown', { key: 'ArrowDown' })

    // Without Shift the ghost drops into the gap, as it always has.
    await card(w, 'a').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('nest')).toBeUndefined()
    expect(w.emitted('move')).toHaveLength(1)
  })

  it('drops onto the card below the ghost when Shift is held', async () => {
    const w = nestable()
    await card(w, 'a').trigger('keydown', { key: ' ' })
    await card(w, 'a').trigger('keydown', { key: 'Enter', shiftKey: true })

    expect(w.emitted('nest')?.at(-1)?.[0]).toMatchObject({
      itemId: 'a',
      ontoItemId: 'b',
    })
    expect(w.emitted('move')).toBeUndefined()
  })

  it('ignores Shift on a board that is not nestable', async () => {
    const w = mountBoard()
    await card(w, 'a').trigger('keydown', { key: ' ' })
    // Moved first, because dropping a card back where it started emits
    // nothing at all and would prove only that.
    await card(w, 'a').trigger('keydown', { key: 'ArrowDown' })
    await card(w, 'a').trigger('keydown', { key: 'Enter', shiftKey: true })

    expect(w.emitted('nest')).toBeUndefined()
    expect(w.emitted('move')).toHaveLength(1)
  })
})

describe('NbBoard selection', () => {
  const cells = (w: ReturnType<typeof mountBoard>) =>
    w.findAll('.nb-board__cell')
  const selection = (w: ReturnType<typeof mountBoard>) =>
    (w.emitted('update:selected')?.at(-1)?.[0] ?? []) as string[]

  it('is off by default: a modified click selects nothing', async () => {
    const w = mountBoard()
    await card(w, 'a').trigger('click', { metaKey: true })
    expect(w.emitted('update:selected')).toBeUndefined()
    expect(card(w, 'a').attributes('aria-selected')).toBeUndefined()
  })

  it('toggles with Cmd or Ctrl-click, without opening the card', async () => {
    const w = mountBoard({ selectable: true, selected: [] })
    let opened = 0
    card(w, 'a').element.firstElementChild?.addEventListener(
      'click',
      () => opened++,
    )
    await card(w, 'a').trigger('click', { metaKey: true })
    expect(selection(w)).toEqual(['a'])
    await w.setProps({ selected: ['a'] })
    expect(card(w, 'a').classes()).toContain('nb-board__card--selected')
    expect(card(w, 'a').attributes('aria-selected')).toBe('true')
    await card(w, 'a').trigger('click', { ctrlKey: true })
    expect(selection(w)).toEqual([])
    expect(opened).toBe(0)
  })

  it('takes a run within a cell with Shift-click', async () => {
    const w = mountBoard({ selectable: true, selected: [] })
    await card(w, 'a').trigger('click', { metaKey: true })
    await w.setProps({ selected: ['a'] })
    await card(w, 'c').trigger('click', { shiftKey: true })
    expect(selection(w)).toEqual(['a', 'b', 'c'])
  })

  it('selects the focused card with X and clears with Escape', async () => {
    const w = mountBoard({ selectable: true, selected: [] })
    await card(w, 'b').trigger('keydown', { key: 'x' })
    expect(selection(w)).toEqual(['b'])
    await w.setProps({ selected: ['b'] })
    await card(w, 'b').trigger('keydown', { key: 'Escape' })
    expect(selection(w)).toEqual([])
  })

  it('drags the whole selection, in board order, as one move-many', async () => {
    const w = mountBoard({ selectable: true, selected: ['d', 'a'] })
    await card(w, 'a').trigger('dragstart')
    expect(card(w, 'd').classes()).toContain('nb-board__card--carried')
    await cells(w)[2].trigger('dragover')
    await cells(w)[2].trigger('drop')
    expect(w.emitted('move')).toBeUndefined()
    expect(w.emitted('move-many')?.at(-1)?.[0]).toEqual({
      itemIds: ['a', 'd'],
      toColumnId: 'done',
      beforeItemId: null,
      afterItemId: null,
    })
  })

  it('skips moving cards when naming the neighbours', async () => {
    const w = mountBoard({ selectable: true, selected: ['a', 'b'] })
    await card(w, 'a').trigger('dragstart')
    await card(w, 'c').trigger('dragover', { clientY: 0 })
    await cells(w)[0].trigger('drop')
    expect(w.emitted('move-many')?.at(-1)?.[0]).toMatchObject({
      itemIds: ['a', 'b'],
      toColumnId: 'todo',
      beforeItemId: 'c',
      afterItemId: null,
    })
  })

  it('moves the selection when a selected card is picked up by keyboard', async () => {
    const w = mountBoard({ selectable: true, selected: ['a', 'b'] })
    await card(w, 'a').trigger('keydown', { key: ' ' })
    await card(w, 'a').trigger('keydown', { key: 'ArrowRight' })
    await card(w, 'a').trigger('keydown', { key: ' ' })
    expect(w.emitted('move-many')?.at(-1)?.[0]).toMatchObject({
      itemIds: ['a', 'b'],
      toColumnId: 'doing',
    })
  })

  it('drags an unselected card on its own', async () => {
    const w = mountBoard({ selectable: true, selected: ['a', 'b'] })
    await card(w, 'd').trigger('dragstart')
    await cells(w)[0].trigger('dragover')
    await cells(w)[0].trigger('drop')
    expect(w.emitted('move-many')).toBeUndefined()
    expect(lastMove(w)).toMatchObject({ itemId: 'd', toColumnId: 'todo' })
  })

  it('shows the batch bar with the selection, when given actions', async () => {
    const w = mountBoard(
      { selectable: true, selected: ['a', 'b'] },
      {
        slots: {
          card: '<i>{{ params.item.title }}</i>',
          'batch-actions':
            '<button class="act">Archive {{ params.selected.length }}</button>',
        },
      },
    )
    const bar = w.find('.nb-board__batch')
    expect(bar.text()).toContain('2 selected')
    expect(bar.find('.act').text()).toBe('Archive 2')
    await bar.findAll('button').at(-1)!.trigger('click')
    expect(selection(w)).toEqual([])
  })
})

describe('NbBoard select mode', () => {
  const selection = (w: ReturnType<typeof mountBoard>) =>
    (w.emitted('update:selected')?.at(-1)?.[0] ?? []) as string[]

  it('selects on a plain tap instead of opening the card', async () => {
    const w = mountBoard({ selectable: true, selected: [], selectMode: true })
    let opened = 0
    card(w, 'a').element.firstElementChild?.addEventListener(
      'click',
      () => opened++,
    )
    await card(w, 'a').find('i').trigger('click')
    expect(selection(w)).toEqual(['a'])
    await w.setProps({ selected: ['a'] })
    await card(w, 'a').find('i').trigger('click')
    expect(selection(w)).toEqual([])
    expect(opened).toBe(0)
  })

  it('does nothing without selectable, and a plain tap still opens the card', async () => {
    const w = mountBoard({ selectMode: true })
    let opened = 0
    card(w, 'a').element.firstElementChild?.addEventListener(
      'click',
      () => opened++,
    )
    await card(w, 'a').find('i').trigger('click')
    expect(w.emitted('update:selected')).toBeUndefined()
    expect(opened).toBe(1)
    expect(w.classes()).not.toContain('nb-board--select-mode')
  })

  it('leaves select mode when the selection is cleared', async () => {
    const w = mountBoard(
      { selectable: true, selected: ['a'], selectMode: true },
      {
        slots: {
          card: '<i>{{ params.item.title }}</i>',
          'batch-actions': '<button class="act">Archive</button>',
        },
      },
    )
    expect(w.classes()).toContain('nb-board--select-mode')
    await w.find('.nb-board__batch-cancel').trigger('click')
    expect(selection(w)).toEqual([])
    expect(w.emitted('update:selectMode')?.at(-1)).toEqual([false])
  })

  it('does not emit update:selectMode when select mode is off', async () => {
    const w = mountBoard({ selectable: true, selected: ['b'] })
    await card(w, 'b').trigger('keydown', { key: 'Escape' })
    expect(selection(w)).toEqual([])
    expect(w.emitted('update:selectMode')).toBeUndefined()
  })
})

describe('NbBoard on a phone', () => {
  afterEach(() => unstubPhone())

  const lanes = () => [
    { id: 'l1', label: 'Lane one' },
    { id: 'l2', label: 'Lane two' },
  ]

  it('adds none of the phone markup when not on a phone', () => {
    const w = mountBoard(
      { selectable: true, selected: ['a'] },
      {
        slots: {
          card: '<i>{{ params.item.title }}</i>',
          'batch-actions': '<button class="act">Archive</button>',
        },
      },
    )
    expect(w.attributes('class')).toBe('nb-board nb-layer-1')
    expect(w.find('.nb-board__grid').attributes('style')).not.toContain(
      '--nb-board-cols',
    )
    // The bar stays inside the board, where it has always been.
    expect(w.find('.nb-board__batch').exists()).toBe(true)
  })

  it('exposes the column count to the phone track', () => {
    stubPhone()
    const w = mountBoard()
    expect(w.find('.nb-board__grid').attributes('style')).toContain(
      '--nb-board-cols: 3',
    )
  })

  it('marks a flat board, and not a swimlane one', () => {
    stubPhone()
    expect(mountBoard().classes()).toContain('nb-board--flat')
    const laned = mountBoard({
      lanes: lanes(),
      items: items().map((i) => ({ ...i, laneId: 'l1' })),
    })
    expect(laned.classes()).not.toContain('nb-board--flat')
  })

  it('moves the batch bar to the body and tells the actions it is a phone', async () => {
    stubPhone()
    const w = mount(Board, {
      props: {
        columns: columns(),
        items: items(),
        selectable: true,
        selected: ['a'],
      },
      slots: {
        card: '<i>{{ params.item.title }}</i>',
        'batch-actions':
          '<button class="act">{{ params.phone ? "phone" : "desk" }}</button>',
      },
      attachTo: document.body,
    })
    await nextTick()
    expect(w.find('.nb-board__batch').exists()).toBe(false)
    const bar = document.body.querySelector('.nb-board__batch')
    expect(bar).not.toBeNull()
    expect(bar!.parentElement).toBe(document.body)
    expect(bar!.querySelector('.act')!.textContent).toBe('phone')
    expect(w.classes()).toContain('nb-board--batching')
    // The cancel still works from its new home.
    ;(bar!.querySelector('.nb-board__batch-cancel') as HTMLElement).click()
    expect(w.emitted('update:selected')?.at(-1)).toEqual([[]])
    w.unmount()
    expect(document.body.querySelector('.nb-board__batch')).toBeNull()
  })

  it('gives the batch actions phone: false off a phone', () => {
    const w = mountBoard(
      { selectable: true, selected: ['a'] },
      {
        slots: {
          card: '<i>{{ params.item.title }}</i>',
          'batch-actions':
            '<button class="act">{{ params.phone ? "phone" : "desk" }}</button>',
        },
      },
    )
    expect(w.find('.act').text()).toBe('desk')
  })
})
