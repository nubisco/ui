---
layout: nubisco
title: Data Table
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbDataTable` is a presentational, data-driven table for read-mostly application lists. It ships full `<table>` semantics, controlled sorting, row selection, loading / empty / error states, density options, a sticky header with horizontal scroll, and a companion `NbPagination` footer.

It is deliberately **not** an editable spreadsheet. When cells need in-place editing, reach for [`NbSpreadsheet`](/labs/spreadsheet) instead.

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

Sorting is **controlled**: the table renders the `sortState` you pass and emits a `sort` event with the next state when a sortable header is activated (click or keyboard). Direction cycles `asc → desc → none`. Apply the ordering yourself (or server-side) so the component stays honest about what it displays. Sortable headers expose `aria-sort`.

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
      <NbButton variant="ghost" icon="trash" @click="clear">
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
    <NbButton variant="ghost" icon="trash" @click="clear">
      Delete {{ selectedKeys.length }}
    </NbButton>
  </template>
  <template #row-actions>
    <NbButton variant="ghost" size="sm" icon="dots-three-vertical" />
  </template>
</NbDataTable>
```

### A toolbar that does not fit

When the heading and the tools do not fit on one line, the tools move to a line
of their own below the heading, at the end, and a `#search` field grows to take
the room the actions leave. This follows the table's own width, not the
screen's, so a table in a card or a side panel wraps the same way a phone does.
A toolbar that fits on one line is unchanged. Tick a row: the batch bar still
covers the whole toolbar, at whatever height it has.

<preview>
  <div style="max-width: 520px">
    <NbDataTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      title="Workspace members and pending invitations"
      description="Everyone who can open this workspace, and the people invited who have not accepted yet."
      selectable="multiple"
      v-model:selected="selectedNarrow"
    >
      <template #search>
        <NbTextInput placeholder="Search members" size="sm" />
      </template>
      <template #toolbar-actions>
        <NbButton variant="secondary" size="sm" icon="export">Export</NbButton>
        <NbButton variant="primary" size="sm" icon="plus">Invite</NbButton>
      </template>
      <template #batch-actions="{ selectedKeys, clear }">
        <NbButton variant="ghost" icon="trash" @click="clear">
          Remove {{ selectedKeys.length }}
        </NbButton>
      </template>
    </NbDataTable>
  </div>
</preview>

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

Drop an [`NbPagination`](/components/pagination) into the `#footer` slot. Both components are fully controlled, so the same wiring drives client-side slicing or server-side paging. On page-size change the page resets to 1.

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

## Fill height & internal scroll

Set `fill` and the table becomes a flex item that fills its parent and scrolls internally: the toolbar and the `#footer` stay pinned, the header stays sticky, and only the body scrolls. This is the shape you want for a full-height list view, and it needs no table-specific CSS on your side.

<preview>
  <div style="height: 320px; display: flex; flex-direction: column; min-height: 0; border: 1px dashed var(--nb-c-border);">
    <NbDataTable
      :columns="columns"
      :rows="allRows"
      row-key="id"
      title="Team members"
      fill
      style="width: 100%"
    >
      <template #footer>
        <NbPagination :page="1" :page-size="10" :total="allRows.length" />
      </template>
    </NbDataTable>
  </div>
</preview>

```vue
<template>
  <NbDataTable
    :columns="columns"
    :rows="rows"
    row-key="id"
    title="Team members"
    fill
  >
    <template #footer>
      <NbPagination v-model:page="page" :page-size="pageSize" :total="total" />
    </template>
  </NbDataTable>
</template>
```

### The parent must bound the height

`fill` makes the table _claim_ its parent's height. It cannot _create_ one. The parent has to be a flex column that is itself bounded, which in practice means `min-height: 0` somewhere up the chain. Without that, the parent grows to fit every row and the page scrolls instead of the body.

`NbShell`'s content row already qualifies, so a table placed directly in `#content` works with no extra CSS:

```scss
// Already part of NbShell, shown here for reference.
.nb-shell__content-row {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
```

```vue
<NbShell>
  <template #content>
    <NbDataTable :columns="columns" :rows="rows" row-key="id" fill />
  </template>
</NbShell>
```

An unbounded wrapper between the shell and the table defeats it. A plain `<div>` grows to fit its content, so the table inherits no ceiling:

```vue
<!-- Does not scroll internally: the wrapper has no bounded height. -->
<template #content>
  <div class="my-view">
    <NbDataTable :columns="columns" :rows="rows" row-key="id" fill />
  </div>
</template>
```

Give that wrapper the same treatment and it works again:

```scss
.my-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
```

Leave `fill` off (the default) and the table sizes to its content exactly as before.

## Stacked on a phone

Set `stackOnPhone` and, on a phone layout (below 672px, or a phone held
sideways), each row becomes a card instead of a squeezed table row. Off a phone
the table renders exactly as without the prop.

- The column marked `primary` is the card's title. Without one, the first
  column that is neither `phoneHidden` nor `phoneMeta` is.
- Columns marked `phoneMeta` share one muted line under the title: a key, an
  owner, a date.
- Every other column is a label and value pair, labelled with its `header`.
- Columns marked `phoneHidden` are left out of the card.
- Column widths are ignored, because there are no columns any more.
- Sortable headers stay, as a strip of sort chips above the cards that cycle
  the same way the headers do. The select-all box stays beside them. With
  neither, or with no rows, the header is not shown, and the empty state is
  compact.
- Clickable rows stay clickable, and the row actions sit at the end of the
  title line.

```vue
<NbDataTable
  :columns="[
    { key: 'title', header: 'Title', primary: true, sortable: true },
    { key: 'key', header: 'Key', phoneMeta: true },
    { key: 'owner', header: 'Owner', phoneMeta: true },
    { key: 'status', header: 'Status' },
    { key: 'type', header: 'Type', phoneHidden: true },
  ]"
  :rows="rows"
  row-key="id"
  stack-on-phone
/>
```

## Clickable rows

Listen for `row-click` and every row becomes clickable: the pointer cursor, and
a place in the tab order. A row is reached with Tab and activated with Enter or
Space, which emit the same `row-click` a click does, with the same row and
index. A keyboard focus ring is drawn around the row in the library's focus
colour, and a mouse click draws none. Clicks and keys on the selection control
and the `#row-actions` cell stay theirs and do not activate the row.

This works the same with `stackOnPhone`, where each card is the focusable row.
A table that does not listen for `row-click` has no tab stops on its rows and
renders exactly as before.

<preview>
  <NbDataTable
    :columns="columns"
    :rows="rows"
    row-key="id"
    style="width: 100%"
    @row-click="onRowClick"
  />
  <p>Last opened: {{ lastOpened || 'none yet' }}</p>
</preview>

```vue
<template>
  <NbDataTable
    :columns="columns"
    :rows="rows"
    row-key="id"
    @row-click="(row) => open(row.id)"
  />
</template>
```

Each clickable row is its own tab stop, in reading order, rather than one tab
stop with the arrow keys moving between rows. That keeps the table a plain
table, and it is how a list of links behaves. For a long list, pair it with
`NbPagination` so the number of stops stays small.

## Expandable rows

Give the table a `#row-detail` slot and each row gets a toggle in a leading
column. An open row shows the slot as a full-width region directly under it,
spanning every column. Which rows are open is **controlled**, like selection:
bind the open row keys with `v-model:expanded`. The toggle emits the next keys
and the table shows what you pass back, so you decide whether several rows can
be open at once, or only one.

The toggle is the only thing that opens a row. A row click still emits
`row-click`, and a click on the toggle does not, so a row can be both
clickable and expandable. With `stackOnPhone`, the toggle leads the card's
title line and the detail opens inside the card, under its fields. A table
without the slot has no toggle column and renders exactly as before.

<preview>
  <NbDataTable
    :columns="columns"
    :rows="rows"
    row-key="id"
    v-model:expanded="expanded"
    stack-on-phone
    style="width: 100%"
  >
    <template #row-detail="{ row }">
      <NbDefinitionList :items="detailItems(row)" />
    </template>
  </NbDataTable>
</preview>

```vue
<template>
  <NbDataTable
    :columns="columns"
    :rows="rows"
    row-key="id"
    v-model:expanded="expanded"
  >
    <template #row-detail="{ row, rowIndex }">
      <MemberDetail :member="row" />
    </template>
  </NbDataTable>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Row keys, as `rowKey` gives them. Start with a row open by listing its key.
const expanded = ref<(string | number)[]>([2])
</script>
```

Only one row open at a time is a matter of what you pass back:

```vue
<NbDataTable
  :columns="columns"
  :rows="rows"
  row-key="id"
  :expanded="expanded"
  @update:expanded="(keys) => (expanded = keys.slice(-1))"
>
  <template #row-detail="{ row }">
    <MemberDetail :member="row" />
  </template>
</NbDataTable>
```

## Accessibility

- Renders a real `<table>` with `<th scope="col">` header cells and a `<colgroup>` for widths.
- Sortable headers are `<button>`s inside the `<th>` and expose `aria-sort` (`ascending` / `descending` / `none`), so sorting works with keyboard and screen readers.
- Selection controls are labelled checkboxes / radios; selected rows carry `aria-selected`.
- The table exposes `aria-busy` while loading, and uses `aria-label` (from `ariaLabel` or `title`).
- Clickable rows (with a `row-click` listener) are focusable with `tabindex="0"` and keep their native row role, so the table is still a table and a screen reader names the focused row from its cells. Enter and Space activate the row, and a key pressed on a control inside the row (a checkbox, a row action, a link in a cell) belongs to that control. The row draws a 2px `--nb-c-focus-ring` outline on keyboard focus.
- Expandable rows: the toggle is a `<button>` with `aria-expanded`, and while the row is open, `aria-controls` points at the detail. The detail is a `region` inside a full-width cell, so the cell stays a table cell. The toggle and the region are both named after the row's title column (`Details for Ada Lovelace`), the same column a phone card uses as its title, so a screen reader hears whose details they are. The header cell of the toggle column has a visually hidden "Row details" label. Focus stays on the toggle when the row opens or closes.
- Stacked on a phone, the table, rows and cells carry explicit `table`, `row` and `cell` roles, because the change of `display` that makes the cards would otherwise strip the table semantics in some browsers.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop           | Type                                      | Default     | Description                                                               |
| -------------- | ----------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| `columns`      | `IDataTableColumn<T>[]`                   | required    | Column definitions, left to right                                         |
| `rows`         | `T[]`                                     | required    | Row data (order is respected as-is)                                       |
| `rowKey`       | `keyof T \| (row: T) => string \| number` | required    | Row identity for selection, keys and reconciliation                       |
| `size`         | `'sm' \| 'md' \| 'lg'`                    | `'md'`      | Density                                                                   |
| `sortState`    | `IDataTableSortState \| null`             | `null`      | Controlled sort state, reflected in `aria-sort`                           |
| `selectable`   | `'none' \| 'single' \| 'multiple'`        | `'none'`    | Row selection mode                                                        |
| `selected`     | `(string \| number)[]`                    | `[]`        | Controlled selected keys (`v-model:selected`)                             |
| `loading`      | `boolean`                                 | `false`     | Renders skeleton placeholder rows                                         |
| `skeletonRows` | `number`                                  | `5`         | Number of skeleton rows while loading                                     |
| `error`        | `string`                                  | `undefined` | Error message shown in place of the body                                  |
| `emptyMessage` | `string`                                  | `undefined` | Message shown when there are no rows                                      |
| `stickyHeader` | `boolean`                                 | `true`      | Pins the header while the body scrolls                                    |
| `zebra`        | `boolean`                                 | `false`     | Alternating row backgrounds                                               |
| `fill`         | `boolean`                                 | `false`     | Fill the parent's height and scroll internally                            |
| `title`        | `string`                                  | `undefined` | Toolbar title                                                             |
| `description`  | `string`                                  | `undefined` | Toolbar sub-text                                                          |
| `ariaLabel`    | `string`                                  | `undefined` | Accessible name for the `<table>`                                         |
| `stackOnPhone` | `boolean`                                 | `false`     | On a phone, render each row as a stacked card                             |
| `expanded`     | `(string \| number)[]`                    | `[]`        | Open detail row keys (`v-model:expanded`), read with a `#row-detail` slot |

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
  primary?: boolean // with stackOnPhone: the card's title on a phone
  phoneHidden?: boolean // with stackOnPhone: left out of the card on a phone
  phoneMeta?: boolean // with stackOnPhone: on the muted line under the title
}

type TSortDirection = 'asc' | 'desc' | 'none'

interface IDataTableSortState {
  key: string
  direction: TSortDirection
}
```

## Events

| Event             | Payload                      | Description                                                                            |
| ----------------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| `sort`            | `IDataTableSortState`        | Next sort state after a sortable header is activated                                   |
| `update:selected` | `(string \| number)[]`       | Selected keys changed (`v-model:selected`)                                             |
| `row-click`       | `(row: T, rowIndex: number)` | A body row was clicked, or activated with Enter or Space (not checkbox / action cells) |
| `update:expanded` | `(string \| number)[]`       | Open detail row keys after a toggle (`v-model:expanded`)                               |

## Slots

| Slot              | Scope                              | Description                                            |
| ----------------- | ---------------------------------- | ------------------------------------------------------ |
| `cell-<key>`      | `{ row, value, column, rowIndex }` | Custom cell for column `<key>`                         |
| `header-<key>`    | `{ column }`                       | Custom header for column `<key>`                       |
| `toolbar`         | `{ selectedCount }`                | Replaces the default title / description block         |
| `search`          | (none)                             | Toolbar search area                                    |
| `toolbar-actions` | (none)                             | Toolbar trailing actions                               |
| `batch-actions`   | `{ selectedKeys, clear }`          | Actions shown in the batch bar during selection        |
| `row-actions`     | `{ row, rowIndex }`                | Trailing overflow / actions column                     |
| `row-detail`      | `{ row, rowIndex }`                | Detail shown under an open row; adds the toggle column |
| `loading`         | (none)                             | (Skeleton rows render automatically)                   |
| `empty`           | (none)                             | Empty-state content                                    |
| `error`           | `{ error }`                        | Error-state content                                    |
| `footer`          | (none)                             | Footer region (e.g. `NbPagination`)                    |

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
const lastOpened = ref('')
const expanded = ref([2])
function detailItems(row) {
  return [
    { term: 'Name', value: row.name },
    { term: 'Role', value: row.role },
    { term: 'Status', value: row.status },
  ]
}
function onRowClick(row) {
  lastOpened.value = row.name
}
const selectedToolbar = ref([1])
const selectedNarrow = ref([])

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
