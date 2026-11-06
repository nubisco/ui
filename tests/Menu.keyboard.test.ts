import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import NbMenu from '../src/components/Menu.vue'
import NbMenuItem from '../src/components/MenuItem.vue'
import NbSubmenu from '../src/components/Submenu.vue'

/*
 * The WAI-ARIA menu keys NbMenu was missing (Home, End, wrapping, first-letter
 * typeahead) and focus going back to the opener when it closes.
 */

const mounted: VueWrapper[] = []
const extras: HTMLElement[] = []

afterEach(async () => {
  mounted.splice(0).forEach((w) => w.unmount())
  extras.splice(0).forEach((e) => e.remove())
  await new Promise((resolve) => setTimeout(resolve, 50))
  document.body.innerHTML = ''
})

function button(label: string, parent: HTMLElement = document.body) {
  const b = document.createElement('button')
  b.textContent = label
  parent.appendChild(b)
  extras.push(b)
  return b
}

async function mountMenu(withSubmenu = false) {
  const open = ref(false)
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
            h(NbMenuItem, { label: 'Copy' }),
            h(NbMenuItem, { label: 'Cut', disabled: true }),
            ...(withSubmenu
              ? [
                  h(NbSubmenu, { label: 'Export' }, () => [
                    h(NbMenuItem, { label: 'Markdown' }),
                  ]),
                ]
              : []),
            h(NbMenuItem, { label: 'Paste' }),
            h(NbMenuItem, { label: 'Print' }),
          ],
        )
    },
  })
  const wrapper = mount(Host, { attachTo: document.body })
  mounted.push(wrapper)
  return {
    open: async () => {
      open.value = true
      await vi.waitFor(() =>
        expect(document.activeElement?.textContent).toContain('Copy'),
      )
    },
    close: async () => {
      open.value = false
      await nextTick()
      await nextTick()
    },
    isOpen: () => open.value,
  }
}

const focused = () => (document.activeElement?.textContent ?? '').trim()

async function press(key: string, opts: KeyboardEventInit = {}) {
  ;(document.activeElement as HTMLElement).dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, ...opts }),
  )
  await nextTick()
}

describe('NbMenu keys', () => {
  it('goes to the last and first enabled items with End and Home', async () => {
    const menu = await mountMenu()
    await menu.open()
    await press('End')
    expect(focused()).toBe('Print')
    await press('Home')
    expect(focused()).toBe('Copy')
  })

  it('wraps at both ends and skips disabled items', async () => {
    const menu = await mountMenu()
    await menu.open()
    await press('ArrowUp')
    expect(focused()).toBe('Print')
    await press('ArrowDown')
    expect(focused()).toBe('Copy')
    await press('ArrowDown')
    expect(focused()).toBe('Paste')
  })

  it('jumps by first letter and walks the matches', async () => {
    const menu = await mountMenu()
    await menu.open()
    await press('p')
    expect(focused()).toBe('Paste')
    await press('p')
    expect(focused()).toBe('Print')
    await press('p')
    expect(focused()).toBe('Paste')
    // Cut is disabled, so c stays on Copy's side of the list.
    await press('c')
    expect(focused()).toBe('Copy')
  })
})

describe('NbMenu focus restore', () => {
  it('returns focus to the opener when it closes', async () => {
    const opener = button('Actions')
    opener.focus()
    const menu = await mountMenu()
    await menu.open()
    await press('Escape')
    await nextTick()
    expect(menu.isOpen()).toBe(false)
    expect(document.activeElement).toBe(opener)
  })

  it('leaves focus where a press outside put it', async () => {
    const opener = button('Actions')
    const other = button('Elsewhere')
    opener.focus()
    const menu = await mountMenu()
    await menu.open()
    other.focus()
    await menu.close()
    expect(document.activeElement).toBe(other)
  })

  it('does not pull focus out of a modal the opener is not in', async () => {
    const opener = button('Actions')
    opener.focus()
    const menu = await mountMenu()
    await menu.open()
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    document.body.appendChild(dialog)
    extras.push(dialog)
    await menu.close()
    expect(document.activeElement).not.toBe(opener)
  })

  it('restores once when an item in a submenu closes the menu', async () => {
    const opener = button('Actions')
    opener.focus()
    const focusSpy = vi.spyOn(opener, 'focus')
    const menu = await mountMenu(true)
    await menu.open()
    const trigger = [...document.querySelectorAll('[role="menuitem"]')].find(
      (e) => e.textContent?.includes('Export'),
    ) as HTMLElement
    trigger.focus()
    await press('ArrowRight')
    await vi.waitFor(() => expect(focused()).toBe('Markdown'))
    await press('Enter')
    await vi.waitFor(() => expect(menu.isOpen()).toBe(false))
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(opener)
    expect(focusSpy).toHaveBeenCalledTimes(1)
  })
})
