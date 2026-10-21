import type { TButtonSize } from './Button.d'

interface ICopyButtonProps {
  /** What lands on the clipboard: a link, a key, a token. */
  text: string
  /**
   * What the button does, as its accessible name and tooltip. Say what is
   * copied ("Copy link to MA-123"), not just "Copy".
   */
  label?: string
  /** What the button says once it has copied. */
  copiedLabel?: string
  size?: TButtonSize
  /** How long the checkmark stays before the button resets, in ms. */
  duration?: number
}

export type { ICopyButtonProps }
