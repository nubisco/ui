---
layout: nubisco
title: Spreadsheet
tabs: ['Usage', 'Api']
---

::: warning Labs component
`NbSpreadsheet` is published from the Labs entry. The component is functional and tested, but its API may still change before it graduates into the core library. Pull it in with `app.use(NubiscoUILabs)` (see [Installation](#installation)).
:::

<doc-tab name="Usage">

`NbSpreadsheet` is a spreadsheet-style data grid. It draws on the same design language as [`NbBoard`](/ui/components/board) and IBM Carbon's Data Spreadsheet pattern: dense rows, hairline borders, a sticky header, an inset focus ring, and tabular numerics throughout.

The contract is intentionally narrow: the host owns the data and the formulas, the component renders the grid, captures input, and emits changes. There is no built-in formula engine — derived cells come from a `computed` callback the host supplies, so you can wire it into Vuex, Pinia, a worker thread, or a remote service without forking the component.

<preview>
  <NbSpreadsheet
    :columns="basicColumns"
    :rows="basicRows"
    @commit="onBasicCommit"
  />
</preview>

```vue
<template>
  <NbSpreadsheet :columns="columns" :rows="rows" @commit="onCommit" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type {
  ISpreadsheetColumn,
  ISpreadsheetRow,
  ISpreadsheetChange,
} from '@nubisco/ui'

const columns: ISpreadsheetColumn[] = [
  { id: 'name', label: 'Name', width: 180 },
  { id: 'qty', label: 'Quantity', type: 'number', align: 'right' },
  { id: 'price', label: 'Unit price', type: 'number', align: 'right' },
]

const rows = ref<ISpreadsheetRow[]>([
  { id: 'r1', values: { name: 'Hex bolt M8', qty: 50, price: 0.42 } },
  { id: 'r2', values: { name: 'Washer M8', qty: 50, price: 0.08 } },
])

function onCommit(change: ISpreadsheetChange) {
  const row = rows.value.find((r) => r.id === change.rowId)
  if (row) row.values[change.columnId] = change.after
}
</script>
```

## Installation

`NbSpreadsheet` lives in the Labs plugin. Install it alongside the core plugin:

```ts
import { createApp } from 'vue'
import NubiscoUI, { NubiscoUILabs } from '@nubisco/ui'
import '@nubisco/ui/dist/ui.css'

const app = createApp(App)
app.use(NubiscoUI)
app.use(NubiscoUILabs)
app.mount('#app')
```

You can also import `NbSpreadsheet` directly for tree-shaken usage:

```ts
import { NbSpreadsheet } from '@nubisco/ui'
```

## Columns and rows

A column declares its identity, label, type, alignment, default width and whether the column is pinned, sortable, or read-only. The `format` and `parse` hooks let you take over display and commit-time validation.

A row carries its own id and a `values` map keyed by `columnId`. Rows can pin themselves to the top or bottom of the viewport, which is useful for totals, headers, and reference rows that need to stay on screen while the user scrolls.

<preview>
  <NbSpreadsheet
    :columns="formattedColumns"
    :rows="formattedRows"
    @commit="onFormattedCommit"
  />
</preview>

```ts
const columns: ISpreadsheetColumn[] = [
  { id: 'day', label: 'Day', pinned: 'left', readOnly: true, align: 'center' },
  {
    id: 'eur',
    label: 'Revenue',
    type: 'number',
    align: 'right',
    format: (v) => `€ ${Number(v ?? 0).toLocaleString('pt-PT')}`,
    parse: (input) => Number(input.replace(/[^0-9.,-]/g, '').replace(',', '.')),
  },
]
```

## Derived cells (totals row)

Mark a row as `computed: true` and pin it to the bottom; provide a `computed` prop that returns the derived value. The function receives a `get(rowId, columnId)` reader so you can sum, multiply, or join other cells without storing the result in `values`.

<preview>
  <NbSpreadsheet
    :columns="computedColumns"
    :rows="computedRows"
    :computed="computeTotal"
    @commit="onComputedCommit"
  />
</preview>

```ts
const rows: ISpreadsheetRow[] = [
  { id: 'r1', values: { item: 'Sensors', qty: 12, unit: 14 } },
  { id: 'r2', values: { item: 'Actuators', qty: 6, unit: 39 } },
  {
    id: 'totals',
    pinned: 'bottom',
    computed: true,
    values: { item: 'Total' },
  },
]

function computeTotal(
  rowId: string,
  columnId: string,
  get: (r: string, c: string) => unknown,
) {
  if (rowId !== 'totals') return undefined
  if (columnId === 'qty')
    return Number(get('r1', 'qty')) + Number(get('r2', 'qty'))
  if (columnId === 'unit') return undefined // not summable
  if (columnId === 'amt') {
    const a = Number(get('r1', 'qty')) * Number(get('r1', 'unit'))
    const b = Number(get('r2', 'qty')) * Number(get('r2', 'unit'))
    return a + b
  }
}
```

## Per-cell attributes

`cellAttrs(rowId, columnId, row, column)` runs lazily for visible cells. Return a partial `ISpreadsheetCellAttrs` to decorate the cell: tag it read-only, attach a CSS class for conditional styling, set a tooltip, or override the displayed string. Returning `void` keeps the defaults.

<preview>
  <NbSpreadsheet
    :columns="attrsColumns"
    :rows="attrsRows"
    :cell-attrs="attrsCallback"
  />
</preview>

```ts
function cellAttrs(rowId: string, columnId: string) {
  // Weekend columns are read-only and tinted.
  if (columnId === 'sat' || columnId === 'sun') {
    return { readOnly: true, className: 'weekend' }
  }
}
```

Pair this with a small block of scoped CSS:

```scss
:deep(.nb-spreadsheet__cell.weekend) {
  background: var(--nb-c-surface);
}
```

## Pinned columns and pinned rows

Set `column.pinned` to `'left'` or `'right'` to keep a column visible while the user scrolls horizontally. Set `row.pinned` to `'top'` or `'bottom'` to do the same vertically. Multiple columns or rows can be pinned at the same edge — the order they appear in the array is preserved.

<preview>
  <NbSpreadsheet
    :columns="pinnedColumns"
    :rows="pinnedRows"
  />
</preview>

## Sorting

Set `column.sortable = true` to allow header-click sorting. The first click sorts ascending, the second descending, the third clears the sort. Only the unpinned data rows are sorted; pinned rows stay in their slot.

<preview>
  <NbSpreadsheet
    :columns="sortableColumns"
    :rows="sortableRows"
  />
</preview>

## Keyboard, mouse, and clipboard

| Action                   | Keys                                            |
| ------------------------ | ----------------------------------------------- |
| Move the active cell     | `↑` `↓` `←` `→` / `Tab` / `Shift+Tab` / `Enter` |
| Start editing            | Any printable key / `F2` / double-click         |
| Commit and move down     | `Enter`                                         |
| Commit and move right    | `Tab`                                           |
| Cancel editing           | `Esc`                                           |
| Clear the selected range | `Delete` / `Backspace`                          |
| Extend the selection     | Hold `Shift` while moving / Shift-click         |
| Copy / cut / paste (TSV) | `Cmd/Ctrl+C` / `Cmd/Ctrl+X` / `Cmd/Ctrl+V`      |
| Undo / redo              | `Cmd/Ctrl+Z` / `Cmd/Ctrl+Shift+Z`               |

Clipboard payloads are tab-separated values, so copy-paste round-trips cleanly with Excel, Numbers, and Google Sheets.

## Theming

`NbSpreadsheet` is built entirely against the Surface API and inherits any layer the parent provides. Drop it inside `.nb-layer-2` or under a dark theme and it will follow without overrides.

The component publishes per-instance CSS custom properties for the few decisions that callers regularly want to tune:

| Token                   | Default               | Purpose                         |
| ----------------------- | --------------------- | ------------------------------- |
| `--nbss-row-height`     | `32px`                | Data row height                 |
| `--nbss-header-height`  | `36px`                | Header row height               |
| `--nbss-cell-padding-x` | `0.625rem`            | Horizontal padding inside cells |
| `--nbss-focus-ring`     | `var(--nb-c-primary)` | Inset outline color             |

```scss
// Denser variant
.my-compact-sheet {
  --nbss-row-height: 24px;
  --nbss-header-height: 28px;
  --nbss-cell-padding-x: 0.4rem;
}
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop             | Type                                                              | Default   | Description                                                                 |
| ---------------- | ----------------------------------------------------------------- | --------- | --------------------------------------------------------------------------- |
| `columns`        | `ISpreadsheetColumn[]`                                            | -         | Column definitions, ordered left-to-right                                   |
| `rows`           | `ISpreadsheetRow[]`                                               | -         | Row data. Pinned rows can appear anywhere in the array                      |
| `cellAttrs`      | `(rowId, columnId, row, column) => ISpreadsheetCellAttrs \| void` | -         | Per-cell read-only / class / tooltip / display override                     |
| `computed`       | `(rowId, columnId, get) => unknown`                               | -         | Returns the derived value for cells that are not in `row.values`            |
| `resizable`      | `boolean`                                                         | `true`    | Allow column resize from the right edge of the header                       |
| `rowReorderable` | `boolean`                                                         | `false`   | Allow row drag-reorder via the gutter (Labs follow-up; emits `row-reorder`) |
| `showGutter`     | `boolean`                                                         | `true`    | Show the row-index gutter on the left                                       |
| `windowRows`     | `number`                                                          | `80`      | Approximate visible rows used for the simple row virtualization             |
| `locale`         | `string`                                                          | `'pt-PT'` | Default locale for Intl-based number/date formatting                        |

## Column interface

```typescript
interface ISpreadsheetColumn {
  id: string // stable id
  label: string // header text
  width?: number // default 120
  minWidth?: number // default 60
  pinned?: 'left' | 'right' // freeze the column
  align?: 'left' | 'center' | 'right' // text alignment
  type?: 'text' | 'number' | 'date' // drives default format + parse + inputmode
  readOnly?: boolean // column-wide read-only
  sortable?: boolean // header click sorts
  format?: (raw: unknown, row: ISpreadsheetRow) => string
  parse?: (input: string) => unknown
}
```

## Row interface

```typescript
interface ISpreadsheetRow {
  id: string
  values: Record<string, unknown> // columnId -> raw value
  pinned?: 'top' | 'bottom' // freeze the row
  className?: string // row-wide CSS class
  computed?: boolean // marks as derived (read-only + styled)
}
```

## Cell attributes

```typescript
interface ISpreadsheetCellAttrs {
  readOnly?: boolean
  className?: string
  tooltip?: string
  display?: string // override the rendered string
  computed?: boolean // cell-level derived marker
}
```

## Events

| Event         | Payload                                       | Description                                                               |
| ------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `commit`      | `ISpreadsheetChange`                          | A single cell was committed (edit, paste, delete, undo)                   |
| `change`      | `ISpreadsheetChange[]`                        | Batched changes for bulk operations (paste, delete-range, undo group)     |
| `selection`   | `ISpreadsheetSelection \| null`               | The active selection range changed                                        |
| `focus`       | `{ rowId: string; columnId: string } \| null` | The active cell changed                                                   |
| `row-reorder` | `{ rowId: string; toIndex: number }`          | Emitted when a row is dropped at a new index (only when `rowReorderable`) |

## Change interface

```typescript
interface ISpreadsheetChange {
  rowId: string
  columnId: string
  before: unknown
  after: unknown
}
```

## Selection interface

```typescript
interface ISpreadsheetSelection {
  startRowId: string
  startColumnId: string
  endRowId: string
  endColumnId: string
}
```

## Exposed

```typescript
const sheet = ref<InstanceType<typeof NbSpreadsheet>>()
sheet.value?.focus(rowId, columnId)
sheet.value?.undo()
sheet.value?.redo()
sheet.value?.getSelection()
```

## Slots

| Name      | Purpose                                                        |
| --------- | -------------------------------------------------------------- |
| `toolbar` | Renders above the grid. Use for save status, filters, actions. |

## Accessibility

- The scrollable surface is focusable and announces a focus ring via `box-shadow` on the inner edge so it does not move adjacent content.
- The active cell carries the same inset ring so keyboard users always see where they are.
- Header cells are role `columnheader`; data cells are role `gridcell`. (Labs follow-up: wire up `aria-rowindex` / `aria-colindex` for screen reader virtual-row support.)

## Surface API and theming

The component reads:

- `--nb-c-surface` for the header, toolbar, gutter, and read-only cells.
- `--nb-c-surface-raised` for the editable data area.
- `--nb-c-surface-hover` for row hover and sortable header hover.
- `--nb-c-border` for every line.
- `--nb-c-text`, `--nb-c-text-muted` for foreground.
- `--nb-c-primary` (and `--nb-c-primary-100`) for the focus ring and selection tint.

Anywhere a `.nb-layer-N` modifier reassigns those tokens, `NbSpreadsheet` follows automatically.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
import type {
  ISpreadsheetColumn,
  ISpreadsheetRow,
  ISpreadsheetChange,
} from '@nubisco/ui'

// ── Basic example ───────────────────────────────────────────────────────────
const basicColumns: ISpreadsheetColumn[] = [
  { id: 'name', label: 'Name', width: 200, align: 'left' },
  { id: 'qty', label: 'Qty', type: 'number', align: 'right', width: 80 },
  { id: 'unit', label: 'Unit price', type: 'number', align: 'right', width: 120 },
]
const basicRows = ref<ISpreadsheetRow[]>([
  { id: 'r1', values: { name: 'Hex bolt M8', qty: 50, unit: 0.42 } },
  { id: 'r2', values: { name: 'Washer M8', qty: 50, unit: 0.08 } },
  { id: 'r3', values: { name: 'Nut M8', qty: 50, unit: 0.18 } },
])
function onBasicCommit(c: ISpreadsheetChange) {
  const r = basicRows.value.find((x) => x.id === c.rowId)
  if (r) r.values[c.columnId] = c.after
}

// ── Formatted (currency) example ────────────────────────────────────────────
const formattedColumns: ISpreadsheetColumn[] = [
  { id: 'day', label: 'Day', width: 80, align: 'center', readOnly: true },
  {
    id: 'eur',
    label: 'Revenue',
    type: 'number',
    align: 'right',
    width: 140,
    format: (v) => (v == null ? '' : `€ ${Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`),
    parse: (input) => Number(input.replace(/[^0-9.,-]/g, '').replace(',', '.')),
  },
]
const formattedRows = ref<ISpreadsheetRow[]>([
  { id: 'r1', values: { day: 'Mon', eur: 1240.5 } },
  { id: 'r2', values: { day: 'Tue', eur: 980 } },
  { id: 'r3', values: { day: 'Wed', eur: 1115.25 } },
  { id: 'r4', values: { day: 'Thu', eur: 0 } },
  { id: 'r5', values: { day: 'Fri', eur: 0 } },
])
function onFormattedCommit(c: ISpreadsheetChange) {
  const r = formattedRows.value.find((x) => x.id === c.rowId)
  if (r) r.values[c.columnId] = c.after
}

// ── Computed totals example ─────────────────────────────────────────────────
const computedColumns: ISpreadsheetColumn[] = [
  { id: 'item', label: 'Item', width: 200, align: 'left' },
  { id: 'qty', label: 'Qty', type: 'number', align: 'right', width: 80 },
  { id: 'unit', label: 'Unit price', type: 'number', align: 'right', width: 120 },
  { id: 'amt', label: 'Amount', type: 'number', align: 'right', width: 120 },
]
const computedRows = ref<ISpreadsheetRow[]>([
  { id: 'r1', values: { item: 'Sensors', qty: 12, unit: 14 } },
  { id: 'r2', values: { item: 'Actuators', qty: 6, unit: 39 } },
  { id: 'r3', values: { item: 'Cables', qty: 30, unit: 2.5 } },
  { id: 'totals', pinned: 'bottom', computed: true, values: { item: 'Total' } },
])
function computeTotal(
  rowId: string,
  columnId: string,
  get: (r: string, c: string) => unknown,
): unknown {
  if (columnId === 'amt' && rowId !== 'totals') {
    return Number(get(rowId, 'qty')) * Number(get(rowId, 'unit'))
  }
  if (rowId === 'totals') {
    if (columnId === 'qty') {
      return computedRows.value
        .filter((r) => !r.pinned)
        .reduce((s, r) => s + Number(r.values.qty ?? 0), 0)
    }
    if (columnId === 'amt') {
      return computedRows.value
        .filter((r) => !r.pinned)
        .reduce((s, r) => s + Number(r.values.qty ?? 0) * Number(r.values.unit ?? 0), 0)
    }
  }
  return undefined
}
function onComputedCommit(c: ISpreadsheetChange) {
  const r = computedRows.value.find((x) => x.id === c.rowId)
  if (r) r.values[c.columnId] = c.after
}

// ── Per-cell attributes example ─────────────────────────────────────────────
const attrsColumns: ISpreadsheetColumn[] = [
  { id: 'task', label: 'Task', width: 200, align: 'left' },
  { id: 'mon', label: 'Mon', type: 'number', align: 'right', width: 80 },
  { id: 'tue', label: 'Tue', type: 'number', align: 'right', width: 80 },
  { id: 'wed', label: 'Wed', type: 'number', align: 'right', width: 80 },
  { id: 'thu', label: 'Thu', type: 'number', align: 'right', width: 80 },
  { id: 'fri', label: 'Fri', type: 'number', align: 'right', width: 80 },
  { id: 'sat', label: 'Sat', type: 'number', align: 'right', width: 80 },
  { id: 'sun', label: 'Sun', type: 'number', align: 'right', width: 80 },
]
const attrsRows = ref<ISpreadsheetRow[]>([
  { id: 'r1', values: { task: 'Design review', mon: 2, tue: 1, wed: 0, thu: 0, fri: 1 } },
  { id: 'r2', values: { task: 'Build', mon: 3, tue: 4, wed: 4, thu: 3, fri: 2 } },
  { id: 'r3', values: { task: 'Tests', mon: 1, tue: 1, wed: 2, thu: 2, fri: 2 } },
])
function attrsCallback(_rowId: string, columnId: string) {
  if (columnId === 'sat' || columnId === 'sun') {
    return { readOnly: true, className: 'weekend' }
  }
}

// ── Pinned columns and rows example ─────────────────────────────────────────
const pinnedColumns: ISpreadsheetColumn[] = [
  { id: 'sku', label: 'SKU', pinned: 'left', width: 100, align: 'left' },
  { id: 'name', label: 'Name', width: 200, align: 'left' },
  { id: 'jan', label: 'Jan', type: 'number', align: 'right', width: 80 },
  { id: 'feb', label: 'Feb', type: 'number', align: 'right', width: 80 },
  { id: 'mar', label: 'Mar', type: 'number', align: 'right', width: 80 },
  { id: 'apr', label: 'Apr', type: 'number', align: 'right', width: 80 },
  { id: 'may', label: 'May', type: 'number', align: 'right', width: 80 },
  { id: 'jun', label: 'Jun', type: 'number', align: 'right', width: 80 },
  { id: 'total', label: 'Total', type: 'number', align: 'right', width: 100, pinned: 'right' },
]
const pinnedRows = ref<ISpreadsheetRow[]>([
  { id: 'p1', values: { sku: 'AX-1', name: 'Sensor pack', jan: 14, feb: 18, mar: 22, apr: 19, may: 25, jun: 27, total: 125 } },
  { id: 'p2', values: { sku: 'AX-2', name: 'Controller', jan: 9, feb: 11, mar: 7, apr: 12, may: 14, jun: 12, total: 65 } },
  { id: 'p3', values: { sku: 'AX-3', name: 'Cable set', jan: 30, feb: 30, mar: 32, apr: 28, may: 34, jun: 31, total: 185 } },
])

// ── Sortable example ────────────────────────────────────────────────────────
const sortableColumns: ISpreadsheetColumn[] = [
  { id: 'name', label: 'Country', width: 200, align: 'left', sortable: true },
  { id: 'pop', label: 'Population (M)', type: 'number', align: 'right', width: 160, sortable: true },
  { id: 'gdp', label: 'GDP per capita ($)', type: 'number', align: 'right', width: 200, sortable: true },
]
const sortableRows = ref<ISpreadsheetRow[]>([
  { id: 's1', values: { name: 'Portugal', pop: 10.3, gdp: 27300 } },
  { id: 's2', values: { name: 'Spain', pop: 47.5, gdp: 32400 } },
  { id: 's3', values: { name: 'France', pop: 67.8, gdp: 47900 } },
  { id: 's4', values: { name: 'Germany', pop: 83.2, gdp: 52800 } },
  { id: 's5', values: { name: 'Switzerland', pop: 8.7, gdp: 99300 } },
])
</script>

<style scoped>
:deep(.nb-spreadsheet__cell.weekend) {
  background: var(--nb-c-surface);
  color: var(--nb-c-text-muted);
}
</style>
