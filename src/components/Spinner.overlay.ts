import { ref, type Ref } from 'vue'
import {
  acquireScrollLock,
  releaseScrollLock,
} from '@/composables/useScrollLock.composable'

/**
 * Containment for `NbSpinner`'s two blocking modes.
 *
 * The whole of it rests on one rule, and the rule is document order:
 *
 *   **A blocking spinner blocks the page as it stood when it went up. Anything
 *   that arrives afterwards arrived on top of it, and stays usable.**
 *
 * That is the same arbitration NbModal already uses to decide which of a stack
 * of dialogs answers Escape (Modal.vue's `isTopmost`, "the last aria-modal
 * element in document order"), and it is the only rule here. It decides paint,
 * because the page overlay sits at exactly `--nb-zindex-modal` and teleported
 * siblings at equal z-index paint in document order. It decides focus, because
 * the elements marked `inert` are the ones that existed at claim time. Paint
 * and focus therefore cannot disagree, which is the failure mode of every
 * containment layer that arbitrates focus with one rule and stacking with
 * another: an element that is on top and unreachable, or reachable and
 * invisible.
 *
 * It also means there is no focus trap here. `inert` is the containment, not a
 * `focusin` listener that pulls focus back: a listener has to decide, on every
 * focus change, whether the new holder outranks the overlay, and a widget that
 * refocuses itself when it loses focus turns that decision into a loop. The
 * attribute has no such conversation. What we do instead is bookkeeping:
 * remember what we marked, count owners so two overlays cannot untangle each
 * other's work, and put every attribute back exactly as it was found.
 *
 * The rule has exactly one exception, and it is written down in
 * `NB_OVERLAY_EXEMPT_ATTR` below: a host that exists only to speak. Those are
 * skipped, because taking them out of the accessibility tree is the one thing
 * that would make paint and focus disagree in the other direction.
 *
 * Claims are keyed by a per-instance symbol rather than by the element, so a
 * component can release during teardown, after Vue has detached the node, and
 * two spinners that happen to share a DOM id still count as two claims.
 */

interface IPageOverlayEntry {
  key: symbol
  element: HTMLElement
  /** Elements this claim marked inert, in the order they were marked. */
  inerted: HTMLElement[]
}

/** Bottom to top. The last entry is the overlay currently in charge. */
const stack: Ref<IPageOverlayEntry[]> = ref([])

/**
 * How many live claims (page overlays and contained regions) depend on each
 * element staying inert.
 *
 * Without the count, two overlapping overlays hand each other a broken page:
 * the second one skips a sibling because it is already inert, the first one
 * releases and clears it, and half the application comes back to life
 * underneath a scrim that is still up. Elements the application inerted for
 * its own reasons never enter the map at all, so they are never cleared.
 */
const inertOwners = new Map<HTMLElement, number>()

/** What had focus before the first overlay of a run appeared. */
let restoreTarget: HTMLElement | null = null

/** That element's parent at claim time, kept for the case where it is removed. */
let restoreParent: HTMLElement | null = null

/**
 * True for the overlay that arrived first, which is the only one allowed to
 * paint the scrim. Reactive: if the bottom overlay leaves while a second is
 * still up, the survivor takes over the paint rather than blocking invisibly.
 */
export function isBasePageOverlay(key: symbol): boolean {
  return stack.value.length > 0 && stack.value[0].key === key
}

/** The overlay currently on top of the stack, for tests and debugging. */
export function topPageOverlay(): HTMLElement | null {
  return stack.value.length > 0
    ? stack.value[stack.value.length - 1].element
    : null
}

// ── The exemption ────────────────────────────────────────────────────────────

/**
 * Marks a host that a blocking overlay must never inert.
 *
 * `inert` is deliberately blunt: it removes a subtree from hit testing, from
 * the tab order AND from the accessibility tree. That is exactly right for the
 * application, and exactly wrong for a node whose only job is to be read out.
 * A toast raised while the page is blocked ("Session expired", "Import
 * finished") is the message the blocked user most needs, and it paints above
 * the scrim by token (`--nb-zindex-toast` is `--nb-zindex-modal` plus 50). If
 * the region that speaks it is inert, the message is painted and silent, which
 * is precisely the paint-and-focus disagreement this module claims to make
 * impossible.
 *
 * So: put `data-nb-overlay-exempt` on any host that exists to announce rather
 * than to be operated. In the library that is `NbToaster`'s announcer and its
 * stack, plus the shared loading announcer. In an application it is any live
 * region you own and mount at the top of the document. Nothing else should
 * carry it: a form that opts itself out of blocking is a form the user can
 * submit while the page says it cannot be used.
 */
export const NB_OVERLAY_EXEMPT_ATTR = 'data-nb-overlay-exempt'

/**
 * Library hosts that are exempt whether or not they carry the attribute.
 *
 * The attribute is the contract, and it is what an application should use.
 * These class names are a floor under it, so a mismatched pair of package
 * versions (a Toaster built before the contract existed, an app pinning an
 * older build) degrades to a working toast rather than to a silent one. The
 * failure mode being guarded against is unhearable, so it is worth two
 * selectors.
 */
const LEGACY_EXEMPT =
  '.nb-toaster, .nb-toaster__announcer, .nb-loading-announcer'

const EXEMPT_SELECTOR = `[${NB_OVERLAY_EXEMPT_ATTR}], ${LEGACY_EXEMPT}`

/**
 * How far to descend looking for an exempt node before giving up and blocking
 * the branch whole.
 *
 * Exempt hosts are mounted at the top of the document (that is what makes them
 * exempt), so a handful of levels covers every real case, including a toaster
 * teleported into a wrapper of the application's own. The limit exists because
 * the alternative is an unbounded `querySelector` walk over an arbitrarily
 * deep application tree on every claim, and because if something exempt really
 * is buried eight levels inside the page, containment is the safer answer.
 */
const MAX_EXEMPT_DESCENT = 8

/**
 * Marks an element as exempt and returns a function that puts it back.
 *
 * For application-owned live regions. Call it once, when the region is
 * mounted; the attribute is read at claim time, so an overlay that is already
 * up does not pick it up retroactively.
 */
export function markOverlayExempt(element: HTMLElement): () => void {
  const had = element.hasAttribute(NB_OVERLAY_EXEMPT_ATTR)
  element.setAttribute(NB_OVERLAY_EXEMPT_ATTR, '')
  return () => {
    if (!had) element.removeAttribute(NB_OVERLAY_EXEMPT_ATTR)
  }
}

/**
 * Blocks one branch of the tree, leaving exempt hosts inside it reachable.
 *
 * Three outcomes, in order:
 *
 * 1. The branch is itself exempt: nothing happens to it at all.
 * 2. The branch contains something exempt: the branch is left alone and the
 *    question is asked again of each of its children, so the announcer inside
 *    a wrapper stays live while its siblings are blocked. A wrapper that is
 *    focusable in its own right keeps its focusability here; that is the price
 *    of not blocking the thing inside it, and it is why exempt hosts belong at
 *    the top of the document rather than inside the application.
 * 3. Neither: the branch is blocked whole, which is the ordinary case and the
 *    only one that costs a single attribute write.
 */
function inertBranch(
  element: HTMLElement,
  owned: HTMLElement[],
  depth = 0,
): void {
  if (element.matches(EXEMPT_SELECTOR)) return
  if (depth < MAX_EXEMPT_DESCENT && element.querySelector(EXEMPT_SELECTOR)) {
    for (const child of Array.from(element.children)) {
      if (child instanceof HTMLElement) inertBranch(child, owned, depth + 1)
    }
    return
  }
  takeInert(element, owned)
}

// ── Inert bookkeeping ────────────────────────────────────────────────────────

/**
 * Marks `element` inert on behalf of one claim, and reports whether the claim
 * now owns a share of it. An element the application had already inerted is
 * left entirely alone: it is already unreachable, and clearing it later would
 * be us undoing a decision that was never ours.
 */
function takeInert(element: HTMLElement, owned: HTMLElement[]): void {
  const count = inertOwners.get(element)
  if (count === undefined && element.hasAttribute('inert')) return
  if (count === undefined) element.setAttribute('inert', '')
  inertOwners.set(element, (count ?? 0) + 1)
  owned.push(element)
}

/** Gives back one claim's shares, clearing the attribute at the last one. */
function returnInert(owned: HTMLElement[]): void {
  for (const element of owned) {
    const count = inertOwners.get(element)
    if (count === undefined) continue
    if (count > 1) {
      inertOwners.set(element, count - 1)
      continue
    }
    inertOwners.delete(element)
    element.removeAttribute('inert')
  }
  owned.length = 0
}

// ── Focus restoration ────────────────────────────────────────────────────────

/**
 * Elements that can already take focus without us editing them.
 *
 * The fallback deliberately stops here rather than making something focusable.
 * Writing `tabindex="-1"` onto a consumer's element to focus it is a permanent
 * change to a tree we do not own: it outlives the spinner and turns that
 * element into a target for every later `.focus()` in the application. If the
 * control that started the work is gone and nothing focusable survives near
 * it, focus is left where the browser put it and the page says so in its docs.
 */
const FOCUSABLE =
  'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable=""], [contenteditable="true"]'

function isFocusable(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false
  if (element.hasAttribute('disabled')) return false
  if (element.getAttribute('aria-hidden') === 'true') return false
  return element.matches(FOCUSABLE)
}

function restoreFocus(released: HTMLElement | null): void {
  const target = restoreTarget
  const parentAtClaimTime = restoreParent
  restoreTarget = null
  restoreParent = null
  if (typeof document === 'undefined') return

  // Someone else is holding focus now, which under the document-order rule
  // means they arrived on top of us: a dialog opened while the spinner was up
  // and is still open. Putting the user back where they were before the
  // spinner would take them out of it.
  const active = document.activeElement
  const heldByUs =
    active === null ||
    active === document.body ||
    active === released ||
    (released !== null && released.contains(active))
  if (!heldByUs) return

  if (!target) return

  if (target.isConnected) {
    target.focus({ preventScroll: true })
    return
  }

  // The work an overlay covers routinely deletes the control that started it
  // (a row that was removed, a form that was replaced). Walk up to the nearest
  // surviving ancestor and take the first thing there that is focusable in its
  // own right.
  let node: HTMLElement | null = parentAtClaimTime
  while (node && !node.isConnected) node = node.parentElement
  while (node && node !== document.body) {
    if (isFocusable(node)) {
      node.focus({ preventScroll: true })
      return
    }
    const candidate = node.querySelector(FOCUSABLE)
    if (candidate && isFocusable(candidate)) {
      ;(candidate as HTMLElement).focus({ preventScroll: true })
      return
    }
    node = node.parentElement
  }
}

// ── Claim and release ────────────────────────────────────────────────────────

export function claimPageOverlay(key: symbol, element: HTMLElement): void {
  if (typeof document === 'undefined') return
  if (stack.value.some((entry) => entry.key === key)) return

  if (stack.value.length === 0) {
    const active = document.activeElement
    restoreTarget = active instanceof HTMLElement ? active : null
    // Captured now, while it still has a parent: a detached node's
    // parentElement is already null by the time we come to restore.
    restoreParent = restoreTarget?.parentElement ?? null
    // One share of the counted lock every blocking surface in the library
    // holds. A blocking overlay that scrolls with the page is not blocking.
    acquireScrollLock()
  }

  const entry: IPageOverlayEntry = { key, element, inerted: [] }

  // The snapshot. Body children present now are the application this overlay
  // is blocking; children appended later opened on top of it and are left
  // reachable, because they also paint on top of it. Exempt hosts are skipped
  // whenever they were mounted, because a live region is not the application.
  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement)) continue
    if (child === element || child.contains(element)) continue
    inertBranch(child, entry.inerted)
  }

  stack.value = [...stack.value, entry]
  element.focus({ preventScroll: true })
}

export function releasePageOverlay(key: symbol): void {
  const entry = stack.value.find((item) => item.key === key)
  if (!entry) return

  returnInert(entry.inerted)
  stack.value = stack.value.filter((item) => item.key !== key)

  if (stack.value.length > 0) {
    // A lower overlay is still up and still owns its own snapshot, so the page
    // stays blocked. Focus moves to the survivor rather than escaping.
    topPageOverlay()?.focus({ preventScroll: true })
    return
  }

  releaseScrollLock()
  restoreFocus(entry.element)
}

// ── Contained regions ────────────────────────────────────────────────────────

/**
 * Blocks one region rather than the page, for `overlay="container"`.
 *
 * A scrim over a panel stops the mouse and nothing else: the controls under it
 * keep their place in the tab order, so a keyboard user tabs straight into a
 * form that is visibly unavailable and submits it. The same snapshot rule
 * applies here, scoped to the covered container: everything in it at the
 * moment the spinner appeared is inert until the spinner leaves, the container
 * is marked `aria-busy` so assistive tech reads it as being rebuilt, and both
 * attributes are put back exactly as they were found.
 *
 * Returns the release function. Calling it twice is a no-op.
 */
export function containRegion(
  container: HTMLElement,
  exclude: HTMLElement,
): () => void {
  warnIfNotPositioned(container)
  const owned: HTMLElement[] = []
  const hadBusy = container.getAttribute('aria-busy')
  container.setAttribute('aria-busy', 'true')

  for (const child of Array.from(container.children)) {
    if (!(child instanceof HTMLElement)) continue
    if (child === exclude || child.contains(exclude)) continue
    inertBranch(child, owned)
  }

  let released = false
  return () => {
    if (released) return
    released = true
    returnInert(owned)
    if (hadBusy === null) container.removeAttribute('aria-busy')
    else container.setAttribute('aria-busy', hadBusy)
  }
}

/**
 * Says so, in development, when a container overlay is about to cover the
 * wrong thing.
 *
 * `position: absolute; inset: 0` resolves against the nearest positioned
 * ancestor. If the covered parent is static, the scrim silently escapes to
 * whatever is positioned further up (a page shell, a dialog) and shades that
 * instead, while the containment below stays correctly scoped to the parent.
 * The result is the one state this module exists to prevent, arrived at
 * geometrically rather than logically: a region blocked in the accessibility
 * tree with the scrim drawn somewhere else entirely. It looks like a styling
 * mistake, so it is usually reported as one.
 */
function warnIfNotPositioned(container: HTMLElement): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production')
    return
  if (typeof window === 'undefined' || !container.isConnected) return
  const position = window.getComputedStyle(container).position
  if (position && position !== 'static') return
  console.warn(
    '[NbSpinner] overlay="container" covers the nearest positioned ancestor, ' +
      "and this spinner's parent element is position: static, so the scrim " +
      'will be drawn over some ancestor further up while only the parent is ' +
      'blocked. Set position: relative on the element you mean to cover.',
  )
}

/** Test helper: drops all state and puts every borrowed attribute back. */
export function resetPageOverlays(): void {
  for (const entry of stack.value) returnInert(entry.inerted)
  for (const element of inertOwners.keys()) element.removeAttribute('inert')
  inertOwners.clear()
  while (stack.value.length > 0) {
    stack.value = stack.value.slice(0, -1)
    releaseScrollLock()
  }
  restoreTarget = null
  restoreParent = null
}
