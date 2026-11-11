import type { TIconSource } from '@/types/Glyph.d'
import type { TButtonSize, TButtonVariant } from './Button.d'

/**
 * When the group folds its actions into an overflow menu.
 *
 * - `'never'`: every action is a button, always. The default, and exactly
 *   what the same buttons placed by hand render.
 * - `'phone'`: labelled buttons on a desktop. On a phone the visible actions
 *   become icon-only and the rest move into a "more" menu.
 * - `'always'`: the visible actions stay labelled buttons and the rest live in
 *   the menu at every width (icon-only on a phone).
 * - `'auto'`: by the room there is. As many actions as fit stay on screen,
 *   in reading order, and the rest move into the menu, measured again
 *   whenever the group is resized. For a toolbar or a panel header whose
 *   width changes with the page. On a phone it behaves as `'phone'`.
 */
type TActionGroupOverflow = 'never' | 'phone' | 'always' | 'auto'

interface IActionGroupItem {
  /** Stable key, also the payload of the `select` event. */
  id: string
  /**
   * The button text. On an icon-only button (`iconOnly`, or folded on a
   * phone) it is the button's `label`: its accessible name and its tooltip.
   */
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
  /**
   * Icon only, at every width: the label becomes the accessible name and the
   * tooltip. For the tools of a toolbar and the actions of a table row.
   * Needs an `icon`. Without one the action keeps its text.
   */
  iconOnly?: boolean
  /**
   * Keeps the action in place but unavailable. Prefer it to removing an
   * action that does not apply: a row of actions that changes shape from
   * row to row is a row nobody can learn.
   */
  disabled?: boolean
  /**
   * Why the action is disabled ("Paid invoices cannot be deleted"). An
   * icon-only action adds it to its tooltip and accessible name, so the
   * action still explains itself. Read only while `disabled`.
   */
  disabledReason?: string
  loading?: boolean
  /**
   * `'primary'` actions are the ones a phone keeps on screen (up to
   * `phoneVisible` of them). When none is flagged, the first ones stay.
   */
  priority?: 'primary' | 'secondary'
  /**
   * A toggle's state: the button's `pressed` (`aria-pressed` and the visible
   * selected fill on a ghost), and a selected row in the overflow menu.
   * Leave it unset for an action that is not a toggle.
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
  /**
   * Button size for every action and the overflow trigger. Defaults to the
   * toolbar's size inside an `NbToolbar`, and to `sm` anywhere else.
   */
  size?: TButtonSize
  /** When the actions fold into an overflow menu. */
  overflow?: TActionGroupOverflow
  /**
   * Accessible name and tooltip of the overflow trigger. Defaults to the
   * catalogue's `overflowMenuLabel` ("More actions").
   */
  overflowLabel?: string
  /** How many actions stay on screen when folded (not with `'auto'`). */
  phoneVisible?: number
}

export type { IActionGroupItem, IActionGroupProps, TActionGroupOverflow }
