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
  /** Shows a clear button when a value is selected. */
  allowClear?: boolean
  /** Reserved for future virtual-scroll support. Currently unused. */
  virtual?: boolean
}

export { ISelectOption, ISelectProps }

// Clean aliases — prefer these in new code.
export type { ISelectOption as NbSelectOption, ISelectProps as NbSelectProps }
