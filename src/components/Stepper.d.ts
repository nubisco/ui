import { IDefaultProps } from '@/types/Props.d'

/** Reading direction of the step list. */
enum EStepperOrientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

/** Marker and type scale. */
enum EStepperSize {
  Small = 'sm',
  Medium = 'md',
}

/**
 * The state one step is in. Derived from position unless a step overrides it
 * with `complete`, `invalid` or `disabled`.
 */
enum EStepStatus {
  /** Behind the current step, or explicitly marked done. */
  Complete = 'complete',
  /** Where the user is now. */
  Current = 'current',
  /** Ahead of the current step. */
  Incomplete = 'incomplete',
  /** Cannot be reached at all, whatever the user has visited. */
  Disabled = 'disabled',
  /** Visited and left in a state the flow will not accept. */
  Invalid = 'invalid',
}

/**
 * The words read out after a step's label, and the accessible name of the
 * list. The only English in the component, so this is the localisation hook.
 */
interface IStepperLabels {
  /** Accessible name of the list when `ariaLabel` is not given. */
  progress?: string
  /**
   * Template announced politely when the current step changes.
   * `{step}`, `{total}` and `{label}` are substituted.
   */
  announcement?: string
  complete?: string
  current?: string
  incomplete?: string
  disabled?: string
  invalid?: string
}

interface IStepperProps extends IDefaultProps {
  /** Zero-based index of the current step. Omit to let the stepper own it. */
  modelValue?: number
  /** Layout direction. Vertical reads better when labels are long. */
  orientation?: `${EStepperOrientation}`
  /** Marker and type scale. */
  size?: `${EStepperSize}`
  /** Allow clicking back to a step the user has already reached. */
  navigable?: boolean
  /**
   * Furthest index the user has reached, which is what `navigable` opens up.
   * Omit and the stepper keeps its own high-water mark, so going back never
   * closes the steps ahead. Pass it when the flow is resumed from storage.
   */
  furthest?: number
  /** Accessible name of the list. Falls back to `labels.progress`. */
  ariaLabel?: string
  /** Status words announced per step. Override to translate. */
  labels?: IStepperLabels
  /**
   * Announce the new step in a polite live region when the flow advances.
   * Turn it off when the flow already moves focus to the new step's heading,
   * which would otherwise announce the move twice.
   */
  announce?: boolean
}

interface IStepperStepProps extends IDefaultProps {
  /** One or two words naming what the step accomplishes. */
  label?: string
  /** Optional second line: what the step needs, or why it is optional. */
  description?: string
  /**
   * Force the complete state on a step that is not behind the current one,
   * for a flow that lets an optional step be finished out of order.
   */
  complete?: boolean
  /** Visited and rejected. Stays reachable so the user can go back and fix it. */
  invalid?: boolean
  /** Not part of this run of the flow. Never reachable, never focusable. */
  disabled?: boolean
}

export {
  EStepperOrientation,
  EStepperSize,
  EStepStatus,
  IStepperLabels,
  IStepperProps,
  IStepperStepProps,
}
