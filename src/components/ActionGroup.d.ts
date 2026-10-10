import type { TIconSource } from '@/types/Glyph.d'
import type { TButtonSize, TButtonVariant } from './Button.d'

/**
 * When the group folds its actions into an overflow menu.
 *
 * - `'never'`: every action is a labelled button, always. The default, and
 *   exactly what the same buttons placed by hand render.
 * - `'phone'`: labelled buttons on a desktop. On a phone the visible actions
 *   become icon-only and the rest move into a "more" menu.
 * - `'always'`: the visible actions stay labelled buttons and the rest live in
 *   the menu at every width (icon-only on a phone).
 */
type TActionGroupOverflow = 'never' | 'phone' | 'always'

interface IActionGroupItem {
  /** Stable key, also the payload of the `select` event. */
  id: string
  /** The button text. On a phone it is the icon-only button's accessible name. */
  label: string
  /**
   * The icon. Needed for an action to fold to icon-only on a phone (without
   * one it keeps its label). A name only known at runtime must be registered
   * (`registerIcons`) or passed as an imported glyph module, see "What ships
   * in your bundle".
   */
  icon?: TIconSource
  /** Passed to NbButton. Defaults to `danger` when `danger` is set. */
  variant?: TButtonVariant
  outlined?: boolean
  disabled?: boolean
  loading?: boolean
  /**
   * `'primary'` actions are the ones a phone keeps on screen (up to
   * `phoneVisible` of them). When none is flagged, the first ones stay.
   */
  priority?: 'primary' | 'secondary'
  /**
   * A toggle's state: `aria-pressed` on its button, and a selected row in the
   * overflow menu. Leave it unset for an action that is not a toggle.
   */
  pressed?: boolean
  /** Destructive: a danger button, and a danger row in the overflow menu. */
  danger?: boolean
  /** Called when the action is chosen, from its button or its menu row. */
  onSelect?: () => void
}

interface IActionGroupProps {
  /** The actions, in reading order. */
  items: IActionGroupItem[]
  /** Button size for every action and the overflow trigger. */
  size?: TButtonSize
  /** When the actions fold into an overflow menu. */
  overflow?: TActionGroupOverflow
  /** Accessible name of the overflow trigger. */
  overflowLabel?: string
  /** How many actions stay on screen when folded. */
  phoneVisible?: number
}

export type { IActionGroupItem, IActionGroupProps, TActionGroupOverflow }
