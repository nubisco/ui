import type { TIconSource } from '@/types/Glyph.d'
import type { TGapSize, TGridRatio } from './Grid.d'
import type { THeadingLevel } from './Panel.d'

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
  /**
   * Holds every tile at an aspect ratio (`'1:1'`, `'2:1'`, `'2:3'`, `'3:2'`,
   * `'4:3'`, `'16:9'`), for a wall of thumbnails or tiles that should line
   * up before their content loads. A tile whose content is taller grows
   * rather than clipping. On a phone, where a column shrinks below `min`, the
   * tile keeps its shape at the narrower width.
   */
  ratio?: TGridRatio
}

export interface ICardProps {
  /** Card title. Use the `title` slot for anything richer than a string. */
  title?: string
  /** One line under the title: a type, an owner, a version. */
  subtitle?: string
  /**
   * The same line as `subtitle`, under the name `NbPanel` uses for it, so a
   * card and a panel take the same two props. Wins over `subtitle` when both
   * are set.
   */
  description?: string
  /**
   * The element the title renders as. A card's title is a heading, at the
   * `heading-compact` size whatever the level. A clickable card (one that is
   * a button) renders it as a plain span instead, since a heading inside a
   * button is flattened into the button's name.
   *
   * @default 'h3'
   */
  headingLevel?: THeadingLevel
  /**
   * Keep the border and the padding, paint no surface, and do not deepen the
   * contents. For tiles that are regions of the page, sitting on its ground,
   * beside the one raised region the page is for.
   *
   * @default false
   */
  flat?: boolean
  /** Icon name, rendered in the card's header. */
  icon?: TIconSource
  /**
   * `'vertical'` (default) stacks the media or icon above the title.
   * `'horizontal'` puts it in a column on the left, with the title, text and
   * footer stacked beside it: a launcher of apps (logo left, name and one line
   * right), or a list of pages with a thumbnail each. It stays horizontal on a
   * phone, with a narrower thumbnail.
   */
  orientation?: 'vertical' | 'horizontal'
  /**
   * `'md'` (default) is the card as it has always been. `'sm'` halves the
   * padding, for a dense grid of small tiles that act (a row of progress
   * bars to filter by, a picker), where the full padding made each tile
   * twice the height of what it holds.
   *
   * @default 'md'
   */
  size?: 'sm' | 'md'
  /**
   * Image URL for the card's media: a cover across the top of a vertical card,
   * a thumbnail beside a horizontal one. Passing the prop at all reserves the
   * box, so an empty string or `null` draws a placeholder in the same shape,
   * and so does an image that fails to load. Leave it undefined for a card
   * without media. Use the `media` slot for anything other than one image.
   */
  image?: string | null
  /**
   * Alternative text for `image`. Empty by default, which marks the image as
   * decorative: on a card the title usually says everything the picture does.
   */
  imageAlt?: string
  /**
   * Shape of the media box, as a CSS `aspect-ratio` (`'16 / 9'`, `'1'`,
   * `'4 / 3'`). Defaults to 16 / 9. Fixed rather than taken from the image, so
   * a grid of cards lines up before any image has loaded.
   */
  imageRatio?: string
  /** `'cover'` (default) crops the image to fill the box, `'contain'` shows it whole. */
  imageFit?: 'cover' | 'contain'
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
  /**
   * How an interactive card answers the pointer and keyboard focus.
   *
   * `fill` (the default) lifts the surface to its hover layer. `draw` does
   * that and draws the border in: two strokes leave the top-left corner at
   * the same speed, one along the top and down the right, the other down the
   * left and along the bottom, and they meet at the bottom-right. For a wall
   * of destination cards (a hub, a product picker), where the card is the
   * whole call to action. It snaps off when the pointer leaves, and under
   * reduced motion the full border appears at once.
   *
   * Only interactive cards (`href`, `to` or `clickable`) respond. A static
   * card renders exactly the same whatever this is set to.
   */
  hoverEffect?: 'fill' | 'draw'
}
