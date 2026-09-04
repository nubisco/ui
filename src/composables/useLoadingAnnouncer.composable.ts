/**
 * Announces that a load has finished, from a component that is about to stop
 * existing.
 *
 * A spinner or a skeleton says "this is loading" and then, when the work is
 * done, it is unmounted. Sighted users see the content appear. A screen reader
 * user gets silence: the live region that was doing the talking has been
 * removed from the document, so nothing can be spoken through it, and the
 * newly inserted content is not itself an update anyone is watching. Every
 * loading indicator in the library shares this problem, and it is why the
 * completion half of a load is the part that goes missing.
 *
 * The fix cannot live inside the component: to be heard, the message has to be
 * written into a live region that is already in the document and stays there
 * afterwards. So there is one shared region, owned by this module, appended to
 * `<body>` the first time anything announces and reused from then on.
 *
 * Two details that matter more than they look:
 *
 * - The message is written on a later task, not synchronously. A live region
 *   that is inserted and filled in the same frame is frequently missed, and
 *   the announcement typically races the unmount that triggered it.
 * - The same text twice in a row is not spoken twice by most screen readers,
 *   because the node's contents did not change. Clearing first makes the
 *   second "Invoices loaded" a real change.
 *
 * The delay is also what makes `suppressLoadingAnnouncement` possible, and that
 * matters more than it sounds: an indicator is unmounted by the same state
 * change that decides whether the load succeeded or failed, and it cannot read
 * that decision. Vue does not update a component's props on the render that
 * removes it, so a `:failed` prop set in the same tick is never seen by the
 * teardown handler. The failure path speaks up instead. See the composable's
 * docs and the "when the fetch fails" section of the skeleton page.
 */

import { NB_OVERLAY_EXEMPT_ATTR } from '@/components/Spinner.overlay'

let region: HTMLElement | null = null
let pending: ReturnType<typeof setTimeout> | undefined
let suppressed = false
let suppression: ReturnType<typeof setTimeout> | undefined

function ensureRegion(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  if (region?.isConnected) return region

  region = document.createElement('div')
  region.setAttribute('role', 'status')
  region.setAttribute('aria-live', 'polite')
  region.setAttribute('aria-atomic', 'true')
  region.className = 'nb-loading-announcer'
  // A page overlay blocks every body child that existed when it claimed, and
  // this region is a body child. Blocked, it would be painted above the scrim
  // by token and silent in the accessibility tree, so the one message the
  // blocked user is waiting for ("Invoices loaded") would never be spoken.
  // The attribute is the contract that keeps announcers out of containment;
  // see NB_OVERLAY_EXEMPT_ATTR in Spinner.overlay.ts.
  region.setAttribute(NB_OVERLAY_EXEMPT_ATTR, '')
  // Inline, not a stylesheet: the region is created from script and can be
  // appended to a page that has not loaded our CSS (a consumer importing one
  // component). It must never be visible, and it must never be display:none,
  // which removes it from the accessibility tree along with the announcement.
  region.style.cssText =
    'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;white-space:nowrap;border:0;clip-path:inset(50%)'
  document.body.appendChild(region)
  return region
}

/**
 * Speaks `message` politely. Called from a component's teardown, after the
 * work it was covering has finished.
 */
// #region announceLoadingComplete
export function announceLoadingComplete(message: string | undefined): void {
  if (!message) return
  // A failure claimed this load a moment ago. "Description loaded" is now a
  // lie, and it would be spoken to exactly the user who cannot see the banner
  // that says otherwise.
  if (suppressed) return
  const node = ensureRegion()
  if (!node) return

  node.textContent = ''
  if (pending) clearTimeout(pending)
  pending = setTimeout(() => {
    pending = undefined
    node.textContent = message
  }, 60)
}
// #endregion announceLoadingComplete

/**
 * Cancels the completion announcement for the load that is ending right now.
 *
 * Call it where the failure is known, before the state change that removes the
 * indicator:
 *
 * ```ts
 * catch (reason) {
 *   suppressLoadingAnnouncement()
 *   error.value = reason
 * }
 * ```
 *
 * The suppression covers anything queued for the rest of the current task, so
 * it holds across the render that unmounts the spinner or skeleton and the
 * teardown handler that would have announced. It then lifts by itself: the
 * next load is a new load, and it is allowed to report its own ending.
 */
// #region suppressLoadingAnnouncement
export function suppressLoadingAnnouncement(): void {
  if (pending) {
    clearTimeout(pending)
    pending = undefined
  }
  if (region?.isConnected) region.textContent = ''
  suppressed = true
  if (suppression) clearTimeout(suppression)
  suppression = setTimeout(() => {
    suppression = undefined
    suppressed = false
  }, 0)
}
// #endregion suppressLoadingAnnouncement

/** The shared region, for tests. Null until something has announced. */
export function loadingAnnouncerRegion(): HTMLElement | null {
  return region?.isConnected ? region : null
}

/** Test helper: removes the region and cancels anything queued. */
export function resetLoadingAnnouncer(): void {
  if (pending) clearTimeout(pending)
  pending = undefined
  if (suppression) clearTimeout(suppression)
  suppression = undefined
  suppressed = false
  region?.remove()
  region = null
}
