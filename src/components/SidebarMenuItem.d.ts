import type { TIconSource } from '@/types/Glyph.d'
interface ISidebarMenuItemProps {
  /** Visible row label. */
  label: string
  /**
   * Optional icon name (uses NbIcon). Recommended for top-level items in
   * verbose sidebars; child items typically omit it.
   */
  icon?: TIconSource
  /**
   * A picture drawn in the icon's place, as a small round `NbAvatar`: the logo
   * of a project, a client or a space. Takes the place of `icon` when set.
   *
   * `null` draws the label's initials there instead, for a row whose siblings
   * carry pictures and which has none, so the labels of a list still line up.
   * Left out, nothing is drawn and the row is exactly as it was.
   */
  picture?: string | null
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
  /**
   * Something behind this destination is running right now: a job, an
   * agent, a sync. Draws a small pulsing dot at the end of the label, before
   * any badge. On the collapsed rail it sits on the icon's top-right corner,
   * where a count would go, or on its bottom-right corner when the item
   * also has a badge. Reduced motion stops the pulse and keeps the dot.
   *
   * The dot is named by `liveLabel` for assistive technology. Absent by
   * default, and the row is then exactly as it was.
   */
  live?: boolean
  /**
   * The live dot's accessible text. Defaults to the string catalogue's
   * `sidebarMenuItemLive` ("Running").
   */
  liveLabel?: string
}

export { ISidebarMenuItemProps }
