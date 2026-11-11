import type { TIconSource } from '@/types/Glyph.d'
import type { IActionGroupItem } from './ActionGroup.d'
import type { TButtonSize } from './Button.d'
import type { TMenuAlign } from './Menu.d'

interface IOverflowMenuProps {
  /**
   * The actions in the menu, in reading order. The same item type
   * `NbActionGroup` takes, so a group's overflow and a standalone menu are
   * written the same way. `NbMenuItem`s in the default slot are added after
   * them.
   */
  items?: IActionGroupItem[]
  /**
   * The trigger's words: its accessible name and its tooltip. Defaults to
   * the catalogue's `overflowMenuLabel` ("More actions"). Name what the menu
   * is about when the page has more than one ("More actions for invoice
   * 2026/002").
   */
  label?: string
  /** The trigger's icon. `dots-three` by default, the fleet's "more" glyph. */
  icon?: TIconSource
  /**
   * The trigger's size. Inside an `NbToolbar` it follows the toolbar when
   * left unset. The menu's rows take the matching height, up to 48px.
   */
  size?: TButtonSize
  /**
   * Which edge of the trigger the menu lines up with. `'end'` (the default)
   * suits a trigger at the end of a row or in a toolbar's corner.
   */
  align?: TMenuAlign
  /** Disables the trigger. */
  disabled?: boolean
  /** Where the trigger's tooltip opens. */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
}

export type { IOverflowMenuProps }
