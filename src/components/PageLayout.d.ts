import type { TGapSize } from './Grid.d'

/**
 * The container width below which the main region and the aside stack:
 * `sm` 480px, `md` 720px (the default), `lg` 960px. Container width, not
 * viewport width: inside NbShell the content column is narrower than the
 * window by the rail and any open inspector.
 */
export type TPageLayoutStack = 'sm' | 'md' | 'lg'

export interface IPageLayoutProps {
  /**
   * The aside's width. A ratio of main to aside (`'3:2'`, the default, or
   * `'2:1'`), or a CSS length for a fixed aside (`'20rem'`, `'320px'`), in
   * which case the main region takes the rest.
   *
   * @default '3:2'
   */
  asideWidth?: string
  /** Where the two regions stack. See `TPageLayoutStack`. */
  stackBelow?: TPageLayoutStack
  /**
   * Put the aside first when the two are stacked: for an aside that has to be
   * read before the main region (the record's facts above its history). Side
   * by side, the main region is always first and widest.
   *
   * @default false
   */
  asideFirst?: boolean
  /**
   * Space between the two regions, on `NbGrid`'s scale. `xl` (32px) by
   * default: main and aside are regions of a page, not groups in one.
   *
   * @default 'xl'
   */
  gap?: TGapSize
}
