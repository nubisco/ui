enum EAiLabelVariant {
  Default = 'default',
  Inline = 'inline',
}

// #region EAiLabelSize
enum EAiLabelSize {
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
}
// #endregion EAiLabelSize

interface IAiLabelProps {
  variant?: `${EAiLabelVariant}`
  size?: `${EAiLabelSize}`
  /**
   * Render a mark instead of a control: a `span` announced as an image, with
   * no hover or focus state. Set it beside a heading or a block of text that
   * AI wrote, where there is nothing to click.
   */
  static?: boolean
  /** Accessible name of the static mark. */
  label?: string
}

export { EAiLabelVariant, EAiLabelSize, IAiLabelProps }
