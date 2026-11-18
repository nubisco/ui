/**
 * NbSpreadsheet: a spreadsheet-style data grid. The host owns the data, the
 * sheet renders it, captures input and emits changes.
 */

export type TSpreadsheetCellType = 'text' | 'number' | 'date'
export type TSpreadsheetAlign = 'left' | 'center' | 'right'
export type TSpreadsheetPinCol = 'left' | 'right'
export type TSpreadsheetPinRow = 'top' | 'bottom'
export type TSpreadsheetSortDir = 'asc' | 'desc'
/** Carbon's row heights: 24, 32, 40 and 48px. The header matches the row. */
export type TSpreadsheetSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ISpreadsheetColumn {
  /** Stable id used for selection, sort, and host commits. */
  id: string
  /** Header label. */
  label: string
  /**
   * A shorter header label ("Sep" for "September"), shown while `label` does
   * not fit the column's width. The full label stays as the header's tooltip.
   */
  shortLabel?: string
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
  /**
   * Text for the row header in the gutter, in place of the row number. Use
   * it when rows have a name of their own (a day, a total) so the sheet does
   * not need a separate read-only column to show it.
   */
  label?: string
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
  /**
   * @deprecated Never implemented: it has no effect and `row-reorder` is
   * never emitted. It will be removed in the next major.
   */
  rowReorderable?: boolean
  /** Show a row index gutter on the left. Default true. */
  showGutter?: boolean
  /** Width of the gutter in pixels. Default 44. Widen it for `row.label`. */
  gutterWidth?: number
  /** Approximate visible rows used for the simple virtualization. Default 80. */
  windowRows?: number
  /**
   * Locale used for default Intl-based number/date formatting. Default
   * 'pt-PT'. The next major changes the default to the runtime's locale, so
   * pass one explicitly when the formatting matters.
   */
  locale?: string
  /**
   * Fill the parent instead of sizing to the columns. The columns share the
   * width beyond their own (`width` becomes the least they get), and the rows
   * shrink, down to 20px, until every row fits the height. Below that the
   * sheet scrolls as usual. A touch phone keeps the full row height, so every
   * cell stays a target a finger can hit. The parent has to give the sheet a
   * height: a flex column, or a box with a set height.
   */
  fit?: boolean
  /** Row and header height, from Carbon's sizes. Default 'sm' (32px). */
  size?: TSpreadsheetSize
  /** Accessible name of the grid. Name every sheet on a page that has two. */
  ariaLabel?: string
}
