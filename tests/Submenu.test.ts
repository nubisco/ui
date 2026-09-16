import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import NbMenu from '../src/components/Menu.vue'
import NbMenuItem from '../src/components/MenuItem.vue'
import NbSubmenu from '../src/components/Submenu.vue'

const mounted: VueWrapper[] = []

afterEach(async () => {
  vi.useRealTimers()
  mounted.splice(0).forEach((w) => w.unmount())
  // Leave transitions finish on a later frame. Let them, so a list from one
  // test is not still being removed while the next test runs.
  await new Promise((resolve) => setTimeout(resolve, 50))
  document.body.innerHTML = ''
})

/**
 * A menu with one submenu between two plain items, the shape of Acta's import
 * and export menu. Real teleports: the submenu's list lands in <body>, outside
 * the menu, which is the whole problem being tested.
 */
async function mountMenu(onSelect = vi.fn()) {
  const open = ref(true)
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          NbMenu,
          {
            open: open.value,
            'onUpdate:open': (value: boolean) => (open.value = value),
          },
          () => [
            h(NbMenuItem, { label: 'New file' }),
            h(NbSubmenu, { label: 'Export' }, () => [
              h(NbMenuItem, { label: 'Draft', disabled: true }),
              h(NbMenuItem, {
                label: 'Markdown',
                onSelect: () => onSelect('markdown'),
              }),
              h(NbMenuItem, {
                label: 'HTML',
                onSelect: () => onSelect('html'),
              }),
            ]),
            h(NbMenuItem, { label: 'Save' }),
          ],
        )
    },
  })
  // Mounted closed, then opened, the way a host opens a menu.
  open.value = false
  const wrapper = mount(Host, { attachTo: document.body })
  mounted.push(wrapper)
  open.value = true
  // Opening focuses the first item after a tick. Wait for it, so that step
  // cannot land after a test has already moved focus somewhere else.
  await vi.waitFor(() => {
    if (focusedLabel() !== 'New file') throw new Error('menu not open yet')
  })
  return { wrapper, open, onSelect }
}

/**
 * Lets renders flush, then a few real milliseconds pass. Vue ignores an event
 * stamped in the same millisecond its listener was attached, so a key pressed
 * straight after a submenu mounts is dropped. No person presses a key that
 * fast, but a loaded test run did, and the suite flaked on it.
 */
async function settle({ realTime = true } = {}) {
  await nextTick()
  await nextTick()
  await nextTick()
  if (realTime) await new Promise((resolve) => setTimeout(resolve, 5))
}

const trigger = () =>
  document.querySelector<HTMLElement>('.nb-submenu-trigger')!
const submenu = () => document.querySelector<HTMLElement>('.nb-submenu')
const focusedLabel = () =>
  (document.activeElement as HTMLElement | null)
    ?.querySelector('.nb-menu-item__label')
    ?.textContent?.trim()

function press(el: Element, key: string) {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  )
}

describe('NbSubmenu keyboard', () => {
  it.each(['ArrowRight', 'Enter', ' '])(
    '%s on the trigger opens the submenu and focuses its first enabled item',
    async (key) => {
      await mountMenu()
      await settle()
      trigger().focus()
      press(trigger(), key)
      await settle()

      expect(submenu()).not.toBeNull()
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      // "Draft" is disabled, so focus skips it.
      expect(focusedLabel()).toBe('Markdown')
    },
  )

  it('moves between items with the arrow keys and activates with Enter', async () => {
    const { onSelect, open } = await mountMenu()
    await settle()
    trigger().focus()
    press(trigger(), 'ArrowRight')
    await settle()

    press(document.activeElement!, 'ArrowDown')
    expect(focusedLabel()).toBe('HTML')
    // The last item stays put, as it does at the top level.
    press(document.activeElement!, 'ArrowDown')
    expect(focusedLabel()).toBe('HTML')
    press(document.activeElement!, 'ArrowUp')
    expect(focusedLabel()).toBe('Markdown')
    // Up from the first enabled item does not land on the disabled one.
    press(document.activeElement!, 'ArrowUp')
    expect(focusedLabel()).toBe('Markdown')

    press(document.activeElement!, 'Enter')
    await settle()
    expect(onSelect).toHaveBeenCalledWith('markdown')
    expect(open.value).toBe(false)
  })

  it.each(['ArrowLeft', 'Escape'])(
    '%s closes only the submenu and returns focus to its trigger',
    async (key) => {
      const { open } = await mountMenu()
      await settle()
      trigger().focus()
      press(trigger(), 'ArrowRight')
      await settle()

      press(document.activeElement!, key)
      await settle()
      // The list may still be in its leave transition, so the state is read
      // from the trigger rather than from the list's presence.
      expect(document.activeElement).toBe(trigger())
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(open.value).toBe(true)
    },
  )

  it('carries on through the parent menu once focus is back on the trigger', async () => {
    await mountMenu()
    await settle()
    trigger().focus()
    press(trigger(), 'ArrowRight')
    await settle()
    press(document.activeElement!, 'Escape')
    await settle()

    press(document.activeElement!, 'ArrowDown')
    expect(focusedLabel()).toBe('Save')
  })

  it('Tab from inside the submenu closes the whole menu', async () => {
    const { open } = await mountMenu()
    await settle()
    trigger().focus()
    press(trigger(), 'ArrowRight')
    await settle()

    press(document.activeElement!, 'Tab')
    await settle()
    expect(open.value).toBe(false)
  })

  it('opening on hover leaves focus where it was', async () => {
    await mountMenu()
    await settle()
    // Only the hover delay is faked, once the menu is open.
    vi.useFakeTimers()
    const first = document.querySelector<HTMLElement>('.nb-menu-item')!
    first.focus()
    trigger().dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(200)
    await settle({ realTime: false })

    expect(submenu()).not.toBeNull()
    expect(document.activeElement).toBe(first)
  })
})

describe('NbSubmenu pointer', () => {
  it('pressing a submenu item does not close the menu before the click lands', async () => {
    const { onSelect, open } = await mountMenu()
    await settle()
    trigger().click()
    await settle()

    const html = Array.from(
      submenu()!.querySelectorAll<HTMLElement>('.nb-menu-item'),
    ).find((el) => el.textContent?.includes('HTML'))!
    html.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await settle()
    expect(open.value).toBe(true)
    expect(submenu()).not.toBeNull()

    html.click()
    await settle()
    expect(onSelect).toHaveBeenCalledWith('html')
    expect(open.value).toBe(false)
  })

  it('a press outside both lists still closes the menu', async () => {
    const { open } = await mountMenu()
    await settle()
    trigger().click()
    await settle()

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await settle()
    expect(open.value).toBe(false)
  })
})
