/**
 * Why the space is empty. This is not decoration: the four cases want
 * different copy and different actions, and naming the case is what stops a
 * product writing "No results" over a failed request.
 *
 *   - `'empty'` (default): there is nothing here yet, and the user can create
 *     the first one. The action is to create.
 *   - `'no-results'`: there IS data, but this filter or search matched none of
 *     it. The action is to widen the search, never to create.
 *   - `'error'`: the request failed. The action is to retry. Do not offer to
 *     create something in a view that could not load.
 *   - `'forbidden'`: the data exists and this user may not see it. There is
 *     usually no action, and inventing one is worse than admitting it.
 */
export type TEmptyStateKind = 'empty' | 'no-results' | 'error' | 'forbidden'

/** How much room the empty state takes. */
export type TEmptyStateSize = 'sm' | 'md'

export interface IEmptyStateProps {
  /**
   * Short, and a positive statement where the situation allows one. Carbon's
   * example is the rule of thumb: "Start by adding data assets" reads better
   * than "You don't have any data assets".
   */
  title?: string
  /**
   * What to do next, and if it helps, why the space is empty. One or two
   * sentences. Longer than that and it stops being read.
   */
  description?: string
  /** Icon name. Defaults to one that suits `kind`; pass `null` for none. */
  icon?: string | null
  /** See `TEmptyStateKind`. */
  kind?: `${TEmptyStateKind}`
  /** `'md'` (default) for a whole view, `'sm'` inside a panel or a card. */
  size?: `${TEmptyStateSize}`
  /**
   * Draw a dashed outline around the space. For an empty region that would
   * otherwise have no edges, like a drop zone or an empty column, where the
   * text alone leaves the reader unsure how big the empty thing is.
   */
  bordered?: boolean
}
