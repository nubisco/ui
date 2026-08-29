import type { TLayerLevel } from '@/composables/useSurfaceLayer.composable'

export interface ILayerProps {
  /**
   * Absolute layer for the subtree. Surfaces directly inside paint this level,
   * exactly like writing `class="nb-layer-{level}"`. Omit it to push the
   * subtree one level deeper than the current context.
   */
  level?: TLayerLevel
  /** Element or component to render as. Defaults to `div`. */
  as?: string
}
