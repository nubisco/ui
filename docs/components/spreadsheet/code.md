---
layout: nubisco
title: Spreadsheet
intro: '`NbSpreadsheet` is an editable grid of cells for data people key in: dense rows, a sticky header, row numbers or labels in a gutter, keyboard entry like a desktop spreadsheet, range selection, clipboard, and undo. The app owns the data: the sheet renders it, captures input and emits the changes.'
source: src/components/Spreadsheet.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Getting started

Give the sheet its columns and rows, and write each committed change back into the rows.

```vue
<template>
  <NbSpreadsheet
    :columns="columns"
    :rows="rows"
    aria-label="Parts"
    @commit="onCommit"
  />
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
  { id: 'qty', label: 'Quantity', type: 'number' },
  { id: 'price', label: 'Unit price', type: 'number' },
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

`NbSpreadsheet` resolves and links its styles like every other component. An app that still calls `app.use(NubiscoUILabs)` from when it was a labs component keeps working: the labs plugin registers it too.

## Columns and rows

A column declares its id, label, type, alignment, width, and whether it is pinned, sortable or read-only. `type` picks the default formatting, the parsing of what is typed, and the keyboard a phone shows. `format` and `parse` take over display and commit-time parsing. A `parse` that throws rejects the value, and the cell keeps the one it had.

A row carries its own id and a `values` map keyed by column id.

<preview>
  <NbSpreadsheet
    :columns="formattedColumns"
    :rows="formattedRows"
    aria-label="Revenue"
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
    format: (v) => `€ ${Number(v ?? 0).toLocaleString('en-GB')}`,
    parse: (input) => Number(input.replace(/[^0-9.,-]/g, '').replace(',', '.')),
  },
]
```

Number and date columns are formatted with `Intl` in `locale`, which defaults to `'pt-PT'`. The next major changes that default to the runtime's locale, so pass `locale` whenever the formatting matters.

## Derived cells

A cell missing from `row.values` asks the `computed` callback for its value. The callback receives a `get(rowId, columnId)` reader for other cells, so it can sum, multiply or join them without the result being stored.

```ts
const rows: ISpreadsheetRow[] = [
  { id: 'r1', values: { item: 'Sensors', qty: 12, unit: 14 } },
  { id: 'r2', values: { item: 'Actuators', qty: 6, unit: 39 } },
  { id: 'totals', pinned: 'bottom', computed: true, values: { item: 'Total' } },
]

function computeTotal(
  rowId: string,
  columnId: string,
  get: (r: string, c: string) => unknown,
) {
  if (columnId === 'amt' && rowId !== 'totals')
    return Number(get(rowId, 'qty')) * Number(get(rowId, 'unit'))
  if (rowId === 'totals' && columnId === 'qty')
    return Number(get('r1', 'qty')) + Number(get('r2', 'qty'))
}
```

## Per-cell attributes

`cellAttrs(rowId, columnId, row, column)` runs for every rendered cell. Return a partial `ISpreadsheetCellAttrs` to make the cell read-only, add a class for conditional styling, set a tooltip, or replace the displayed text. Returning nothing keeps the defaults.

<preview>
  <NbSpreadsheet
    :columns="attrsColumns"
    :rows="attrsRows"
    :cell-attrs="attrsCallback"
    aria-label="Hours by task"
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

```scss
:deep(.nb-spreadsheet__cell.weekend) {
  background: var(--nb-c-surface);
}
```

## Filling the page

The parent has to give a `fit` sheet a height to fill: make it a flex column that reaches the bottom of the page, or give it a set height.

```ts
const columns = months.map((m, i) => ({
  id: String(i + 1),
  label: m, // "September"
  shortLabel: short.format(new Date(2000, i, 1)), // "Sep"
  width: 72,
}))
```

```vue
<div class="sheet-page">
  <NbSpreadsheet :columns="columns" :rows="rows" :gutter-width="96" fit />
</div>

<style scoped>
.sheet-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
</style>
```

## Hidden columns and rows

Bind the two models to keep what a person hid, for example in their preferences. Ids that name no column or row are ignored, so a stored list survives a column being removed.

```vue
<NbSpreadsheet
  v-model:hidden-columns="hiddenColumns"
  v-model:hidden-rows="hiddenRows"
  :columns="columns"
  :rows="rows"
  column-headers="both"
  context-menu
  @column-resize="({ columnId, width }) => saveWidth(columnId, width)"
/>
```

```ts
const hiddenColumns = ref<string[]>(prefs.hiddenColumns ?? [])
const hiddenRows = ref<string[]>([])
```

The exposed `hideColumns`, `showColumns`, `hideRows` and `showRows` do the same from code, for a toolbar button or a saved view.

The context menu's words, and the names of the marks hidden columns and rows leave, come from the library's string catalogue (`spreadsheetCut`, `spreadsheetHideColumns` and the rest), so an app translates them where it translates every other built-in string.

## Sheet mode

Bind `v-model:cells` in place of `columns` and `rows`. The sheet writes every edit into the map itself, so the host has nothing to apply. It still emits `commit` and `change`, with each change's `cell` reference, for an app that saves deltas rather than the whole map.

```vue
<NbSpreadsheet
  v-model:cells="cells"
  :extent="{ minRows: 50, minColumns: 10, maxRows: 2000 }"
  locale="en-GB"
  aria-label="Scratch sheet"
  @change="(changes) => save(changes)"
/>
```

```ts
const cells = ref<TSpreadsheetCells>({
  A1: 'Region',
  B1: 'Total',
  A2: 'North',
  B2: 1200,
})
```

In sheet mode a column's id is its letter and a row's id is its number, so `hiddenColumns: ['C']`, `focus('3', 'B')` and `cellAttrs` all speak in references. Columns are not sortable, since sorting would move rows the references point at.

A wide sheet renders only the columns in view, as every sheet does with its rows. Every column keeps its track, so the scrollbar is true to the sheet's size.

## Theming

The sheet is built on the surface tokens, so it follows any `.nb-layer-N` parent and the dark theme without overrides.

| Token                     | Role                                             |
| ------------------------- | ------------------------------------------------ |
| `--nb-c-surface-accent`   | Column and row headers, and the corner           |
| `--nb-c-surface`          | Toolbar, read-only and computed cells            |
| `--nb-c-surface-raised`   | Editable cells                                   |
| `--nb-c-surface-hover`    | Cell hover                                       |
| `--nb-c-surface-selected` | A selected range, and its column and row headers |
| `--nb-c-border`           | Every line                                       |
| `--nb-c-focus-ring`       | The active cell and the editor                   |

A few component-local properties tune a single sheet. Prefer `size` to setting the heights by hand.

| Property                | Default                  | Purpose                          |
| ----------------------- | ------------------------ | -------------------------------- |
| `--nbss-row-height`     | from `size` (`32px`)     | Data row height                  |
| `--nbss-header-height`  | from `size` (`32px`)     | Header row height                |
| `--nbss-letter-height`  | `24px`                   | The letters row above the labels |
| `--nbss-cell-padding-x` | `0.625rem`               | Horizontal padding inside cells  |
| `--nbss-focus-ring`     | `var(--nb-c-focus-ring)` | The active cell's ring           |

## Props

| Prop             | Type                                                              | Default    | Description                                                                                                            |
| ---------------- | ----------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `columns`        | `ISpreadsheetColumn[]`                                            | -          | Table mode: column definitions, ordered left to right                                                                  |
| `rows`           | `ISpreadsheetRow[]`                                               | -          | Table mode: row data. Pinned rows can appear anywhere in the array                                                     |
| `cellAttrs`      | `(rowId, columnId, row, column) => ISpreadsheetCellAttrs \| void` | -          | Per-cell read-only, class, tooltip or display override                                                                 |
| `computed`       | `(rowId, columnId, get) => unknown`                               | -          | Returns the value of cells that are not in `row.values`                                                                |
| `size`           | `'xs' \| 'sm' \| 'md' \| 'lg'`                                    | `'sm'`     | Row and header height: 24, 32, 40 or 48px                                                                              |
| `ariaLabel`      | `string`                                                          | -          | Accessible name of the grid                                                                                            |
| `resizable`      | `boolean`                                                         | `true`     | Allow column resize from the right edge of the header                                                                  |
| `showGutter`     | `boolean`                                                         | `true`     | Show the row gutter on the left                                                                                        |
| `gutterWidth`    | `number`                                                          | `44`       | Gutter width in pixels. Widen it when rows carry a `label`                                                             |
| `windowRows`     | `number`                                                          | `80`       | Approximate visible rows used by the row virtualization                                                                |
| `locale`         | `string`                                                          | `'pt-PT'`  | Locale for the default number and date formatting. The next major defaults to the runtime's locale                     |
| `fit`            | `boolean`                                                         | `false`    | Fill the parent: columns share the spare width and rows shrink, down to 20px, to fit the height (not on a touch phone) |
| `columnHeaders`  | `'label' \| 'letters' \| 'both'`                                  | `'label'`  | What the headers show: labels, A, B, C letters, or letters above the labels                                            |
| `contextMenu`    | `boolean`                                                         | `false`    | Replace the browser's menu with the sheet's: clipboard, clear, sort, hide and show                                     |
| `hiddenColumns`  | `string[]`                                                        | `[]`       | Ids of hidden columns. `v-model:hidden-columns`, or kept by the sheet when unbound                                     |
| `hiddenRows`     | `string[]`                                                        | `[]`       | Ids of hidden rows. `v-model:hidden-rows`, or kept by the sheet when unbound                                           |
| `cells`          | `TSpreadsheetCells`                                               | -          | Sheet mode: the cells, keyed `A1`. `v-model:cells`. Leave unbound for table mode                                       |
| `extent`         | `'data' \| 'infinite' \| ISpreadsheetExtent`                      | `'data'`   | Sheet mode: how far the grid reaches. `{ minRows, minColumns, maxRows, maxColumns }` sets bounds                       |
| `fillHandle`     | `boolean`                                                         | sheet mode | The fill handle, and `Ctrl+D` and `Ctrl+R`. On in sheet mode, off in table mode                                        |
| `rowReorderable` | `boolean`                                                         | `false`    | Deprecated. Never implemented and has no effect. Removed in the next major                                             |

## Column interface

```typescript
interface ISpreadsheetColumn {
  id: string // stable id
  label: string // header text
  shortLabel?: string // shown while any label does not fit its column
  width?: number // default 120
  minWidth?: number // default 60
  pinned?: 'left' | 'right' // keep the column in view
  align?: 'left' | 'center' | 'right' // default: numbers and dates right, text left
  type?: 'text' | 'number' | 'date' // drives default format, parse and inputmode
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
  pinned?: 'top' | 'bottom' // keep the row in view
  className?: string // row-wide CSS class
  computed?: boolean // derived: read-only and styled as a result
  label?: string // shown in the gutter in place of the row number
}
```

## Cell attributes

```typescript
interface ISpreadsheetCellAttrs {
  readOnly?: boolean
  className?: string
  tooltip?: string
  display?: string // replaces the rendered text
  computed?: boolean // cell-level derived marker
}
```

## Events

| Event                  | Payload                                       | Description                                                     |
| ---------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| `commit`               | `ISpreadsheetChange`                          | One cell was committed (edit, paste, clear, undo, redo)         |
| `change`               | `ISpreadsheetChange[]`                        | The batch of changes from one action                            |
| `selection`            | `ISpreadsheetSelection \| null`               | The range the active cell is in changed                         |
| `focus`                | `{ rowId: string; columnId: string } \| null` | The active cell changed                                         |
| `column-resize`        | `{ columnId: string; width: number }`         | A column was resized, at the end of a drag or on each key       |
| `update:hiddenColumns` | `string[]`                                    | Columns were hidden or shown                                    |
| `update:hiddenRows`    | `string[]`                                    | Rows were hidden or shown                                       |
| `update:cells`         | `TSpreadsheetCells`                           | Sheet mode: the cells after an edit, paste, fill, clear or undo |
| `row-reorder`          | `{ rowId: string; toIndex: number }`          | Deprecated with `rowReorderable`. Never emitted                 |

## Change interface

```typescript
interface ISpreadsheetChange {
  rowId: string
  columnId: string
  cell?: string // sheet mode: the reference, such as 'B3'
  before: unknown
  after: unknown
}
```

## Sheet mode types

```typescript
type TSpreadsheetValue = string | number | boolean | null
type TSpreadsheetCells = Record<string, TSpreadsheetValue>
type TSpreadsheetExtent = 'data' | 'infinite' | ISpreadsheetExtent

interface ISpreadsheetExtent {
  minRows?: number // the least shown, filled or not (default 1)
  minColumns?: number
  maxRows?: number // the most a paste or fill grows to
  maxColumns?: number
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
sheet.value?.focus(rowId, columnId) // make a cell active
sheet.value?.selectColumn(columnId) // select a whole column
sheet.value?.selectRow(rowId) // select a whole row
sheet.value?.selectAll()
sheet.value?.hideColumns(['note']) // and showColumns, hideRows, showRows
sheet.value?.getSelection() // the range the active cell is in
sheet.value?.getSelections() // every range, with the ones added by Cmd/Ctrl-click
sheet.value?.undo()
sheet.value?.redo()
```

## Slots

| Name      | Purpose                                                       |
| --------- | ------------------------------------------------------------- |
| `toolbar` | Renders above the grid. Use for save status, filters, actions |

<!--@include: ./_shared.md-->
