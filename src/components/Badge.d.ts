import type { TIconSource } from '../types/Glyph.d'

// FIXME replace the variant with the existing variants
enum EBadgeVariant {
  Grey = 'grey',
  Blue = 'blue',
  Orange = 'orange',
  Green = 'green',
  Red = 'red',
  Purple = 'purple',
  Primary = 'primary',
}

enum EBadgeSize {
  Small = 'sm',
  Medium = 'md',
}

interface IBadgeProps {
  variant?: `${EBadgeVariant}`
  size?: `${EBadgeSize}`
  dot?: boolean
  /** A leading icon, sized to the badge's text. */
  icon?: TIconSource
  /**
   * Stands in for a value that is not set yet: a dashed outline and quiet
   * italic text in place of the variant's fill ("No labels", "No goal").
   * Same height as a filled badge of the same size, so a row of badges keeps
   * its shape whether it holds values or only the placeholder.
   */
  placeholder?: boolean
  /**
   * Renders a real `<button type="button">` with hover and focus states, for
   * a badge that does something when pressed (a placeholder that sets its
   * value, a filter chip). Listen with `@click`. Name it with `aria-label`
   * when the text alone does not say what pressing it does.
   */
  interactive?: boolean
}

export { EBadgeVariant, EBadgeSize, IBadgeProps }
