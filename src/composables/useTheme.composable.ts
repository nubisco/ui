import { computed, readonly, ref, watch, type ComputedRef, type Ref } from 'vue'

/**
 * The three states a theme preference can be in.
 *
 * `system` is a preference in its own right, not the absence of one: it means
 * "keep following the OS", and it stays selected while the resolved theme
 * changes underneath it.
 */
export type TTheme = 'light' | 'dark' | 'system'

/** The two themes that can actually be painted. */
export type TResolvedTheme = 'light' | 'dark'

export interface IThemeOptions {
  /**
   * localStorage key the preference is persisted under. Namespace it per
   * application (`'analytics.theme'`), so two Nubisco products served from the
   * same origin do not fight over one value.
   */
  storageKey?: string
  /** Preference to use when nothing is stored yet. */
  defaultTheme?: TTheme
  /**
   * Class placed on `<html>` for the dark theme. Matches the selector the
   * library's own dark ramp is emitted under; override only if an application
   * has its own dark stylesheet keyed on something else.
   */
  darkClass?: string
}

export interface IThemeController {
  /** The stored preference, including `system`. */
  theme: Readonly<Ref<TTheme>>
  /** The theme actually showing right now. Never `system`. */
  resolved: Readonly<Ref<TResolvedTheme>>
  /** True while the preference is `system`, for a control that marks it. */
  followsSystem: ComputedRef<boolean>
  /** Pin a preference, or hand control back to the OS with `'system'`. */
  setTheme: (value: TTheme) => void
  /**
   * Flip to the opposite of what is currently showing. Always lands on an
   * explicit `light` or `dark`, which is what a single-button toggle in a
   * topbar wants; a three-state control should call `setTheme` instead.
   */
  toggle: () => void
}

const DEFAULTS: Required<IThemeOptions> = {
  storageKey: 'nubisco.theme',
  defaultTheme: 'system',
  darkClass: 'dark',
}

const QUERY = '(prefers-color-scheme: dark)'

let options: Required<IThemeOptions> = { ...DEFAULTS }
let initialized = false
let detachMedia: (() => void) | null = null

const theme = ref<TTheme>(DEFAULTS.defaultTheme)
const resolved = ref<TResolvedTheme>('light')

function isTheme(value: unknown): value is TTheme {
  return value === 'light' || value === 'dark' || value === 'system'
}

/**
 * Storage access is wrapped because reading `localStorage` throws outright in
 * Safari's private mode and wherever cookies are blocked. A product losing the
 * preference between visits is a nuisance; a product that will not boot is not.
 */
function readStored(): TTheme | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const value = localStorage.getItem(options.storageKey)
    return isTheme(value) ? value : null
  } catch {
    return null
  }
}

function writeStored(value: TTheme): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(options.storageKey, value)
  } catch {
    // A preference that cannot be persisted still applies for this session.
  }
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
    return false
  return window.matchMedia(QUERY).matches
}

/**
 * Puts the resolved theme on the document.
 *
 * The class goes on `<html>` rather than the application root because modals,
 * popovers and everything else this library teleports mount outside it and
 * would otherwise keep the light ramp. `color-scheme` goes with it so the
 * browser paints form controls, scrollbars and the canvas behind the page to
 * match, which is what stops a white flash around a dark page.
 */
function apply(): void {
  const isDark =
    theme.value === 'dark' || (theme.value === 'system' && systemPrefersDark())
  resolved.value = isDark ? 'dark' : 'light'

  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(options.darkClass, isDark)
  document.documentElement.style.colorScheme = resolved.value
}

function attachMedia(): void {
  detachMedia?.()
  detachMedia = null

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
    return

  const media = window.matchMedia(QUERY)
  // Only meaningful while the preference is `system`, but harmless to leave
  // attached: apply() re-reads the preference every time it runs.
  const onChange = () => apply()

  // Safari < 14 only has the deprecated addListener/removeListener pair.
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', onChange)
    detachMedia = () => media.removeEventListener('change', onChange)
  } else if (typeof media.addListener === 'function') {
    media.addListener(onChange)
    detachMedia = () => media.removeListener(onChange)
  }
}

let stopPersisting: (() => void) | null = null

function initialize(): void {
  theme.value = readStored() ?? options.defaultTheme
  apply()
  attachMedia()

  stopPersisting?.()
  stopPersisting = watch(theme, (value) => {
    writeStored(value)
    apply()
  })

  initialized = true
}

/**
 * Names the storage key (and any other option) before the first `useTheme()`.
 *
 * Call it once, at application start, next to the other boot-time wiring:
 *
 * ```ts
 * configureTheme({ storageKey: 'analytics.theme' })
 * ```
 *
 * Calling it later re-reads storage and repaints, which is what an application
 * that switches identity mid-session (or a test) wants, but it is not a
 * per-component knob: the preference is one global piece of state, exactly like
 * the document it paints.
 */
export function configureTheme(next: IThemeOptions = {}): void {
  options = { ...options, ...next }
  initialize()
}

/**
 * Light/dark theming, with `system` as a first-class third state.
 *
 * The library ships both ramps and switches between them on a single class, so
 * all this owns is the decision about when that class is present, where the
 * preference is stored, and what happens when the OS setting changes while the
 * application is open.
 *
 * ```vue
 * const { theme, resolved, setTheme, toggle } = useTheme()
 * ```
 *
 * `theme` is what the person chose (`'system'` included) and is what a settings
 * control should bind to. `resolved` is what is actually painted, and is what
 * an icon should follow.
 */
export function useTheme(): IThemeController {
  if (!initialized) initialize()

  return {
    theme: readonly(theme),
    resolved: readonly(resolved),
    followsSystem: computed(() => theme.value === 'system'),
    setTheme: (value: TTheme) => {
      theme.value = value
    },
    toggle: () => {
      theme.value = resolved.value === 'dark' ? 'light' : 'dark'
    },
  }
}
