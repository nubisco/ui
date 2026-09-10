import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  configureAppearance,
  useAppearance,
  appearanceAttribute,
  resetAppearance,
} from '../src/composables/useAppearance.composable'

describe('useAppearance', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-nb-appearance')
    document.documentElement.className = ''
    resetAppearance()
  })

  afterEach(() => {
    resetAppearance()
  })

  it('defaults to square, which is the geometry existing applications have', () => {
    const { appearance, isRounded } = useAppearance()
    expect(appearance.value).toBe('square')
    expect(isRounded.value).toBe(false)
  })

  it('writes the appearance onto the document element', () => {
    useAppearance()
    expect(document.documentElement.getAttribute('data-nb-appearance')).toBe(
      'square',
    )
  })

  // The attribute goes on <html> rather than an app root precisely so that
  // teleported overlays, which mount as siblings of that root, inherit it.
  it('puts the attribute where teleported overlays can inherit it', async () => {
    const { setAppearance } = useAppearance()
    setAppearance('rounded')
    await nextTick()

    const teleported = document.createElement('div')
    document.body.appendChild(teleported)

    expect(teleported.closest('[data-nb-appearance="rounded"]')).toBe(
      document.documentElement,
    )
    teleported.remove()
  })

  it('switches at runtime without a reload', async () => {
    const { appearance, isRounded, setAppearance } = useAppearance()

    setAppearance('rounded')
    await nextTick()
    expect(appearance.value).toBe('rounded')
    expect(isRounded.value).toBe(true)
    expect(document.documentElement.getAttribute('data-nb-appearance')).toBe(
      'rounded',
    )

    setAppearance('square')
    await nextTick()
    expect(document.documentElement.getAttribute('data-nb-appearance')).toBe(
      'square',
    )
  })

  it('toggles between the two', async () => {
    const { appearance, toggle } = useAppearance()
    toggle()
    await nextTick()
    expect(appearance.value).toBe('rounded')
    toggle()
    await nextTick()
    expect(appearance.value).toBe('square')
  })

  /**
   * The two settings are the whole point of this being a separate composable.
   * Appearance must not touch the dark class, and the theme must not touch the
   * appearance attribute.
   */
  it('leaves the colour mode alone', async () => {
    document.documentElement.classList.add('dark')
    const { setAppearance } = useAppearance()

    setAppearance('rounded')
    await nextTick()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-nb-appearance')).toBe(
      'rounded',
    )
  })

  it('survives a colour-mode change without resetting', async () => {
    const { appearance, setAppearance } = useAppearance()
    setAppearance('rounded')
    await nextTick()

    // What useTheme() does when the preference flips.
    document.documentElement.classList.toggle('dark', true)
    document.documentElement.style.colorScheme = 'dark'

    expect(appearance.value).toBe('rounded')
    expect(document.documentElement.getAttribute('data-nb-appearance')).toBe(
      'rounded',
    )
  })

  it('persists the preference and reads it back', async () => {
    const { setAppearance } = useAppearance()
    setAppearance('rounded')
    await nextTick()

    expect(localStorage.getItem('nubisco.appearance')).toBe('rounded')

    resetAppearance()
    configureAppearance()
    expect(useAppearance().appearance.value).toBe('rounded')
  })

  it('namespaces the storage key', async () => {
    configureAppearance({ storageKey: 'analytics.appearance' })
    useAppearance().setAppearance('rounded')
    await nextTick()
    expect(localStorage.getItem('analytics.appearance')).toBe('rounded')
  })

  // An application that owns the setting must be able to stop a stale stored
  // value from overriding what it just asked for.
  it('does not let storage override an application that opted out of persistence', () => {
    localStorage.setItem('nubisco.appearance', 'rounded')
    configureAppearance({ persist: false, defaultAppearance: 'square' })
    expect(useAppearance().appearance.value).toBe('square')
  })

  it('honours a stored preference over the default when persisting', () => {
    localStorage.setItem('nubisco.appearance', 'rounded')
    configureAppearance({ defaultAppearance: 'square' })
    expect(useAppearance().appearance.value).toBe('rounded')
  })

  it('ignores a corrupt stored value rather than applying it', () => {
    localStorage.setItem('nubisco.appearance', 'triangular')
    configureAppearance({ defaultAppearance: 'square' })
    expect(useAppearance().appearance.value).toBe('square')
    expect(document.documentElement.getAttribute('data-nb-appearance')).toBe(
      'square',
    )
  })

  it('boots when storage throws, as it does in private mode', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied')
      })
    expect(() => configureAppearance()).not.toThrow()
    expect(useAppearance().appearance.value).toBe('square')
    spy.mockRestore()
  })

  it('reports the attribute a server should render for the first paint', () => {
    expect(appearanceAttribute('rounded')).toEqual({
      attribute: 'data-nb-appearance',
      value: 'rounded',
    })
    expect(appearanceAttribute().value).toBe('square')
  })
})
