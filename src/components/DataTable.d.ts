import type { VNodeChild } from 'vue'
import type { ESizeShort } from '@/types/Size.d'

/**
 * NbDataTable: presentational, data-driven table for read-mostly application
 * lists, modeled on the Carbon Design System Data Table. It renders full
 * `<table>` semantics with sorting, selection, states, density, sticky header
 * and horizontal scroll. It is NOT an editable spreadsheet. Reach for
 * `NbSpreadsheet` when cells must be edited in place.
 */

// #region alignment / identity helpers
/** Horizontal alignment for a column's header and body cells. */
export type TColumnAlign = 'left' | 'center' | 'right'

/**
 * Value used to identify a row. Either the name of a property on the row, or a
 * function deriving a stable key from the row. Keys drive selection, sorting
 * reconciliation and Vue's `:key`.
 */
export type TRowKey<T> = keyof T | ((row: T) => string | number)
// #endregion

// #region column
/**
 * A single column definition. Custom cell content can be supplied three ways,
 * in precedence order: the `#cell-<key>` slot, then the `render` function, then
 * the raw value read from `row[key]`.
 */
export interface IDataTableColumn<T = Record<string, unknown>> {
  /** Stable identifier, also the default property read from each row and the
   *  value emitted in sort events / used to target the `#cell-<key>` slot. */
  key: string
  /** Header label shown in the `<th>`. */
  header: string
  /** Fixed column width. A number is treated as pixels, a string is used
   *  verbatim (e.g. `'20%'`, `'12rem'`). Applied via `<colgroup>`. */
  width?: string | number
  /** Horizontal alignment of the header and its body cells. Default `left`. */
  align?: TColumnAlign
  /** Enables click / keyboard sorting on the header and exposes `aria-sort`. */
  sortable?: boolean
  /** Per-column cell renderer. Receives the row and the resolved cell value and
   *  returns renderable content. Overridden by a `#cell-<key>` slot when both
   *  are present. */
  render?: (row: T, value: unknown, rowIndex: number) => VNodeChild
  /** Extra class applied to every body cell in this column. */
  cellClass?: string
  /** Accessible-but-hidden columns still occupy a `<col>`. Set to hide. */
  hidden?: boolean
}
// #endregion

// #region sorting
/** Sort directions. `none` clears sorting for the column. */
export type TSortDirection = 'asc' | 'desc' | 'none'

/** Controlled sort descriptor. `key` matches an `IDataTableColumn.key`. */
export interface IDataTableSortState {
  key: string
  direction: TSortDirection
}
// #endregion

// #region selection
/** Selection mode for the leading control column. */
export type TDataTableSelectable = 'none' | 'single' | 'multiple'
// #endregion

/**
 * Props for `NbDataTable`. Sorting, selection and pagination are all
 * *controlled*: the component emits intent and reflects the props you pass
 * back, it does not mutate `rows` itself. This keeps it honest for server-side
 * paging and sorting.
 */
export interface IDataTableProps<T = Record<string, unknown>> {
  /** Column definitions, left to right. */
  columns: IDataTableColumn<T>[]
  /** Row data. Order is respected as-is (sort server- or parent-side). */
  rows: T[]
  /** Row identity. See {@link TRowKey}. */
  rowKey: TRowKey<T>
  /** Density. Matches the shared `ESizeShort` scale. Default `md`. */
  size?: ESizeShort | 'sm' | 'md' | 'lg'
  /** Controlled sort state, reflected in header UI and `aria-sort`. */
  sortState?: IDataTableSortState | null
  /** Row selection mode. Default `none`. */
  selectable?: TDataTableSelectable
  /** Controlled selected row keys (`v-model:selected`). */
  selected?: (string | number)[]
  /** Renders skeleton placeholder rows instead of data. */
  loading?: boolean
  /** Number of skeleton rows shown while `loading`. Default 5. */
  skeletonRows?: number
  /** Error message shown in place of the body. Overrides `empty`. */
  error?: string
  /** Message shown when there are no rows and not loading. */
  emptyMessage?: string
  /** Pins the header while the body scrolls vertically. Default true. */
  stickyHeader?: boolean
  /** Alternating row background (Carbon "zebra"). Default false. */
  zebra?: boolean
  /** Optional toolbar title. */
  title?: string
  /** Optional toolbar sub-text under the title. */
  description?: string
  /** Accessible name for the `<table>` (rendered as a visually-hidden
   *  `<caption>` when no `title` is set). */
  ariaLabel?: string
}

/** Payload emitted by `NbDataTable` events. */
export interface IDataTableEmits<T = Record<string, unknown>> {
  /** Next sort state after the user activates a sortable header. */
  sort: [state: IDataTableSortState]
  /** Updated selected keys (`v-model:selected`). */
  'update:selected': [keys: (string | number)[]]
  /** A body row was clicked (not fired for checkbox / action clicks). */
  'row-click': [row: T, rowIndex: number]
}

export type {
  IDataTableColumn as NbDataTableColumn,
  IDataTableProps as NbDataTableProps,
  IDataTableSortState as NbDataTableSortState,
  IDataTableEmits as NbDataTableEmits,
  TColumnAlign as NbDataTableAlign,
  TSortDirection as NbDataTableSortDirection,
  TDataTableSelectable as NbDataTableSelectable,
  TRowKey as NbDataTableRowKey,
}
