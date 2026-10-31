import type { InjectionKey, Ref } from 'vue'

interface ICheckboxGroupContext {
  disabled: Ref<boolean>
}

/**
 * Inject key NbCheckboxGroup provides so child NbCheckbox instances inherit
 * group-level state (disabled) without prop-drilling. Lives in a `.ts` file
 * (not `.d.ts`) because the key is a runtime value.
 */
const NB_CHECKBOX_GROUP_CONTEXT: InjectionKey<ICheckboxGroupContext> =
  Symbol.for('@nubisco/ui:checkbox-group-context')

export { NB_CHECKBOX_GROUP_CONTEXT }
export type { ICheckboxGroupContext }
