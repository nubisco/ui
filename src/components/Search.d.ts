/**
 * A search field: a magnifying glass at the start, a clear button once there
 * is a query, and Escape to clear it. Bind the query with `v-model`.
 *
 * It has no outer margin and fills the width it is given, so it sits flush
 * in a toolbar or a table header. `expandable` folds it to a square button
 * the height of the field until it is wanted.
 */
interface ISearchProps {
  /**
   * The field's accessible name, and the collapsed button's tooltip. It is
   * not shown as a visible label: a search field's icon is its label.
   * Defaults to the string catalogue's `searchLabel` ("Search").
   */
  label?: string
  /** Defaults to the string catalogue's `searchPlaceholder` ("Search"). */
  placeholder?: string
  /** The shared control height: xs 24, sm 32, md 40, lg 48. */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /**
   * Starts as a square icon-only button the size of the field. A click, or
   * Tab onto it, opens the field and moves focus into it. It folds back when
   * focus leaves an empty field, and on Escape, which also clears it.
   * Bind `v-model:expanded` to open or read it from outside.
   */
  expandable?: boolean
  disabled?: boolean
  /** The native input's id. Generated if omitted. */
  id?: string
  /** The native input's name. */
  name?: string
}

export type { ISearchProps }
