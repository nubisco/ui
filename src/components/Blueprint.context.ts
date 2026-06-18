import type { InjectionKey } from 'vue'
import type {
  IBlueprintCardContext,
  IBlueprintController,
} from './Blueprint.types'

/**
 * Inject key NbBlueprint provides so its child cards can drive wire dragging
 * without the parent app having to forward port events manually. Lives in a
 * `.ts` file (not `.d.ts`) because Symbol() is a runtime value.
 */
export const NB_BLUEPRINT_CONTEXT: InjectionKey<IBlueprintCardContext> = Symbol(
  'NB_BLUEPRINT_CONTEXT',
)

/**
 * Inject key for the full Blueprint controller (camera, selection, view
 * actions, coordinate transforms, edit mode). Provided alongside
 * NB_BLUEPRINT_CONTEXT so sibling chrome (background, minimap, controls
 * toolbar) and host apps can drive the blueprint without prop-drilling.
 * Consume it with the `useBlueprint()` composable.
 */
export const NB_BLUEPRINT_CONTROLLER: InjectionKey<IBlueprintController> =
  Symbol('NB_BLUEPRINT_CONTROLLER')
