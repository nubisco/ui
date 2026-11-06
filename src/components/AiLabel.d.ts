import type { TAnchorSide } from '@/utils/anchorPosition.helper'

enum EAiLabelVariant {
  Default = 'default',
  Inline = 'inline',
}

// #region EAiLabelSize
enum EAiLabelSize {
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
}
// #endregion EAiLabelSize

interface IAiLabelProps {
  variant?: `${EAiLabelVariant}`
  /**
   * `sm`, `md` or `lg`: a 24, 32 or 40px square for the default variant, and
   * 12, 14 or 16px type for the inline one.
   */
  size?: `${EAiLabelSize}`
  /**
   * Always render the mark, even when there is something to open. Without it
   * the label is already a mark unless it has something to do, so this is
   * only needed to silence a label whose host passes content it should not
   * show.
   */
  static?: boolean
  /**
   * Accessible name. Defaults to "AI, show information" for the control and
   * "Written by AI" for the mark.
   */
  label?: string
  /**
   * The visible word of the inline variant, beside the dot. Default "AI".
   * An empty string draws the glyph instead.
   */
  text?: string
  /**
   * A plain-text explanation, shown when the label is opened. The `#explain`
   * slot replaces it with rich content: the facts the product computed, the
   * provider and model, and whether the plain fallback was used and why.
   * Either one makes the label a button.
   */
  explain?: string
  /**
   * Preferred side for the explanation. It flips and clamps to stay on
   * screen, and on a phone it is a bottom sheet instead.
   */
  placement?: TAnchorSide
  /** Teleport target for the explanation. */
  teleportTo?: string
  /**
   * The person has edited the AI value. The label becomes an undo button
   * named by `revertLabel`, and activating it emits `revert`. The host
   * restores the AI value and sets this back to false.
   */
  revertable?: boolean
  /** Accessible name of the undo button. Default "Revert to AI input". */
  revertLabel?: string
  /**
   * A plain rendering of the same facts exists. The explanation offers it
   * as an action that emits `show-plain`, and this alone makes the label a
   * button.
   */
  plainAvailable?: boolean
  /** Text of the plain-version action. Default "Show the plain version". */
  showPlainLabel?: string
}

export { EAiLabelVariant, EAiLabelSize, IAiLabelProps }
