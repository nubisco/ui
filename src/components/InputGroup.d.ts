import type { TInputGroupSize } from './InputGroup.context'

/**
 * One control made of a field and the buttons flush against it: an email
 * field with its Invite button, a URL with Copy, an amount with its unit.
 *
 * The group owns the label above the row and the message below it, so the
 * fields inside it are bare and every box in the row lines up on the control
 * row rather than on whichever child happens to have a label.
 */
interface IInputGroupProps {
  /** The label above the row. It points at the first field in the group. */
  label?: string
  /** Helper text below the row, when there is no error or warning. */
  helper?: string
  /** Error below the row. The fields in the group draw their error state. */
  error?: string
  /** Warning below the row. The fields in the group draw their warning state. */
  warning?: string
  /**
   * The height of every control in the row, from the scale fields and
   * buttons share (xs 24, sm 32, md 40, lg 48). The fields inside take it
   * over their own `size`, and a button is held to the same height. Pass the
   * slot's `size` to your buttons as well, so their icons are sized for it.
   */
  size?: TInputGroupSize
  /** Disables the fields inside. Buttons read the slot's `disabled`. */
  disabled?: boolean
  /** Marks the label as required. */
  required?: boolean
  /** The id of the first field, which the label points at. Generated if omitted. */
  id?: string
}

export type { IInputGroupProps, TInputGroupSize }
