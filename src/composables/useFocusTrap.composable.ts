/**
 * Keeping keyboard focus inside the surface in front of the user.
 *
 * A modal surface is only modal to the eye. The scrim paints over the page but
 * does nothing to the tab order, so Tab walks straight out of the dialog and
 * onto the document behind it: the user is typing into a form they cannot see,
 * and a screen reader is reading a page the scrim says is unavailable. NbModal
 * shipped in exactly that state while its own documentation promised a focus
 * trap, and the showcase reproduced it in one keypress.
 *
 * The rules were already written twice in this library, to two different
 * standards. NbConfirm has the thorough version (arbitrary slot content,
 * teleported popups, a pending state with nothing left to focus); NbWalkthrough
 * has a five-selector approximation; NbModal, the component both of the others
 * are built to sit inside, had none. What "focusable" means is not a per
 * component opinion, so it lives here once and the surfaces share it.
 *
 * The trap is deliberately not an `inert` attribute on the rest of the
 * document. `inert` is the better primitive, but it applies to siblings of the
 * dialog, and this library teleports overlays to `<body>` next to an
 * application root it does not own and must not mutate.
 */

import { nextTick, onMounted, onUnmounted, watch } from 'vue'

/**
 * What the browser will stop on with Tab, as far as a dialog needs to care.
 *
 * The long tail matters because a dialog body takes arbitrary content: a
 * preview of the record being deleted is often an `<iframe>`, an embedded
 * player, an image map or a rich-text field, and every one of those is a tab
 * stop the trap has to know about or the cycle breaks at the dialog edge.
 * Elements that are focusable but explicitly removed from the tab order
 * (`tabindex="-1"`, which is how a dialog box itself holds focus) are
 * excluded, as are controls hidden from assistive technology or from the page.
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'area[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'summary:not([tabindex="-1"])',
  'audio[controls]:not([tabindex="-1"])',
  'video[controls]:not([tabindex="-1"])',
  'iframe:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
]
  .map((selector) => `${selector}:not([hidden]):not([aria-hidden="true"])`)
  .join(',')

/**
 * The tab stops inside `root`, in document order.
 *
 * `aria-disabled` is filtered as well as `disabled`, because a control that
 * reports itself unavailable to assistive technology should not be the thing
 * the trap parks focus on, and our own buttons use it for the states a native
 * `disabled` would make unreachable.
 */
export function focusablesWithin(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => el.getAttribute('aria-disabled') !== 'true')
}

/** Every `aria-modal` surface currently on screen, in document order. */
export function openModalSurfaces(): HTMLElement[] {
  if (typeof document === 'undefined') return []
  return Array.from(
    document.querySelectorAll<HTMLElement>('[aria-modal="true"]'),
  )
}

/**
 * Whether `el` is the last `aria-modal` surface in the document, which for
 * teleported overlays is the one painted on top.
 *
 * Two dialogs open at once (a confirm raised from inside a modal, which is a
 * supported composition) both listen on the document, so without this test one
 * Tab is answered twice and the older instance wins: focus jumps to a dialog
 * the user cannot see.
 */
export function isTopmostSurface(el: HTMLElement | null): boolean {
  if (!el) return false
  const all = openModalSurfaces()
  return all.length === 0 || all[all.length - 1] === el
}

export interface IFocusTrapOptions {
  /** The element focus is held inside. Read live: it mounts after `active`. */
  container: () => HTMLElement | null
  /** Whether the trap should currently be holding focus. */
  active: () => boolean
  /**
   * Where focus goes when the trap activates. Defaults to the first tab stop,
   * falling back to the container itself. Return `null` to take the default.
   *
   * A destructive dialog overrides this to land on Cancel: the confirm button
   * is one Space away from whatever is focused when a dialog appears, and a
   * surface that steals focus onto a destructive default turns a stray
   * keypress into a deletion.
   */
  initialFocus?: () => HTMLElement | null
  /**
   * A selector for teleported popups that belong to this surface, such as a
   * select listbox rendered to `<body>` by a control inside the dialog. Focus
   * inside one of those is not an escape and must not be dragged back.
   */
  floatingSelector?: () => string
}

/**
 * Holds keyboard focus inside a surface for as long as it is active, and hands
 * it back to whatever opened it afterwards.
 *
 * Returns nothing to call in the common case: it wires itself to the component
 * scope, follows `active()`, and cleans up on unmount. `restoreFocus` is
 * exposed for the host that is destroyed outright rather than closed, where
 * there is no state change left for the watcher to see.
 */
export function useFocusTrap(options: IFocusTrapOptions): {
  focusInside: () => void
  restoreFocus: () => void
} {
  const { container, active, initialFocus, floatingSelector } = options

  function inFloating(node: Element | null): boolean {
    const selector = floatingSelector?.()
    if (!selector || !node) return false
    return !!node.closest(selector)
  }

  function contains(node: Element | null): boolean {
    const root = container()
    return !!root && !!node && root.contains(node)
  }

  function focusables(): HTMLElement[] {
    return focusablesWithin(container())
  }

  /**
   * The one place focus can always go. A dialog in its pending state disables
   * every control it has, and a browser does not hold focus on a control that
   * becomes disabled: it drops it to `<body>`, outside the dialog, where the
   * trap has nothing to catch. Dialog boxes carry `tabindex="-1"` for exactly
   * this, so there is always a container to hold focus when there is no
   * control to put it on.
   */
  function focusFallback() {
    container()?.focus()
  }

  /** Puts focus somewhere legitimate inside the surface, controls or not. */
  function focusInside() {
    const first = focusables()[0]
    if (first) first.focus()
    else focusFallback()
  }

  let previouslyFocused: HTMLElement | null = null

  /**
   * Hands focus back to whatever opened the surface. Losing this drops a
   * keyboard user at the top of the document, which on a long page means the
   * work they were doing is now several screens away with no way back to it
   * but scrolling.
   *
   * A trigger that has since been unmounted (the row action of a row the
   * dialog just deleted) is not focusable, so the body takes focus and the
   * next Tab starts from the top rather than throwing.
   */
  function restoreFocus() {
    const target = previouslyFocused
    previouslyFocused = null
    if (target?.isConnected) target.focus()
  }

  function captureOpener() {
    previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !active()) return
    const root = container()
    if (!root || !isTopmostSurface(root)) return
    // A popup teleported out of the surface by one of its own controls is
    // still part of it as far as the user is concerned, and it runs its own
    // key handling.
    if (inFloating(document.activeElement)) return

    const items = focusables()
    const activeEl = document.activeElement as Element | null

    if (items.length === 0) {
      // Nothing to cycle between, which is the pending state. Focus stays on
      // the surface rather than being allowed out onto the page behind.
      event.preventDefault()
      if (!contains(activeEl)) focusFallback()
      return
    }

    const first = items[0]
    const last = items[items.length - 1]

    if (event.shiftKey && (activeEl === first || !contains(activeEl))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && activeEl === last) {
      event.preventDefault()
      first.focus()
    } else if (!contains(activeEl)) {
      event.preventDefault()
      first.focus()
    }
  }

  /**
   * Tab is not the only way out. A click on the page behind the scrim, a
   * programmatic `focus()` from application code, or a control being disabled
   * out from under the caret all move focus without a keystroke, and a trap
   * that only reads keydowns never notices.
   */
  function onFocusOut(event: FocusEvent) {
    if (!active()) return
    const next = event.relatedTarget
    if (next instanceof Element) {
      if (contains(next) || inFloating(next)) return
    } else if (next !== null) {
      return
    }
    // `relatedTarget` is null for a blur to nothing as well as for a blur into
    // a cross-document target, so confirm against the live focus after the
    // event settles rather than acting on the event alone.
    requestAnimationFrame(() => {
      if (!active()) return
      const activeEl = document.activeElement as Element | null
      if (contains(activeEl) || inFloating(activeEl)) return
      // A node that was removed while focused is not an escape: the surface is
      // re-rendering, and dragging focus now would fight its own update.
      if (activeEl && activeEl !== document.body && !activeEl.isConnected)
        return
      if (!isTopmostSurface(container())) return
      focusInside()
    })
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', onKeydown, true)
    document.addEventListener('focusout', onFocusOut, true)
  }

  /**
   * Moves focus in once the surface exists. The state change that activates
   * the trap is the same one that renders the surface, so there is nothing to
   * focus until Vue has flushed. The enter transition animates opacity and
   * transform only, so the box is focusable as soon as it is in the DOM and
   * there is no second frame to wait for.
   */
  async function takeFocus() {
    await nextTick()
    if (!active()) return
    const preferred = initialFocus?.() ?? null
    if (preferred) preferred.focus()
    else focusInside()
  }

  watch(active, (isActive, wasActive) => {
    if (isActive === wasActive) return
    if (isActive) {
      captureOpener()
      void takeFocus()
    } else {
      restoreFocus()
    }
  })

  onMounted(() => {
    // Mounted already open is a real path: a host that renders its dialog on
    // the first frame never fires the watcher, because `active` never changes.
    if (!active()) return
    captureOpener()
    void takeFocus()
  })

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', onKeydown, true)
      document.removeEventListener('focusout', onFocusOut, true)
    }
    // A surface destroyed outright rather than closed has no state change for
    // the watcher to see, and its opener is still waiting for focus.
    restoreFocus()
  })

  return { focusInside, restoreFocus }
}
