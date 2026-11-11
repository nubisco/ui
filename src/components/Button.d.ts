import type { TIconSource } from '@/types/Glyph.d'
import { ESize } from '@/types/Size.d'
import type { EWeight } from './Icon.d'

enum EButtonType {
  Button = 'button',
  Submit = 'submit',
  Reset = 'reset',
}

/**
 * The full size scale NbButton implements. Every token here is backed by a
 * real `.nb-button--<size>` rule (height, inline padding, font size, icon
 * size) plus a matching icon-only width, so all seven render correctly.
 *
 * Deliberately NOT `ESizeShort` (`sm | md | lg`): that is the narrower scale
 * used by Modal, DataTable and Pagination, and typing the button with it
 * rejected four sizes the component has always styled. The raw literals sit
 * alongside the enum so templates can write `size="xs"` without importing it.
 */
type TButtonSize = `${ESize}`

/** The action hierarchy, then the four status roles. */
type TButtonVariant =
  | 'primary'
  | 'tertiary'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'danger-tertiary'
  | 'danger-ghost'

interface IButtonProps {
  /**
   * Visual role. Typed rather than left as `string`, which accepted any typo
   * silently: `varaint="primary"` and `variant="primry"` both compiled and
   * both rendered the base button.
   *
   * `primary` / `tertiary` / `secondary` / `ghost` are the action hierarchy.
   * `primary` is the one filled action of a page or region header.
   * `tertiary` is primary outlined, under its own name: a standalone action of
   * lower rank (it renders exactly `variant="primary" outlined`).
   * `secondary` belongs only beside a primary, as its negative half (Cancel,
   * Discard). `ghost` is for rows, toolbars and tiles. `link` is
   * the quietest of them: no box at all, it reads as a text link in the line
   * it sits in (its font size, weight and line height come from there, so
   * `size` does not change it), underlined on hover and focus. The four
   * status roles say what a press MEANS, not how loud it is, so they belong on
   * a control whose semantics match: `danger` on something destructive, not on
   * whatever the page wants to emphasise.
   *
   * `danger-tertiary` is danger outlined (it renders exactly
   * `variant="danger" outlined`), and `danger-ghost` is a ghost's box in
   * danger's colour: Carbon's three danger styles. Danger is never icon-only.
   *
   * Omitted, the button renders the high-contrast base treatment.
   */
  variant?: TButtonVariant
  outlined?: boolean
  size?: TButtonSize
  disabled?: boolean
  loading?: boolean
  /**
   * Icon name passed directly to NbIcon. On a labelled button it sits at the
   * far end, pinned to the right edge (top right on xl and xxl), never beside
   * the label. On a ghost it follows the label. Replaced by the spinner while
   * loading, in the same slot, so the width does not change.
   */
  icon?: TIconSource
  /**
   * The icon's weight. `regular` everywhere, `fill` only for a selected or
   * active state. Forwarded to NbIcon, and read at compile time by the glyph
   * plugin so `<NbButton icon="plus">` links one weight rather than six.
   */
  iconWeight?: `${EWeight}`
  /**
   * The words for an icon-only button. Required on every icon-only button:
   * it becomes the accessible name AND the tooltip, anchored to the button,
   * so the two can never disagree and no icon-only button ships without
   * one. An explicit `aria-label` still wins for the spoken name, for a
   * longer name than the chip shows ("Delete invoice 2026/002" against
   * "Delete"). Ignored on a labelled button, whose text is its name.
   */
  label?: string
  /** Where the icon-only tooltip opens. Defaults to `bottom`, as Carbon's. */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
  /**
   * A toggle's state. When set, the button carries `aria-pressed`, and a
   * ghost draws a selected fill while it is `true`. Leave it `undefined` for
   * an ordinary button, which then has no `aria-pressed` at all.
   */
  pressed?: boolean
  /** Native button type. Ignored when `href` is provided. */
  type?: `${EButtonType}`
  /** When provided the component renders as an `<a>` element instead of `<button>`. */
  href?: string
  /** Forwarded to the `<a>` element. Only used when `href` is set. */
  target?: string
  /** Forwarded to the `<a>` element. Only used when `href` is set. */
  rel?: string
  /**
   * Target route. When vue-router is installed, the button renders as a
   * `<RouterLink>` and accepts any value valid for its `to` prop (string path or
   * location object). Without vue-router, a string `to` falls back to a plain
   * `<a>` and an object `to` falls back to a `<button>` that emits `click`.
   */
  to?: string | Record<string, unknown>
}

export type { TButtonVariant }

export { EButtonType, IButtonProps }
export type { TButtonSize }
