/** The star sizes: `sm` 16px, `md` 20px (the default) and `lg` 24px. */
type TRatingSize = 'sm' | 'md' | 'lg'

interface IRatingProps {
  /**
   * The rating (`v-model`), from 1 to `max`. `null` means not rated. Read
   * only, a fraction is drawn to the nearest half star and announced as
   * given.
   */
  modelValue?: number | null
  /** How many stars. */
  max?: number
  /**
   * What is being rated ("Quality"), the accessible name. Without it the
   * catalogue's `ratingLabel` ("Rating") is used.
   */
  label?: string
  /**
   * Shows the rating without taking input: an image named "Quality, 4 of 5
   * stars" instead of a radio group.
   */
  readonly?: boolean
  /** Takes the control out of use, in place. */
  disabled?: boolean
  /** The star size: `sm` 16px, `md` 20px or `lg` 24px. */
  size?: TRatingSize
  /**
   * Lets the rating go back to not rated (`null`), with a clear button after
   * the stars and with Delete or Backspace.
   */
  clearable?: boolean
}

export type { IRatingProps, TRatingSize }
