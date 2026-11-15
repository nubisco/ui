/**
 * A conversation: a scrolling log of `NbChatMessage`s that follows the newest
 * one, and an optional composer under it.
 *
 * It fills the height it is given and scrolls inside it, so give it a height
 * through its container (a flex column, a panel body, a grid row).
 */
interface IChatThreadProps {
  /**
   * The log's accessible name. Defaults to the string catalogue's
   * `chatThreadLabel` ("Conversation").
   */
  label?: string
  /**
   * The other side is working on a reply. Shows an `NbInlineLoading` after
   * the newest message and, with `stoppable`, a stop button in the composer.
   */
  working?: boolean
  /**
   * What the working indicator says. Defaults to the string catalogue's
   * `chatThreadWorking` ("Working").
   */
  workingLabel?: string
  /** Shows the composer under the log: a multiline field and a send button. */
  composer?: boolean
  /**
   * The composer field's accessible name. Defaults to the string
   * catalogue's `chatThreadMessage` ("Message").
   */
  composerLabel?: string
  /** Defaults to the string catalogue's `chatThreadPlaceholder`. */
  placeholder?: string
  /**
   * Turns the composer off. The field and the send button are disabled, and
   * `disabledReason` says why, under the field and as the send button's
   * tooltip. The log stays readable and scrollable.
   */
  disabled?: boolean
  /**
   * Why the composer is off: "The agent is not running", "This conversation
   * is archived". Shown only while `disabled`.
   */
  disabledReason?: string
  /**
   * While `working`, shows a stop button beside the send button, which emits
   * `stop`. Sending stays possible, so a host can queue a follow-up.
   */
  stoppable?: boolean
  /** Defaults to the string catalogue's `chatThreadSend` ("Send"). */
  sendLabel?: string
  /** Defaults to the string catalogue's `chatThreadStop` ("Stop"). */
  stopLabel?: string
  /**
   * The composer field's visible rows before it scrolls. It starts at one
   * row and grows with the text where the browser supports it.
   */
  maxRows?: number
}

export type { IChatThreadProps }
