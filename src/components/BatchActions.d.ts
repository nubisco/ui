import type { IActionGroupItem } from './ActionGroup.d'
import type { TToolbarSize } from './Toolbar.context'

/**
 * Where the bar sits.
 *
 * - `'overlay'`: over a toolbar strip, filling it edge to edge, its buttons
 *   flush and full height. What NbDataTable shows while rows are selected:
 *   the strip keeps its height, so nothing below it moves.
 * - `'floating'`: a pill that floats at the foot of a free layout (a board,
 *   a gallery), where there is no strip to cover.
 */
type TBatchActionsVariant = 'overlay' | 'floating'

interface IBatchActionsProps {
  /** How many things are selected. Shown as "3 selected". */
  count: number
  /**
   * The actions, in reading order, as `NbActionGroup` takes them. A phone
   * folds them into an overflow menu. Use the default slot instead for
   * controls of your own.
   */
  items?: IActionGroupItem[]
  /** See {@link TBatchActionsVariant}. Defaults to `'overlay'`. */
  variant?: TBatchActionsVariant
  /**
   * The bar's height, shared with its buttons. Match it to the toolbar it
   * covers. Defaults to `lg` (48px) for an overlay and `sm` for a floating
   * bar.
   */
  size?: TToolbarSize
  /** The cancel button's text. Defaults to the catalogue's "Cancel". */
  cancelLabel?: string
  /**
   * The region's accessible name. Defaults to the catalogue's
   * `batchActionsLabel` ("Batch actions").
   */
  label?: string
}

export type { IBatchActionsProps, TBatchActionsVariant }
