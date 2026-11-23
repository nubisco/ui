import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import {
  configureDarkSurfaces,
  useDarkSurfaces,
  darkSurfacesAttribute,
  resetDarkSurfaces,
} from '../src/composables/useDarkSurfaces.composable'

const ATTR = 'data-nb-dark-surfaces'

describe('useDarkSurfaces', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute(ATTR)
    document.documentElement.className = ''
    resetDarkSurfaces()
  })

  afterEach(() => {
    resetDarkSurfaces()
  })

  // Grey is what every existing application renders, and it is the absence
  // of the attribute, so the default compiles and paints exactly as before.
  it('defaults to grey and writes no attribute', () => {
    const { darkSurfaces, isTinted } = useDarkSurfaces()
    expect(darkSurfaces.value).toBe('grey')
    expect(isTinted.value).toBe(false)
    expect(document.documentElement.hasAttribute(ATTR)).toBe(false)
  })

  it('opts in with one call at boot', () => {
    configureDarkSurfaces({ tinted: true })
    expect(document.documentElement.getAttribute(ATTR)).toBe('tinted')
    expect(useDarkSurfaces().isTinted.value).toBe(true)
  })

  it('puts the attribute where teleported overlays can inherit it', () => {
    configureDarkSurfaces({ tinted: true })
    const teleported = document.createElement('div')
    document.body.appendChild(teleported)
    expect(teleported.closest(`[${ATTR}="tinted"]`)).toBe(
      document.documentElement,
    )
    teleported.remove()
  })

  it('switches at runtime and removes the attribute for grey', async () => {
    const { setTinted } = useDarkSurfaces()
    setTinted(true)
    await nextTick()
    expect(document.documentElement.getAttribute(ATTR)).toBe('tinted')
    setTinted(false)
    await nextTick()
    expect(document.documentElement.hasAttribute(ATTR)).toBe(false)
  })

  it('toggles between the two', async () => {
    const { darkSurfaces, toggle } = useDarkSurfaces()
    toggle()
    await nextTick()
    expect(darkSurfaces.value).toBe('tinted')
    toggle()
    await nextTick()
    expect(darkSurfaces.value).toBe('grey')
  })

  it('leaves the colour mode, theme and appearance alone', async () => {
    const root = document.documentElement
    root.classList.add('dark')
    root.setAttribute('data-nb-theme', 'probe')
    root.setAttribute('data-nb-appearance', 'rounded')
    useDarkSurfaces().setTinted(true)
    await nextTick()
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.getAttribute('data-nb-theme')).toBe('probe')
    expect(root.getAttribute('data-nb-appearance')).toBe('rounded')
    root.removeAttribute('data-nb-theme')
    root.removeAttribute('data-nb-appearance')
  })

  it('persists a choice and reads it back', async () => {
    useDarkSurfaces().setTinted(true)
    await nextTick()
    expect(localStorage.getItem('nubisco.dark-surfaces')).toBe('tinted')

    resetDarkSurfaces()
    configureDarkSurfaces()
    expect(useDarkSurfaces().isTinted.value).toBe(true)
  })

  it('namespaces the storage key', async () => {
    configureDarkSurfaces({ storageKey: 'analytics.dark-surfaces' })
    useDarkSurfaces().setTinted(true)
    await nextTick()
    expect(localStorage.getItem('analytics.dark-surfaces')).toBe('tinted')
  })

  it('does not let storage override an application that opted out of persistence', () => {
    localStorage.setItem('nubisco.dark-surfaces', 'grey')
    configureDarkSurfaces({ persist: false, tinted: true })
    expect(useDarkSurfaces().isTinted.value).toBe(true)
  })

  it('ignores a corrupt stored value rather than applying it', () => {
    localStorage.setItem('nubisco.dark-surfaces', 'sepia')
    configureDarkSurfaces({ tinted: false })
    expect(useDarkSurfaces().darkSurfaces.value).toBe('grey')
    expect(document.documentElement.hasAttribute(ATTR)).toBe(false)
  })

  it('boots when storage throws, as it does in private mode', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied')
      })
    expect(() => configureDarkSurfaces({ tinted: true })).not.toThrow()
    expect(useDarkSurfaces().isTinted.value).toBe(true)
    spy.mockRestore()
  })

  it('reports the attribute a server should render for the first paint', () => {
    expect(darkSurfacesAttribute(true)).toEqual({
      attribute: ATTR,
      value: 'tinted',
    })
    expect(darkSurfacesAttribute().value).toBe(null)
  })
})
