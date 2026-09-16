/**
 * The axis the handle moves along. It picks the glyph (six dots stacked for a
 * vertical move, laid flat for a horizontal one) and which arrow keys a
 * keyboard user moves with.
 */
type TDragHandleAxis = 'vertical' | 'horizontal' | 'both'

/** What started the drag. */
type TDragHandleVia = 'pointer' | 'keyboard' | 'native'

/** Direction of a single keyboard step. */
type TDragHandleDirection = 'up' | 'down' | 'left' | 'right'

interface IDragHandleProps {
  /**
   * Accessible name, and the only one the handle has: it renders a glyph and no
   * text. Name the thing being moved, e.g. `"Move Introduction"`, so a screen
   * reader user in a list of handles can tell them apart.
   */
  label: string
  /** Movement axis. Sets the glyph and the arrow keys that move. */
  axis?: TDragHandleAxis
  /** Glyph size in pixels, matching NbIcon's numeric `size`. */
  size?: number
  /**
   * Pixels the pointer must travel before a press becomes a drag. Below it the
   * press stays a click, so a handle that also opens a menu keeps working.
   */
  threshold?: number
  /**
   * Use the browser's HTML drag and drop instead of pointer tracking. The
   * handle becomes `draggable` and forwards the native `DragEvent`, so the host
   * can fill `dataTransfer`. Editors built on ProseMirror expect this.
   */
  native?: boolean
  /**
   * Keyboard instructions, read as the handle's description. Override it to
   * translate, or to describe what the arrow keys do in your layout.
   */
  instructions?: string
  /**
   * Text for the handle's polite live region. The handle does not own the
   * reorder, so it cannot know the new position. Set this after each move
   * (e.g. `"Introduction moved to position 3 of 5"`) and it is announced.
   */
  announcement?: string
  /** Renders the handle inert. */
  disabled?: boolean
}

interface IDragHandleEvent {
  via: TDragHandleVia
  /** Pointer position in viewport coordinates. Absent for keyboard drags. */
  clientX?: number
  clientY?: number
  /**
   * Distance from where the drag started, in pixels for a pointer drag and in
   * steps for a keyboard drag.
   */
  deltaX: number
  deltaY: number
  /** Set on keyboard `drag-move` events only. */
  direction?: TDragHandleDirection
  /** The DOM event behind this lifecycle event. */
  event: Event
}

export type {
  IDragHandleEvent,
  IDragHandleProps,
  TDragHandleAxis,
  TDragHandleDirection,
  TDragHandleVia,
}
