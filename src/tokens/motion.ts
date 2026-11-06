/**
 * Motion tokens for script.
 *
 * The same durations and curves that `src/styles/variables/_animations.scss`
 * declares and `_theme.scss` emits as `--nb-motion-*` and `--nb-ease-*`. CSS
 * reads the custom properties. Script reads these when it has to wait for a
 * transition to finish (a timer, a queued dialog, a chip removed after its
 * exit), because a timer needs a number and a custom property is a string.
 *
 * `tests/motion-tokens.test.ts` compiles the Sass maps and fails if the two
 * ever disagree, so neither side can drift on its own.
 *
 * A product that retunes a token on `:root` retunes the CSS, not these
 * numbers: a timer written against them is then early or late by the
 * difference, never broken. Where that matters, read the property at the
 * call site (`getComputedStyle(el).getPropertyValue('--nb-motion-short')`).
 */

/** Durations, in milliseconds, by step. */
export const motion = Object.freeze({
  micro: 70,
  quick: 110,
  short: 150,
  medium: 240,
  long: 400,
  /** Expressive only: a page arriving or a critical alert, never a control. */
  slow: 700,
} as const)

/** Easing curves, as CSS `cubic-bezier()` strings, by role. */
export const easing = Object.freeze({
  standard: 'cubic-bezier(0.2, 0, 0.38, 0.9)',
  enter: 'cubic-bezier(0, 0, 0.38, 0.9)',
  exit: 'cubic-bezier(0.2, 0, 1, 0.9)',
  /** Expressive: a page arriving or a critical alert, never a control. */
  'standard-expressive': 'cubic-bezier(0.4, 0.14, 0.3, 1)',
  'enter-expressive': 'cubic-bezier(0, 0, 0.3, 1)',
  'exit-expressive': 'cubic-bezier(0.4, 0.14, 1, 1)',
} as const)

/** A step of the duration scale. */
export type TMotionStep = keyof typeof motion
/** A role of the easing family. */
export type TEasingRole = keyof typeof easing
