interface ISidebarLinkProps {
  /**
   * Target route. When vue-router is installed, the link renders as a
   * `<RouterLink>` and accepts any value valid for its `to` prop (string path or
   * location object). Without vue-router, a string `to` falls back to a plain
   * `<a>` and an object `to` falls back to a `<button>` that emits `click`.
   */
  to?: string | Record<string, unknown>
  /** External href — renders as a plain `<a>`. Used when `to` is not set. */
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
