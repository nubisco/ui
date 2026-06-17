interface ISidebarMenuItemProps {
  /** Visible row label. */
  label: string
  /**
   * Optional icon name (uses NbIcon). Recommended for top-level items in
   * verbose sidebars; child items typically omit it.
   */
  icon?: string
  /**
   * Target route. When vue-router is installed (the app called
   * `app.use(router)`), the row renders as a `<RouterLink>` and accepts any
   * value valid for its `to` prop (a string path or a location object). When
   * vue-router is not present, a string `to` falls back to a plain anchor
   * (`href`) and an object `to` falls back to a button that emits `click`.
   * Ignored for items that have sub-items (those toggle/expand instead).
   */
  to?: string | Record<string, unknown>
  /** External href, used when `to` is not set. Always renders a plain anchor. */
  href?: string
  /** Marks the row as the currently active route. */
  active?: boolean
  /** Prevents interaction. */
  disabled?: boolean
  /**
   * Initial expanded state when the item has sub-items. Ignored when there
   * are no children.
   * @default false
   */
  defaultExpanded?: boolean
  /** Small badge text displayed on the right (counts, status). */
  badge?: string | number
  /**
   * Visual variant of the badge.
   * - 'neutral' (default): muted, blends with sidebar
   * - 'accent': uses the sidebar active colour, ideal for feature flags
   *   like "AI", "BETA", "NEW"
   * - 'success' | 'warning' | 'danger': semantic colours
   */
  badgeVariant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
}

export { ISidebarMenuItemProps }
