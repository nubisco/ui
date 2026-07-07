import type { InjectionKey, Ref } from 'vue'

interface ICheckboxGroupContext {
  disabled: Ref<boolean>
}

/**
 * Inject key NbCheckboxGroup provides so child NbCheckbox instances inherit
 * group-level state (disabled) without prop-drilling. Lives in a `.ts` file
 * (not `.d.ts`) because Symbol() is a runtime value.
 */
const NB_CHECKBOX_GROUP_CONTEXT: InjectionKey<ICheckboxGroupContext> = Symbol(
  'NB_CHECKBOX_GROUP_CONTEXT',
)

export { NB_CHECKBOX_GROUP_CONTEXT }
export type { ICheckboxGroupContext }
