import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import NbMenu from '../src/components/Menu.vue'
import NbMenuItem from '../src/components/MenuItem.vue'
import NbOverflowMenu from '../src/components/OverflowMenu.vue'
import type { IActionGroupItem } from '../src/components/ActionGroup.d'

/*
 * An action that does not apply stays visible, disabled, and says why. Once
 * it folds into a menu, the row has to carry the reason itself: printed under
 * the label, wired as the row's description, and reachable by the arrow keys
 * so a keyboard or screen reader user lands on it and hears it.
 */

const mounted: VueWrapper[] = []

afterEach(async () => {
  mounted.splice(0).forEach((w) => w.unmount())
  await new Promise((resolve) => setTimeout(resolve, 20))
  document.body.innerHTML = ''
})

const focusedLabel = () =>
  document.activeElement?.querySelector('.nb-menu-item__label')?.textContent

async function press(key: string) {
  ;(document.activeElement as HTMLElement).dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true }),
  )
  await nextTick()
}

async function mountMenu(onSelect = vi.fn()) {
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
            h(NbMenuItem, { label: 'Edit' }),
            h(NbMenuItem, {
              label: 'Delete',
              disabled: true,
              disabledReason: 'Paid invoices cannot be deleted',
              onSelect,
            }),
            h(NbMenuItem, { label: 'Archive', disabled: true }),
            h(NbMenuItem, { label: 'Print' }),
          ],
        )
    },
  })
  const wrapper = mount(Host, { attachTo: document.body })
  mounted.push(wrapper)
  open.value = true
  await vi.waitFor(() => expect(focusedLabel()).toBe('Edit'))
  return { isOpen: () => open.value }
}

describe('NbMenuItem disabledReason', () => {
  it('prints the reason under the label and names it as the description', () => {
    const w = mount(NbMenuItem, {
      props: {
        label: 'Delete',
        disabled: true,
        disabledReason: 'Paid invoices cannot be deleted',
      },
    })
    const reason = w.find('.nb-menu-item__reason')
    expect(reason.text()).toBe('Paid invoices cannot be deleted')
    expect(reason.attributes('id')).toBeTruthy()
    expect(w.attributes('aria-describedby')).toBe(reason.attributes('id'))
    expect(w.attributes('aria-disabled')).toBe('true')
    expect(w.classes()).toContain('nb-menu-item--explained')
  })

  it('says nothing while the item is enabled', () => {
    const w = mount(NbMenuItem, {
      props: {
        label: 'Delete',
        disabledReason: 'Paid invoices cannot be deleted',
      },
    })
    expect(w.find('.nb-menu-item__reason').exists()).toBe(false)
    expect(w.attributes('aria-describedby')).toBeUndefined()
    expect(w.classes()).not.toContain('nb-menu-item--explained')
  })

  it('keeps an item without a reason to one line', () => {
    const w = mount(NbMenuItem, { props: { label: 'Archive', disabled: true } })
    expect(w.find('.nb-menu-item__reason').exists()).toBe(false)
    expect(w.classes()).not.toContain('nb-menu-item--explained')
  })

  it('gives each item its own description id', () => {
    const props = { label: 'Delete', disabled: true, disabledReason: 'No' }
    const w = mount(
      defineComponent({
        setup: () => () => [h(NbMenuItem, props), h(NbMenuItem, props)],
      }),
    )
    const ids = w
      .findAll('.nb-menu-item')
      .map((item) => item.attributes('aria-describedby'))
    expect(ids[0]).toBeTruthy()
    expect(ids[0]).not.toBe(ids[1])
  })
})

describe('NbMenu with a disabled item that says why', () => {
  it('stops on it with the arrow keys and still skips one without a reason', async () => {
    await mountMenu()
    await press('ArrowDown')
    expect(focusedLabel()).toBe('Delete')
    await press('ArrowDown')
    expect(focusedLabel()).toBe('Print')
    await press('ArrowUp')
    expect(focusedLabel()).toBe('Delete')
  })

  it('is reached by Home, End and typeahead too', async () => {
    await mountMenu()
    await press('d')
    expect(focusedLabel()).toBe('Delete')
    // Archive has no reason, so "a" finds nothing and focus stays.
    await press('a')
    expect(focusedLabel()).toBe('Delete')
  })

  it('cannot be chosen with Enter, Space or a click, and the menu stays open', async () => {
    const onSelect = vi.fn()
    const menu = await mountMenu(onSelect)
    await press('ArrowDown')
    const item = document.activeElement as HTMLElement
    await press('Enter')
    await press(' ')
    item.click()
    await nextTick()
    expect(onSelect).not.toHaveBeenCalled()
    expect(menu.isOpen()).toBe(true)
  })
})

describe('NbOverflowMenu carries the reason', () => {
  const items = (): IActionGroupItem[] => [
    { id: 'edit', label: 'Edit', onSelect: vi.fn() },
    {
      id: 'delete',
      label: 'Delete',
      disabled: true,
      disabledReason: 'Paid invoices cannot be deleted',
      onSelect: vi.fn(),
    },
    {
      id: 'send',
      label: 'Send',
      loading: true,
      disabledReason: 'Left over from an earlier state',
    },
  ]

  it('prints the reason of a disabled action and not of a busy one', async () => {
    const list = items()
    const w = mount(NbOverflowMenu, {
      props: { items: list },
      attachTo: document.body,
    })
    mounted.push(w)
    await w.find('button').trigger('click')
    await nextTick()
    await nextTick()
    const rows = Array.from(
      document.body.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    )
    const reason = rows[1].querySelector('.nb-menu-item__reason')
    expect(reason?.textContent).toBe('Paid invoices cannot be deleted')
    expect(rows[1].getAttribute('aria-describedby')).toBe(reason?.id)
    expect(rows[2].querySelector('.nb-menu-item__reason')).toBeNull()
    rows[1].click()
    expect(list[1].onSelect).not.toHaveBeenCalled()
    expect(w.emitted('select')).toBeUndefined()
  })
})
