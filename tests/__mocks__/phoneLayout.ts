import { vi } from 'vitest'
import {
  NB_PHONE_QUERY,
  NB_PHONE_TOUCH_QUERY,
  resetPhoneLayoutForTests,
} from '../../src/composables/usePhoneLayout.composable'

/**
 * Lay the page out as a phone (or a phone touch screen) for the components
 * that read usePhoneLayout(). The composable shares one answer across the
 * app, so it is reset first and the next caller reads the stub.
 *
 * Call `unstubPhone()` in afterEach, or a later spec inherits the phone.
 */
export function stubPhone({ touch = false } = {}): void {
  resetPhoneLayoutForTests()
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches:
      query === NB_PHONE_QUERY || (touch && query === NB_PHONE_TOUCH_QUERY),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

export function unstubPhone(): void {
  resetPhoneLayoutForTests()
  vi.unstubAllGlobals()
}
