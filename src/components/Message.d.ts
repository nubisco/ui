enum EMessageVariant {
  Error = 'error',
  Warning = 'warning',
  Success = 'success',
  Helper = 'helper',
}

interface IMessageProps {
  variant?: `${EMessageVariant}`
  /**
   * Icon-only mode: hides the text and shows only an icon.
   * On hover, the message text appears via a CSS tooltip.
   * Used in the TextInput `fluid` variant.
   */
  iconOnly?: boolean
  /**
   * How the message is announced. `auto` (default) is a status region,
   * assertive for an error. Form fields pass `off` for a message rendered
   * with the page and `alert` or `status` once it changes.
   */
  live?: 'auto' | 'off' | 'alert' | 'status'
}

export { EMessageVariant, IMessageProps }
