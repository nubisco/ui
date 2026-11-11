import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

/**
 * The WAI-ARIA toolbar's keyboard model, for any element that holds a row
 * (or column) of controls: the whole strip is one tab stop, and the arrow
 * keys, Home and End move between its controls. It is what stops a twelve
 * button formatting bar from costing twelve presses of Tab.
 *
 * Shared by NbToolbar and NbFloatingToolbar, which had the only copy.
 */

const FOCUSABLE =
  'button, [role="button"], a[href], input, select, textarea, [tabindex]'

/** Text fields: an arrow key inside one moves the caret, not the toolbar. */
const FIELD = 'input, textarea, select, [contenteditable="true"]'

export interface IRovingFocusOptions {
  /** Which arrow keys move: Left and Right, or Up and Down. */
  orientation: () => 'horizontal' | 'vertical'
  /**
   * Whether text fields join the roving set. A floating formatting bar has
   * its fields in the set. A page toolbar leaves them out, so a search field
   * keeps its own tab stop beside the one the buttons share: a field you
   * cannot arrow out of is a poor place to hold the strip's only stop.
   */
  includeFields?: boolean
}

export function useRovingFocus(
  root: Ref<HTMLElement | null>,
  options: IRovingFocusOptions,
) {
  /** Index of the control that holds the single tab stop. */
  const activeIndex = ref(0)

  function items(): HTMLElement[] {
    const el = root.value
    if (!el) return []
    return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (item) =>
        !(item as HTMLButtonElement).disabled &&
        item.getAttribute('aria-hidden') !== 'true' &&
        !item.closest('[inert]') &&
        (options.includeFields || !item.matches(FIELD)) &&
        // A nested composite (a select's listbox) manages its own focus.
        item.closest('[role="toolbar"]') === el,
    )
  }

  function sync() {
    const list = items()
    if (!list.length) return
    if (activeIndex.value >= list.length) activeIndex.value = list.length - 1
    if (activeIndex.value < 0) activeIndex.value = 0
    list.forEach((item, index) => {
      const value = index === activeIndex.value ? '0' : '-1'
      if (item.getAttribute('tabindex') !== value)
        item.setAttribute('tabindex', value)
    })
  }

  function focusIndex(index: number) {
    const list = items()
    if (!list.length) return
    activeIndex.value = (index + list.length) % list.length
    sync()
    list[activeIndex.value].focus()
  }

  /** Moves keyboard focus into the strip, onto its current tab stop. */
  function focus() {
    focusIndex(activeIndex.value)
  }

  function onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    if (target.closest(FIELD)) return

    const vertical = options.orientation() === 'vertical'
    const previous = vertical ? 'ArrowUp' : 'ArrowLeft'
    const next = vertical ? 'ArrowDown' : 'ArrowRight'

    const list = items()
    const current = list.indexOf(target)
    if (current === -1) return

    if (event.key === next) {
      event.preventDefault()
      focusIndex(current + 1)
    } else if (event.key === previous) {
      event.preventDefault()
      focusIndex(current - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusIndex(list.length - 1)
    }
  }

  function onFocusIn(event: FocusEvent) {
    const index = items().indexOf(event.target as HTMLElement)
    if (index === -1) return
    activeIndex.value = index
    sync()
  }

  // Controls come and go (a link button only for links, an action that
  // appears with a selection), and a disabled one cannot hold the tab stop.
  let observer: MutationObserver | undefined

  function disconnect() {
    observer?.disconnect()
    observer = undefined
  }

  watch(
    root,
    (el) => {
      disconnect()
      if (!el) return
      sync()
      if (typeof MutationObserver === 'undefined') return
      observer = new MutationObserver(() => sync())
      observer.observe(el, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'inert'],
      })
    },
    { flush: 'post' },
  )

  onBeforeUnmount(disconnect)

  return { activeIndex, items, sync, focus, focusIndex, onKeydown, onFocusIn }
}
