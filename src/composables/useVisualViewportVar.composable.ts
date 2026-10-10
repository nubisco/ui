/**
 * The visual viewport, as two custom properties on <html>, while a phone
 * surface needs them.
 *
 * A `position: fixed` box is laid out against the layout viewport. On a phone
 * that is not the part of the page the user can see: iOS Safari keeps the
 * layout viewport full height when the on-screen keyboard opens and pans the
 * visual one inside it, so a sheet pinned to `bottom: 0` ends up under the
 * keyboard, and `100dvh` does not shrink for it either. Only
 * `window.visualViewport` knows the visible box, and CSS cannot read it.
 *
 * So, while at least one owner is active, this writes
 *
 *   --nb-vvh: the visual viewport's height, in px
 *   --nb-vvt: its offset from the top of the layout viewport, in px
 *
 * and keeps them current on the viewport's resize and scroll. Styles read
 * them with a fallback (`var(--nb-vvh, 100dvh)`, `var(--nb-vvt, 0px)`), so a
 * browser without the API, or a moment before the first write, still lays out.
 *
 * Owners are counted, like the scroll lock: two dialogs open at once hold two
 * shares, and the properties come off <html> only when the last one lets go.
 * Nothing is written outside the phone layout, so a desktop page never sees
 * them.
 */

import { onScopeDispose, watch } from 'vue'
import { usePhoneLayout } from './usePhoneLayout.composable'

let owners = 0
let viewport: VisualViewport | null = null

function write() {
  if (!viewport) return
  const root = document.documentElement.style
  root.setProperty('--nb-vvh', `${viewport.height}px`)
  root.setProperty('--nb-vvt', `${viewport.offsetTop}px`)
}

function acquire() {
  owners += 1
  if (owners > 1) return
  viewport = typeof window !== 'undefined' ? window.visualViewport : null
  if (!viewport) return
  viewport.addEventListener('resize', write)
  viewport.addEventListener('scroll', write)
  write()
}

function release() {
  if (owners === 0) return
  owners -= 1
  if (owners > 0) return
  if (viewport) {
    viewport.removeEventListener('resize', write)
    viewport.removeEventListener('scroll', write)
    viewport = null
  }
  const root = document.documentElement.style
  root.removeProperty('--nb-vvh')
  root.removeProperty('--nb-vvt')
}

/**
 * One owner's share, tied to the calling scope. `active` says whether this
 * owner currently needs the properties (a modal: while it is open). The share
 * is held only while that is true and the phone layout is on, and it is
 * released when the scope goes away, so a dialog unmounted while open cannot
 * leave the properties behind.
 */
export function useVisualViewportVar(active: () => boolean): void {
  const { phone } = usePhoneLayout()
  let held = false

  function set(on: boolean) {
    if (on === held) return
    held = on
    if (on) acquire()
    else release()
  }

  watch(() => active() && phone.value, set, { immediate: true })
  onScopeDispose(() => set(false))
}

/** How many owners hold the properties. Exposed for tests. */
export function visualViewportVarOwners(): number {
  return owners
}
