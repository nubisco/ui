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
/**
 * What the column headers show: each column's `label`, its letter (A, B, C,
 * from its place in the sheet), or the letters in a compact row above the
 * labels.
 */
export type TSpreadsheetColumnHeaders = 'label' | 'letters' | 'both'
/** A value in sheet mode: a number, text, or nothing. */
export type TSpreadsheetValue = string | number | boolean | null
/**
 * The cells of a sheet-mode sheet, keyed by reference: `{ A1: 'Rent', B1: 950 }`.
 * An empty cell has no key.
 */
export type TSpreadsheetCells = Record<string, TSpreadsheetValue>

/** Bounds for a sheet-mode sheet. Each one is a count of rows or columns. */
export interface ISpreadsheetExtent {
  /** The least the sheet shows, filled or not. Default 1. */
  minRows?: number
  minColumns?: number
  /** The most it grows to, by typing, pasting or filling. */
  maxRows?: number
  maxColumns?: number
}
/**
 * How far a sheet-mode sheet reaches. 'data' ends at the last filled row and
 * column. An object sets bounds. 'infinite' grows as it is scrolled.
 */
export type TSpreadsheetExtent = 'data' | 'infinite' | ISpreadsheetExtent

/**
 * What a cell's colour means, not the colour itself: each one paints the
 * library's status surface pair, so it follows the theme and dark mode.
 */
export type TSpreadsheetIntent =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'

/**
 * How a number is shown. The value stays the number: a format changes only
 * the text in the cell. `decimals` is fixed when set, up to 10 otherwise.
 */
export type TSpreadsheetNumberFormat =
  | { type: 'number'; decimals?: number; grouping?: boolean }
  | { type: 'percent'; decimals?: number }
  | { type: 'currency'; currency: string; decimals?: number }

/** The look of one cell in sheet mode. */
export interface ISpreadsheetCellStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  /** Default: numbers to the right, everything else to the left. */
  align?: TSpreadsheetAlign
  intent?: TSpreadsheetIntent
  format?: TSpreadsheetNumberFormat
}

/** Sheet-mode styles, keyed by reference like the cells. */
export type TSpreadsheetStyles = Record<string, ISpreadsheetCellStyle>

/**
 * A conditional format's test. The comparisons work on the value a cell
 * shows, so a formula's result is compared, not its text. A `formula` rule is
 * written for the range's first cell and moves with each cell, as in a
 * desktop spreadsheet: `=B2>A2` on `B2:B9` compares each row with column A.
 */
export type TSpreadsheetRule =
  | {
      when:
        | 'greaterThan'
        | 'lessThan'
        | 'greaterOrEqual'
        | 'lessOrEqual'
        | 'equal'
        | 'notEqual'
      value: number | string
    }
  | { when: 'between' | 'notBetween'; min: number; max: number }
  | {
      when: 'contains' | 'notContains' | 'startsWith' | 'endsWith'
      text: string
    }
  | { when: 'empty' | 'notEmpty' | 'error' }
  | { when: 'formula'; formula: string }

/** Styles a range's cells while they pass a rule. */
export interface ISpreadsheetConditionalFormat {
  /** A reference or range: 'B2:B20', 'C:C', 'A1'. */
  range: string
  rule: TSpreadsheetRule
  /** Only the look applies: a rule never changes a number's format. */
  style: Omit<ISpreadsheetCellStyle, 'format'>
}

/** Options for reading a sheet out as CSV. */
export interface ISpreadsheetCsvOptions {
  /** Default ','. */
  delimiter?: string
  /**
   * 'display' writes what each cell shows, formatted. 'raw' writes the values,
   * and formulas as their text. Default 'raw'.
   */
  values?: 'raw' | 'display'
}

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
  /** Cell value type: drives the default formatter, parser and input mode. */
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
  /** Marks the row as a totals or computed row, which disables editing. */
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
  /** The cell's reference in sheet mode, such as 'B3'. */
  cell?: string
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
  /** The columns of a table-mode sheet. Sheet mode makes its own. */
  columns?: ISpreadsheetColumn[]
  /** The rows of a table-mode sheet. Sheet mode makes its own. */
  rows?: ISpreadsheetRow[]
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
  /**
   * What the column headers show. Default 'label'. 'letters' shows A, B, C in
   * place of the labels, which stay as each header's tooltip and accessible
   * name. 'both' adds a compact row of letters above the labels.
   *
   * Hidden columns and rows are `v-model:hidden-columns` and
   * `v-model:hidden-rows` (arrays of ids). Left unbound, the sheet keeps them
   * itself.
   */
  columnHeaders?: TSpreadsheetColumnHeaders
  /**
   * Replace the browser's menu on a right click, `Shift+F10` and the menu key
   * with the sheet's own: cut, copy, paste, clear, sort, and hiding and
   * showing columns and rows. Default false.
   */
  contextMenu?: boolean
  /**
   * How far a sheet-mode sheet reaches. Default 'data': it ends at the last
   * filled row and column. Ignored in table mode.
   *
   * Sheet mode is `v-model:cells`: bind it and the sheet makes columns A, B,
   * C and rows 1, 2, 3 over the cells, and writes edits back into them.
   */
  extent?: TSpreadsheetExtent
  /**
   * Show the fill handle on the selection, and fill with `Ctrl+D` and
   * `Ctrl+R`. Default: on in sheet mode, off in table mode.
   */
  fillHandle?: boolean
  /**
   * Sheet mode: styles applied while a range's cells pass a rule. A later
   * entry wins where two set the same thing, and both win over `styles`.
   */
  conditionalFormats?: ISpreadsheetConditionalFormat[]
  /**
   * Sheet mode: work out cells whose text starts with `=` as formulas, such
   * as `=SUM(B2:B9)`. The cells keep the formula and the sheet shows its
   * result. Default true. The engine is `@nubisco/ui/formula`.
   */
  formulas?: boolean
  /**
   * Show the formula bar above the grid: the active cell's reference and its
   * contents, a formula as written. Default: on in sheet mode with formulas.
   */
  formulaBar?: boolean
}
