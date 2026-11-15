/**
 * How a log line is marked. `error` and `warning` colour the marker and the
 * text with the matching text colour (never a fill), and show a marker word
 * when the line has none. `debug` is muted. `info` is the plain line.
 */
export type TLogLevel = 'error' | 'warning' | 'info' | 'debug'

/** One line of a log. */
export interface ILogLine {
  /**
   * A stable key for the line. Without it the line's position in `lines` is
   * used, which is stable as long as lines are only appended.
   */
  id?: string | number
  /** The line's text. Long lines wrap unless `wrap` is off. */
  text: string
  /**
   * When it was written. Shown before the text as a time of day with
   * seconds, in `locale`.
   */
  time?: string | number | Date
  /** A ready-made time string, used as is in place of the formatted `time`. */
  timeLabel?: string
  /** See `TLogLevel`. */
  level?: TLogLevel
  /**
   * A short word before the text naming the line's kind or source: `stderr`,
   * `tool`, `git`. Defaults to the level's word for `error` and `warning`.
   */
  marker?: string
}

/**
 * A read-only log or terminal output: monospace lines that follow the newest
 * one unless the reader scrolled up, with a copy-all action.
 *
 * It fills the height it is given and scrolls inside it, so give it a height
 * through its container or a `max-height`.
 */
export interface ILogViewProps {
  /** The lines, oldest first. A plain string is a line with only text. */
  lines: ReadonlyArray<ILogLine | string>
  /**
   * The most lines rendered at once: the newest ones. The rest stay in
   * `lines`, are counted in a note at the top, and are still copied by the
   * copy action. Keeps a long-running log smooth. `0` renders every line.
   */
  maxLines?: number
  /** Follows the newest line while the reader is at the end. */
  follow?: boolean
  /** Wraps long lines. Off, a long line scrolls sideways instead. */
  wrap?: boolean
  /** Shows the copy-all button. */
  copyable?: boolean
  /**
   * The log's accessible name. Defaults to the string catalogue's
   * `logViewLabel` ("Log"). The copy button is named by `logViewCopy`.
   */
  label?: string
  /**
   * Announces new lines to a screen reader as they arrive. Off by default,
   * because a busy log would talk over everything else on the page. Turn it
   * on for a log that writes a line now and then.
   */
  announce?: boolean
  /**
   * What the empty log says. Defaults to the string catalogue's
   * `logViewEmpty` ("No output yet"). The `#empty` slot replaces it.
   */
  emptyText?: string
  /** BCP 47 tag for formatting line times. Defaults to the runtime locale. */
  locale?: string
}
