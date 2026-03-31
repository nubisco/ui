enum EMessageVariant {
  Error = 'error',
  Warning = 'warning',
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
}

export { EMessageVariant, IMessageProps }
