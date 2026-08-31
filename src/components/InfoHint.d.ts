import type { TAnchorSide } from '@/utils/anchorPosition.helper'

/**
 * Side the hint popover prefers. It is a preference, not a guarantee: the
 * popover flips and clamps itself to stay inside the viewport.
 */
type TInfoHintPlacement = `${TAnchorSide}`

interface IInfoHintProps {
  /**
   * Plain-text description. Ignored when the default slot is used, which is
   * the escape hatch for rich content (lists, formulas, inline code).
   */
  text?: string
  /** Optional bold heading above the body. */
  title?: string
  /**
   * Glossary / documentation identifier for the concept being explained. The
   * library never resolves it — it is echoed back on the `activate` event and
   * mirrored to `data-term`, so an app can map it to a central glossary or
   * deep-link into its docs without the component knowing anything about
   * either.
   */
  term?: string
  /** Preferred popover side. Flipped automatically when it does not fit. */
  placement?: TInfoHintPlacement
  /** Icon size in pixels, matching NbIcon's numeric `size`. */
  size?: number
  /** Any icon name NbIcon accepts. Defaults to the Phosphor `info` glyph. */
  icon?: string
  /**
   * Accessible name for the trigger button. Override it when the hint sits
   * next to an ambiguous value so screen-reader users hear what it explains,
   * e.g. `label="About the archived status"`.
   */
  label?: string
  /** Delay in ms before a hover opens the popover. */
  openDelay?: number
  /** Delay in ms before leaving the trigger closes the popover. */
  closeDelay?: number
  /** Teleport target for the popover. */
  teleportTo?: string
  /** Renders the icon inert and suppresses the popover. */
  disabled?: boolean
}

export type { TInfoHintPlacement, IInfoHintProps }
