import { IFieldComponent } from '@/types/Props.d'

interface ISelectOption {
  label: string
  value: string | number
  disabled?: boolean
  /**
   * The heading this option sits under.
   *
   * Options carrying the same group name, consecutively, are rendered under
   * one heading inside a `role="group"`. The list is never reordered: runs
   * are formed in the order given, because a caller that groups its options
   * has usually already arranged them (versions, sizes, stages), and sorting
   * would undo that.
   *
   * Omit it and nothing changes: a list where no option names a group
   * renders exactly as it did before this existed.
   */
  group?: string
  /**
   * Artwork shown before the label, in the list and on the closed select.
   *
   * For options a person recognises by mark before they read the word:
   * platforms, providers, file kinds. The name is resolved at runtime, so a
   * consumer with the glyph catalogue off registers the names it passes
   * (`registerIcons`). The `option` and `value` slots remain the way to build
   * a row this cannot express.
   */
  icon?: string
}

interface ISelectProps extends IFieldComponent {
  modelValue?: string | number | Array<string | number> | null
  options?: ISelectOption[]
  /** Allows selecting multiple options simultaneously. */
  multiple?: boolean
  /** Shows a text input at the bottom of the dropdown so users can create new options. Emits `create` with the entered value. */
  creatable?: boolean
  /** Placeholder text for the create input when `creatable` is true. */
  createPlaceholder?: string
  /**
   * Shows a button in the trigger that clears the selection, while a value is
   * selected and the select is not disabled. Clearing emits `null`, or `[]`
   * when `multiple`. Off by default.
   */
  clearable?: boolean
  /** Accessible name of the clear button when `clearable` is true. */
  clearLabel?: string
  /**
   * Shows a search box at the top of the open list and focuses it, so typing
   * narrows the options. Matches the label anywhere in it, ignoring case and
   * accents. For long lists (countries, time zones, currencies), where
   * scrolling to find a row is the slow way. Off by default.
   */
  searchable?: boolean
  /** Placeholder, and accessible name, of the search box when `searchable`. */
  searchPlaceholder?: string
  /** Shown when `searchable` and nothing matches what was typed. */
  noResultsLabel?: string
  /**
   * The element the open list hangs under, in place of the select's own
   * trigger. With a `trigger` slot, the slot is a small control inside a
   * larger thing (a breadcrumb), and the list belongs under that thing. A
   * function is read when the list opens, for an element that does not exist
   * yet when the select renders.
   */
  anchor?: HTMLElement | (() => HTMLElement | null | undefined) | null
  /**
   * How the chosen option is marked in the open list of a single select.
   * `fill` colours the row, as a form field does. `check` puts a check mark
   * before it and leaves the row plain, as a menu of places to go does.
   */
  selectedMark?: 'fill' | 'check'
}

export { ISelectOption, ISelectProps }

// Clean aliases — prefer these in new code.
export type { ISelectOption as NbSelectOption, ISelectProps as NbSelectProps }
