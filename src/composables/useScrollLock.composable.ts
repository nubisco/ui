/**
 * The page scroll lock, counted, in one place.
 *
 * `document.body.style.overflow` is a single slot on a single element, so every
 * component that wants to stop the page scrolling is writing to the same
 * variable. Three of ours did, independently: NbModal (counted), NbCommandPalette
 * (a raw assignment) and NbSpinner's page overlay (a save/restore pair of its
 * own). Any two of them overlapping produced the same class of bug, and the
 * worst ordering left the page permanently unscrollable with nothing on screen:
 *
 *   1. the spinner saves `''` and sets `hidden`
 *   2. a modal opens, saves `hidden` as the value to put back
 *   3. the spinner releases and restores `''`, so the page scrolls behind the
 *      open dialog
 *   4. the modal closes and restores its saved `hidden`, forever
 *
 * A counter fixes it because the thing being tracked is not "am I locked" but
 * "how many owners still need the lock". The original value is read once, when
 * the count goes from zero to one, and put back once, when it returns to zero.
 * Restoring the literal previous value (usually the empty string, meaning "not
 * set by us") matters: an application that legitimately sets `overflow: hidden`
 * on the body for its own layout keeps it.
 *
 * Owners hold a share rather than calling the module functions directly, so a
 * component that unmounts mid-lock releases exactly one count and a component
 * that locks twice still only holds one.
 */

import { onScopeDispose } from 'vue'

let lockCount = 0
let previousOverflow = ''

/** Adds one owner to the lock, taking the scrollbar away on the first. */
export function acquireScrollLock(): void {
  if (typeof document === 'undefined') return
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

/** Drops one owner. The page scrolls again only when the last one has gone. */
export function releaseScrollLock(): void {
  if (typeof document === 'undefined') return
  if (lockCount === 0) return
  lockCount -= 1
  if (lockCount === 0) document.body.style.overflow = previousOverflow
}

/** How many owners hold the lock. Exposed for tests and for debugging. */
export function scrollLockDepth(): number {
  return lockCount
}

/**
 * One owner's share of the lock, tied to the calling scope.
 *
 * `lock()` and `unlock()` are idempotent for this owner, and the share is
 * released automatically when the component goes away, which is the case that
 * used to leak: a route change that unmounts a dialog without closing it.
 */
export function useScrollLock(): { lock: () => void; unlock: () => void } {
  let held = false

  function lock() {
    if (held) return
    held = true
    acquireScrollLock()
  }

  function unlock() {
    if (!held) return
    held = false
    releaseScrollLock()
  }

  onScopeDispose(unlock, true)

  return { lock, unlock }
}

/** Test helper: forgets every owner and puts the body back as it was found. */
export function resetScrollLock(): void {
  if (lockCount > 0 && typeof document !== 'undefined') {
    document.body.style.overflow = previousOverflow
  }
  lockCount = 0
  previousOverflow = ''
}
