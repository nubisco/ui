/**
 * The two facts about NbConfirm's surroundings that are not the component:
 * how long its exit takes, and which teleported popups count as being inside
 * it. Both are shared between NbConfirm and `useConfirm()`, and both used to
 * be duplicated in the two files with nothing keeping them in step.
 */

/**
 * How long the dialog takes to leave, in milliseconds.
 *
 * This is not a reading of NbModal's stylesheet. NbModal declares its own
 * `0.2s` transition, and an earlier version of this file copied that number
 * by hand into the queue's delay, which meant editing the SCSS silently
 * desynchronised the queue: the next question appeared before the last one
 * had faded, or the dialog sat blank waiting for a transition that had
 * already finished.
 *
 * So NbConfirm stopped reading the number and started writing it.
 * `applyConfirmMotion` puts this duration on the overlay and the dialog box
 * as an inline `transition-duration`, which wins over the stylesheet, so the
 * animation the user sees and the delay the queue waits are the same value by
 * construction. Change it here and both move together.
 */
export const CONFIRM_LEAVE_MS = 200

/**
 * Popups our own components teleport to `<body>`. They are visually inside
 * the dialog and logically owned by a control inside it, but in the DOM they
 * are siblings of it, so a focus trap that only knows about descendants would
 * yank focus out of an open NbSelect list the moment the user pressed Tab,
 * and Escape would abandon the question instead of closing the list.
 */
const BUILT_IN_FLOATING = [
  '[data-nb-confirm-floating]',
  '.nb-select__dropdown',
  '.nb-menu',
  '.nb-date-picker__calendar',
  '.nb-user-menu__panel',
  '.nb-sidebar-menu-item__flyout',
]

const registered = new Set<string>()

/**
 * Teaches every NbConfirm about a popup that teleports out of the dialog and
 * cannot carry `[data-nb-confirm-floating]` itself, which is the usual case
 * for a third-party combobox or date picker whose markup you do not own.
 *
 * ```ts
 * registerConfirmFloatingSelector('.tomselect-dropdown')
 * ```
 *
 * Call it once at application start. It is additive and idempotent; use the
 * `floatingSelectors` prop instead when only one dialog needs the exemption.
 * Returns a function that removes the selector again, for a plugin that has
 * to clean up after itself.
 */
export function registerConfirmFloatingSelector(selector: string): () => void {
  const trimmed = selector.trim()
  if (!trimmed) return () => {}
  registered.add(trimmed)
  return () => {
    registered.delete(trimmed)
  }
}

/** Every selector currently treated as "still inside the dialog". */
export function floatingSelector(extra: readonly string[] = []): string {
  return [...BUILT_IN_FLOATING, ...registered, ...extra]
    .map((selector) => selector.trim())
    .filter(Boolean)
    .join(',')
}

/**
 * Writes the exit duration onto the nodes NbModal animates.
 *
 * Under `prefers-reduced-motion` the duration is zero rather than
 * `transition: none`, for two reasons. It is a value, so flipping the
 * preference back mid-session restores the animation instead of leaving a
 * dead `none` on a recycled node. And it is the same property the queue
 * reads, so a user with reduced motion gets the shorter queue delay too
 * rather than waiting out an animation that never ran.
 */
export function applyConfirmMotion(
  dialog: HTMLElement | null,
  reduced: boolean,
): void {
  if (!dialog) return
  const duration = `${reduced ? 0 : CONFIRM_LEAVE_MS}ms`
  dialog.style.transitionDuration = duration
  const overlay = dialog.parentElement
  if (overlay instanceof HTMLElement)
    overlay.style.transitionDuration = duration
}
