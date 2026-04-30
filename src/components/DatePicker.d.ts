import type { IReadableFieldComponent } from '@/types/Props.d'

interface IDatePickerProps extends IReadableFieldComponent {
  /**
   * Selected date as an ISO string (YYYY-MM-DD) or null.
   * For range type, use `modelValue` for the start date and `endValue` for the end date.
   */
  modelValue?: string | null
  /**
   * Picker type:
   * - `simple`  — text-only input, no calendar dropdown.
   * - `single`  — text input with a calendar dropdown for picking one date.
   * - `range`   — two inputs for selecting a start and end date.
   */
  type?: 'simple' | 'single' | 'range'
  /** End date for range type (ISO string YYYY-MM-DD). */
  endValue?: string | null
  /** Minimum selectable date (ISO string YYYY-MM-DD). */
  min?: string
  /** Maximum selectable date (ISO string YYYY-MM-DD). */
  max?: string
  /** First day of the week: 0 = Sunday, 1 = Monday. Defaults to 1. */
  weekStart?: 0 | 1
  /** BCP 47 locale tag for month and weekday labels. Defaults to browser locale. */
  locale?: string
  /** Placeholder for the end date input (range type only). */
  endPlaceholder?: string
}

export type { IDatePickerProps }

export type { IDatePickerProps as NbDatePickerProps }
