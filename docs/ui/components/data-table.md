---
layout: nubisco
title: Data Table
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbDataTable` is a presentational, data-driven table for read-mostly application lists, modeled on the [Carbon Design System Data Table](https://carbondesignsystem.com/components/data-table/usage/). It ships full `<table>` semantics, controlled sorting, row selection, loading / empty / error states, density options, a sticky header with horizontal scroll, and a companion `NbPagination` footer.

It is deliberately **not** an editable spreadsheet. When cells need in-place editing, reach for [`NbSpreadsheet`](/ui/labs/spreadsheet) instead.

## Basic Usage

Provide `columns`, `rows`, and a `rowKey` for identity. Cell values are read from `row[column.key]` by default.

<preview>
  <NbDataTable :columns="columns" :rows="rows" row-key="id" style="width: 100%" />
</preview>

```vue
<template>
  <NbDataTable :columns="columns" :rows="rows" row-key="id" />
</template>

<script setup lang="ts">
import type { IDataTableColumn } from '@nubisco/ui'

interface Member {
  id: number
  name: string
  role: string
  status: string
}

const columns: IDataTableColumn<Member>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'status', header: 'Status', align: 'center' },
]

const rows: Member[] = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer', status: 'Active' },
  { id: 2, name: 'Grace Hopper', role: 'Admiral', status: 'Active' },
  { id: 3, name: 'Alan Turing', role: 'Researcher', status: 'Away' },
]
</script>
```

## Sorting

Sorting is **controlled**: the table renders the `sortState` you pass and emits a `sort` event with the next state when a sortable header is activated (click or keyboard). Direction cycles `asc → desc → none`, matching Carbon. Apply the ordering yourself (or server-side) so the component stays honest about what it displays. Sortable headers expose `aria-sort`.

<preview>
  <NbDataTable
    :columns="columns"
    :rows="sortedRows"
    row-key="id"
    :sort-state="sortState"
    style="width: 100%"
    @sort="onSort"
  />
</preview>

```vue
<template>
  <NbDataTable
    :columns="columns"
    :rows="sortedRows"
    row-key="id"
    :sort-state="sortState"
    @sort="onSort"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IDataTableSortState } from '@nubisco/ui'

const sortState = ref<IDataTableSortState>({ key: 'name', direction: 'asc' })

function onSort(state: IDataTableSortState) {
  sortState.value = state
}

const sortedRows = computed(() => {
  const { key, direction } = sortState.value
  if (direction === 'none') return rows
  return [...rows].sort((a, b) => {
    const cmp = String(a[key]).localeCompare(String(b[key]))
    return direction === 'asc' ? cmp : -cmp
  })
})
</script>
```

## Selection

Set `selectable` to `'single'` or `'multiple'` to render a leading control column, and bind the selected row keys with `v-model:selected`. The header "select all" checkbox (multiple mode) reflects an indeterminate state and preserves selections that live on other pages.

<preview>
  <NbDataTable
    :columns="columns"
    :rows="rows"
    row-key="id"
    selectable="multiple"
    v-model:selected="selected"
    style="width: 100%"
  />
</preview>

```vue
<template>
  <NbDataTable
    :columns="columns"
    :rows="rows"
    row-key="id"
    selectable="multiple"
    v-model:selected="selected"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selected = ref<(string | number)[]>([])
</script>
```

## Toolbar, batch actions & row actions

The `toolbar` region hosts a `title` / `description`, a `#search` slot, and a `#toolbar-actions` slot. While rows are selected, a batch-action bar takes over the toolbar and renders the `#batch-actions` slot (with a `clear` helper). A trailing overflow column appears whenever a `#row-actions` slot is provided.

<preview>
  <NbDataTable
    :columns="columns"
    :rows="rows"
    row-key="id"
    title="Team members"
    description="People with access to this workspace."
    selectable="multiple"
    v-model:selected="selectedToolbar"
    style="width: 100%"
  >
    <template #toolbar-actions>
      <NbButton variant="primary" size="sm" icon="plus">Add member</NbButton>
    </template>
    <template #batch-actions="{ selectedKeys, clear }">
      <NbButton variant="danger" size="sm" @click="clear">
        Delete {{ selectedKeys.length }}
      </NbButton>
    </template>
    <template #cell-status="{ value }">
      <NbBadge>{{ value }}</NbBadge>
    </template>
    <template #row-actions>
      <NbButton variant="ghost" size="sm" icon="dots-three-vertical" />
    </template>
  </NbDataTable>
</preview>

```vue
<NbDataTable
  :columns="columns"
  :rows="rows"
  row-key="id"
  title="Team members"
  description="People with access to this workspace."
  selectable="multiple"
  v-model:selected="selected"
>
  <template #toolbar-actions>
    <NbButton variant="primary" size="sm" icon="plus">Add member</NbButton>
  </template>
  <template #batch-actions="{ selectedKeys, clear }">
    <NbButton variant="danger" size="sm" @click="clear">
      Delete {{ selectedKeys.length }}
    </NbButton>
  </template>
  <template #row-actions>
    <NbButton variant="ghost" size="sm" icon="dots-three-vertical" />
  </template>
</NbDataTable>
```

## Custom cells

Render custom cell content three ways, in precedence order: a `#cell-<key>` slot, a column `render` function, then the raw value. Headers can be overridden with a `#header-<key>` slot.

```vue
<template>
  <NbDataTable :columns="columns" :rows="rows" row-key="id">
    <!-- Slot approach: full template control -->
    <template #cell-status="{ value }">
      <NbBadge>{{ value }}</NbBadge>
    </template>
  </NbDataTable>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { IDataTableColumn } from '@nubisco/ui'

// Render-function approach: keep the definition next to the column
const columns: IDataTableColumn[] = [
  { key: 'name', header: 'Name' },
  {
    key: 'email',
    header: 'Email',
    render: (row) => h('a', { href: `mailto:${row.email}` }, row.email),
  },
  { key: 'status', header: 'Status' },
]
</script>
```

## States

Loading renders shimmering skeleton rows (`skeletonRows` controls the count). `error` shows an error row that takes precedence over the empty state. When there are no rows, `emptyMessage` (or the `#empty` slot) is shown.

<preview dir="col">
  <NbDataTable :columns="columns" :rows="[]" row-key="id" loading style="width: 100%" />
  <NbDataTable :columns="columns" :rows="[]" row-key="id" empty-message="No members yet" style="width: 100%" />
  <NbDataTable :columns="columns" :rows="[]" row-key="id" error="Failed to load members." style="width: 100%" />
</preview>

```vue
<NbDataTable
  :columns="columns"
  :rows="rows"
  row-key="id"
  loading
  :skeleton-rows="5"
/>
<NbDataTable
  :columns="columns"
  :rows="rows"
  row-key="id"
  empty-message="No members yet"
/>
<NbDataTable
  :columns="columns"
  :rows="rows"
  row-key="id"
  error="Failed to load members."
/>
```

## Density

`size` follows the shared `sm` / `md` / `lg` scale used across the library. Combine with `zebra` for alternating row backgrounds.

<preview dir="col">
  <NbDataTable :columns="columns" :rows="rows" row-key="id" size="sm" zebra style="width: 100%" />
  <NbDataTable :columns="columns" :rows="rows" row-key="id" size="lg" style="width: 100%" />
</preview>

```vue
<NbDataTable :columns="columns" :rows="rows" row-key="id" size="sm" zebra />
```

## Pagination

Drop an [`NbPagination`](/ui/components/pagination) into the `#footer` slot. Both components are fully controlled, so the same wiring drives client-side slicing or server-side paging. On page-size change the page resets to 1.

<preview>
  <NbDataTable
    :columns="columns"
    :rows="pagedRows"
    row-key="id"
    style="width: 100%"
  >
    <template #footer>
      <NbPagination
        :page="page"
        :page-size="pageSize"
        :total="allRows.length"
        v-model:page="page"
        @update:page-size="onPageSize"
      />
    </template>
  </NbDataTable>
</preview>

```vue
<template>
  <NbDataTable :columns="columns" :rows="pagedRows" row-key="id">
    <template #footer>
      <NbPagination
        :page="page"
        :page-size="pageSize"
        :total="allRows.length"
        v-model:page="page"
        @update:page-size="onPageSize"
      />
    </template>
  </NbDataTable>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const page = ref(1)
const pageSize = ref(5)

function onPageSize(size: number) {
  pageSize.value = size
  page.value = 1
}

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return allRows.slice(start, start + pageSize.value)
})
</script>
```

## Accessibility

- Renders a real `<table>` with `<th scope="col">` header cells and a `<colgroup>` for widths.
- Sortable headers are `<button>`s inside the `<th>` and expose `aria-sort` (`ascending` / `descending` / `none`), so sorting works with keyboard and screen readers.
- Selection controls are labelled checkboxes / radios; selected rows carry `aria-selected`.
- The table exposes `aria-busy` while loading, and uses `aria-label` (from `ariaLabel` or `title`).

</doc-tab>

<doc-tab name="Api">

## Props

| Prop           | Type                                      | Default     | Description                                         |
| -------------- | ----------------------------------------- | ----------- | --------------------------------------------------- |
| `columns`      | `IDataTableColumn<T>[]`                   | required    | Column definitions, left to right                   |
| `rows`         | `T[]`                                     | required    | Row data (order is respected as-is)                 |
| `rowKey`       | `keyof T \| (row: T) => string \| number` | required    | Row identity for selection, keys and reconciliation |
| `size`         | `'sm' \| 'md' \| 'lg'`                    | `'md'`      | Density                                             |
| `sortState`    | `IDataTableSortState \| null`             | `null`      | Controlled sort state, reflected in `aria-sort`     |
| `selectable`   | `'none' \| 'single' \| 'multiple'`        | `'none'`    | Row selection mode                                  |
| `selected`     | `(string \| number)[]`                    | `[]`        | Controlled selected keys (`v-model:selected`)       |
| `loading`      | `boolean`                                 | `false`     | Renders skeleton placeholder rows                   |
| `skeletonRows` | `number`                                  | `5`         | Number of skeleton rows while loading               |
| `error`        | `string`                                  | `undefined` | Error message shown in place of the body            |
| `emptyMessage` | `string`                                  | `undefined` | Message shown when there are no rows                |
| `stickyHeader` | `boolean`                                 | `true`      | Pins the header while the body scrolls              |
| `zebra`        | `boolean`                                 | `false`     | Alternating row backgrounds                         |
| `title`        | `string`                                  | `undefined` | Toolbar title                                       |
| `description`  | `string`                                  | `undefined` | Toolbar sub-text                                    |
| `ariaLabel`    | `string`                                  | `undefined` | Accessible name for the `<table>`                   |

## Interfaces

```typescript
interface IDataTableColumn<T = Record<string, unknown>> {
  key: string
  header: string
  width?: string | number // number → px
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (row: T, value: unknown, rowIndex: number) => VNodeChild
  cellClass?: string
  hidden?: boolean
}

type TSortDirection = 'asc' | 'desc' | 'none'

interface IDataTableSortState {
  key: string
  direction: TSortDirection
}
```

## Events

| Event             | Payload                      | Description                                          |
| ----------------- | ---------------------------- | ---------------------------------------------------- |
| `sort`            | `IDataTableSortState`        | Next sort state after a sortable header is activated |
| `update:selected` | `(string \| number)[]`       | Selected keys changed (`v-model:selected`)           |
| `row-click`       | `(row: T, rowIndex: number)` | A body row was clicked (not checkbox / action cells) |

## Slots

| Slot              | Scope                              | Description                                     |
| ----------------- | ---------------------------------- | ----------------------------------------------- |
| `cell-<key>`      | `{ row, value, column, rowIndex }` | Custom cell for column `<key>`                  |
| `header-<key>`    | `{ column }`                       | Custom header for column `<key>`                |
| `toolbar`         | `{ selectedCount }`                | Replaces the default title / description block  |
| `search`          | (none)                             | Toolbar search area                             |
| `toolbar-actions` | (none)                             | Toolbar trailing actions                        |
| `batch-actions`   | `{ selectedKeys, clear }`          | Actions shown in the batch bar during selection |
| `row-actions`     | `{ row, rowIndex }`                | Trailing overflow / actions column              |
| `loading`         | (none)                             | (Skeleton rows render automatically)            |
| `empty`           | (none)                             | Empty-state content                             |
| `error`           | `{ error }`                        | Error-state content                             |
| `footer`          | (none)                             | Footer region (e.g. `NbPagination`)             |

</doc-tab>

<script setup lang="ts">
import { computed, ref } from 'vue'

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'status', header: 'Status', align: 'center' },
]

const rows = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer', status: 'Active' },
  { id: 2, name: 'Grace Hopper', role: 'Admiral', status: 'Active' },
  { id: 3, name: 'Alan Turing', role: 'Researcher', status: 'Away' },
]

const selected = ref([])
const selectedToolbar = ref([1])

const sortState = ref({ key: 'name', direction: 'asc' })
function onSort(state) {
  sortState.value = state
}
const sortedRows = computed(() => {
  const { key, direction } = sortState.value
  if (direction === 'none') return rows
  return [...rows].sort((a, b) => {
    const cmp = String(a[key]).localeCompare(String(b[key]))
    return direction === 'asc' ? cmp : -cmp
  })
})

const allRows = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer', status: 'Active' },
  { id: 2, name: 'Grace Hopper', role: 'Admiral', status: 'Active' },
  { id: 3, name: 'Alan Turing', role: 'Researcher', status: 'Away' },
  { id: 4, name: 'Katherine Johnson', role: 'Mathematician', status: 'Active' },
  { id: 5, name: 'Margaret Hamilton', role: 'Engineer', status: 'Away' },
  { id: 6, name: 'Hedy Lamarr', role: 'Inventor', status: 'Active' },
  { id: 7, name: 'Barbara Liskov', role: 'Computer Scientist', status: 'Active' },
]
const page = ref(1)
const pageSize = ref(5)
function onPageSize(size) {
  pageSize.value = size
  page.value = 1
}
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return allRows.slice(start, start + pageSize.value)
})
</script>
