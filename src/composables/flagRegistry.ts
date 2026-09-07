import type { Component } from 'vue'

/**
 * An app may register either a bare component or a module namespace (the shape
 * of `@nubisco/ui/flags/<code>`, which exports `regular` and a default).
 */
export type TCustomFlag =
  | Component
  | { regular?: Component; default?: Component }

const registry = new Map<string, Component>()

function toComponent(flag: TCustomFlag): Component | undefined {
  const asRecord = flag as { regular?: Component; default?: Component }
  if (
    asRecord &&
    typeof asRecord === 'object' &&
    ('regular' in asRecord || 'default' in asRecord)
  ) {
    return asRecord.regular ?? asRecord.default
  }
  return flag as Component
}

/**
 * Register flags for use with `NbFlag` by country code.
 *
 * This is the supported way to cover a *bounded* set of runtime-chosen flags:
 * values that arrive from an API but are known at build time to fall inside a
 * fixed list. Import those modules and register them, and the app links only
 * those flags instead of the whole catalogue.
 *
 * ```ts
 * import { registerFlags } from '@nubisco/ui'
 * import * as pt from '@nubisco/ui/flags/pt'
 * import * as es from '@nubisco/ui/flags/es'
 *
 * registerFlags({ pt, es })
 * ```
 *
 * A country *selector*, which must render whatever the user picks, is the case
 * that genuinely needs `import '@nubisco/ui/flags/all'` instead.
 */
export function registerFlags(flags: Record<string, TCustomFlag>): void {
  for (const [code, flag] of Object.entries(flags)) {
    const component = toComponent(flag)
    if (component) registry.set(code.toLowerCase(), component)
  }
}

/** Remove a previously registered flag. Returns true if it existed. */
export function unregisterFlag(code: string): boolean {
  return registry.delete(code.toLowerCase())
}

/** Look up a registered flag component for `code`. */
export function getRegisteredFlag(code: string): Component | undefined {
  return registry.get(code.toLowerCase())
}

/** Test helper: clear all registered flags. */
export function clearRegisteredFlags(): void {
  registry.clear()
}
