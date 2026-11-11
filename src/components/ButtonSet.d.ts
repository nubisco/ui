import type { TButtonSize } from './Button.d'

/** When the set turns into a column. */
type TButtonSetStack = 'never' | 'phone' | 'always'

/** Which end of the row the buttons gather at. */
type TButtonSetAlign = 'start' | 'end'

interface IButtonSetProps {
  /**
   * Full bleed: the buttons share the row in equal widths, with no gap and a
   * 1px separator between them, the way a dialog footer or a tile's action
   * row is built. Without it the buttons keep their own widths, 16px apart.
   */
  fluid?: boolean
  /**
   * `phone` stacks the set into a column in the phone layout only, `always`
   * at every width. Stacked, the primary is on top and every button spans the
   * column.
   */
  stack?: `${TButtonSetStack}`
  /** Where a row that does not fill its width gathers. Defaults to `start`. */
  align?: `${TButtonSetAlign}`
  /**
   * One size for every NbButton in the set. A set is read as one control, so
   * when this is given it wins over a size written on a child. Omitted, each
   * button keeps its own.
   */
  size?: TButtonSize
}

export type { IButtonSetProps, TButtonSetStack, TButtonSetAlign }
