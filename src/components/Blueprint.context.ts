import type { InjectionKey } from 'vue'
import type { IBlueprintCardContext } from './Blueprint.types'

/**
 * Inject key NbBlueprint provides so its child cards can drive wire dragging
 * without the parent app having to forward port events manually. Lives in a
 * `.ts` file (not `.d.ts`) because Symbol() is a runtime value.
 */
export const NB_BLUEPRINT_CONTEXT: InjectionKey<IBlueprintCardContext> = Symbol(
  'NB_BLUEPRINT_CONTEXT',
)
