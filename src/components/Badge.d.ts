import type { TIconSource } from '../types/Glyph.d'

/**
 * What the badge means, not what colour it is. Each intent paints the
 * library's status surface pair (`--nb-c-<intent>-surface` under
 * `--nb-c-on-<intent>-surface`), measured at AA or better; `primary` is the
 * filled accent with its `-a11y` foreground.
 *
 * The colour names are deprecated aliases. They render as the intent they
 * map to and warn once in development: grey is neutral, blue is info, green
 * is success, orange is warning, red is danger, purple is primary.
 */
enum EBadgeVariant {
  Neutral = 'neutral',
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Danger = 'danger',
  Primary = 'primary',
  /** @deprecated use `neutral` */
  Grey = 'grey',
  /** @deprecated use `info` */
  Blue = 'blue',
  /** @deprecated use `warning` */
  Orange = 'orange',
  /** @deprecated use `success` */
  Green = 'green',
  /** @deprecated use `danger` */
  Red = 'red',
  /** @deprecated use `primary` */
  Purple = 'purple',
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
