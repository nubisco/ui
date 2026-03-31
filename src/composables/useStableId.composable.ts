import { getCurrentInstance, useId } from 'vue'
import str2kebab from '@/utils/str2kebab.helper'

/**
 * Returns a stable, deterministic element ID for any component that needs one.
 *
 * Resolution order:
 * 1. `props.id`  — honored as-is when explicitly provided.
 * 2. `{component-slug}-{name-slug}` — when `props.name` is set.
 *    e.g. NbTextInput + `name="billingEmail"` → `"nb-text-input-billing-email"`
 * 3. `{component-slug}-{vue-uid}` — positional fallback via Vue's `useId()`.
 *    e.g. `"nb-select-v3"` (SSR-safe, unique within the app instance)
 *
 * The resulting IDs are meaningful in analytics / tracking pipelines: the
 * component type is always present as a prefix, and the field name (when
 * available) makes the target immediately identifiable.
 *
 * @example
 * // Inside a component setup()
 * const elementId = useStableId(props)  // props carries id? and name?
 */
// #region useStableId
export function useStableId(props: { id?: string; name?: string }): string {
  if (props.id) return props.id

  const instance = getCurrentInstance()
  const componentSlug = str2kebab(instance?.type?.__name ?? 'component')

  if (props.name) {
    return `${componentSlug}-${str2kebab(props.name)}`
  }

  return `${componentSlug}-${useId()}`
}
// #endregion useStableId
