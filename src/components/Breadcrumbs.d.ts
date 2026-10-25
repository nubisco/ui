/**
 * One crumb of an `NbBreadcrumbs` trail given through `items`.
 *
 * What it renders as follows from what it carries, the same way `NbButton`
 * chooses its element:
 *
 * - `to`: a `<RouterLink>` when vue-router is installed, otherwise an `<a>`
 *   for a string path.
 * - `href`: an `<a>`.
 * - `onClick`, or a `select` listener on the trail: a `<button>`. Right for
 *   the way back OUT of something a view opened inside itself, which has no
 *   route of its own.
 * - none of these: plain text.
 *
 * The current crumb is never interactive. It renders as text with
 * `aria-current="page"`, whatever it carries.
 */
export interface IBreadcrumbItem {
  /** The text of the crumb. */
  label: string
  /** Target route. A location object needs vue-router. */
  to?: string | Record<string, unknown>
  /** A plain link target, for a crumb that leaves the app's router. */
  href?: string
  /** Forwarded to the `<a>` when `href` is set. */
  target?: string
  /** Called when the crumb is activated. Makes a crumb with no link a button. */
  onClick?: (event: MouseEvent) => void
  /**
   * Marks the page the user is on. When no item sets it, the last item is the
   * current one, which is what a trail almost always means.
   */
  current?: boolean
}
