/**
 * The fleet's status vocabulary, the same five words NbToast, NbMessage and
 * NbBanner use. `error`, not `danger`: `danger` is the word for a destructive
 * ACTION (NbButton, NbConfirm), and the audit found an app passing
 * variant="danger" to NbMessage, which does not accept it, precisely because
 * the two vocabularies had drifted. `danger` is accepted here and treated as
 * `error` so that app's habit does not silently render an unstyled row, but it
 * is deprecated and not the documented value.
 */
export type TNotificationStatus =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'

/** @deprecated Use TNotificationStatus. */
export type TNotificationVariant = TNotificationStatus | 'danger'

export interface INotificationCenterItemProps {
  /** Headline of the notification. One line, no trailing punctuation. */
  title?: string
  /** Supporting sentence. Wraps to at most three lines before it is clipped. */
  body?: string
  /** When the event happened. Rendered as a `<time>` with a machine-readable
   *  `datetime`, and formatted relative to now unless `timeLabel` is given. */
  time?: string | number | Date
  /** A ready-made time string. Use it when the host app already formats
   *  timestamps its own way, and this component should not second-guess it. */
  timeLabel?: string
  /** Read notifications lose the dot, the tint and the heavier title. */
  read?: boolean
  /** Colours the leading icon. It does not change the unread affordance,
   *  which stays one shape everywhere so it can be learned once. Values are
   *  the library's status words: neutral, info, success, warning, error. */
  variant?: TNotificationVariant
  /** Phosphor icon name. `null` renders no icon and no icon gutter. */
  icon?: string | null
  /** Renders the row as a link. Takes priority over `interactive`. */
  href?: string
  /**
   * A row that leads somewhere is a `<button>` (or an `<a>`, with `href`).
   * A row that leads nowhere is `false` here, and then it is genuinely inert:
   * a plain element with no tabindex, outside the panel's roving focus, and
   * it never emits `select`. Not "a button that looks quieter".
   */
  interactive?: boolean
  /** BCP 47 tag for the relative time. Defaults to the runtime locale. */
  locale?: string
  /** Visually hidden state words, translated by the host. */
  unreadLabel?: string
  readLabel?: string
}
