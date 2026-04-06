interface ISidebarLinkProps {
  /**
   * When provided the component renders as an `<a>` element.
   * Accepts any string valid for `href` / RouterLink's `to`.
   */
  to?: string | Record<string, unknown>
  /** External href — renders as `<a>`. Takes lower precedence than `to`. */
  href?: string
  /** Tooltip text shown to the right of the sidebar on hover. */
  tooltip?: string
  /** Marks the link as the currently active route. */
  active?: boolean
  /** Prevents interaction. */
  disabled?: boolean
  /**
   * Applies a danger (red) hover style — use for destructive actions like
   * sign-out.
   */
  danger?: boolean
}

export { ISidebarLinkProps }
