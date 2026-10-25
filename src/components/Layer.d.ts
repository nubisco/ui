import type { TLayerLevel } from '@/composables/useSurfaceLayer.composable'

export interface ILayerProps {
  /**
   * Absolute layer for the subtree. Surfaces directly inside paint this level,
   * exactly like writing `class="nb-layer-{level}"`. Omit it to take one step
   * above the surroundings: the level a surface placed here would paint, so
   * layer 1 directly in NbShell's main region and layer 2 inside a panel.
   */
  level?: TLayerLevel
  /** Element or component to render as. Defaults to `div`. */
  as?: string
}
