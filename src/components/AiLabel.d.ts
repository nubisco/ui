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
  /**
   * `sm`, `md` or `lg`: a 24, 32 or 40px square for the default variant, and
   * 12, 14 or 16px type for the inline one.
   */
  size?: `${EAiLabelSize}`
  /**
   * Always render the mark, even when there is something to open. Without it
   * the label is already a mark unless it has something to do, so this is
   * only needed to silence a label whose host passes content it should not
   * show.
   */
  static?: boolean
  /**
   * Accessible name. Defaults to "AI, show information" for the control and
   * "Written by AI" for the mark.
   */
  label?: string
  /**
   * The visible word of the inline variant, beside the dot. Default "AI".
   * An empty string draws the glyph instead.
   */
  text?: string
}

export { EAiLabelVariant, EAiLabelSize, IAiLabelProps }
