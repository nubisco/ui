/** Emitted when a row lands somewhere new. */
export interface IReorderEvent {
  /** Index the row came from, in the array as it was before the move. */
  from: number
  /** Index it landed on, in the array as it is after the move. */
  to: number
  /** How the move was made. Useful for analytics, and for deciding whether to
   *  announce the result: a pointer user saw it happen, a keyboard user did
   *  not necessarily. */
  via: 'pointer' | 'keyboard'
}

export interface IReorderListProps<T = unknown> {
  /**
   * The rows, in order. Use `v-model` to have the component write the new
   * order back, or bind `:model-value` and handle `reorder` yourself when the
   * order lives on a server and the move can fail.
   */
  modelValue?: T[]
  /**
   * Key for each row. A property name, or a function. Rows need a stable
   * identity that survives reordering; an index cannot provide one, because
   * the index is the thing that changes.
   */
  itemKey?: string | ((item: T, index: number) => string | number)
  /**
   * Restrict dragging to an explicit handle, exposed through the `handle`
   * slot. Off by default: a row that is only a label is easier to drag whole.
   * Turn it on when a row contains its own controls, where dragging from
   * anywhere would fight the buttons inside it.
   */
  handle?: boolean
  /** Nothing can be moved. Rows still render and are still readable. */
  disabled?: boolean
  /**
   * Accessible name for the list. Announced when focus enters, and used in the
   * instructions a screen reader gets, so it should say what is being ordered:
   * "Fields", "Blocks in this zone".
   */
  label?: string
}
