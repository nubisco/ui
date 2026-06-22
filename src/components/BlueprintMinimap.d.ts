import type { IBlueprintCard } from './Blueprint.types'
import type { TBlueprintChromePosition } from './BlueprintControls.d'

export interface IBlueprintMinimapProps {
  /** The same cards passed to NbBlueprint (windowed API). Their geometry
   *  drives the overview. */
  cards: IBlueprintCard[]
  /** Corner the minimap floats in. */
  position?: TBlueprintChromePosition
  width?: number
  height?: number
  /** Click / drag on the minimap to recenter the viewport. */
  pannable?: boolean
  /** Override node color (CSS color). Defaults to each card's accent, else a
   *  muted token. */
  nodeColor?: string
}
