import type { TWalkthroughTarget } from '@/components/Walkthrough.d'

/**
 * Attribute written by the `v-nb-tour-step` directive. Steps reference these
 * ids instead of CSS selectors so a refactor of the markup cannot silently
 * break a tour: the id travels with the element.
 */
export const TOUR_STEP_ATTRIBUTE = 'data-nb-tour-step'

function escapeAttributeValue(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value.replace(/["\\]/g, '\\$&')
}

/** Builds the selector for a tour-step id. Exported for host-side assertions. */
export function tourStepSelector(id: string): string {
  return `[${TOUR_STEP_ATTRIBUTE}="${escapeAttributeValue(id)}"]`
}

function isRefLike(
  value: unknown,
): value is { value: HTMLElement | null | undefined } {
  return !!value && typeof value === 'object' && 'value' in value
}

/**
 * Resolves a step's `target` to a live element, or null when it is not in the
 * DOM right now (a collapsed sidebar, a route not yet visited). Null is a
 * normal outcome, not an error: the walkthrough skips over steps whose target
 * has gone missing rather than stranding the user on a blank spotlight.
 */
export function resolveTourTarget(
  target: TWalkthroughTarget | undefined,
  root: Document | HTMLElement = typeof document !== 'undefined'
    ? document
    : (undefined as unknown as Document),
): HTMLElement | null {
  if (!target || !root) return null

  if (typeof target === 'function') return target() ?? null
  if (typeof target === 'object') {
    if (target instanceof HTMLElement) return target
    if (isRefLike(target)) {
      const value = target.value
      return value instanceof HTMLElement ? value : null
    }
    return null
  }

  // Tour-step id first, CSS selector second. Trying the id form even for
  // strings that look like selectors costs one failed query and means an id
  // like `nav` is never shadowed by the `<nav>` element.
  const byId = root.querySelector<HTMLElement>(tourStepSelector(target))
  if (byId) return byId

  try {
    return root.querySelector<HTMLElement>(target)
  } catch {
    // Not a valid selector either (a bare id containing spaces, say).
    return null
  }
}

/** True when the element is rendered and has a non-zero box worth spotlighting. */
export function isTargetVisible(element: HTMLElement | null): boolean {
  if (!element || !element.isConnected) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}
