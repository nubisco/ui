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
  size?: EProgressBarSize
  /** Semantic state. `finished` and `error` fill the bar and recolor it. */
  status?: EProgressBarStatus
}

export { EProgressBarSize, EProgressBarStatus, IProgressBarProps }
