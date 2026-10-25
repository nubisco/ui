import type { TIconSource } from '@/types/Glyph.d'
import type { TGapSize } from './Grid.d'

export interface ICardGridProps {
  /**
   * Narrowest a column may get before the grid drops one, as a CSS length.
   *
   * This is the prop `NbGrid` cannot express. `NbGrid`'s `grid` is a span on
   * the element within a 16-column page grid: it answers "how much of the page
   * does this take". A card grid asks the opposite question, "how many of these
   * fit", and the answer has to come from the card's own comfortable width, not
   * from the page. That is why this is a separate component rather than another
   * prop on `NbGrid`.
   */
  min?: string
  /** Space between cards. Same scale as `NbGrid`'s `gap`. */
  gap?: TGapSize
  /**
   * `'auto-fill'` (default) keeps empty columns, so a grid of two cards in a
   * wide container leaves them card-width and the rest of the row empty.
   * `'auto-fit'` collapses the empty columns, so those two cards stretch to
   * fill the row.
   *
   * Prefer the default. A catalogue of things reads as a catalogue when the
   * card size is constant and the row is allowed to be short; stretching two
   * cards across a desktop makes them look like panels instead.
   */
  fill?: 'auto-fill' | 'auto-fit'
}

export interface ICardProps {
  /** Card title. Use the `title` slot for anything richer than a string. */
  title?: string
  /** One line under the title: a type, an owner, a version. */
  subtitle?: string
  /** Icon name, rendered in the card's header. */
  icon?: TIconSource
  /**
   * Renders the whole card as a link. The card becomes an `<a>`, so it gets a
   * browser's link affordances for free: middle click, open in new tab, and a
   * URL in the status bar.
   */
  href?: string
  /**
   * Target route, as on `NbButton`. When vue-router is installed the card
   * renders as a `<RouterLink>` and accepts anything its `to` does (a path or
   * a location object), so navigation stays in the app and the card still has
   * a real href. Without vue-router a string `to` is a plain link and an
   * object `to` is ignored. Takes precedence over `href`.
   */
  to?: string | Record<string, unknown>
  /** Link target, only meaningful alongside `href` or `to`. */
  target?: string
  /**
   * Makes the card activate on click and emit `select`, for a card that opens
   * something in place rather than navigating. Ignored when `href` or `to` is set,
   * because a link already does this and does it better.
   */
  clickable?: boolean
  /** Draws the card as chosen, for a card that is part of a selection. */
  selected?: boolean
  /** Non-interactive and muted. */
  disabled?: boolean
}
