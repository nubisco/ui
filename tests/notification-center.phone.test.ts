import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import NotificationCenter from '../src/components/NotificationCenter.vue'
import {
  NB_PHONE_QUERY,
  resetPhoneLayoutForTests,
} from '../src/composables/usePhoneLayout.composable'

const ITEMS = [
  { id: 'a', title: 'Build failed', read: false },
  { id: 'b', title: 'Invite accepted', read: true },
]

function stubPhone(on: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: on && query === NB_PHONE_QUERY,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

const panel = () =>
  document.querySelector<HTMLElement>('.nb-notification-center__panel')

async function openCenter(props: Record<string, unknown> = {}) {
  const w = mount(NotificationCenter, {
    props: { items: ITEMS, ...props },
    attachTo: document.body,
  })
  await w.find('.nb-notification-center__trigger').trigger('click')
  await nextTick()
  await nextTick()
  return w
}

afterEach(() => {
  vi.unstubAllGlobals()
  resetPhoneLayoutForTests()
  document.body.innerHTML = ''
})

describe('NbNotificationCenter on a phone', () => {
  it('stays the anchored popover on a desktop', async () => {
    stubPhone(false)
    const w = await openCenter()
    const el = panel()!
    expect(el.classList.contains('nb-notification-center__panel--sheet')).toBe(
      false,
    )
    expect(el.style.width).toBe('360px')
    expect(document.querySelector('.nb-notification-center__close')).toBeNull()
    const list = document.querySelector<HTMLElement>(
      '.nb-notification-center__list',
    )!
    expect(list.style.maxHeight).not.toBe('')
    w.unmount()
  })

  it('opens as a full-screen sheet with no anchored geometry', async () => {
    stubPhone(true)
    const w = await openCenter()
    const el = panel()!
    expect(el.classList.contains('nb-notification-center__panel--sheet')).toBe(
      true,
    )
    // Placed by its class, not by the popover arithmetic.
    expect(el.getAttribute('style') ?? '').toBe('')
    const list = document.querySelector<HTMLElement>(
      '.nb-notification-center__list',
    )!
    expect(list.style.maxHeight).toBe('')
    w.unmount()
  })

  it('carries its own named close button, which closes it', async () => {
    stubPhone(true)
    const w = await openCenter({ closeLabel: 'Cerrar' })
    const close = document.querySelector<HTMLElement>(
      '.nb-notification-center__close',
    )!
    expect(close.tagName).toBe('BUTTON')
    expect(close.getAttribute('aria-label')).toBe('Cerrar')
    close.click()
    await nextTick()
    expect(w.emitted('update:open')?.at(-1)).toEqual([false])
    w.unmount()
  })

  it('does not close when the trigger scrolls away', async () => {
    stubPhone(true)
    const w = await openCenter()
    vi.spyOn(w.element as HTMLElement, 'getBoundingClientRect').mockReturnValue(
      {
        top: -500,
        left: 0,
        width: 32,
        height: 32,
        right: 32,
        bottom: -468,
        x: 0,
        y: -500,
        toJSON: () => ({}),
      } as DOMRect,
    )
    window.dispatchEvent(new Event('scroll'))
    await new Promise((r) => requestAnimationFrame(r))
    await nextTick()
    expect(w.emitted('update:open')?.at(-1)).toEqual([true])
    w.unmount()
  })

  it('styles the sheet only through its class', () => {
    const src = readFileSync(
      resolve(__dirname, '../src/components/NotificationCenter.vue'),
      'utf8',
    )
    const style = src.slice(src.indexOf('<style'))
    expect(style).toContain('.nb-notification-center__panel--sheet {')
    expect(style).toContain('env(safe-area-inset-top)')
    expect(style).toContain('min-block-size: 44px')
  })
})
