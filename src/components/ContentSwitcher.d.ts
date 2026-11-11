import type { TIconSource } from '@/types/Glyph.d'

interface IContentSwitcherItem {
  /** Stable key, and the value `v-model` holds while this item is selected. */
  id: string
  /** The text. With `iconOnly`, the accessible name and the tooltip. */
  label: string
  /** Needed for `iconOnly`. Pass the imported glyph module or a registered name. */
  icon?: TIconSource
  /** Takes the item out of the choice, in place. */
  disabled?: boolean
}

interface IContentSwitcherProps {
  /** The selected item's `id` (`v-model`). */
  modelValue?: string
  /** The views to switch between, in order. Two to five reads best. */
  items: IContentSwitcherItem[]
  /**
   * What the choice is about ("View", "Period"). The radio group's
   * accessible name. Required: the options alone do not say what they
   * choose between.
   */
  label: string
  /**
   * Icons only. Each label becomes its button's accessible name and its
   * tooltip, through NbButton's `label`.
   */
  iconOnly?: boolean
  /** `sm` 32px, `md` 40px (the default) or `lg` 48px. */
  size?: 'sm' | 'md' | 'lg'
}

export type { IContentSwitcherItem, IContentSwitcherProps }
