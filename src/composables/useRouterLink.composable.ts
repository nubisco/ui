import {
  computed,
  getCurrentInstance,
  type Component,
  type ComputedRef,
} from 'vue'

/**
 * Resolves the globally-registered `RouterLink` component, if vue-router is
 * installed (the consuming app called `app.use(router)`).
 *
 * vue-router is an optional peer dependency of NubiscoUI: components that accept
 * a `to` prop use this to render a real `<RouterLink>` when it's available, and
 * fall back to a plain `<a>` (string `to`/`href`) or `<button>` otherwise.
 *
 * Reading from `appContext.components` avoids importing vue-router and avoids the
 * missing-component console warning that `resolveComponent('RouterLink')` emits
 * when no router is present. Must be called during `setup()`.
 */
export function useRouterLink(): ComputedRef<Component | null> {
  const instance = getCurrentInstance()
  return computed<Component | null>(() => {
    const components = instance?.appContext.components as
      | Record<string, Component>
      | undefined
    return components?.RouterLink ?? components?.['router-link'] ?? null
  })
}
