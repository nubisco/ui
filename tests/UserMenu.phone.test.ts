import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import UserMenu from '../src/components/UserMenu.vue'
import {
  NB_PHONE_QUERY,
  resetPhoneLayoutForTests,
} from '../src/composables/usePhoneLayout.composable'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {} } })

function stubPhone(on: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: on && query === NB_PHONE_QUERY,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

function setViewport(width: number, height = 800) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    configurable: true,
    writable: true,
  })
}

/** Mount with the trigger at a fixed spot, open it, return the panel style. */
async function openAt(
  rect: { left: number; right: number; top: number; bottom: number },
  props: Record<string, unknown> = {},
) {
  const w = mount(UserMenu, {
    props: { user: { email: 'jose@nubisco.io', name: 'José' }, ...props },
    global: { plugins: [i18n] },
    attachTo: document.body,
  })
  vi.spyOn(w.element as HTMLElement, 'getBoundingClientRect').mockReturnValue({
    ...rect,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  } as DOMRect)
  await w.find('.nb-user-menu__avatar').trigger('click')
  await nextTick()
  const panel = document.body.querySelector<HTMLElement>('.nb-user-menu__panel')
  return { w, panel: panel! }
}

afterEach(() => {
  vi.unstubAllGlobals()
  resetPhoneLayoutForTests()
  setViewport(1024, 768)
})

describe('UserMenu placement on a phone', () => {
  const railBottom = { left: 12, right: 52, top: 700, bottom: 740 }

  it('keeps right-end exactly as it was on a desktop, even past the edge', async () => {
    stubPhone(false)
    setViewport(300, 800)
    const { w, panel } = await openAt(railBottom)
    // Desktop is untouched: rect.right + 12, bottom aligned to the trigger.
    expect(panel.style.left).toBe('64px')
    expect(panel.style.bottom).toBe('60px')
    w.unmount()
  })

  it('opens above the trigger and inside the screen on a phone', async () => {
    stubPhone(true)
    setViewport(360, 800)
    const { w, panel } = await openAt(railBottom)
    expect(panel.style.left).toBe('12px')
    // Above the trigger: innerHeight - rect.top + 8.
    expect(panel.style.bottom).toBe('108px')
    w.unmount()
  })

  it('clamps left so the panel stops 8px short of the right edge', async () => {
    stubPhone(true)
    setViewport(320, 800)
    const { w, panel } = await openAt({
      left: 280,
      right: 312,
      top: 700,
      bottom: 740,
    })
    // jsdom has no layout, so the stylesheet's 260px is the width used.
    expect(panel.style.left).toBe(`${320 - 260 - 8}px`)
    w.unmount()
  })

  it('clamps left to 8px at the left edge', async () => {
    stubPhone(true)
    setViewport(360, 800)
    const { w, panel } = await openAt(
      { left: -4, right: 30, top: 700, bottom: 740 },
      { placement: 'top-start' },
    )
    expect(panel.style.left).toBe('8px')
    w.unmount()
  })
})
