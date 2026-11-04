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
/**
 * One place a crumb can be switched to: another company, client, repository or
 * year at the same level.
 */
export interface IBreadcrumbOption {
  /** The text of the option. */
  label: string
  /** Route to go to when it is picked. A location object needs vue-router. */
  to?: string | Record<string, unknown>
  /** A plain link target, for an option that leaves the app's router. */
  href?: string
  /**
   * Identifies the option. Compared with the item's `value` to mark the
   * current one. Defaults to the option's position.
   */
  value?: string | number
  /** Artwork shown before the label. */
  icon?: string
  /**
   * A picture shown before the label in the list, as a small round `NbAvatar`:
   * the logo of the company, client or space the option stands for. `null`
   * draws the label's initials there, so a list where only some options carry
   * a picture still lines up. Takes the place of `icon` when set.
   */
  picture?: string | null
}

export interface IBreadcrumbItem {
  /** The text of the crumb. */
  label: string
  /** Target route. A location object needs vue-router. */
  to?: string | Record<string, unknown>
  /** A plain link target, for a crumb that leaves the app's router. */
  href?: string
  /** Forwarded to the `<a>` when `href` is set. */
  target?: string
  /**
   * A picture before the label, as a small round `NbAvatar`: the logo of the
   * company, client or space the crumb names. `null` draws the label's
   * initials there. Left out, the crumb is its label alone.
   */
  picture?: string | null
  /**
   * The label is a key, a path or an identifier rather than a name: drawn in
   * the monospace face as a small chip, whatever the crumb renders as.
   */
  code?: boolean
  /** Called when the crumb is activated. Makes a crumb with no link a button. */
  onClick?: (event: MouseEvent) => void
  /**
   * Marks the page the user is on. When no item sets it, the last item is the
   * current one, which is what a trail almost always means.
   */
  current?: boolean
  /**
   * The siblings of this crumb, when it stands for one of several (a company, a
   * client, a repository, a year). A small up and down chevron after the label
   * opens them in a searchable list, under the crumb. Picking one goes to its
   * `to` or `href` and emits `switch` on the trail.
   *
   * Works on any crumb, the current one included: the label and the chevron are
   * separate controls, so a crumb that links still links.
   */
  options?: IBreadcrumbOption[]
  /**
   * The `value` of the current option, marked with a check. When omitted, the
   * option whose label equals the crumb's.
   */
  value?: string | number
  /** Accessible name of the chevron button. Defaults to "Switch <label>". */
  switchLabel?: string
  /** Placeholder, and accessible name, of the search box. Defaults to "Find". */
  searchPlaceholder?: string
  /** Shown when nothing matches the search. Defaults to "No results". */
  noResultsLabel?: string
}
