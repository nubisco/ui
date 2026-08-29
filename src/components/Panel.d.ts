import type { TLayerLevel } from '@/composables/useSurfaceLayer.composable'

export interface IPanelProps {
  /**
   * Force an absolute layer instead of deriving one from nesting depth.
   * Equivalent to writing `class="nb-layer-{level}"` on the panel.
   */
  layer?: TLayerLevel
}
