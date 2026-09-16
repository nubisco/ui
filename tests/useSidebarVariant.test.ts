import { afterEach, describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { useSidebarVariant } from '../src/composables/useSidebarVariant.composable'

const KEY = 'test.sidebar'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('useSidebarVariant', () => {
  it('starts expanded for someone who has never chosen', () => {
    expect(useSidebarVariant({ storageKey: KEY }).variant.value).toBe('verbose')
  })

  it('honours a product default', () => {
    expect(
      useSidebarVariant({ storageKey: KEY, defaultVariant: 'compact' }).variant
        .value,
    ).toBe('compact')
  })

  it('toggles and remembers the choice, as a preference and not per route', async () => {
    const nav = useSidebarVariant({ storageKey: KEY })
    nav.toggle()
    await nextTick()
    expect(nav.variant.value).toBe('compact')
    expect(nav.isCompact.value).toBe(true)
    expect(localStorage.getItem(KEY)).toBe('compact')
    // A later visit, a fresh instance, restores it.
    expect(useSidebarVariant({ storageKey: KEY }).variant.value).toBe('compact')
  })

  it('ignores a stored value it does not know, rather than passing it to the shell', () => {
    localStorage.setItem(KEY, 'sideways')
    expect(useSidebarVariant({ storageKey: KEY }).variant.value).toBe('verbose')
  })

  it('refuses an invalid variant set at runtime', () => {
    const nav = useSidebarVariant({ storageKey: KEY })
    nav.setVariant('sideways' as never)
    expect(nav.variant.value).toBe('verbose')
  })

  it('keeps working when storage throws, as in a private window', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    const nav = useSidebarVariant({ storageKey: KEY })
    expect(nav.variant.value).toBe('verbose')
    expect(() => nav.toggle()).not.toThrow()
    await nextTick()
    expect(nav.variant.value).toBe('compact')
  })
})
