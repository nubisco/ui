import type { IAnchorRect, TAnchorSide } from '@/utils/anchorPosition.helper'

/**
 * Anything that can report where it is on screen. An `Element` satisfies it,
 * and so does a hand-written object, which is the whole point: a text
 * selection has a `DOMRect` (`range.getBoundingClientRect()`) but no element
 * to attach to. The toolbar calls it again on every reposition, so a live
 * getter keeps the toolbar glued to a selection while the page scrolls.
 */
interface IFloatingToolbarVirtualAnchor {
  getBoundingClientRect(): IAnchorRect
}

/**
 * Where the toolbar floats: an element, a virtual anchor, or a plain rectangle
 * in viewport coordinates. A plain rectangle is a snapshot. Pass a new one (or
 * call `reposition()`) when the thing it describes moves.
 */
type TFloatingToolbarAnchor = IAnchorRect | IFloatingToolbarVirtualAnchor

/** Side the toolbar prefers. It flips and clamps to stay in the viewport. */
type TFloatingToolbarPlacement = `${TAnchorSide}`

/** Which arrow keys move between the toolbar's controls. */
type TFloatingToolbarOrientation = 'horizontal' | 'vertical'

interface IFloatingToolbarProps {
  /** Renders the toolbar. The toolbar never opens or closes itself. */
  open?: boolean
  /**
   * What the toolbar floats next to. Without one the toolbar is not rendered,
   * because there is nowhere to put it.
   */
  anchor?: TFloatingToolbarAnchor | null
  /** Preferred side. Flipped automatically when it does not fit. */
  placement?: TFloatingToolbarPlacement
  /** Distance in pixels between the anchor and the toolbar. */
  gap?: number
  /**
   * Accessible name of the toolbar, e.g. `"Text formatting"`. Required: a
   * screen reader announces a toolbar by its name, and an unnamed one is just
   * "toolbar".
   */
  label: string
  /** Arrow-key axis, mirrored to `aria-orientation`. */
  orientation?: TFloatingToolbarOrientation
  /** Teleport target for the toolbar. */
  teleportTo?: string
}

export type {
  IFloatingToolbarProps,
  IFloatingToolbarVirtualAnchor,
  TFloatingToolbarAnchor,
  TFloatingToolbarOrientation,
  TFloatingToolbarPlacement,
}
