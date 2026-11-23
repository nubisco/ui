/**
 * Grey or tinted dark surfaces, for the whole document.
 *
 * A sibling of `useAppearance()` and built the same way: one global piece of
 * state, a `configure*` function for boot-time wiring, a controller for
 * components, an attribute on `<html>` so that teleported overlays inherit it,
 * and storage access that cannot throw the application down.
 *
 * ## Grey is the default
 *
 * The dark ramp is neutral grey, and with nothing configured it stays exactly
 * that. Tinted is an opt-in a product makes for itself: its dark surfaces,
 * borders, hovers and per-plane values take its category's hue at the same
 * WCAG luminance as the grey they replace, and the text tiers take a trace of
 * it. Light mode is never affected.
 *
 * The tint comes from the category the product passed to `app-theme()` in its
 * own stylesheet. A document without a category theme has nothing to tint
 * toward, so the attribute alone changes nothing there.
 *
 * ## Independence
 *
 * Like appearance, this does not touch the colour-mode preference, the named
 * theme or the geometry, and none of them can reset it. It is stored under its
 * own key and written to its own attribute.
 */

import { computed, readonly, ref, watch, type ComputedRef, type Ref } from 'vue'

/** The two treatments of a dark surface. */
export type TDarkSurfaces = 'grey' | 'tinted'

export interface IDarkSurfacesOptions {
  /**
   * Whether dark surfaces are tinted when nothing is stored yet. Defaults to
   * `false`, the grey ramp every existing application already has.
   */
  tinted?: boolean
  /**
   * localStorage key the choice is persisted under, when `persist` is on.
   * Namespace it per application (`'analytics.dark-surfaces'`), so two
   * Nubisco products served from the same origin do not fight over one value.
   */
  storageKey?: string
  /**
   * Attribute placed on `<html>`. Matches the selector `app-theme()` emits the
   * tinted ramp under; override only if an application has its own stylesheet
   * keyed on something else.
   */
  attribute?: string
  /**
   * Whether the choice is read from and written to storage at all.
   *
   * On by default, as for appearance, so a choice made through
   * `setTinted()` survives a reload. With it on, a stored value from a
   * previous visit wins over the `tinted` the application just passed. An
   * application that treats this as its own design decision rather than a
   * viewer preference should pass `persist: false`, so `configureDarkSurfaces()`
   * is the only thing that decides.
   */
  persist?: boolean
}

export interface IDarkSurfacesController {
  /** The current treatment. */
  darkSurfaces: Readonly<Ref<TDarkSurfaces>>
  /** True while tinted, for a control that marks it. */
  isTinted: ComputedRef<boolean>
  /** Turn the tint on or off. */
  setTinted: (value: boolean) => void
  /** Flip to the other one, for a single-button toggle. */
  toggle: () => void
}

const DEFAULTS: Required<IDarkSurfacesOptions> = {
  tinted: false,
  storageKey: 'nubisco.dark-surfaces',
  attribute: 'data-nb-dark-surfaces',
  persist: true,
}

let options: Required<IDarkSurfacesOptions> = { ...DEFAULTS }
let initialized = false

const darkSurfaces = ref<TDarkSurfaces>('grey')

function isDarkSurfaces(value: unknown): value is TDarkSurfaces {
  return value === 'grey' || value === 'tinted'
}

/**
 * Storage access is wrapped because reading `localStorage` throws outright in
 * Safari's private mode and wherever cookies are blocked.
 */
function readStored(): TDarkSurfaces | null {
  if (!options.persist) return null
  try {
    if (typeof localStorage === 'undefined') return null
    const value = localStorage.getItem(options.storageKey)
    return isDarkSurfaces(value) ? value : null
  } catch {
    return null
  }
}

function writeStored(value: TDarkSurfaces): void {
  if (!options.persist) return
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(options.storageKey, value)
  } catch {
    // A choice that cannot be persisted still applies for this session.
  }
}

/**
 * Puts the choice on the document.
 *
 * On `<html>`, like the dark class and the appearance attribute, so teleported
 * overlays inherit it. Grey REMOVES the attribute rather than writing a value:
 * the grey ramp is what a document without it renders, so the default needs
 * no selector of its own and its compiled CSS is untouched.
 */
function apply(): void {
  if (typeof document === 'undefined') return
  if (darkSurfaces.value === 'tinted')
    document.documentElement.setAttribute(options.attribute, 'tinted')
  else document.documentElement.removeAttribute(options.attribute)
}

let stopPersisting: (() => void) | null = null

function initialize(): void {
  darkSurfaces.value = readStored() ?? (options.tinted ? 'tinted' : 'grey')
  apply()

  stopPersisting?.()
  stopPersisting = watch(darkSurfaces, (value) => {
    writeStored(value)
    apply()
  })

  initialized = true
}

/**
 * Chooses grey or tinted dark surfaces before the first `useDarkSurfaces()`.
 *
 * Call it once, at application start, next to the other boot-time wiring:
 *
 * ```ts
 * import { configureDarkSurfaces } from '@nubisco/ui'
 *
 * configureDarkSurfaces({ tinted: true })
 * ```
 *
 * Calling it later re-reads storage and repaints, which is what a test or an
 * application switching identity mid-session wants.
 */
export function configureDarkSurfaces(next: IDarkSurfacesOptions = {}): void {
  options = { ...options, ...next }
  initialize()
}

/**
 * Grey or tinted dark surfaces, at runtime, without a rebuild or a reload.
 *
 * ```vue
 * const { isTinted, setTinted, toggle } = useDarkSurfaces()
 * ```
 *
 * Both ramps ship in the stylesheet and switch on a single attribute, so all
 * this owns is whether the attribute is present and where the choice is
 * stored.
 */
export function useDarkSurfaces(): IDarkSurfacesController {
  if (!initialized) initialize()

  return {
    darkSurfaces: readonly(darkSurfaces),
    isTinted: computed(() => darkSurfaces.value === 'tinted'),
    setTinted: (value: boolean) => {
      darkSurfaces.value = value ? 'tinted' : 'grey'
    },
    toggle: () => {
      darkSurfaces.value = darkSurfaces.value === 'tinted' ? 'grey' : 'tinted'
    },
  }
}

/**
 * The attribute the server should render on `<html>` so the first dark paint
 * is already tinted. `value` is null for grey, which renders no attribute.
 *
 * ```ts
 * const { attribute, value } = darkSurfacesAttribute(true)
 * // -> <html data-nb-dark-surfaces="tinted">
 * ```
 */
export function darkSurfacesAttribute(tinted = false): {
  attribute: string
  value: 'tinted' | null
} {
  return { attribute: options.attribute, value: tinted ? 'tinted' : null }
}

/** Test helper: forgets configuration and state. */
export function resetDarkSurfaces(): void {
  stopPersisting?.()
  stopPersisting = null
  options = { ...DEFAULTS }
  darkSurfaces.value = 'grey'
  initialized = false
}
