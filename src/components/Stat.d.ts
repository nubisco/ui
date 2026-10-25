/**
 * The colour of a tile. `neutral` is a plain surface; the others fill the tile
 * with that status's quiet ground and set the number in its ink, for counts
 * whose meaning is the status itself (created, failed, needs review).
 */
type TStatStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

/** Which way the value moved against whatever it is compared with. */
type TStatTrend = 'up' | 'down' | 'flat'

interface IStatProps {
  /** What the number counts, for example "Visitors" or "Needs review". */
  label: string
  /**
   * The number, already formatted for the reader (`'1,204'`, `'42%'`,
   * `'3m 12s'`). The tile does not format it, because only the product knows
   * the unit and the locale. Use the `value` slot for anything richer.
   */
  value?: string | number
  /** Tints the tile with a status. Defaults to `'neutral'`. */
  status?: TStatStatus
  /** The change, already formatted: `'+12%'`, `'-3'`. Drawn beside the arrow. */
  delta?: string
  /**
   * Which way the value moved. Draws an arrow, and colours the delta: up is
   * good, down is bad, flat is neither. Set `invertTrend` where a fall is the
   * good news (an error rate, a bounce rate).
   */
  trend?: TStatTrend
  /** Down is good and up is bad, for a figure that should fall. */
  invertTrend?: boolean
  /** What the delta is measured against, shown after it: `'vs last week'`. */
  comparison?: string
  /**
   * `md` (default) for a row of tiles, `lg` for the one headline figure, and
   * `sm` for a dense KPI row above a table or a chart: tighter padding and a
   * smaller figure, 59px tall without a delta against 86px for `md`.
   */
  size?: 'sm' | 'md' | 'lg'
  /** Shows a placeholder where the value goes and marks the tile busy. */
  loading?: boolean
  /** Target route, as on `NbCard` and `NbButton`. Makes the tile a link. */
  to?: string | Record<string, unknown>
  /** Makes the tile a plain link. `to` wins when both are set. */
  href?: string
  /** Link target, only meaningful alongside `href` or `to`. */
  target?: string
  /**
   * Makes the tile a button that emits `select`, for a tile that changes
   * something in place, such as which metric a chart below it plots.
   */
  clickable?: boolean
  /** Draws the tile as chosen, for the tile whose metric is on show. */
  selected?: boolean
  /** Non-interactive and muted. */
  disabled?: boolean
}

export { IStatProps, TStatStatus, TStatTrend }
