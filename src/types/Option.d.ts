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
/**
 * @deprecated Nothing consumes this shape. It described a grouped option list
 * no component ever implemented, which is worse than an absence: a consumer
 * reads it as a promise and builds a workaround when it finds none. Group a
 * select's options with `ISelectOption['group']` instead. Kept until the next
 * major so an import does not break.
 */
interface IOptionGroup {
  groupName?: string // Optional: Name of the group
  options: IOption[]
}
// #endregion IOptionGroup

export { IOption, IOptionGroup }
