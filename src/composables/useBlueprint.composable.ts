import { inject } from 'vue'
import { NB_BLUEPRINT_CONTROLLER } from '../components/Blueprint.context'
import type { IBlueprintController } from '../components/Blueprint.types'

/**
 * Access the controller of the nearest ancestor NbBlueprint: camera
 * (`panX`/`panY`/`zoom`), selection (`selectedIds`/`focusedId`), view
 * actions (`fitToView`/`centerView`/`resetView`), alignment/distribution,
 * coordinate transforms (`screenToCanvas`/`canvasToScreen`), and the
 * `isEditMode` flag.
 *
 * Intended for chrome rendered inside a NbBlueprint's default slot, such as
 * a controls toolbar, minimap, or custom background, so they can drive the
 * blueprint without the host wiring template refs and event handlers by
 * hand. Must be called from within a NbBlueprint subtree (during a
 * component's `setup`); throws otherwise.
 *
 * @example
 * ```ts
 * const bp = useBlueprint()
 * bp.fitToView()
 * bp.zoom.value = 1.5
 * ```
 */
export function useBlueprint(): IBlueprintController {
  const controller = inject(NB_BLUEPRINT_CONTROLLER, null)
  if (!controller) {
    throw new Error(
      '[NubiscoUI] useBlueprint() must be called from inside an <NbBlueprint> subtree.',
    )
  }
  return controller
}
