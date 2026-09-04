---
layout: nubisco
title: Board
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbBoard` is a kanban-style board with columns, optional swim lanes, and drag-and-drop support. Card rendering is fully customizable via the `card` slot.

## Basic Usage

<preview>
  <NbBoard :columns="columns" :items="items" @move="onMove">
    <template #card="{ item }">
      <strong>{{ item.title }}</strong>
    </template>
  </NbBoard>
</preview>

```vue
<template>
  <NbBoard :columns="columns" :items="items" @move="onMove">
    <template #card="{ item }">
      <strong>{{ item.title }}</strong>
    </template>
  </NbBoard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { IBoardColumn, IBoardItem, IBoardMoveEvent } from '@nubisco/ui'

const columns: IBoardColumn[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'doing', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

const items = ref<IBoardItem[]>([
  { id: '1', columnId: 'todo', title: 'Design mockups' },
  { id: '2', columnId: 'doing', title: 'Build API' },
  { id: '3', columnId: 'done', title: 'Write specs' },
])

function onMove(e: IBoardMoveEvent) {
  const moved = items.value.find((i) => i.id === e.itemId)
  if (!moved) return
  moved.columnId = e.toColumnId
  if (e.toLaneId !== undefined) moved.laneId = e.toLaneId
  // Reinsert at the reported position so same-column reorders stick.
  const rest = items.value.filter((i) => i.id !== moved.id)
  const cell = rest.filter(
    (i) =>
      i.columnId === e.toColumnId &&
      (i.laneId ?? null) === (e.toLaneId ?? null),
  )
  const anchor = cell[e.toIndex]
  const at = anchor ? rest.indexOf(anchor) : rest.length
  rest.splice(at, 0, moved)
  items.value = rest
}
</script>
```

## Column Colors

Each column can have an accent `color` that renders as a top border on the column header.

<preview>
  <NbBoard :columns="coloredColumns" :items="items" @move="onMove">
    <template #card="{ item }">
      <strong>{{ item.title }}</strong>
    </template>
  </NbBoard>
</preview>

```vue
<script setup>
const columns = [
  { id: 'todo', label: 'To Do', color: '#6366f1' },
  { id: 'doing', label: 'In Progress', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#22c55e' },
]
</script>
```

## Custom Column Header

The default header shows the column label and a subtle item count. The `column-header` slot replaces both while keeping the color accent, for headers that carry badges or a column menu.

```vue
<NbBoard :columns="columns" :items="items" @move="onMove">
  <template #column-header="{ column, count }">
    <span>{{ column.label }}</span>
    <NbBadge>{{ count }}</NbBadge>
  </template>
  <template #card="{ item }">
    <strong>{{ item.title }}</strong>
  </template>
</NbBoard>
```

## Add-item Composer

The `column-footer` slot renders at the bottom of every cell, which is where an add-item composer belongs. With lanes, the slot renders once per lane-and-column cell and receives the lane.

```vue
<NbBoard :columns="columns" :items="items" @move="onMove">
  <template #card="{ item }">
    <strong>{{ item.title }}</strong>
  </template>
  <template #column-footer="{ column }">
    <NbButton size="sm" variant="ghost" @click="startComposer(column.id)">
      Add item
    </NbButton>
  </template>
</NbBoard>
```

## Swim Lanes

Pass a `lanes` array to group items into horizontal swim lanes. Each lane is collapsible. Items are matched to lanes via `laneId`.

<preview>
  <NbBoard :columns="columns" :items="laneItems" :lanes="lanes" @move="onMoveLane">
    <template #card="{ item }">
      <strong>{{ item.title }}</strong>
    </template>
  </NbBoard>
</preview>

```vue
<template>
  <NbBoard :columns="columns" :items="items" :lanes="lanes" @move="onMove">
    <template #card="{ item }">
      <strong>{{ item.title }}</strong>
    </template>
  </NbBoard>
</template>

<script setup lang="ts">
import type { IBoardLane } from '@nubisco/ui'

const lanes: IBoardLane[] = [
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
]

const items = ref([
  { id: '1', columnId: 'todo', laneId: 'frontend', title: 'Build form' },
  { id: '2', columnId: 'doing', laneId: 'backend', title: 'Auth endpoint' },
])
</script>
```

## Custom Lane Header

Use the `lane-header` slot to customize lane header rendering.

```vue
<NbBoard :columns="columns" :items="items" :lanes="lanes" @move="onMove">
  <template #lane-header="{ lane }">
    <NbIcon :name="lane.icon" />
    <span>{{ lane.label }}</span>
  </template>
  <template #card="{ item }">
    <strong>{{ item.title }}</strong>
  </template>
</NbBoard>
```

## Drag and Drop

Drag and drop is built in. When a card is dropped somewhere new, in another cell or at a different position in its own column, the `move` event fires with the source and destination coordinates, the target index, and the ids of the neighbouring items. The component does not mutate `items` directly; update your data in the event handler.

`toIndex` counts positions in the destination cell with the moved item excluded, so it is the index the item should occupy after the move. `beforeItemId` and `afterItemId` name the items that end up directly above and below it (`null` at the edges), which is exactly what a fractional-position scheme needs.

During a drag operation:

- A drop line marks the position the card would land in, and the target cell highlights with a primary-tinted background and dashed outline.
- Cards show a grab cursor and lift with a subtle shadow on hover.

## Keyboard

Every card is focusable and can be moved without a pointer, the same pick-up-move-drop model as `NbReorderList`.

| Key                                   | Does                                                                                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| <kbd>Tab</kbd>                        | Moves to the next card                                                                                                                    |
| <kbd>Space</kbd> / <kbd>Enter</kbd>   | Picks the card up, or drops it (which emits `move`)                                                                                       |
| <kbd>&uarr;</kbd> / <kbd>&darr;</kbd> | Moves the held card within its cell, or moves focus when nothing is held; past the edge of a cell it continues into the neighbouring lane |
| <kbd>&larr;</kbd> / <kbd>&rarr;</kbd> | Moves the held card to the adjacent column, or moves focus when nothing is held                                                           |
| <kbd>Esc</kbd>                        | Cancels the pick-up                                                                                                                       |

Arrow keys **browse** until a card is picked up, and only then **move** it. A held card does not travel until it is dropped: the board shows a ghost drop line at the target position and emits the same `move` event a pointer drop would.

Every pick-up, move and drop is announced through a live region, because a keyboard user does not see the card travel.

## Reordering Columns

Set `reorderableColumns` and column headers become draggable. Dropping a header on another column emits `column-move` with the column's destination index; as with cards, the board does not mutate `columns` itself.

```vue
<template>
  <NbBoard
    :columns="columns"
    :items="items"
    reorderable-columns
    @move="onMove"
    @column-move="onColumnMove"
  >
    <template #card="{ item }">
      <strong>{{ item.title }}</strong>
    </template>
  </NbBoard>
</template>

<script setup lang="ts">
import type { IBoardColumnMoveEvent } from '@nubisco/ui'

function onColumnMove(e: IBoardColumnMoveEvent) {
  const from = columns.value.findIndex((c) => c.id === e.columnId)
  const [col] = columns.value.splice(from, 1)
  columns.value.splice(e.toIndex, 0, col)
}
</script>
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop                 | Type             | Default     | Description                                        |
| -------------------- | ---------------- | ----------- | -------------------------------------------------- |
| `columns`            | `IBoardColumn[]` | required    | Column definitions (one per status/stage)          |
| `items`              | `IBoardItem[]`   | required    | Items to display on the board                      |
| `lanes`              | `IBoardLane[]`   | `undefined` | Optional swim lanes for horizontal grouping        |
| `reorderableColumns` | `boolean`        | `false`     | Make column headers draggable; emits `column-move` |

## Interfaces

```typescript
interface IBoardColumn {
  id: string
  label: string
  color?: string
}

interface IBoardLane {
  id: string | null
  label: string
}

interface IBoardItem {
  id: string
  columnId: string
  laneId?: string | null
  [key: string]: unknown // arbitrary payload for the card slot
}

interface IBoardMoveEvent {
  itemId: string
  fromColumnId: string
  toColumnId: string
  fromLaneId?: string | null
  toLaneId?: string | null
  toIndex: number // index in the destination cell, moved item excluded
  beforeItemId: string | null // item ending up directly above, null at the top
  afterItemId: string | null // item ending up directly below, null at the bottom
}

interface IBoardColumnMoveEvent {
  columnId: string
  toIndex: number // index in `columns` after the move
}
```

## Events

| Event         | Payload                 | Description                                                                                           |
| ------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `move`        | `IBoardMoveEvent`       | Emitted when a card is dropped into a different cell or at a different position within its own column |
| `column-move` | `IBoardColumnMoveEvent` | Emitted when a column header is dropped on a new position (requires `reorderableColumns`)             |

## Slots

| Slot            | Scope                                                           | Description                                                                  |
| --------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `card`          | `{ item: IBoardItem, column: IBoardColumn, lane?: IBoardLane }` | Content of each card                                                         |
| `column-header` | `{ column: IBoardColumn, count: number }`                       | Replaces the default column header (label and count); the color accent stays |
| `column-footer` | `{ column: IBoardColumn, lane?: IBoardLane }`                   | Rendered at the bottom of each cell, e.g. an add-item composer               |
| `lane-header`   | `{ lane: IBoardLane }`                                          | Custom lane header content                                                   |

## Keyboard

| Key                                   | Does                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| <kbd>Tab</kbd>                        | Moves to the next card                                                                                                |
| <kbd>Space</kbd> / <kbd>Enter</kbd>   | Picks the card up, or drops it (emits `move`)                                                                         |
| <kbd>&uarr;</kbd> / <kbd>&darr;</kbd> | Moves the held card within its cell (continuing into the next lane at the edges), or moves focus when nothing is held |
| <kbd>&larr;</kbd> / <kbd>&rarr;</kbd> | Moves the held card across columns, or moves focus when nothing is held                                               |
| <kbd>Esc</kbd>                        | Cancels the pick-up                                                                                                   |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const columns = [
  { id: 'todo', label: 'To Do' },
  { id: 'doing', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

const coloredColumns = [
  { id: 'todo', label: 'To Do', color: '#6366f1' },
  { id: 'doing', label: 'In Progress', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#22c55e' },
]

const items = ref([
  { id: '1', columnId: 'todo', title: 'Design mockups' },
  { id: '2', columnId: 'doing', title: 'Build API' },
  { id: '3', columnId: 'done', title: 'Write specs' },
])

const lanes = [
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
]

const laneItems = ref([
  { id: 'l1', columnId: 'todo', laneId: 'frontend', title: 'Build form' },
  { id: 'l2', columnId: 'doing', laneId: 'backend', title: 'Auth endpoint' },
  { id: 'l3', columnId: 'done', laneId: 'frontend', title: 'Style header' },
  { id: 'l4', columnId: 'todo', laneId: 'backend', title: 'DB migration' },
])

function onMove(e: { itemId: string; toColumnId: string; toLaneId?: string | null }) {
  const item = items.value.find((i) => i.id === e.itemId)
  if (item) item.columnId = e.toColumnId
}

function onMoveLane(e: { itemId: string; toColumnId: string; toLaneId?: string | null }) {
  const item = laneItems.value.find((i) => i.id === e.itemId)
  if (item) {
    item.columnId = e.toColumnId
    if (e.toLaneId !== undefined) item.laneId = e.toLaneId
  }
}
</script>
