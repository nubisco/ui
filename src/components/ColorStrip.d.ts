import { IDefaultProps, IWithLabel } from '@/types/Props.d'
import type { IOption } from '@/types/Option'

interface IColorStripProps extends IDefaultProps, IWithLabel {
  options?: string[] | IOption[]
  /** Disables interaction — only renders the color dots without selection. */
  onlyView?: boolean
  /** Allows more than one color to be selected at a time. */
  allowMultiple?: boolean
  /** Wraps color dots onto multiple lines instead of scrolling horizontally. */
  wrap?: boolean
  /** Shows a null / "no color" option as the first item. */
  showNull?: boolean
  /**
   * Presentation variant:
   * - `default` — label above the strip.
   * - `fluid`   — label inside the field box.
   */
  variant?: 'default' | 'fluid'
}

export { IColorStripProps, IOption }
