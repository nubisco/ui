import { IDefaultProps } from '@/types/Props.d'

// #region ETabsVariant
enum ETabsVariant {
  /** Underlined text tabs sitting on a rule. The default for page sections. */
  Line = 'line',
  /** Boxed segmented control with a filled active block. For mode switches. */
  Contained = 'contained',
}
// #endregion ETabsVariant

// #region ETabsSize
enum ETabsSize {
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
}
// #endregion ETabsSize

// #region ITabItem
/** A single tab in the bar. */
interface ITabItem {
  /** Stable identifier, used as the `v-model` value and as the slot name. */
  id: string
  /** Visible tab text. */
  label: string
  /** Optional icon name rendered before the label. */
  icon?: string
  /** Optional count or short status rendered after the label. */
  badge?: string | number
  /** Prevents selection and dims the tab. */
  disabled?: boolean
}
// #endregion ITabItem

// #region ITabsProps
interface ITabsProps extends IDefaultProps {
  /** Tabs to render, in display order. */
  items: ITabItem[]
  /**
   * Accessible name for the tab bar, exposed as `aria-label` on the tablist.
   * Nothing is rendered: name the section the tabs belong to, e.g. `Project`.
   */
  ariaLabel?: string
  /** Id of the selected tab. Falls back to the first enabled tab. */
  modelValue?: string
  /** Visual treatment: `line` for page sections, `contained` for mode switches. */
  variant?: `${ETabsVariant}`
  /** Control size. */
  size?: `${ETabsSize}`
  /** Disables every tab in the bar. */
  disabled?: boolean
  /** Stretches tabs to fill the available width, sharing it equally. */
  fullWidth?: boolean
}
// #endregion ITabsProps

export { ETabsVariant, ETabsSize, ITabItem, ITabsProps }
