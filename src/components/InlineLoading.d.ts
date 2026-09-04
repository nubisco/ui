import { IDefaultProps } from '@/types/Props.d'

/**
 * The four states a single action moves through. `inactive` is not "hidden":
 * the component still renders its (empty) live region so that assistive tech
 * is watching the node before the first update lands in it.
 */
enum EInlineLoadingStatus {
  Inactive = 'inactive',
  Active = 'active',
  Finished = 'finished',
  Error = 'error',
}

interface IInlineLoadingProps extends IDefaultProps {
  /** Current state of the action. */
  status?: `${EInlineLoadingStatus}`
  /** Text shown while `status` is `active`. Present tense: "Saving". */
  label?: string
  /** Text shown while `status` is `finished`. Past tense: "Saved". */
  finishedLabel?: string
  /** Text shown while `status` is `error`. Say what failed, not "Error". */
  errorLabel?: string
  /**
   * Milliseconds the finished state stays on screen before `success` is
   * emitted. Below roughly 1000 the confirmation is gone before it is read.
   */
  dwell?: number
  /**
   * Reserves horizontal space for the longest of the three labels so the
   * controls beside it do not jump when the text changes. Turn off when the
   * component is the last thing in its row and nothing can be pushed.
   */
  reserveSpace?: boolean
}

export { EInlineLoadingStatus, IInlineLoadingProps }
