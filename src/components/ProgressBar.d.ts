import { IDefaultProps, IWithLabel } from '@/types/Props.d'

enum EProgressBarSize {
  Small = 'sm',
  Medium = 'md',
}

enum EProgressBarStatus {
  Active = 'active',
  Finished = 'finished',
  Error = 'error',
}

interface IProgressBarProps extends IDefaultProps, IWithLabel {
  /** Current progress against `max`. Omit for an indeterminate bar. */
  value?: number
  /** Upper bound the progress is measured against. */
  max?: number
  /** Contextual hint below the bar. Rendered in the error style when `status` is `error`. */
  helper?: string
  /** Track thickness: `md` is 8px, `sm` is 4px. */
  size?: `${EProgressBarSize}`
  /** Semantic state. `finished` and `error` fill the bar and recolor it. */
  status?: `${EProgressBarStatus}`
  /**
   * Keep `label` as the bar's accessible name, but do not show it. For a bar
   * that sits in a row which already says what it measures (a name beside it,
   * a count after it), where a visible label would say it twice. The status
   * icon goes with the label, so the bar's colour carries the status alone.
   */
  hideLabel?: boolean
}

export { EProgressBarSize, EProgressBarStatus, IProgressBarProps }
