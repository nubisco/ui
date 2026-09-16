/**
 * One entry in the contents: a section of the page and where it is.
 *
 * Flat, in document order, with the heading level. The component works out the
 * nesting itself, the way a document outline does, so a host can pass the
 * headings it already has without building a tree first.
 */
interface ITableOfContentsItem {
  /**
   * Identifies the section. By default it is also the target element's `id`
   * and the `#fragment` the link points at.
   */
  id: string
  /** The text shown for the section. */
  label: string
  /**
   * Heading level, 1 to 6. Nesting is relative: an h4 straight under an h2 is
   * one step in, not two, so a skipped level does not open an empty indent.
   */
  level: number
}

/** An item with the entries nested under it. Built internally from the flat list. */
interface ITableOfContentsNode extends ITableOfContentsItem {
  children: ITableOfContentsNode[]
}

/** Where the contents sit. */
type TTableOfContentsVariant = 'docked' | 'floating'

interface ITableOfContentsProps {
  /** The sections, in document order. */
  items: ITableOfContentsItem[]
  /**
   * The section being read (`v-model:active`). Left unbound, the component
   * tracks it on its own from the scroll position.
   */
  active?: string | null
  /**
   * Whether the list is showing (`v-model:open`). Left unbound, a docked
   * contents starts open and a floating one starts closed.
   */
  open?: boolean
  /**
   * `docked` sits in a page gutter. `floating` is the narrow form for a page
   * with no gutter: a single button that opens the list on a surface over the
   * page, closes again once a section is chosen, and closes on Escape. The host
   * positions it.
   */
  variant?: TTableOfContentsVariant
  /** A docked contents can be hidden down to its show button. */
  collapsible?: boolean
  /** Visible heading above the list. */
  title?: string
  /** Accessible name of the navigation landmark. */
  label?: string
  /** Accessible name of the button that shows the list. */
  showLabel?: string
  /** Accessible name of the button that hides the list. */
  hideLabel?: string
  /**
   * The element the sections live in. Targets are looked up inside it, and the
   * scroll container is the nearest scrolling ancestor of the first target.
   * Unset, the whole document.
   */
  root?: HTMLElement | null
  /**
   * Finds the element for a section. By default, the element whose `id` is the
   * item's `id`. Supply one when the targets have no ids, for example headings
   * in an editor that rebuilds them as they are typed.
   */
  resolveTarget?: (
    item: ITableOfContentsItem,
    index: number,
  ) => HTMLElement | null
  /** Follow the scroll position to highlight the section being read. */
  spy?: boolean
  /**
   * How far below the top of the scroll viewport, in pixels, a section's
   * heading still counts as the one being read. Keep it larger than the
   * targets' `scroll-margin-top`, so the section a link scrolled to is the one
   * highlighted.
   */
  offset?: number
  /**
   * Write the chosen section's `#id` to the address bar, replacing the current
   * entry, so Back leaves the page rather than walking the outline.
   */
  updateHash?: boolean
  /**
   * On mount, and again as items arrive, scroll to the section named in the
   * address bar's `#fragment`. Once only.
   */
  followHash?: boolean
}

export type {
  ITableOfContentsItem,
  ITableOfContentsNode,
  ITableOfContentsProps,
  TTableOfContentsVariant,
}
