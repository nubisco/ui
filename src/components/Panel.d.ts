import type { TIconSource } from '@/types/Glyph.d'
import type { TLayerLevel } from '@/composables/useSurfaceLayer.composable'

/** The element a panel, card or list renders its title as. */
export type THeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export interface IPanelProps {
  /**
   * Force an absolute layer instead of deriving one from nesting depth.
   * Equivalent to writing `class="nb-layer-{level}"` on the panel.
   */
  layer?: TLayerLevel
  /**
   * The panel's title, rendered in a header at the top of the panel at the
   * `heading-01` type set. The size is fixed by the component: a product does
   * not choose it. Leave unset (with no `description`, `meta` or `actions`)
   * and the panel renders no header at all, exactly as before.
   */
  title?: string
  /**
   * An icon drawn before the title, muted, at 20px to sit with `heading-01`.
   * Decorative: the title names the panel. Any NbIcon source.
   */
  icon?: TIconSource
  /** One line of support under the title, at `body-sm`, muted. */
  description?: string
  /**
   * The element the title renders as. Match the page's outline: `h2` (the
   * default) for a panel directly under the page's `h1`, `h3` for a panel
   * inside a section that has its own `h2`.
   *
   * @default 'h2'
   */
  headingLevel?: THeadingLevel
  /**
   * Keep the border and the padding, paint no surface. The panel sits on the
   * plane around it and does not deepen its contents: a panel inside a flat
   * panel paints the level a sibling of the flat panel would. For tiles that
   * are regions of the page rather than groups raised off it.
   *
   * @default false
   */
  flat?: boolean
}
