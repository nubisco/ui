/**
 * The two sizes a close control comes in, after Carbon. `lg` (48px) is the
 * close of a surface that owns the screen or a column of it: a dialog, a side
 * panel, a sheet. `sm` (32px) is the inline close of something that sits in
 * the page: a toast, a banner, a tag, a panel header. Nothing in between, so
 * the same job never comes in seven sizes again.
 */
type TCloseButtonSize = 'sm' | 'lg'

interface ICloseButtonProps {
  /**
   * The words for the button: its accessible name and its tooltip. Defaults
   * to the catalogue's `close` ("Close"). Pass a longer one when the page has
   * more than one thing to close ("Close notifications").
   */
  label?: string
  /** `lg` for dialogs, side panels and sheets, `sm` inline. Defaults to `sm`. */
  size?: TCloseButtonSize
  disabled?: boolean
  /** Where the tooltip opens. Defaults to `bottom`, as on every icon button. */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
}

export type { ICloseButtonProps, TCloseButtonSize }
