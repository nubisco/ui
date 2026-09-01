import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  configureTheme,
  useTheme,
} from '../src/composables/useTheme.composable'

/**
 * jsdom's matchMedia always answers `matches: false` and ignores listeners, so
 * the OS half of this composable is unobservable without a stand-in. This one
 * records its listeners and exposes `set()` so a spec can change the "OS"
 * setting mid-test, which is the case that separates `system` from a preference
 * that merely started out matching it.
 */
function stubMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>()
  const media = {
    matches,
    addEventListener: (_: string, fn: () => void) => void listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) =>
      void listeners.delete(fn),
  }
  window.matchMedia = vi.fn(() => media) as unknown as typeof window.matchMedia
  return {
    set(next: boolean) {
      media.matches = next
      for (const fn of listeners) fn()
    },
    listenerCount: () => listeners.size,
  }
}

const KEY = 'test.theme'

function fresh(matches = false) {
  const os = stubMatchMedia(matches)
  configureTheme({ storageKey: KEY, defaultTheme: 'system', darkClass: 'dark' })
  return os
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
})

afterEach(() => {
  localStorage.clear()
})

describe('useTheme', () => {
  it('follows the OS by default, painting nothing of its own', () => {
    fresh(false)
    const { theme, resolved } = useTheme()

    expect(theme.value).toBe('system')
    expect(resolved.value).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('resolves dark when the OS asks for dark and nothing is stored', () => {
    fresh(true)
    const { theme, resolved } = useTheme()

    expect(theme.value).toBe('system')
    expect(resolved.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('puts the class on <html>, not on the app root', async () => {
    fresh(false)
    const { setTheme } = useTheme()

    setTheme('dark')
    await nextTick()

    // Teleported overlays (modals, popovers, the DatePicker calendar) mount
    // outside #app; anything scoped tighter than <html> leaves them light.
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('persists the preference under the configured key', async () => {
    fresh(false)
    const { setTheme } = useTheme()

    setTheme('dark')
    await nextTick()

    expect(localStorage.getItem(KEY)).toBe('dark')
  })

  it('reads a stored preference back on start, over the OS', () => {
    localStorage.setItem(KEY, 'dark')
    fresh(false)
    const { theme, resolved } = useTheme()

    expect(theme.value).toBe('dark')
    expect(resolved.value).toBe('dark')
  })

  it('ignores a stored value that is not a theme', () => {
    localStorage.setItem(KEY, 'sepia')
    fresh(false)
    const { theme } = useTheme()

    expect(theme.value).toBe('system')
  })

  it('repaints when the OS flips while following it', () => {
    const os = fresh(false)
    const { resolved, theme } = useTheme()
    expect(resolved.value).toBe('light')

    os.set(true)

    expect(resolved.value).toBe('dark')
    expect(theme.value).toBe('system')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('ignores the OS once a preference is pinned', async () => {
    const os = fresh(false)
    const { setTheme, resolved } = useTheme()

    setTheme('light')
    await nextTick()
    os.set(true)

    expect(resolved.value).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('hands control back to the OS when set to system again', async () => {
    const os = fresh(true)
    const { setTheme, resolved } = useTheme()

    setTheme('light')
    await nextTick()
    expect(resolved.value).toBe('light')

    setTheme('system')
    await nextTick()
    expect(resolved.value).toBe('dark')
    expect(os.listenerCount()).toBe(1)
  })

  it('toggles against what is showing, not against what is stored', async () => {
    fresh(true)
    const { theme, resolved, toggle } = useTheme()

    // Showing dark via `system`: the first toggle has to land on light, which a
    // toggle written against `theme` ('system' -> 'dark') would get backwards.
    expect(theme.value).toBe('system')
    toggle()
    await nextTick()

    expect(theme.value).toBe('light')
    expect(resolved.value).toBe('light')
  })

  it('reports whether it is following the system', async () => {
    fresh(false)
    const { followsSystem, setTheme } = useTheme()

    expect(followsSystem.value).toBe(true)
    setTheme('dark')
    await nextTick()
    expect(followsSystem.value).toBe(false)
  })

  it('shares one state across every caller', async () => {
    fresh(false)
    const a = useTheme()
    const b = useTheme()

    a.setTheme('dark')
    await nextTick()

    expect(b.theme.value).toBe('dark')
    expect(b.resolved.value).toBe('dark')
  })

  it('keeps a single media listener across re-configuration', () => {
    const os = fresh(false)
    useTheme()
    configureTheme({ storageKey: KEY })
    useTheme()

    expect(os.listenerCount()).toBe(1)
  })

  it('survives storage that throws, as in Safari private mode', async () => {
    fresh(false)
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied')
      })
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('denied')
      })

    configureTheme({ storageKey: KEY })
    const { setTheme, resolved } = useTheme()
    setTheme('dark')
    await nextTick()

    // The preference still applies for this session, it just does not survive.
    expect(resolved.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    getItem.mockRestore()
    setItem.mockRestore()
  })

  it('honours a custom dark class', async () => {
    stubMatchMedia(false)
    configureTheme({ storageKey: KEY, darkClass: 'theme-dark' })
    const { setTheme } = useTheme()

    setTheme('dark')
    await nextTick()

    expect(document.documentElement.classList.contains('theme-dark')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
