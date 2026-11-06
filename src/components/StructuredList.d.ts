/** One column of a structured list. */
export interface IStructuredListColumn {
  /** The field read off each row, and the name of the cell slot (`cell-{key}`). */
  key: string
  /** The column header. */
  label: string
  /**
   * The column's track, as a CSS grid track size. Defaults to
   * `minmax(0, 1fr)`, so columns share the width and a long value wraps.
   * Give a short fixed column (a count, a date) `auto` or a length.
   */
  width?: string
  /** `'end'` for figures, so a column of numbers lines up on the right. */
  align?: 'start' | 'end'
}

export interface IStructuredListProps {
  /** The columns, in reading order. */
  columns: IStructuredListColumn[]
  /** The rows. Each is read by column `key`. */
  rows: Record<string, unknown>[]
  /**
   * The field that identifies a row, or a function returning it. Defaults to
   * `id`, then the row's index.
   */
  rowKey?:
    | string
    | ((row: Record<string, unknown>, index: number) => string | number)
  /** Tighter rows: 8px above and below a cell instead of 16px. */
  condensed?: boolean
  /** No inline padding at the edges, so the text lines up with the content around the list. */
  flush?: boolean
  /** The list's accessible name. Required when nothing else names it. */
  ariaLabel?: string
  /** Shown in a cell whose value is empty. Defaults to an en dash. */
  empty?: string
}
