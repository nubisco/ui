interface INubiscoMarkProps {
  /**
   * Rendered edge length. A number is taken as pixels; a string is passed to
   * CSS as given, so `'1.5rem'` and `'100%'` both work.
   */
  size?: number | string
  /**
   * Accessible name. Provide it when the mark carries meaning on its own (a
   * bare logo link, a splash screen). Omit it when adjacent text already names
   * the product, and the mark is hidden from assistive technology instead of
   * being announced twice.
   */
  title?: string
}

export { INubiscoMarkProps }
