/**
 * One message in an `NbChatThread`: who said it, when, and what. The
 * viewer's own messages (`own`) sit at the end of the line on the accent
 * surface, everyone else's at the start on the plain one, so a reader tells
 * the two sides apart by place and surface, never by a status colour.
 */
interface IChatMessageProps {
  /** Who said it. Shown above the message and part of what is announced. */
  author: string
  /**
   * The avatar beside the message, drawn by `NbAvatar`. A URL draws the
   * picture, `null` draws the author's initials, and leaving it out draws no
   * avatar at all.
   */
  picture?: string | null
  /** The viewer's own message: placed at the end, on the accent surface. */
  own?: boolean
  /**
   * The message as plain text. Line breaks are kept and long words wrap.
   * The default slot replaces it with rich content.
   */
  text?: string
  /**
   * When it was said. Rendered as a `<time>` with a machine-readable
   * `datetime`, formatted as a short time of day in `locale`, with the full
   * date and time as its tooltip.
   */
  time?: string | number | Date
  /** A ready-made time string, used as is in place of the formatted `time`. */
  timeLabel?: string
  /** BCP 47 tag for formatting `time`. Defaults to the runtime locale. */
  locale?: string
  /**
   * A model wrote this message. Draws the AI label after the author's name,
   * as the AI label docs ask for every place AI content appears.
   */
  ai?: boolean
  /**
   * What the AI label explains when opened: the inputs the product gave the
   * model, the provider and model, and whether a fallback was used. The
   * `#ai-explain` slot replaces it with rich content. Without either, the
   * label is a plain mark.
   */
  aiExplain?: string
}

export type { IChatMessageProps }
