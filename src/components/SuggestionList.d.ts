interface ISuggestionListProps<T = unknown> {
  /** The suggestions, already filtered by whatever the person has typed. */
  items: T[]
  /**
   * Whether the list is showing. Supports `v-model:open`: Escape, choosing an
   * item and leaving the field all set it to `false`. Defaults to `true`, so a
   * list rendered under a `v-if` needs nothing else.
   */
  open?: boolean
  /** The text of an item. Defaults to `item.label`, or the item itself. */
  itemLabel?: (item: T) => string
  /** A stable key for an item. Defaults to its label. */
  itemKey?: (item: T, index: number) => string | number
  /**
   * Shown when `items` is empty. Without it (or an `#empty` slot) an empty
   * list is not drawn at all, which suits a list that only opens on a match.
   */
  emptyText?: string
  /**
   * Which side of the field the list opens on. `'top'` suits a composer at
   * the bottom of a panel, where a list below would fall off the screen.
   */
  placement?: 'bottom' | 'top'
  /** Accessible name of the list, for example "People" or "Keys". */
  label?: string
  /**
   * Id of the input or textarea that drives the list, when the list is not in
   * an `NbTextInput`'s `#dropdown` slot. Inside the slot it is found for you.
   */
  for?: string
  /** Id of the list. Generated when not given. */
  id?: string
}

export { ISuggestionListProps }
