import { IFieldComponent } from '@/types/Props.d'

interface ISelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

interface ISelectProps extends IFieldComponent {
  modelValue?: string | number | Array<string | number> | null
  options?: ISelectOption[]
  /** Allows selecting multiple options simultaneously. */
  multiple?: boolean
  /** Shows a text input at the bottom of the dropdown so users can create new options. Emits `create` with the entered value. */
  creatable?: boolean
  /** Placeholder text for the create input when `creatable` is true. */
  createPlaceholder?: string
}

export { ISelectOption, ISelectProps }

// Clean aliases — prefer these in new code.
export type { ISelectOption as NbSelectOption, ISelectProps as NbSelectProps }
