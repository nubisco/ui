import type { THeadingLevel } from './Panel.d'

/**
 * Row height: `sm` 32px, `md` 40px (the default), `lg` 48px. The rows grow to
 * fit a second line, and to 44px on a phone touch screen when they act.
 */
export type TContainedListSize = 'sm' | 'md' | 'lg'

export interface IContainedListProps {
  /**
   * The list's title, in a header above the rows. It also names the list for
   * a screen reader. Without one, pass `ariaLabel`.
   */
  title?: string
  /**
   * The element the title renders as.
   *
   * @default 'h3'
   */
  headingLevel?: THeadingLevel
  /** Row height for every item. */
  size?: TContainedListSize
  /**
   * Cap the list's height and let it scroll, as a CSS length. The header
   * sticks to the top with a surface under it while the rows scroll past.
   */
  maxHeight?: string
  /** The list's accessible name when it has no `title`. */
  ariaLabel?: string
}

export interface IContainedListItemProps {
  /**
   * The row's title, at `heading-compact`. Use the default slot for anything
   * richer than a string.
   */
  title?: string
  /**
   * A short identifier before the title: a key, a number, a code. Mono and
   * subtle. Named `itemKey` because `key` is reserved by Vue.
   */
  itemKey?: string
  /** One line under the title, `body-sm`, muted. */
  line?: string
  /** Target route, as on `NbButton`: a `<RouterLink>` when a router exists. */
  to?: string | Record<string, unknown>
  /** Renders the row as a link. */
  href?: string
  /** Link target, only meaningful with `href` or `to`. */
  target?: string
  /**
   * The row acts on click, Enter or Space and emits `select`. Ignored when
   * `href` or `to` is set.
   */
  clickable?: boolean
  /**
   * The row is the current one: the page it links to, or the record open
   * beside the list. Sets `aria-current` (`page` on a link, `true` otherwise).
   */
  current?: boolean
  /** Inert and muted. */
  disabled?: boolean
}
