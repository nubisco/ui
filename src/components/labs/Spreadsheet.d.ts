/**
 * NbSpreadsheet — labs-tier spreadsheet-style data grid.
 *
 * Status: experimental. API may change. Use via `app.use(NubiscoUILabs)`.
 */

export type TSpreadsheetCellType = 'text' | 'number' | 'date'
export type TSpreadsheetAlign = 'left' | 'center' | 'right'
export type TSpreadsheetPinCol = 'left' | 'right'
export type TSpreadsheetPinRow = 'top' | 'bottom'
export type TSpreadsheetSortDir = 'asc' | 'desc'

export interface ISpreadsheetColumn {
  /** Stable id used for selection, sort, and host commits. */
  id: string
  /** Header label. */
  label: string
  /** Initial pixel width. Default 120. */
  width?: number
  /** Minimum width when the user resizes. Default 60. */
  minWidth?: number
  /** Pin the column to the left or right edge of the viewport. */
  pinned?: TSpreadsheetPinCol
  /** Text alignment inside the cell. Defaults: number+date right, text left. */
  align?: TSpreadsheetAlign
  /** Cell value type — drives default formatter, parser, and input mode. */
  type?: TSpreadsheetCellType
  /** All cells in this column are read-only. */
  readOnly?: boolean
  /** Allow header-click sorting. */
  sortable?: boolean
  /** Host-supplied display formatter. Defaults pick a sensible string. */
  format?: (raw: unknown, row: ISpreadsheetRow) => string
  /** Host-supplied parser for committed edits. Defaults follow `type`. */
  parse?: (input: string) => unknown
}

export interface ISpreadsheetRow {
  id: string
  /** columnId -> raw value */
  values: Record<string, unknown>
  /** Pinned rows stick to the top or bottom of the viewport. */
  pinned?: TSpreadsheetPinRow
  /** Row-wide CSS class for theming (e.g. 'weekend'). */
  className?: string
  /** Marks the row as a totals/computed row — disables editing. */
  computed?: boolean
}

export interface ISpreadsheetCellAttrs {
  readOnly?: boolean
  className?: string
  tooltip?: string
  /** Override the formatted display string. */
  display?: string
  /** Mark a single cell as derived (read-only + style). */
  computed?: boolean
}

export interface ISpreadsheetChange {
  rowId: string
  columnId: string
  before: unknown
  after: unknown
}

export interface ISpreadsheetSelection {
  startRowId: string
  startColumnId: string
  endRowId: string
  endColumnId: string
}

export interface ISpreadsheetProps {
  columns: ISpreadsheetColumn[]
  rows: ISpreadsheetRow[]
  /** Per-cell metadata. Called lazily for visible cells. */
  cellAttrs?: (
    rowId: string,
    columnId: string,
    row: ISpreadsheetRow,
    column: ISpreadsheetColumn,
  ) => ISpreadsheetCellAttrs | void
  /**
   * Compute a derived value for a cell. Lets the host implement totals or
   * formulas without putting raw values in `row.values`. `get` reads other
   * cells' raw values.
   */
  computed?: (
    rowId: string,
    columnId: string,
    get: (rowId: string, columnId: string) => unknown,
  ) => unknown
  /** Allow column resize. Default true. */
  resizable?: boolean
  /** Allow row reorder by dragging the row header. Default false. */
  rowReorderable?: boolean
  /** Show a row index gutter on the left. Default true. */
  showGutter?: boolean
  /** Approximate visible rows used for the simple virtualization. Default 80. */
  windowRows?: number
  /** Locale used for default Intl-based number/date formatting. */
  locale?: string
}
