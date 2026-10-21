interface IBackToTopProps {
  /**
   * How far the page must be scrolled, in px, before the button appears.
   * Defaults to one screen height: the visitor has left the first screen.
   */
  threshold?: number
  /** The button's accessible name and tooltip. */
  label?: string
}

export type { IBackToTopProps }
