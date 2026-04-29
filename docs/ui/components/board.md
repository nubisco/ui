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
  const item = items.value.find((i) => i.id === e.itemId)
  if (item) {
    item.columnId = e.toColumnId
    if (e.toLaneId !== undefined) item.laneId = e.toLaneId
  }
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

Drag and drop is built in. When a card is dragged to a different cell, the `move` event fires with the source and destination coordinates. The component does not mutate `items` directly; update your data in the event handler.

During a drag operation:

- The target cell highlights with a primary-tinted background and dashed outline.
- Cards show a grab cursor and lift with a subtle shadow on hover.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop      | Type             | Default     | Description                                 |
| --------- | ---------------- | ----------- | ------------------------------------------- |
| `columns` | `IBoardColumn[]` | required    | Column definitions (one per status/stage)   |
| `items`   | `IBoardItem[]`   | required    | Items to display on the board               |
| `lanes`   | `IBoardLane[]`   | `undefined` | Optional swim lanes for horizontal grouping |

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
}
```

## Events

| Event  | Payload           | Description                                          |
| ------ | ----------------- | ---------------------------------------------------- |
| `move` | `IBoardMoveEvent` | Emitted when a card is dropped into a different cell |

## Slots

| Slot          | Scope                                                           | Description                |
| ------------- | --------------------------------------------------------------- | -------------------------- |
| `card`        | `{ item: IBoardItem, column: IBoardColumn, lane?: IBoardLane }` | Content of each card       |
| `lane-header` | `{ lane: IBoardLane }`                                          | Custom lane header content |

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
