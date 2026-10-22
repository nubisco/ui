import type { TIconSource } from '@/types/Glyph.d'

export interface ISidebarHeaderToggleProps {
  /**
   * Accessible name and tooltip while the rail is expanded. Defaults to a
   * built-in "Collapse sidebar" in the active locale.
   */
  collapseLabel?: string
  /**
   * Accessible name and tooltip while the rail is collapsed. Defaults to
   * "Expand sidebar".
   */
  expandLabel?: string
  /**
   * The glyph. Defaults to a panel outline for the 'end' and 'start'
   * positions and to a direction caret for the 'edge' tab, where a small
   * chip reads better as an arrow.
   */
  icon?: TIconSource
}
