import { onScopeDispose, readonly, ref } from 'vue'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Reactive `prefers-reduced-motion` state.
 *
 * CSS media queries cover styling, but the walkthrough also has to choose a
 * `scrollIntoView` behaviour and decide whether to animate the spotlight
 * between targets, and those are script decisions. Reading the preference
 * reactively (rather than once at setup) matters because the user can flip
 * the OS setting while a tour is running.
 */
export function useReducedMotion() {
  const reduced = ref(false)

  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  ) {
    const media = window.matchMedia(QUERY)
    reduced.value = media.matches

    const onChange = (event: MediaQueryListEvent) => {
      reduced.value = event.matches
    }

    // Safari < 14 only has the deprecated addListener/removeListener pair.
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange)
      onScopeDispose(() => media.removeEventListener('change', onChange))
    } else if (typeof media.addListener === 'function') {
      media.addListener(onChange)
      onScopeDispose(() => media.removeListener(onChange))
    }
  }

  return readonly(reduced)
}

/** One-shot check for code paths outside a reactive scope. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
    return false
  return window.matchMedia(QUERY).matches
}
