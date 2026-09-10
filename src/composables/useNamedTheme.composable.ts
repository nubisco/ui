/**
 * Selecting one of several named colour themes at runtime.
 *
 * The third of three independent axes, and deliberately the same shape as the
 * other two:
 *
 * | Axis        | Written to             | Owner              |
 * | ----------- | ---------------------- | ------------------ |
 * | Colour mode | `.dark` on `<html>`    | `useTheme()`       |
 * | Appearance  | `data-nb-appearance`   | `useAppearance()`  |
 * | Named theme | `data-nb-theme`        | this file          |
 *
 * They never touch each other. A theme carries colour only: it supplies both a
 * light and a dark half and the existing `.dark` class chooses between them, so
 * switching theme cannot reset the mode, and switching mode cannot reset the
 * theme. Neither disturbs the corner geometry.
 *
 * ## It does not know your palette
 *
 * This applies an identifier and nothing else. The values live in CSS, emitted
 * by the SCSS a consumer imports, so adding a theme is one import plus one
 * string. Nothing here has to be told what "ocean" looks like, and a consumer
 * never restates a palette in JavaScript to make one selectable.
 *
 * Human-readable labels for a theme picker are the application's business and
 * stay out of the styling contract: keep them in your own list, keyed by id.
 */

import { computed, readonly, ref, watch, type ComputedRef, type Ref } from 'vue'

/**
 * A theme identifier, or `null` for the library's built-in default.
 *
 * Any string a stylesheet defines is valid, so this is not a closed union: the
 * whole point is that a consumer can add a theme without changing this file.
 */
export type TNamedTheme = string | null

export interface INamedThemeOptions {
  /**
   * localStorage key the selection is persisted under. Namespace it per
   * application, so two Nubisco products on one origin do not fight over it.
   */
  storageKey?: string
  /** Theme to select when nothing is stored. `null` is the built-in default. */
  defaultTheme?: TNamedTheme
  /** Attribute placed on `<html>`. Matches the selector the SCSS emits. */
  attribute?: string
  /**
   * Identifiers this application ships. When given, a stored value outside the
   * list is ignored rather than applied.
   *
   * This is not decoration. The stored value is attacker-influenced in the
   * sense that it survives from any earlier version of the app, and applying an
   * unknown id writes an arbitrary string into a DOM attribute. Listing what
   * exists means a stale or junk value falls back to the default instead.
   */
  themes?: readonly string[]
  /**
   * Whether the selection is read from and written to storage at all. Turn it
   * off when the application drives the theme from its own settings, so a
   * stored value cannot override what it just asked for.
   */
  persist?: boolean
}

export interface INamedThemeController {
  /** The selected identifier, or `null` for the default theme. */
  namedTheme: Readonly<Ref<TNamedTheme>>
  /** True while a named theme is active. */
  isCustom: ComputedRef<boolean>
  /** Select a theme, or `null` to return to the default. */
  setNamedTheme: (value: TNamedTheme) => void
}

const DEFAULTS: Required<Omit<INamedThemeOptions, 'themes'>> & {
  themes: readonly string[] | null
} = {
  storageKey: 'nubisco.named-theme',
  defaultTheme: null,
  attribute: 'data-nb-theme',
  themes: null,
  persist: true,
}

let options = { ...DEFAULTS }
let initialized = false

const namedTheme = ref<TNamedTheme>(DEFAULTS.defaultTheme)

/**
 * Whether a value is usable as a theme id.
 *
 * The same shape the SCSS validates, for the same reason: this string is
 * written into a DOM attribute, so it is checked rather than trusted.
 */
export function isValidThemeId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]{1,64}$/.test(value)
}

function known(value: string): boolean {
  return !options.themes || options.themes.includes(value)
}

function readStored(): TNamedTheme | null {
  if (!options.persist) return null
  try {
    if (typeof localStorage === 'undefined') return null
    const value = localStorage.getItem(options.storageKey)
    if (value === null) return null
    if (value === '') return null
    return isValidThemeId(value) && known(value) ? value : null
  } catch {
    return null
  }
}

function writeStored(value: TNamedTheme): void {
  if (!options.persist) return
  try {
    if (typeof localStorage === 'undefined') return
    if (value === null) localStorage.removeItem(options.storageKey)
    else localStorage.setItem(options.storageKey, value)
  } catch {
    // A selection that cannot be persisted still applies for this session.
  }
}

/**
 * Puts the selection on the document.
 *
 * On `<html>`, like the dark class and the appearance attribute, so teleported
 * overlays inherit it: a modal or a select list mounts as a sibling of the app
 * root and would otherwise keep the default theme while the page behind it
 * changed.
 *
 * The default theme REMOVES the attribute rather than writing a sentinel, so
 * `[data-nb-theme]` means "a theme is selected" and the default needs no
 * selector of its own.
 */
function apply(): void {
  if (typeof document === 'undefined') return
  const value = namedTheme.value
  if (value === null)
    document.documentElement.removeAttribute(options.attribute)
  else document.documentElement.setAttribute(options.attribute, value)
}

let stopPersisting: (() => void) | null = null

function initialize(): void {
  const stored = readStored()
  const fallback = options.defaultTheme
  namedTheme.value =
    stored ??
    (fallback !== null && isValidThemeId(fallback) && known(fallback)
      ? fallback
      : null)
  apply()

  stopPersisting?.()
  stopPersisting = watch(namedTheme, (value) => {
    writeStored(value)
    apply()
  })

  initialized = true
}

/**
 * Names the themes this application ships, and picks the starting one.
 *
 * ```ts
 * configureNamedTheme({ themes: ['ocean', 'forest'], defaultTheme: 'ocean' })
 * ```
 */
export function configureNamedTheme(next: INamedThemeOptions = {}): void {
  options = { ...options, ...next, themes: next.themes ?? options.themes }
  initialize()
}

/**
 * The selected colour theme.
 *
 * ```vue
 * const { namedTheme, setNamedTheme } = useNamedTheme()
 * ```
 *
 * An unknown or malformed id is refused rather than written to the document.
 */
export function useNamedTheme(): INamedThemeController {
  if (!initialized) initialize()

  return {
    namedTheme: readonly(namedTheme) as Readonly<Ref<TNamedTheme>>,
    isCustom: computed(() => namedTheme.value !== null),
    setNamedTheme: (value: TNamedTheme) => {
      if (value === null) {
        namedTheme.value = null
        return
      }
      if (!isValidThemeId(value) || !known(value)) return
      namedTheme.value = value
    },
  }
}

/** Test helper: forgets configuration and selection. */
export function resetNamedTheme(): void {
  stopPersisting?.()
  stopPersisting = null
  options = { ...DEFAULTS }
  namedTheme.value = DEFAULTS.defaultTheme
  initialized = false
  if (typeof document !== 'undefined')
    document.documentElement.removeAttribute(DEFAULTS.attribute)
}
