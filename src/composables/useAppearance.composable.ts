/**
 * Square or rounded, for the whole library, independently of light and dark.
 *
 * This is a sibling of `useTheme()` and deliberately looks like it: one global
 * piece of state, a `configure*` function for boot-time wiring, a controller
 * for components, an attribute on `<html>` so that teleported overlays inherit
 * it, and storage access that cannot throw the application down. Two knobs
 * that behave the same way are easier to hold than two knobs that each invent
 * their own conventions.
 *
 * The two settings are genuinely independent. Changing appearance does not
 * touch the colour-mode preference and does not repaint the theme; changing
 * the theme does not reset appearance. They are stored under different keys
 * and written to different attributes, so neither can clobber the other.
 *
 * ## Square is the default, and it is the compatible one
 *
 * The library's geometry is square today: panels, menus, modals, buttons and
 * fields all render at 0. `square` reproduces that exactly, so an application
 * that upgrades and calls nothing gets the pixels it had before. `rounded` is
 * an explicit opt-in.
 *
 * Rounding is not a modernisation and is not a default in waiting. The square
 * treatment is part of what makes this library recognisable, and it stays
 * supported and unchanged for anyone who wants it.
 */

import { computed, readonly, ref, watch, type ComputedRef, type Ref } from 'vue'

/** The two appearances. There is no `system` here: the OS has no opinion. */
export type TAppearance = 'square' | 'rounded'

export interface IAppearanceOptions {
  /**
   * localStorage key the preference is persisted under. Namespace it per
   * application (`'analytics.appearance'`), so two Nubisco products served
   * from the same origin do not fight over one value.
   */
  storageKey?: string
  /**
   * Appearance to use when nothing is stored yet. Defaults to `square`, which
   * is the geometry every existing application already has.
   */
  defaultAppearance?: TAppearance
  /**
   * Attribute placed on `<html>`. Matches the selector the library's rounded
   * scale is emitted under; override only if an application has its own
   * stylesheet keyed on something else.
   */
  attribute?: string
  /**
   * Whether the preference is read from and written to storage at all.
   *
   * An application that drives appearance from its own settings backend wants
   * this off: with persistence on, a stored value from a previous visit wins
   * over the `defaultAppearance` the application just passed, which looks like
   * the library overriding the application. Off, `configureAppearance()` is
   * the only thing that decides.
   */
  persist?: boolean
}

export interface IAppearanceController {
  /** The current appearance. */
  appearance: Readonly<Ref<TAppearance>>
  /** True while rounded, for a control that marks it. */
  isRounded: ComputedRef<boolean>
  /** Pin an appearance. */
  setAppearance: (value: TAppearance) => void
  /** Flip to the other one, for a single-button toggle. */
  toggle: () => void
}

const DEFAULTS: Required<IAppearanceOptions> = {
  storageKey: 'nubisco.appearance',
  defaultAppearance: 'square',
  attribute: 'data-nb-appearance',
  persist: true,
}

let options: Required<IAppearanceOptions> = { ...DEFAULTS }
let initialized = false

const appearance = ref<TAppearance>(DEFAULTS.defaultAppearance)

function isAppearance(value: unknown): value is TAppearance {
  return value === 'square' || value === 'rounded'
}

/**
 * Storage access is wrapped because reading `localStorage` throws outright in
 * Safari's private mode and wherever cookies are blocked. A product losing the
 * preference between visits is a nuisance; a product that will not boot is not.
 */
function readStored(): TAppearance | null {
  if (!options.persist) return null
  try {
    if (typeof localStorage === 'undefined') return null
    const value = localStorage.getItem(options.storageKey)
    return isAppearance(value) ? value : null
  } catch {
    return null
  }
}

function writeStored(value: TAppearance): void {
  if (!options.persist) return
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(options.storageKey, value)
  } catch {
    // A preference that cannot be persisted still applies for this session.
  }
}

/**
 * Puts the appearance on the document.
 *
 * The attribute goes on `<html>` rather than the application root for the same
 * reason the dark class does: modals, menus and everything else this library
 * teleports mount outside the app root and would otherwise keep the square
 * scale while the page around them was rounded.
 *
 * `square` writes the attribute rather than removing it. An explicit value is
 * something an application can key its own rules on, and it makes the state
 * visible in devtools instead of being the absence of something.
 */
function apply(): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute(options.attribute, appearance.value)
}

let stopPersisting: (() => void) | null = null

function initialize(): void {
  appearance.value = readStored() ?? options.defaultAppearance
  apply()

  stopPersisting?.()
  stopPersisting = watch(appearance, (value) => {
    writeStored(value)
    apply()
  })

  initialized = true
}

/**
 * Chooses the appearance before the first `useAppearance()`.
 *
 * Call it once, at application start, next to the other boot-time wiring:
 *
 * ```ts
 * import { configureAppearance } from '@nubisco/ui'
 *
 * configureAppearance({ defaultAppearance: 'rounded' })
 * ```
 *
 * With `persist` left on, a value the user chose in a previous visit wins over
 * `defaultAppearance`; that is the point of persisting it. An application that
 * owns the setting itself should pass `persist: false` and call
 * `setAppearance()` from its own state, so nothing in storage can override it.
 *
 * Calling it later re-reads storage and repaints, which is what a test or an
 * application switching identity mid-session wants. It is not a per-component
 * knob: appearance is one global piece of state, exactly like the document it
 * paints.
 */
export function configureAppearance(next: IAppearanceOptions = {}): void {
  options = { ...options, ...next }
  initialize()
}

/**
 * Square or rounded geometry, at runtime, without a rebuild or a reload.
 *
 * ```vue
 * const { appearance, isRounded, setAppearance, toggle } = useAppearance()
 * ```
 *
 * The library ships both radius scales and switches between them on a single
 * attribute, so all this owns is the decision about which one is present and
 * where the preference is stored. Switching changes geometry only: every
 * height, padding and font size is identical in both, so nothing reflows.
 */
export function useAppearance(): IAppearanceController {
  if (!initialized) initialize()

  return {
    appearance: readonly(appearance),
    isRounded: computed(() => appearance.value === 'rounded'),
    setAppearance: (value: TAppearance) => {
      appearance.value = value
    },
    toggle: () => {
      appearance.value = appearance.value === 'rounded' ? 'square' : 'rounded'
    },
  }
}

/**
 * The attribute and value the server should render on `<html>` so that the
 * first paint already has the right geometry.
 *
 * Appearance is a client preference living in `localStorage`, which a server
 * cannot read, so server rendering can only emit the application's default.
 * Emitting it is still worth doing: it makes the markup match what
 * `configureAppearance()` will apply on hydration, so there is no attribute
 * change on the first frame for the square default, and for an application
 * whose default is rounded it removes the square-to-rounded flash entirely.
 *
 * ```ts
 * const { attribute, value } = appearanceAttribute('rounded')
 * // -> <html data-nb-appearance="rounded">
 * ```
 *
 * A user whose stored preference differs from the server default still gets
 * one correction on hydration. That is the same trade the theme class makes,
 * and the same fix applies: an inline script before first paint, reading the
 * same storage key.
 */
export function appearanceAttribute(value: TAppearance = 'square'): {
  attribute: string
  value: TAppearance
} {
  return { attribute: options.attribute, value }
}

/** Test helper: forgets configuration and state. */
export function resetAppearance(): void {
  stopPersisting?.()
  stopPersisting = null
  options = { ...DEFAULTS }
  appearance.value = DEFAULTS.defaultAppearance
  initialized = false
}
