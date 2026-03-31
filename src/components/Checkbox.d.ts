import { IHumanInputComponent, IWithLabel } from '@/types/Props.d'

interface ICheckboxProps extends IHumanInputComponent, IWithLabel {
  modelValue?: boolean
  /** Shows a dash instead of a tick — used for "select all" rows where some children are checked. */
  indeterminate?: boolean
}

export { ICheckboxProps }
