import type { TIconSource } from '../types/Glyph.d'

/** One chip. `value` is what `v-model` carries. */
interface IChipGroupItem {
  value: string | number
  label: string
  /** A 16px icon before the label. */
  icon?: TIconSource
  /** Shown, but cannot be chosen. */
  disabled?: boolean
}

interface IChipGroupProps {
  /** The chosen chip's `value`. Supports `v-model`. */
  modelValue?: string | number | null
  items: IChipGroupItem[]
  /**
   * The group's accessible name, for example "Limit search to a product".
   * Required: a radio group without a name is a row of choices with no
   * question.
   */
  label: string
  /** `sm` is 24px tall, `md` 32px. */
  size?: 'sm' | 'md'
}

export type { IChipGroupItem, IChipGroupProps }
