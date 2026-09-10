import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  configureNamedTheme,
  useNamedTheme,
  isValidThemeId,
  resetNamedTheme,
} from '../src/composables/useNamedTheme.composable'
import {
  A11Y_ROLES,
  TINTS,
  asRampRef,
  resolveRole,
  shadesOf,
  toScss,
  slugify,
  isValidId,
  isValidColor,
  SAMPLE_THEMES,
} from '../docs/.vitepress/theme/components/theme-builder/themeModel'

describe('useNamedTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-nb-theme')
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-nb-appearance')
    resetNamedTheme()
  })

  afterEach(() => resetNamedTheme())

  it('defaults to the built-in theme, with no attribute at all', () => {
    const { namedTheme, isCustom } = useNamedTheme()
    expect(namedTheme.value).toBeNull()
    expect(isCustom.value).toBe(false)
    expect(document.documentElement.hasAttribute('data-nb-theme')).toBe(false)
  })

  it('writes the identifier onto the document element', async () => {
    const { setNamedTheme } = useNamedTheme()
    setNamedTheme('ocean')
    await nextTick()
    expect(document.documentElement.getAttribute('data-nb-theme')).toBe('ocean')
  })

  // The attribute goes on <html> so a teleported overlay inherits it rather
  // than staying on the default theme while the page behind it changes.
  it('puts the attribute where teleported overlays inherit it', async () => {
    useNamedTheme().setNamedTheme('forest')
    await nextTick()
    const teleported = document.createElement('div')
    document.body.appendChild(teleported)
    expect(teleported.closest('[data-nb-theme="forest"]')).toBe(
      document.documentElement,
    )
    teleported.remove()
  })

  it('returns to the default by removing the attribute', async () => {
    const { setNamedTheme, namedTheme } = useNamedTheme()
    setNamedTheme('ocean')
    await nextTick()
    setNamedTheme(null)
    await nextTick()
    expect(namedTheme.value).toBeNull()
    expect(document.documentElement.hasAttribute('data-nb-theme')).toBe(false)
  })

  /* ── The three axes are independent ─────────────────────────────────── */

  it('leaves colour mode and appearance untouched', async () => {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-nb-appearance', 'rounded')

    useNamedTheme().setNamedTheme('ocean')
    await nextTick()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-nb-appearance')).toBe(
      'rounded',
    )
    expect(document.documentElement.getAttribute('data-nb-theme')).toBe('ocean')
  })

  it('survives a mode change and an appearance change', async () => {
    const { namedTheme, setNamedTheme } = useNamedTheme()
    setNamedTheme('forest')
    await nextTick()

    document.documentElement.classList.toggle('dark', true)
    document.documentElement.setAttribute('data-nb-appearance', 'rounded')

    expect(namedTheme.value).toBe('forest')
    expect(document.documentElement.getAttribute('data-nb-theme')).toBe(
      'forest',
    )
  })

  /* ── Validation ─────────────────────────────────────────────────────── */

  it('refuses an identifier that could break out of the attribute selector', async () => {
    const { setNamedTheme, namedTheme } = useNamedTheme()
    setNamedTheme('evil"] { color: red } [x')
    await nextTick()
    expect(namedTheme.value).toBeNull()
    expect(document.documentElement.hasAttribute('data-nb-theme')).toBe(false)
  })

  it('refuses ids outside the declared list', async () => {
    configureNamedTheme({ themes: ['ocean'] })
    const { setNamedTheme, namedTheme } = useNamedTheme()
    setNamedTheme('forest')
    await nextTick()
    expect(namedTheme.value).toBeNull()
    setNamedTheme('ocean')
    await nextTick()
    expect(namedTheme.value).toBe('ocean')
  })

  it('validates ids the same way the SCSS does', () => {
    for (const good of ['ocean', 'warm-neutral', 'a', 'theme-2']) {
      expect(isValidThemeId(good)).toBe(true)
      expect(isValidId(good)).toBe(true)
    }
    for (const bad of ['Ocean', 'a b', 'a_b', '', 'a"b', 'a]b', 'a{b']) {
      expect(isValidThemeId(bad)).toBe(false)
      expect(isValidId(bad)).toBe(false)
    }
  })

  /* ── Persistence ────────────────────────────────────────────────────── */

  it('persists and reads back a known theme', async () => {
    configureNamedTheme({ themes: ['ocean'] })
    useNamedTheme().setNamedTheme('ocean')
    await nextTick()
    expect(localStorage.getItem('nubisco.named-theme')).toBe('ocean')

    resetNamedTheme()
    configureNamedTheme({ themes: ['ocean'] })
    expect(useNamedTheme().namedTheme.value).toBe('ocean')
  })

  // A value left by an earlier version of an app must not be applied blindly.
  it('ignores a stored theme the application no longer ships', () => {
    localStorage.setItem('nubisco.named-theme', 'retired-theme')
    configureNamedTheme({ themes: ['ocean'] })
    expect(useNamedTheme().namedTheme.value).toBeNull()
    expect(document.documentElement.hasAttribute('data-nb-theme')).toBe(false)
  })

  it('ignores a malformed stored value', () => {
    localStorage.setItem('nubisco.named-theme', '"] {evil}')
    configureNamedTheme()
    expect(useNamedTheme().namedTheme.value).toBeNull()
  })

  it('lets an application own the setting with persist: false', () => {
    localStorage.setItem('nubisco.named-theme', 'ocean')
    configureNamedTheme({ persist: false, defaultTheme: null })
    expect(useNamedTheme().namedTheme.value).toBeNull()
  })

  it('boots when storage throws, as it does in private mode', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied')
      })
    expect(() => configureNamedTheme()).not.toThrow()
    expect(useNamedTheme().namedTheme.value).toBeNull()
    spy.mockRestore()
  })
})

describe('theme export', () => {
  const theme = SAMPLE_THEMES[0]

  it('emits a file that imports only the public entry point', () => {
    const scss = toScss(theme)
    expect(scss).toContain("@use '@nubisco/ui/styles/theme-api' as nb")
    expect(scss).not.toContain('../')
    expect(scss).not.toContain('src/styles')
  })

  it('carries both halves and the identifier', () => {
    const scss = toScss(theme)
    expect(scss).toContain(`'${theme.id}'`)
    expect(scss).toContain('$light: (')
    expect(scss).toContain('$dark: (')
    expect(scss).toContain(theme.light.primary.toLowerCase())
    expect(scss).toContain(theme.dark.primary.toLowerCase())
  })

  // Re-exporting an unchanged theme must not produce a noisy diff.
  it('is deterministic', () => {
    expect(toScss(theme)).toBe(toScss(theme))
    const shuffled = {
      ...theme,
      light: Object.fromEntries(Object.entries(theme.light).reverse()),
    }
    expect(toScss(shuffled)).toBe(toScss(theme))
  })

  it('refuses to render an unsafe identifier', () => {
    expect(() => toScss({ ...theme, id: "evil'] { color: red } [x" })).toThrow()
    expect(() => toScss({ ...theme, id: 'Ocean' })).toThrow()
  })

  // A name reaches a comment, so it must not be able to end one.
  it('neutralises a name that would close the comment block', () => {
    const scss = toScss({ ...theme, name: 'Nice */ body { display: none } /*' })
    const header = scss.slice(0, scss.indexOf('@use'))
    expect(header.split('*/').length - 1).toBe(1)
  })

  it('drops a value that is not a colour rather than interpolating it', () => {
    const scss = toScss({
      ...theme,
      light: { ...theme.light, primary: 'red; } :root { color: blue' },
    })
    expect(scss).not.toContain('color: blue')
  })

  it('carries no geometry, so appearance stays independent', () => {
    const scss = toScss(theme)
    expect(scss).not.toContain('--nb-radius')
    expect(scss).not.toContain('data-nb-appearance')
  })

  it('ships three samples, each a palette and both halves', () => {
    expect(SAMPLE_THEMES.length).toBeGreaterThanOrEqual(3)
    for (const sample of SAMPLE_THEMES) {
      expect(isValidId(sample.id)).toBe(true)
      expect(sample.palette.length).toBeGreaterThan(1)
      for (const color of sample.palette) {
        expect(isValidId(color.id)).toBe(true)
        expect(isValidColor(color.base)).toBe(true)
      }
      expect(Object.keys(sample.light).length).toBeGreaterThan(10)
      expect(Object.keys(sample.dark).length).toBeGreaterThan(10)
      // Every role resolves to a real colour, whether it points at a ramp
      // step or holds a literal.
      for (const half of [sample.light, sample.dark]) {
        for (const value of Object.values(half)) {
          expect(isValidColor(resolveRole(value, sample.palette))).toBe(true)
        }
      }
    }
  })

  /*
   * The point of the model: the two halves are the same palette read at
   * different depths, not two unrelated sets of colours. If a sample ever
   * drifts into restating colours per mode, this fails.
   */
  it('reads both halves from one palette', () => {
    for (const sample of SAMPLE_THEMES) {
      const refs = (half: Record<string, string>) =>
        Object.values(half)
          .map((v) => asRampRef(v, sample.palette))
          .filter(Boolean).length
      expect(refs(sample.light)).toBeGreaterThan(10)
      expect(refs(sample.dark)).toBeGreaterThan(10)
      expect(sample.light.primary).not.toBe(sample.dark.primary)
      expect(asRampRef(sample.light.primary, sample.palette)?.color).toBe(
        asRampRef(sample.dark.primary, sample.palette)?.color,
      )
    }
  })

  it('expands a base colour into the library ramp', () => {
    const shades = shadesOf('#0f6f8c')
    expect(Object.keys(shades)).toHaveLength(TINTS.length)
    // A base keeps its exact value at its own level rather than being
    // approximated by the nearest step.
    expect(Object.values(shades)).toContain('#0f6f8c')
  })

  it('emits a readable foreground for every role that has one', () => {
    const theme = SAMPLE_THEMES[0]
    const scss = toScss(theme)
    for (const role of ['primary', 'success', 'danger']) {
      expect(A11Y_ROLES).toContain(role)
      expect(scss).toMatch(new RegExp(`'${role}': '[a-z]+-\\d+'`))
    }
  })

  it('slugifies a name into a usable identifier', () => {
    expect(slugify('Warm Neutral')).toBe('warm-neutral')
    expect(slugify('Café Crème')).toBe('cafe-creme')
    expect(slugify('  --Odd  Name!!  ')).toBe('odd-name')
    expect(isValidId(slugify('Ocean Blue 2'))).toBe(true)
  })
})
