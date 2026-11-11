import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import NbOverflowMenu from '../src/components/OverflowMenu.vue'
import NbMenu from '../src/components/Menu.vue'
import NbMenuItem from '../src/components/MenuItem.vue'
import type { IActionGroupItem } from '../src/components/ActionGroup.d'

enableAutoUnmount(afterEach)

afterEach(() => {
  document.body.innerHTML = ''
})

const items = (): IActionGroupItem[] => [
  { id: 'rename', label: 'Rename', onSelect: vi.fn() },
  { id: 'archive', label: 'Archive', disabled: true, onSelect: vi.fn() },
  { id: 'delete', label: 'Delete', danger: true, onSelect: vi.fn() },
]

const flush = async () => {
  await nextTick()
  await nextTick()
}

function menuItems(): HTMLElement[] {
  return Array.from(document.body.querySelectorAll('[role="menuitem"]'))
}

describe('NbOverflowMenu trigger', () => {
  it('is a ghost icon-only button named from the catalogue', () => {
    const w = mount(NbOverflowMenu, { props: { items: items() } })
    const trigger = w.find('button')
    expect(trigger.classes()).toContain('nb-button--ghost')
    expect(trigger.classes()).toContain('nb-button--icon-only')
    expect(trigger.attributes('aria-label')).toBe('More actions')
    expect(trigger.attributes('aria-haspopup')).toBe('menu')
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('takes a label that names it and a size', () => {
    const w = mount(NbOverflowMenu, {
      props: { items: items(), label: 'More for invoice 2', size: 'sm' },
    })
    const trigger = w.find('button')
    expect(trigger.attributes('aria-label')).toBe('More for invoice 2')
    expect(trigger.classes()).toContain('nb-button--sm')
  })
})

describe('NbOverflowMenu menu', () => {
  it('opens on click, lists the items and selects one', async () => {
    const list = items()
    const w = mount(NbOverflowMenu, {
      props: { items: list },
      attachTo: document.body,
    })
    await w.find('button').trigger('click')
    await flush()
    expect(w.find('button').attributes('aria-expanded')).toBe('true')
    const rows = menuItems()
    expect(rows.map((r) => r.textContent?.trim())).toEqual([
      'Rename',
      'Archive',
      'Delete',
    ])
    expect(rows[1].getAttribute('aria-disabled')).toBe('true')
    rows[0].click()
    await flush()
    expect(list[0].onSelect).toHaveBeenCalledOnce()
    expect(w.emitted('select')).toEqual([['rename']])
  })

  it('does not select a disabled item', async () => {
    const list = items()
    const w = mount(NbOverflowMenu, {
      props: { items: list },
      attachTo: document.body,
    })
    await w.find('button').trigger('click')
    await flush()
    menuItems()[1].click()
    expect(list[1].onSelect).not.toHaveBeenCalled()
    expect(w.emitted('select')).toBeUndefined()
  })

  it('opens on ArrowDown and focuses the first item', async () => {
    const w = mount(NbOverflowMenu, {
      props: { items: items() },
      attachTo: document.body,
    })
    await w.find('button').trigger('keydown', { key: 'ArrowDown' })
    await flush()
    expect(menuItems()[0]).toBe(document.activeElement)
  })

  it('closes when the trigger of an open menu is pressed', async () => {
    const w = mount(NbOverflowMenu, {
      props: { items: items() },
      attachTo: document.body,
    })
    const trigger = w.find('button')
    await trigger.trigger('click')
    await flush()
    // The real sequence: mousedown (the menu sees an outside press and
    // closes), then the click, which must not open it again.
    trigger.element.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true }),
    )
    await flush()
    await trigger.trigger('click')
    await flush()
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(w.findComponent(NbMenu).props('open')).toBe(false)
  })

  it('returns focus to the trigger on Escape', async () => {
    const w = mount(NbOverflowMenu, {
      props: { items: items() },
      attachTo: document.body,
    })
    const trigger = w.find('button')
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await flush()
    const menu = document.body.querySelector('[role="menu"]') as HTMLElement
    menu.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await flush()
    expect(document.activeElement).toBe(trigger.element)
  })

  it('appends NbMenuItems from the default slot', async () => {
    const w = mount(NbOverflowMenu, {
      props: { items: items().slice(0, 1) },
      slots: { default: () => h(NbMenuItem, { label: 'Export' }) },
      attachTo: document.body,
    })
    await w.find('button').trigger('click')
    await flush()
    expect(menuItems().map((r) => r.textContent?.trim())).toEqual([
      'Rename',
      'Export',
    ])
  })

  it('sizes the rows to the trigger, up to lg', () => {
    const md = mount(NbOverflowMenu, { props: { size: 'sm' } })
    expect(md.findComponent(NbMenu).props('size')).toBe('sm')
    const xl = mount(NbOverflowMenu, { props: { size: 'xl' } })
    expect(xl.findComponent(NbMenu).props('size')).toBe('lg')
  })
})

describe('NbMenu align and flip', () => {
  function stubRect(el: HTMLElement, width: number, height: number) {
    el.getBoundingClientRect = () =>
      ({
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect
  }

  async function openAt(
    align: 'start' | 'end',
    trigger: { top: number; bottom: number; left: number; right: number },
    size = { width: 200, height: 120 },
  ) {
    const open = ref(false)
    const menu = ref<InstanceType<typeof NbMenu> | null>(null)
    const Host = defineComponent({
      setup: () => () =>
        h(NbMenu, { ref: menu, open: open.value, align }, () => [
          h(NbMenuItem, { label: 'One' }),
        ]),
    })
    const w = mount(Host, { attachTo: document.body })
    menu.value!.setPosition({ ...trigger, width: trigger.right - trigger.left })
    open.value = true
    await nextTick()
    const el = document.body.querySelector('.nb-menu') as HTMLElement
    stubRect(el, size.width, size.height)
    menu.value!.setPosition({ ...trigger, width: trigger.right - trigger.left })
    await flush()
    return { w, el }
  }

  it('lines its left edge up with the trigger by default', async () => {
    const { el } = await openAt('start', {
      top: 100,
      bottom: 132,
      left: 300,
      right: 332,
    })
    expect(el.style.left).toBe('300px')
    expect(el.style.top).toBe('132px')
  })

  it('lines its right edge up with the trigger with align="end"', async () => {
    const { el } = await openAt('end', {
      top: 100,
      bottom: 132,
      left: 300,
      right: 332,
    })
    expect(el.style.left).toBe(`${332 - 200}px`)
  })

  it('opens above the trigger when there is no room below', async () => {
    const bottom = window.innerHeight - 10
    const { el } = await openAt('start', {
      top: bottom - 32,
      bottom,
      left: 300,
      right: 332,
    })
    expect(el.style.top).toBe(`${bottom - 32 - 120}px`)
  })
})
