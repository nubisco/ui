import type { InjectionKey, Ref } from 'vue'

interface ICheckboxGroupContext {
  disabled: Ref<boolean>
  /** `'true'` while the group shows an error, for each checkbox's aria-invalid. */
  invalid?: Ref<'true' | undefined>
  /** Id of the group's visible message, for each checkbox's aria-describedby. */
  describedBy?: Ref<string | undefined>
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
