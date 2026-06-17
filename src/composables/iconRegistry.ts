import type { Component } from 'vue'

/**
 * Per-weight component map for a single custom icon. All weights are optional;
 * when a requested weight is missing, the registry falls back to `regular`,
 * then to any available weight, then yields `undefined` so the consumer can
 * fall through to the bundled Phosphor catalog.
 */
export interface ICustomIconWeights {
  thin?: Component
  light?: Component
  regular?: Component
  bold?: Component
  fill?: Component
  duotone?: Component
}

/**
 * An app may register either a single component (treated as the `regular`
 * weight) or a full per-weight map.
 */
export type TCustomIcon = Component | ICustomIconWeights

const registry = new Map<string, ICustomIconWeights>()

function toWeights(icon: TCustomIcon): ICustomIconWeights {
  if (
    typeof icon === 'object' &&
    icon !== null &&
    !('render' in icon) &&
    !('setup' in icon) &&
    !('template' in icon)
  ) {
    // Heuristic: a plain object without Vue component markers is a weight map.
    const maybeWeights = icon as ICustomIconWeights
    const hasWeightKey =
      'thin' in maybeWeights ||
      'light' in maybeWeights ||
      'regular' in maybeWeights ||
      'bold' in maybeWeights ||
      'fill' in maybeWeights ||
      'duotone' in maybeWeights
    if (hasWeightKey) return maybeWeights
  }
  return { regular: icon as Component }
}

/**
 * Register one or more custom icons for use with `NbIcon`. Names are looked up
 * case-sensitively and take precedence over the bundled Phosphor catalog, so
 * an app can override a built-in icon by registering the same name.
 *
 * Typical use: call once during app bootstrap, after `app.use(NubiscoUI)`.
 *
 * ```ts
 * import { registerIcons } from '@nubisco/ui'
 * import SiptaShield from './icons/SiptaShield.vue'
 * import RamoAuto from './icons/RamoAuto.vue'
 *
 * registerIcons({
 *   'sipta-shield': SiptaShield,
 *   'ramo-auto': RamoAuto,
 * })
 * ```
 */
export function registerIcons(icons: Record<string, TCustomIcon>): void {
  for (const [name, icon] of Object.entries(icons)) {
    registry.set(name, toWeights(icon))
  }
}

/** Remove a previously registered icon. Returns true if it existed. */
export function unregisterIcon(name: string): boolean {
  return registry.delete(name)
}

/** Look up a custom icon component for `name` and `weight`. */
export function getRegisteredIcon(
  name: string,
  weight: keyof ICustomIconWeights = 'regular',
): Component | undefined {
  const entry = registry.get(name)
  if (!entry) return undefined
  if (entry[weight]) return entry[weight]
  if (entry.regular) return entry.regular
  for (const w of ['bold', 'fill', 'duotone', 'light', 'thin'] as const) {
    if (entry[w]) return entry[w]
  }
  return undefined
}

/** Test helper: clear all registered icons. */
export function clearRegisteredIcons(): void {
  registry.clear()
}
