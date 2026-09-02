/**
 * How a term and its value are arranged.
 *
 *   - `'columns'` (default): label on the left, value on the right, on one
 *     line. Reads as a facts table, which is what an inspector wants.
 *   - `'stacked'`: label above value. For long values, or a container too
 *     narrow to give the label a column without squeezing the value.
 *   - `'auto'`: columns above `--nb-definition-list-breakpoint` (360px of
 *     container width), stacked below. Uses a container query, so it responds
 *     to the panel it is in rather than the size of the window, which is the
 *     distinction that matters for an inspector.
 */
export type TDefinitionListLayout = 'columns' | 'stacked' | 'auto'

/** A single fact, when the list is driven by the `items` prop. */
export interface IDefinitionListItem {
  /** The label. */
  term: string
  /** The value. Rendered as text; use the slot form for anything richer. */
  value?: string | number | null
  /**
   * Shown in place of an empty value. Defaults to an em-space-width dash, so a
   * fact that has no value still occupies its row and the list does not appear
   * to have fewer facts than it has.
   */
  empty?: string
}

export interface IDefinitionListProps {
  /**
   * The facts. Omit and use the default slot with `NbDefinitionListItem` when
   * values need markup, a link, or a badge.
   */
  items?: IDefinitionListItem[]
  /** See `TDefinitionListLayout`. */
  layout?: TDefinitionListLayout
  /**
   * Width of the label column in the `columns` layout, as a CSS length. The
   * default is a fraction so long labels wrap rather than starving the value.
   */
  termWidth?: string
  /** Draw a hairline between rows. Off by default: spacing separates them
   *  well enough, and in an inspector the rules add up quickly. */
  dividers?: boolean
  /** Tighter rows, for a dense inspector. */
  compact?: boolean
}

export interface IDefinitionListItemProps {
  /** The label. Use the `term` slot for anything richer than a string. */
  term?: string
}
