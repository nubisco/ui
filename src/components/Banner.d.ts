enum EBannerStatus {
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
  Neutral = 'neutral',
}

enum EBannerVariant {
  /**
   * Reports the outcome of something the user did. Sits at the top of the
   * content it concerns, and can be dismissed once it has been read.
   */
  Inline = 'inline',
  /**
   * Guidance that loads WITH the page and is true for as long as the page is:
   * a trial expiring, a draft awaiting approval, an environment that is not
   * production. It cannot be dismissed, because dismissing it would not make it
   * untrue. Carbon's callout, and the reason `dismissible` is not simply on by
   * default.
   */
  Callout = 'callout',
}

interface IBannerProps {
  /** The emotional tone, which picks the ground, the ink and the icon. */
  status?: `${EBannerStatus}`
  /** Whether this reports an outcome (inline) or states a standing fact (callout). */
  variant?: `${EBannerVariant}`
  /**
   * Short and declarative, no full stop. The body says the rest.
   * Rendered ahead of the default slot, in the same paragraph, so a banner
   * reads as one sentence to a screen reader rather than two fragments.
   */
  title?: string
  /**
   * Show a close button. Ignored for `callout`, which by definition states
   * something that is still true after you stop looking at it.
   */
  dismissible?: boolean
  /** Icon name override. Defaults to the icon that matches `status`. */
  icon?: string
  /** Hide the icon entirely. The colour alone must then not be the only cue. */
  hideIcon?: boolean
  /**
   * Full-bleed: drops the radius and the side borders, keeping only the bottom
   * one. For a banner that spans a region edge to edge, such as NbShell's
   * `#notification` slot.
   */
  flush?: boolean
}

export { EBannerStatus, EBannerVariant, IBannerProps }
