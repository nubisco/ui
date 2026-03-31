import { IDecoration } from '@/types/Decoration'

// #region IOption
interface IOption extends IDecoration {
  id?: number | string
  label?: string
  name?: string
  value?: string | number
  color?: string
  context?: string
  i18n_key?: string
  createdBy?: number | string
  createdAt?: string
  disabled?: boolean
  tooltip?: string
  unformatted?: boolean
  code?: string
  hidden?: boolean
}
// #endregion IOption

// #region IOptionGroup
interface IOptionGroup {
  groupName?: string // Optional: Name of the group
  options: IOption[]
}
// #endregion IOptionGroup

export { IOption, IOptionGroup }
