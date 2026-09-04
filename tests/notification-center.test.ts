import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import NotificationCenter, {
  placeNotificationPanel,
  isAnchorInViewport,
} from '../src/components/NotificationCenter.vue'
import NotificationCenterItem from '../src/components/NotificationCenterItem.vue'

const ITEMS = [
  { id: 'a', title: 'Build failed', body: 'main is red', read: false },
  { id: 'b', title: 'Comment on Draft', read: false },
  { id: 'c', title: 'Invite accepted', read: true },
]

// The panel is teleported to <body>, so nothing about it is reachable through
// the wrapper. Every assertion below goes through the document, which is also
// what a real consumer's end-to-end test has to do.
function panel(): HTMLElement | null {
  return document.querySelector('.nb-notification-center__panel')
}

function rows(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-nb-notification-item]'),
  )
}

function mountCenter(props: Record<string, unknown> = {}, options = {}) {
  return mount(NotificationCenter, {
    props: { items: ITEMS, ...props },
    attachTo: document.body,
    ...options,
  })
}

// Vue removes a <Transition> child a tick after the leave hook, and the panel
// is teleported on top of that, so settling takes more than one flush.
async function settle() {
  await nextTick()
  await nextTick()
  // Long enough for the two animation frames Vue waits on before it removes a
  // leaving element.
  await new Promise((resolve) => setTimeout(resolve, 60))
  await nextTick()
}

async function openPanel(w: ReturnType<typeof mountCenter>) {
  await w.find('.nb-notification-center__trigger').trigger('click')
  await settle()
  return w
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('NbNotificationCenter trigger', () => {
  it('announces the unread count in the accessible name', () => {
    const w = mountCenter()
    expect(
      w.find('.nb-notification-center__trigger').attributes('aria-label'),
    ).toBe('Notifications, 2 unread')
    w.unmount()
  })

  it('drops the count from the name and hides the badge at zero', () => {
    const w = mountCenter({ items: [{ id: 'a', title: 'x', read: true }] })
    const trigger = w.find('.nb-notification-center__trigger')
    expect(trigger.attributes('aria-label')).toBe('Notifications')
    expect(w.find('.nb-notification-center__badge').exists()).toBe(false)
    w.unmount()
  })

  // The cap is a layout constraint on a 15px circle, not a fact about the
  // data, so it must never reach the accessible name.
  it('caps the badge at 99+ while the name keeps the real total', () => {
    const w = mountCenter({ items: [], unreadCount: 142 })
    expect(w.find('.nb-notification-center__badge').text()).toBe('99+')
    expect(
      w.find('.nb-notification-center__trigger').attributes('aria-label'),
    ).toBe('Notifications, 142 unread')
    w.unmount()
  })

  it('honours a custom cap and a custom unread phrase', () => {
    const w = mountCenter({
      items: [],
      unreadCount: 3,
      maxCount: 2,
      formatUnread: (n: number) => `${n} por ler`,
    })
    expect(w.find('.nb-notification-center__badge').text()).toBe('2+')
    expect(
      w.find('.nb-notification-center__trigger').attributes('aria-label'),
    ).toBe('Notifications, 3 por ler')
    w.unmount()
  })

  it('counts unread from the items when no total is given', () => {
    const w = mountCenter()
    expect(w.find('.nb-notification-center__badge').text()).toBe('2')
    w.unmount()
  })

  it('marks the trigger as a dialog owner and reflects expansion', async () => {
    const w = mountCenter()
    const trigger = w.find('.nb-notification-center__trigger')
    expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(trigger.attributes('aria-controls')).toBeUndefined()

    await openPanel(w)
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(trigger.attributes('aria-controls')).toBe(panel()?.id)
    w.unmount()
  })
})

describe('NbNotificationCenter panel', () => {
  it('opens a labelled dialog and closes again on a second click', async () => {
    const w = mountCenter()
    await openPanel(w)

    expect(
      document.querySelectorAll('.nb-notification-center__panel').length,
    ).toBe(1)
    const el = panel()
    expect(el).not.toBeNull()
    expect(el?.getAttribute('role')).toBe('dialog')
    const labelledBy = el?.getAttribute('aria-labelledby') as string
    expect(document.getElementById(labelledBy)?.textContent?.trim()).toBe(
      'Notifications',
    )

    await w.find('.nb-notification-center__trigger').trigger('click')
    await settle()
    expect(panel()).toBeNull()
    expect(w.emitted('close')).toHaveLength(1)
    w.unmount()
  })

  it('moves focus into the list and returns it to the trigger on Escape', async () => {
    const w = mountCenter()
    await openPanel(w)
    expect(document.activeElement).toBe(rows()[0])

    panel()?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(
      w.find('.nb-notification-center__trigger').element,
    )
    w.unmount()
  })

  // Closing by clicking elsewhere means the user has already said where they
  // want to be. Pulling focus back to the bell would undo that.
  it('closes on an outside pointer press without stealing focus', async () => {
    const w = mountCenter()
    await openPanel(w)

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).not.toBe(
      w.find('.nb-notification-center__trigger').element,
    )
    w.unmount()
  })

  it('ignores a pointer press inside the panel', async () => {
    const w = mountCenter()
    await openPanel(w)
    rows()[1].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()
    expect(panel()).not.toBeNull()
    w.unmount()
  })

  it('supports v-model:open, and leaves state to the host when controlled', async () => {
    const w = mountCenter({ open: false })
    await w.find('.nb-notification-center__trigger').trigger('click')
    await nextTick()
    // The host ignored update:open, so the panel stayed shut. That is the
    // contract of a controlled component, and the event still fired.
    expect(panel()).toBeNull()
    expect(w.emitted('update:open')?.[0]).toEqual([true])

    await w.setProps({ open: true })
    await settle()
    expect(panel()).not.toBeNull()
    w.unmount()
  })

  it('keeps the scrolling list under the configured height', async () => {
    const w = mountCenter({ maxHeight: 240 })
    await openPanel(w)
    const list = document.querySelector<HTMLElement>(
      '.nb-notification-center__list',
    )
    expect(list?.style.maxHeight).toBeTruthy()
    expect(parseInt(list!.style.maxHeight, 10)).toBeLessThanOrEqual(240)
    w.unmount()
  })

  it('does not open when disabled', async () => {
    const w = mountCenter({ disabled: true })
    await w.find('.nb-notification-center__trigger').trigger('click')
    await nextTick()
    expect(panel()).toBeNull()
    w.unmount()
  })
})

describe('NbNotificationCenter keyboard navigation', () => {
  function press(key: string, shiftKey = false) {
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }),
    )
  }

  it('walks the rows with the arrow keys and Home/End', async () => {
    const w = mountCenter()
    await openPanel(w)
    const all = rows()

    press('ArrowDown')
    expect(document.activeElement).toBe(all[1])
    press('ArrowDown')
    expect(document.activeElement).toBe(all[2])
    // The list does not wrap: the last row is the end of the list, and
    // wrapping to the top would hide that from a screen reader user.
    press('ArrowDown')
    expect(document.activeElement).toBe(all[2])

    press('Home')
    expect(document.activeElement).toBe(all[0])
    press('End')
    expect(document.activeElement).toBe(all[2])
    press('ArrowUp')
    expect(document.activeElement).toBe(all[1])
    w.unmount()
  })

  // One tab stop for the list, not one per notification.
  it('rovers the tabindex so the list is a single tab stop', async () => {
    const w = mountCenter()
    await openPanel(w)
    expect(rows().map((el) => el.getAttribute('tabindex'))).toEqual([
      '0',
      '-1',
      '-1',
    ])

    press('ArrowDown')
    await nextTick()
    expect(rows().map((el) => el.getAttribute('tabindex'))).toEqual([
      '-1',
      '0',
      '-1',
    ])
    w.unmount()
  })

  // The panel is a NON-modal dialog: no scrim, nothing behind it inert, a
  // screen reader's virtual cursor free to read the page underneath. A dialog
  // like that must not hold Tab, or a keyboard user reaches the bell and can
  // then leave only by Escape. Tab moves through it and then out of it, and
  // leaving dismisses it.
  it('lets Tab move between the panel controls without interference', async () => {
    const w = mountCenter(
      {},
      { slots: { footer: '<a href="#all">See all</a>' } },
    )
    await openPanel(w)

    const markAll = document.querySelector<HTMLElement>(
      '.nb-notification-center__mark-all',
    )!
    markAll.focus()
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    markAll.dispatchEvent(event)
    // Not an edge, so the browser's own Tab is left to do its job.
    expect(event.defaultPrevented).toBe(false)
    expect(panel()).not.toBeNull()
    w.unmount()
  })

  it('closes and moves on when Tab leaves the last control', async () => {
    const w = mountCenter(
      {},
      { slots: { footer: '<a href="#all">See all</a>' } },
    )
    // After the trigger in the document, which is where the browser would
    // have gone if the panel were not teleported to the end of <body>.
    const after = document.createElement('button')
    after.id = 'after'
    w.element.after(after)
    await openPanel(w)

    const footerLink = document.querySelector<HTMLElement>(
      '.nb-notification-center__footer a',
    )!
    footerLink.focus()
    press('Tab')
    await settle()

    expect(panel()).toBeNull()
    // The panel is teleported to the end of <body>, so "the next thing" has
    // to be computed from the trigger rather than left to the browser.
    expect(document.activeElement).toBe(after)
    w.unmount()
    after.remove()
  })

  it('closes back onto the trigger when Shift+Tab leaves the first control', async () => {
    const w = mountCenter()
    await openPanel(w)

    const markAll = document.querySelector<HTMLElement>(
      '.nb-notification-center__mark-all',
    )!
    markAll.focus()
    press('Tab', true)
    await settle()

    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(
      w.find('.nb-notification-center__trigger').element,
    )
    w.unmount()
  })

  // A row action or a #footer link can open something that is itself
  // dismissible. That surface owns the keystroke; the centre must not go with
  // it, or one Escape costs the user two dialogs.
  it('leaves Escape alone when a modal surface above it answered first', async () => {
    const w = mountCenter()
    await openPanel(w)

    const nested = document.createElement('div')
    nested.setAttribute('role', 'dialog')
    nested.setAttribute('aria-modal', 'true')
    const inner = document.createElement('button')
    nested.append(inner)
    document.body.append(nested)
    inner.focus()

    inner.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    )
    await settle()
    expect(panel()).not.toBeNull()

    // And the same keystroke from the page at large still dismisses it.
    document.body.focus()
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await settle()
    expect(panel()).toBeNull()

    nested.remove()
    w.unmount()
  })

  it('leaves Escape alone when something already consumed the key', async () => {
    const w = mountCenter()
    await openPanel(w)

    const markAll = document.querySelector<HTMLElement>(
      '.nb-notification-center__mark-all',
    )!
    markAll.focus()
    const consumed = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    consumed.preventDefault()
    markAll.dispatchEvent(consumed)
    await settle()
    expect(panel()).not.toBeNull()
    w.unmount()
  })
})

describe('NbNotificationCenter content states', () => {
  it('shows an empty state when there is nothing to read', async () => {
    const w = mountCenter({ items: [] })
    await openPanel(w)
    expect(document.querySelector('.nb-empty-state__title')?.textContent).toBe(
      'No notifications',
    )
    expect(document.querySelector('.nb-notification-center__list')).toBeNull()
    w.unmount()
  })

  // The audit found an app whose single empty line rendered for both states,
  // so a failed fetch read as "you have nothing".
  it('never shows the empty state while loading', async () => {
    const w = mountCenter({ items: [], loading: true })
    await openPanel(w)
    expect(document.querySelector('.nb-empty-state')).toBeNull()
    const busy = document.querySelector('.nb-notification-center__loading')
    expect(busy?.getAttribute('role')).toBe('status')
    expect(busy?.textContent).toContain('Loading notifications')
    expect(panel()?.getAttribute('aria-busy')).toBe('true')
    // The placeholders are the library's skeleton, and they are silent: the
    // region announces itself once, not once per placeholder row.
    const placeholders = busy!.querySelectorAll('.nb-skeleton')
    expect(placeholders).toHaveLength(3)
    placeholders.forEach((el) =>
      expect(el.getAttribute('aria-hidden')).toBe('true'),
    )
    w.unmount()
  })

  it('takes an empty-state override', async () => {
    const w = mountCenter(
      { items: [] },
      { slots: { empty: '<p class="mine">Nothing yet</p>' } },
    )
    await openPanel(w)
    expect(document.querySelector('.mine')?.textContent).toBe('Nothing yet')
    w.unmount()
  })

  it('renders host-owned rows from the default slot', async () => {
    const w = mountCenter(
      { items: [], itemCount: 1 },
      {
        slots: {
          default: `<li class="host-row"><button data-nb-notification-item>Deploy done</button></li>`,
        },
      },
    )
    await openPanel(w)
    expect(document.querySelector('.host-row')).not.toBeNull()
    expect(document.querySelector('.nb-notification-center__empty')).toBeNull()
    // And the roving focus still picks the host's rows up.
    expect(document.activeElement).toBe(rows()[0])
    w.unmount()
  })

  // The four states have to survive the slot, because the slot is the
  // documented path for any product whose notifications are more than a
  // title and a body. An earlier version keyed "has content" off the slot
  // EXISTING, which made the next three assertions impossible.
  it('renders #empty when the slot supplied no rows', async () => {
    const w = mountCenter(
      { items: [], itemCount: 0 },
      { slots: { default: '', empty: '<p class="mine">All caught up</p>' } },
    )
    await openPanel(w)
    expect(document.querySelector('.mine')?.textContent).toBe('All caught up')
    expect(document.querySelector('.nb-notification-center__list')).toBeNull()
    w.unmount()
  })

  it('renders the error region, not the stale strip, for a slot with no rows', async () => {
    const w = mountCenter(
      { items: [], itemCount: 0, error: true },
      { slots: { default: '' } },
    )
    await openPanel(w)
    const region = document.querySelector('.nb-notification-center__error')
    expect(region).not.toBeNull()
    expect(region?.getAttribute('role')).toBe('alert')
    // The strip is for a refresh that failed OVER rows. There are none.
    expect(document.querySelector('.nb-notification-center__stale')).toBeNull()
    // And the dialog points at whichever of the two exists.
    expect(panel()?.getAttribute('aria-describedby')).toBe(
      region?.getAttribute('id'),
    )
    w.unmount()
  })

  it('keeps slotted rows and shows the stale strip when the refresh failed over them', async () => {
    const w = mountCenter(
      { items: [], itemCount: 2, error: true },
      {
        slots: {
          default: `<li><button data-nb-notification-item>Deploy done</button></li>`,
        },
      },
    )
    await openPanel(w)
    expect(
      document.querySelector('.nb-notification-center__stale'),
    ).not.toBeNull()
    expect(document.querySelector('.nb-notification-center__error')).toBeNull()
    expect(rows()).toHaveLength(1)
    w.unmount()
  })

  // Unknown is not zero and it is not "some". Whichever way it is resolved,
  // a failure must not end up looking like content, so it resolves to the
  // failure and says so.
  it('resolves an unknown slot count in favour of the failure, and warns once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mountCenter(
      { items: [], error: true },
      {
        slots: {
          default: `<li><button data-nb-notification-item>Deploy done</button></li>`,
        },
      },
    )
    await openPanel(w)
    expect(
      document.querySelector('.nb-notification-center__error'),
    ).not.toBeNull()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('itemCount')
    w.unmount()
    warn.mockRestore()
  })

  it('leaves a healthy slot alone when no count was given', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mountCenter(
      { items: [] },
      {
        slots: {
          default: `<li class="host-row"><button data-nb-notification-item>Deploy done</button></li>`,
        },
      },
    )
    await openPanel(w)
    expect(document.querySelector('.host-row')).not.toBeNull()
    expect(document.querySelector('.nb-notification-center__error')).toBeNull()
    w.unmount()
    warn.mockRestore()
  })
})

describe('NbNotificationCenter actions', () => {
  it('emits mark-all-read and disables the control at zero unread', async () => {
    const w = mountCenter()
    await openPanel(w)
    const button = document.querySelector<HTMLButtonElement>(
      '.nb-notification-center__mark-all',
    )!
    expect(button.disabled).toBe(false)
    button.click()
    expect(w.emitted('mark-all-read')).toHaveLength(1)
    // The centre owns no data: the list is unchanged until the host says so.
    expect(rows()).toHaveLength(3)

    await w.setProps({ items: ITEMS.map((i) => ({ ...i, read: true })) })
    await nextTick()
    expect(
      document.querySelector<HTMLButtonElement>(
        '.nb-notification-center__mark-all',
      )!.disabled,
    ).toBe(true)
    w.unmount()
  })

  it('hides mark-all when the host does not support it', async () => {
    const w = mountCenter({ showMarkAll: false })
    await openPanel(w)
    expect(
      document.querySelector('.nb-notification-center__mark-all'),
    ).toBeNull()
    w.unmount()
  })

  it('emits select with the item and closes by default', async () => {
    const w = mountCenter()
    await openPanel(w)
    rows()[1].click()
    await settle()
    expect(w.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'b' })
    expect(panel()).toBeNull()
    w.unmount()
  })

  it('stays open when closeOnSelect is off', async () => {
    const w = mountCenter({ closeOnSelect: false })
    await openPanel(w)
    rows()[0].click()
    await settle()
    expect(panel()).not.toBeNull()
    w.unmount()
  })

  it('exposes show, close and toggle to the host', async () => {
    const w = mountCenter()
    ;(w.vm as unknown as { show: () => void }).show()
    await settle()
    expect(panel()).not.toBeNull()
    ;(w.vm as unknown as { close: () => void }).close()
    await settle()
    expect(panel()).toBeNull()
    w.unmount()
  })
})

describe('NbNotificationCenterItem', () => {
  it('distinguishes read from unread in more than colour', () => {
    const unread = mount(NotificationCenterItem, {
      props: { title: 'Build failed' },
    })
    expect(unread.classes()).toContain('nb-notification-item--unread')
    expect(unread.find('.nb-notification-item__sr').text()).toBe('Unread')

    const read = mount(NotificationCenterItem, {
      props: { title: 'Build failed', read: true },
    })
    expect(read.classes()).not.toContain('nb-notification-item--unread')
    expect(read.find('.nb-notification-item__sr').text()).toBe('Read')
  })

  it('renders a link, a button or an inert row', () => {
    const link = mount(NotificationCenterItem, {
      props: { title: 'x', href: '/builds/1' },
    })
    expect(link.find('a.nb-notification-item__row').attributes('href')).toBe(
      '/builds/1',
    )

    const button = mount(NotificationCenterItem, { props: { title: 'x' } })
    expect(button.find('button.nb-notification-item__row').exists()).toBe(true)

    const inert = mount(NotificationCenterItem, {
      props: { title: 'x', interactive: false },
    })
    const row = inert.find('.nb-notification-item__row')
    expect(row.element.tagName).toBe('DIV')
    expect(row.attributes('tabindex')).toBeUndefined()
    expect(row.attributes('role')).toBeUndefined()
  })

  // This is the whole of what `interactive: false` promises. An earlier
  // version gave the inert row tabindex="-1" and emitted `select` on click,
  // Enter and Space, which is a focusable, activatable control with no name,
  // role or value: WCAG 4.1.2, and the opposite of what the prop says. The
  // row is either a control or it is text, and this test is the line between
  // them.
  it('makes an inert row genuinely inert, not a nameless button', async () => {
    const w = mount(NotificationCenterItem, {
      props: { title: 'x', interactive: false },
    })
    const row = w.find('.nb-notification-item__row')

    // Not in the accessibility tree as a control.
    expect(row.element.tagName).toBe('DIV')
    expect(row.attributes('role')).toBeUndefined()
    // Not reachable: no tabindex of its own, and no attribute for the panel's
    // roving index to hand it one through.
    expect(row.attributes('tabindex')).toBeUndefined()
    expect(row.attributes('data-nb-notification-item')).toBeUndefined()
    // Not activatable, by any of the three routes that used to work.
    await row.trigger('click')
    await row.trigger('keydown', { key: 'Enter' })
    await row.trigger('keydown', { key: ' ' })
    expect(w.emitted('select')).toBeUndefined()
  })

  it('keeps href interactive even when interactive is false', async () => {
    const w = mount(NotificationCenterItem, {
      props: { title: 'x', href: '/builds/1', interactive: false },
    })
    const row = w.find('.nb-notification-item__row')
    expect(row.element.tagName).toBe('A')
    expect(row.attributes('data-nb-notification-item')).toBeDefined()
    await row.trigger('click')
    expect(w.emitted('select')).toHaveLength(1)
  })

  it('writes a machine-readable datetime beside the human one', async () => {
    const when = new Date('2026-09-03T10:00:00.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-03T12:00:00.000Z'))
    const w = mount(NotificationCenterItem, {
      props: { title: 'x', time: when.toISOString(), locale: 'en' },
    })
    const time = w.find('time')
    expect(time.attributes('datetime')).toBe('2026-09-03T10:00:00.000Z')
    // Relative to the clock, which is why it waits for the client: see the
    // hydration test at the bottom of this file.
    await nextTick()
    expect(time.text()).toBe('2 hours ago')
    vi.useRealTimers()
  })

  it('prefers a host-formatted label over the relative time', () => {
    const w = mount(NotificationCenterItem, {
      props: {
        title: 'x',
        time: '2026-09-03T10:00:00.000Z',
        timeLabel: '10:00',
      },
    })
    expect(w.find('time').text()).toBe('10:00')
    expect(w.find('time').attributes('datetime')).toBe(
      '2026-09-03T10:00:00.000Z',
    )
  })

  it('renders no time element at all without a time', () => {
    const w = mount(NotificationCenterItem, { props: { title: 'x' } })
    expect(w.find('time').exists()).toBe(false)
  })

  it('ignores an unparseable time instead of printing Invalid Date', () => {
    const w = mount(NotificationCenterItem, {
      props: { title: 'x', time: 'not a date' },
    })
    expect(w.find('time').exists()).toBe(false)
  })

  it('picks an icon per variant and drops the gutter for null', () => {
    const warning = mount(NotificationCenterItem, {
      props: { title: 'x', variant: 'warning' },
    })
    expect(warning.find('.nb-notification-item__media').exists()).toBe(true)
    expect(warning.classes()).toContain('nb-notification-item--warning')

    const neutral = mount(NotificationCenterItem, { props: { title: 'x' } })
    expect(neutral.find('.nb-notification-item__media').exists()).toBe(false)

    const off = mount(NotificationCenterItem, {
      props: { title: 'x', variant: 'error', icon: null },
    })
    expect(off.find('.nb-notification-item__media').exists()).toBe(false)
  })

  // A per-row control nested inside the row's own button is invalid markup.
  it('keeps row actions outside the activatable row', () => {
    const w = mount(NotificationCenterItem, {
      props: { title: 'x' },
      slots: { actions: '<button class="dismiss">Dismiss</button>' },
    })
    expect(w.find('.nb-notification-item__row .dismiss').exists()).toBe(false)
    expect(w.find('.nb-notification-item__actions .dismiss').exists()).toBe(
      true,
    )
  })
})

describe('NbNotificationCenter cleanup', () => {
  let added: string[] = []
  let removed: string[] = []

  beforeEach(() => {
    added = []
    removed = []
    vi.spyOn(document, 'addEventListener').mockImplementation(((
      type: string,
      ...rest: unknown[]
    ) => {
      added.push(type)
      return (
        Document.prototype.addEventListener as unknown as (
          ...args: unknown[]
        ) => void
      ).call(document, type, ...rest)
    }) as typeof document.addEventListener)
    vi.spyOn(document, 'removeEventListener').mockImplementation(((
      type: string,
      ...rest: unknown[]
    ) => {
      removed.push(type)
      return (
        Document.prototype.removeEventListener as unknown as (
          ...args: unknown[]
        ) => void
      ).call(document, type, ...rest)
    }) as typeof document.removeEventListener)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('unbinds its document listeners when it goes away while open', async () => {
    const w = mountCenter()
    await openPanel(w)
    expect(added).toContain('mousedown')
    w.unmount()
    expect(removed).toContain('mousedown')
    expect(removed).toContain('keydown')
  })
})

/**
 * Placement is the part of a floating surface that is easy to get subtly
 * wrong and impossible to eyeball in jsdom, where every rect is zero. The
 * component keeps the arithmetic in an exported pure function for exactly
 * that reason, and this is the test that argument was making.
 */
describe('NbNotificationCenter placement arithmetic', () => {
  const viewport = { width: 1280, height: 900 }
  const bell = { top: 12, left: 1200, width: 32, height: 32 }

  it('hangs the panel off the trigger edge, not its centre', () => {
    const end = placeNotificationPanel(bell, {
      align: 'end',
      width: 360,
      maxHeight: 384,
      viewport,
    })
    // Right edges line up: 1200 + 32 - 360.
    expect(end.left).toBe(872)
    expect(end.side).toBe('bottom')
    expect(end.top).toBe(52)

    const start = placeNotificationPanel(
      { ...bell, left: 40 },
      { align: 'start', width: 360, maxHeight: 384, viewport },
    )
    expect(start.left).toBe(40)
  })

  it('clamps to the viewport rather than hanging off either edge', () => {
    const offLeft = placeNotificationPanel(
      { ...bell, left: 20 },
      { align: 'end', width: 360, maxHeight: 384, viewport },
    )
    expect(offLeft.left).toBe(8)

    const offRight = placeNotificationPanel(
      { ...bell, left: 1270 },
      { align: 'start', width: 360, maxHeight: 384, viewport },
    )
    expect(offRight.left).toBe(1280 - 360 - 8)

    // Narrower than the panel: still on screen, still not negative.
    const tiny = placeNotificationPanel(bell, {
      align: 'end',
      width: 360,
      maxHeight: 384,
      viewport: { width: 320, height: 640 },
    })
    expect(tiny.left).toBe(8)
  })

  it('flips above only when below is unusable and above is better', () => {
    // A bell at the bottom of the window: 60px below, 700 above.
    const flipped = placeNotificationPanel(
      { top: 800, left: 1200, width: 32, height: 32 },
      { align: 'end', width: 360, maxHeight: 384, viewport },
    )
    expect(flipped.side).toBe('top')
    expect(flipped.top).toBeGreaterThanOrEqual(8)
    expect(flipped.top).toBeLessThan(800)

    // Cramped below, but no better above: the panel stays where the user
    // expects a topbar bell to open.
    const short = placeNotificationPanel(
      { top: 10, left: 1200, width: 32, height: 32 },
      {
        align: 'end',
        width: 360,
        maxHeight: 384,
        viewport: { width: 1280, height: 200 },
      },
    )
    expect(short.side).toBe('bottom')
  })

  it('shrinks the scrolling list to fit, with a floor', () => {
    const roomy = placeNotificationPanel(bell, {
      align: 'end',
      width: 360,
      maxHeight: 384,
      viewport,
    })
    expect(roomy.maxListHeight).toBe(384)

    // 900 - 44 - 8 - 8 = 840 below on a roomy viewport; on a short one the
    // list gives up its height before the header and footer do.
    const cramped = placeNotificationPanel(bell, {
      align: 'end',
      width: 360,
      maxHeight: 384,
      viewport: { width: 1280, height: 400 },
    })
    expect(cramped.maxListHeight).toBeLessThan(384)
    expect(cramped.maxListHeight).toBeGreaterThanOrEqual(88)

    // Absurdly short viewport: never negative, never zero, never taller than
    // what the caller asked for.
    const absurd = placeNotificationPanel(bell, {
      align: 'end',
      width: 360,
      maxHeight: 384,
      viewport: { width: 1280, height: 100 },
    })
    expect(absurd.maxListHeight).toBe(88)
  })

  it('knows when the trigger has left the viewport', () => {
    expect(isAnchorInViewport(bell, viewport)).toBe(true)
    // Half off the top still counts: the user can see it.
    expect(isAnchorInViewport({ ...bell, top: -16 }, viewport)).toBe(true)
    expect(isAnchorInViewport({ ...bell, top: -40 }, viewport)).toBe(false)
    expect(isAnchorInViewport({ ...bell, top: 1000 }, viewport)).toBe(false)
    expect(isAnchorInViewport({ ...bell, left: -40 }, viewport)).toBe(false)
    // jsdom's zero rect at the origin must not read as "scrolled away".
    expect(
      isAnchorInViewport({ top: 0, left: 0, width: 0, height: 0 }, viewport),
    ).toBe(true)
  })
})

describe('NbNotificationCenter list semantics', () => {
  // list-style: none costs a list its role in WebKit, and with it the "list,
  // 3 items" a VoiceOver user navigates by.
  it('keeps list semantics that CSS would otherwise strip', async () => {
    const w = mountCenter()
    await openPanel(w)
    expect(
      document
        .querySelector('.nb-notification-center__list')
        ?.getAttribute('role'),
    ).toBe('list')
    document
      .querySelectorAll('.nb-notification-item')
      .forEach((li) => expect(li.getAttribute('role')).toBe('listitem'))
    w.unmount()
  })
})

describe('NbNotificationCenter keyboard and fields', () => {
  function key(el: Element, name: string) {
    const event = new KeyboardEvent('keydown', {
      key: name,
      bubbles: true,
      cancelable: true,
    })
    el.dispatchEvent(event)
    return event
  }

  // The documented composition for #header-actions is a filter field. Arrows
  // belong to that field: ArrowUp moves the caret, it does not jump the user
  // into the notification list.
  it('leaves the arrow keys to a field inside the panel', async () => {
    const w = mountCenter(
      {},
      {
        slots: {
          'header-actions': '<input class="filter" aria-label="Filter" />',
          footer: '<textarea class="note"></textarea>',
        },
      },
    )
    await openPanel(w)

    const input = document.querySelector<HTMLInputElement>('.filter')!
    input.focus()
    const down = key(input, 'ArrowDown')
    expect(down.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(input)

    const up = key(input, 'ArrowUp')
    expect(up.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(input)

    const area = document.querySelector<HTMLTextAreaElement>('.note')!
    area.focus()
    expect(key(area, 'ArrowUp').defaultPrevented).toBe(false)
    expect(key(area, 'Home').defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(area)

    // Escape is the one key the panel still takes from a field, because a
    // dismissible surface that cannot be dismissed from its own search box is
    // worse than a field that loses one shortcut.
    key(input, 'Escape')
    await settle()
    expect(panel()).toBeNull()
    w.unmount()
  })

  // The guard is on fields, not on everything outside the list: a button in
  // the header still hands the arrows to the rows.
  it('still enters the list with an arrow from a non-field control', async () => {
    const w = mountCenter()
    await openPanel(w)
    const markAll = document.querySelector<HTMLElement>(
      '.nb-notification-center__mark-all',
    )!
    markAll.focus()
    const event = key(markAll, 'ArrowDown')
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(rows()[0])
    w.unmount()
  })
})

describe('NbNotificationCenter slot rows', () => {
  it('forwards activation from host-rendered rows with a null item', async () => {
    const w = mountCenter(
      { items: [] },
      {
        slots: {
          default: `<li><button class="host" data-nb-notification-item>Deploy done</button></li>`,
        },
      },
    )
    await openPanel(w)
    document.querySelector<HTMLElement>('.host')!.click()
    await settle()

    const select = w.emitted('select')!
    expect(select).toHaveLength(1)
    expect(select[0][0]).toBeNull()
    expect(panel()).toBeNull()
    w.unmount()
  })

  // A host row that is not a native control has to carry a role for the
  // centre to treat it as one. With role="button" it is a control and the
  // centre supplies the key handling a <div> does not get for free.
  it('activates a roled slot row from the keyboard, once', async () => {
    const w = mountCenter(
      { items: [], closeOnSelect: false },
      {
        slots: {
          default: `<li><div class="host" role="button" tabindex="0" data-nb-notification-item>Deploy done</div></li>`,
        },
      },
    )
    await openPanel(w)
    const row = document.querySelector<HTMLElement>('.host')!
    row.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    )
    await nextTick()
    expect(w.emitted('select')).toHaveLength(1)
    w.unmount()
  })

  // The v-for rows emit `select` themselves. The delegated listener must not
  // turn one click into two events.
  it('does not double-fire for item-driven rows', async () => {
    const w = mountCenter({ closeOnSelect: false })
    await openPanel(w)
    rows()[0].click()
    await nextTick()
    expect(w.emitted('select')).toHaveLength(1)
    w.unmount()
  })
})

// The defect this component shipped with, from the panel's side: with
// `interactive: false` the rows were bare <div>s that the roving index still
// made focusable and that Enter still turned into a `select`. A row is a
// control or it is text, and a panel full of text still has to be readable
// with a keyboard, which is the second half of these tests.
describe('NbNotificationCenter with an inert feed', () => {
  it('puts no inert row in the keyboard order and activates none of them', async () => {
    const w = mountCenter({ interactive: false, closeOnSelect: false })
    await openPanel(w)

    // Nothing carries the row contract, so there is nothing to rove over.
    expect(rows()).toHaveLength(0)
    const rendered = Array.from(
      document.querySelectorAll<HTMLElement>('.nb-notification-item__row'),
    )
    expect(rendered).toHaveLength(ITEMS.length)
    for (const row of rendered) {
      expect(row.tagName).toBe('DIV')
      expect(row.getAttribute('tabindex')).toBeNull()
      expect(row.getAttribute('role')).toBeNull()
    }

    rendered[0].click()
    rendered[0].dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    )
    await settle()
    expect(w.emitted('select')).toBeUndefined()
    expect(panel()).not.toBeNull()
    w.unmount()
  })

  it('makes the scrolling list itself the tab stop when no row is one', async () => {
    const w = mountCenter({ interactive: false })
    await openPanel(w)

    const list = panel()!.querySelector<HTMLElement>(
      '.nb-notification-center__list',
    )!
    expect(list.getAttribute('tabindex')).toBe('0')

    // Which means the region can actually be reached and scrolled. Without
    // it, a keyboard user opens a panel whose content stops at the fold.
    list.focus()
    expect(document.activeElement).toBe(list)

    // And Tab off it is the panel's last edge, so the panel lets go rather
    // than holding a keyboard user inside a dialog with a live page behind it.
    list.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      }),
    )
    await settle()
    expect(panel()).toBeNull()
    w.unmount()
  })

  it('drops that tab stop as soon as one row is activatable', async () => {
    const w = mountCenter({
      interactive: false,
      items: [
        { id: 'a', title: 'Read only' },
        { id: 'b', title: 'Open the build', interactive: true },
        { id: 'c', title: 'Read only too' },
      ],
    })
    await openPanel(w)

    expect(
      panel()!
        .querySelector('.nb-notification-center__list')!
        .getAttribute('tabindex'),
    ).toBeNull()

    // The arrows walk the one row worth walking to, and focus opened there.
    expect(rows()).toHaveLength(1)
    expect(document.activeElement).toBe(rows()[0])
    expect(rows()[0].tagName).toBe('BUTTON')
    w.unmount()
  })

  it('empties the tab stop again when the list is replaced by a state', async () => {
    const w = mountCenter({ interactive: false })
    await openPanel(w)
    expect(
      panel()!
        .querySelector('.nb-notification-center__list')!
        .getAttribute('tabindex'),
    ).toBe('0')

    await w.setProps({ loading: true })
    await settle()
    expect(panel()!.querySelector('.nb-notification-center__list')).toBeNull()

    await w.setProps({ loading: false })
    await settle()
    expect(
      panel()!
        .querySelector('.nb-notification-center__list')!
        .getAttribute('tabindex'),
    ).toBe('0')
    w.unmount()
  })

  // The same rule applied to markup the centre did not write. A host can put
  // the row attribute on anything; it cannot make the centre hand a nameless
  // <div> a tabindex and an Enter key.
  it('refuses to make a control out of a slotted element that is not one', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mountCenter(
      { items: [], itemCount: 1, closeOnSelect: false },
      {
        slots: {
          default: `<li><div class="host" data-nb-notification-item>Deploy done</div></li>`,
        },
      },
    )
    await openPanel(w)

    // The attribute is on the element, so the naive query still finds it.
    // What matters is that the panel refused it: no tabindex handed out, so
    // it is not in the keyboard order, and the list took the tab stop
    // instead because the panel holds nothing pressable.
    const host = document.querySelector<HTMLElement>('.host')!
    expect(host.getAttribute('tabindex')).toBeNull()
    expect(
      panel()!
        .querySelector('.nb-notification-center__list')!
        .getAttribute('tabindex'),
    ).toBe('0')

    host.click()
    host.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    )
    await settle()
    expect(w.emitted('select')).toBeUndefined()

    // And it says why, once, rather than failing quietly in a host's app.
    expect(warn).toHaveBeenCalled()
    expect(warn.mock.calls[0][0]).toContain('NbNotificationCenter')
    expect(warn.mock.calls[0][0]).toContain('not a control')
    warn.mockRestore()
    w.unmount()
  })
})

describe('NbNotificationCenter mark-all in flight', () => {
  it('keeps focus, refuses a second click and says what is happening', async () => {
    const w = mountCenter()
    await openPanel(w)
    const button = document.querySelector<HTMLButtonElement>(
      '.nb-notification-center__mark-all',
    )!
    button.focus()
    button.click()
    expect(w.emitted('mark-all-read')).toHaveLength(1)

    await w.setProps({ markAllPending: true })
    await nextTick()

    // aria-disabled, not disabled: a `disabled` attribute on the button the
    // user just pressed drops focus to <body> for the length of the request.
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.disabled).toBe(false)
    expect(document.activeElement).toBe(button)
    expect(button.textContent).toContain('Marking all as read')
    expect(button.querySelector('.nb-spinner')).not.toBeNull()

    button.click()
    expect(w.emitted('mark-all-read')).toHaveLength(1)

    const live = document.querySelector(
      '[role="status"].nb-notification-center__sr',
    )
    expect(live?.textContent).toBe('Marking all as read')
    w.unmount()
  })
})

describe('NbNotificationCenter detachment', () => {
  function anchorAt(el: Element, rect: Partial<DOMRect>) {
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      width: 32,
      height: 32,
      bottom: 32,
      right: 32,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...rect,
    } as DOMRect)
  }

  afterEach(() => vi.restoreAllMocks())

  it('lets go when the trigger scrolls out of the viewport', async () => {
    const w = mountCenter()
    await openPanel(w)
    expect(panel()).not.toBeNull()

    // Still on screen: a scroll only repositions.
    anchorAt(w.element, { top: 40, bottom: 72 })
    window.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(panel()).not.toBeNull()

    // Scrolled away entirely: a fixed panel anchored to nothing is a panel
    // floating over unrelated content.
    anchorAt(w.element, { top: -400, bottom: -368 })
    window.dispatchEvent(new Event('scroll'))
    await settle()
    expect(panel()).toBeNull()
    w.unmount()
  })

  it('closes on a browser navigation, unless the host says not to', async () => {
    const w = mountCenter()
    await openPanel(w)
    window.dispatchEvent(new PopStateEvent('popstate'))
    await settle()
    expect(panel()).toBeNull()
    w.unmount()

    const pinned = mountCenter({ closeOnNavigate: false })
    await openPanel(pinned)
    window.dispatchEvent(new PopStateEvent('popstate'))
    await settle()
    expect(panel()).not.toBeNull()
    pinned.unmount()
  })
})

/**
 * The NbBanner incident, in this component's own suite. A component that is
 * written, tested and documented but absent from src/main.ts and
 * src/components/index.ts cannot be imported by any app and renders as an
 * unresolved custom element in its own docs previews, and the shared
 * registration test cannot see it, because it compares the two lists to each
 * other and a name missing from both passes vacuously.
 */
/**
 * The `#trigger` slot is the one documented way to replace the bell, and it
 * used to be the one path with no test. It was also the one path where the
 * component quietly stopped doing its job: `triggerRef` sat on the fallback
 * button, so a host that supplied the slot left it null, and Escape dropped
 * focus onto <body>. Everything below exists because of that.
 */
describe('NbNotificationCenter with a host-supplied trigger', () => {
  type TTriggerScope = {
    open: boolean
    toggle: () => void
    show: () => void
    close: (options?: { restoreFocus?: boolean }) => void
    unreadCount: number
    badge: string
    panelId: string
    triggerProps: Record<string, unknown>
    setTriggerRef: (el: unknown) => void
  }

  /** Mounts a centre whose bell is the host's, wired the documented way. */
  function mountSlotted(
    props: Record<string, unknown> = {},
    options: { wire?: boolean } = {},
  ) {
    const wire = options.wire ?? true
    const scopes: TTriggerScope[] = []
    const w = mount(NotificationCenter, {
      props: { items: ITEMS, ...props },
      attachTo: document.body,
      slots: {
        trigger: (scope: TTriggerScope) => {
          scopes.push(scope)
          return h(
            'button',
            {
              class: 'host-trigger',
              type: 'button',
              ...(wire
                ? { ref: scope.setTriggerRef, ...scope.triggerProps }
                : {}),
              onClick: scope.toggle,
            },
            `Bell ${scope.badge}`,
          )
        },
      },
    })
    return { w, scopes, last: () => scopes[scopes.length - 1] }
  }

  async function openSlotted(w: ReturnType<typeof mount>) {
    await w.find('.host-trigger').trigger('click')
    await settle()
  }

  it('hands the slot everything a correct trigger needs', async () => {
    const { w, last } = mountSlotted()
    const scope = last()
    // Without panelId a host cannot write aria-controls at all, and without
    // the haspopup/expanded pair the button does not announce that it owns a
    // dialog. None of these are derivable by the host.
    expect(typeof scope.panelId).toBe('string')
    expect(scope.triggerProps['aria-haspopup']).toBe('dialog')
    expect(scope.triggerProps['aria-expanded']).toBe('false')
    expect(scope.triggerProps['aria-controls']).toBeUndefined()
    expect(scope.triggerProps['aria-label']).toBe('Notifications, 2 unread')
    expect(typeof scope.setTriggerRef).toBe('function')
    expect(typeof scope.show).toBe('function')
    expect(typeof scope.close).toBe('function')

    await openSlotted(w)
    const button = document.querySelector('.host-trigger')!
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(button.getAttribute('aria-controls')).toBe(scope.panelId)
    expect(panel()?.id).toBe(scope.panelId)
    w.unmount()
  })

  // The bug this whole block was written for. Before the fix this landed on
  // <body>, which is a WCAG 2.4.3 failure: the user is thrown to the top of
  // the document with no way back to where they were.
  it('returns focus to the host trigger on Escape', async () => {
    const { w } = mountSlotted()
    await openSlotted(w)
    const button = document.querySelector<HTMLElement>('.host-trigger')!
    expect(panel()!.contains(document.activeElement)).toBe(true)

    panel()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(button)
    w.unmount()
  })

  it('returns focus to the host trigger when the trigger closes it', async () => {
    const { w } = mountSlotted()
    await openSlotted(w)
    const button = document.querySelector<HTMLElement>('.host-trigger')!
    await w.find('.host-trigger').trigger('click')
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(button)
    w.unmount()
  })

  // A host that ignores setTriggerRef is not a host we can identify, but the
  // panel still knows which subtree it came from. Focus goes to the first
  // focusable thing in that subtree rather than to nothing at all.
  it('falls back to the first focusable in its own root when unwired', async () => {
    const { w } = mountSlotted({}, { wire: false })
    await openSlotted(w)
    const button = document.querySelector<HTMLElement>('.host-trigger')!
    panel()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await settle()
    expect(document.activeElement).not.toBe(document.body)
    expect(document.activeElement).toBe(button)
    w.unmount()
  })

  it('still leaves focus alone when the user clicked elsewhere', async () => {
    const { w } = mountSlotted()
    await openSlotted(w)
    const elsewhere = document.createElement('button')
    document.body.appendChild(elsewhere)
    elsewhere.focus()
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await settle()
    expect(panel()).toBeNull()
    // The user chose where focus went. Yanking it back to the bell would undo
    // their own action.
    expect(document.activeElement).toBe(elsewhere)
    w.unmount()
  })

  it('passes the capped badge and the uncapped count to the slot', () => {
    const { w, last } = mountSlotted({ unreadCount: 142, maxCount: 99 })
    expect(last().badge).toBe('99+')
    expect(last().unreadCount).toBe(142)
    expect(last().triggerProps['aria-label']).toBe('Notifications, 142 unread')
    w.unmount()
  })
})

/**
 * Error is a state, not a synonym for empty. The audit finding behind this
 * component is an app whose one `.empty-text` served both, so a failed fetch
 * read as "no contacts yet"; a component that made error an override of a
 * slot called `empty` would be reproducing that mistake one layer up.
 */
describe('NbNotificationCenter failure state', () => {
  it('says the request failed instead of saying there is nothing', async () => {
    const w = mountCenter({ items: [], error: true })
    await openPanel(w)
    const region = document.querySelector('.nb-notification-center__error')
    expect(region).not.toBeNull()
    // role="alert", so it is announced rather than found by hunting.
    expect(region!.getAttribute('role')).toBe('alert')
    expect(document.querySelector('.nb-empty-state__title')?.textContent).toBe(
      'Could not load notifications',
    )
    // The empty state's own error kind, so the icon and the tone match the
    // rest of the library rather than being restyled here.
    expect(document.querySelector('.nb-empty-state')?.className).toContain(
      'error',
    )
    expect(document.querySelector('.nb-notification-center__empty')).toBeNull()
    w.unmount()
  })

  it('offers retry, emits it, and can be told not to', async () => {
    const w = mountCenter({ items: [], error: true })
    await openPanel(w)
    const retry = document.querySelector<HTMLElement>(
      '.nb-notification-center__error button',
    )!
    expect(retry.textContent).toContain('Try again')
    retry.click()
    await nextTick()
    expect(w.emitted('retry')).toHaveLength(1)
    w.unmount()

    const quiet = mountCenter({ items: [], error: true, showRetry: false })
    await openPanel(quiet)
    expect(
      document.querySelector('.nb-notification-center__error button'),
    ).toBeNull()
    quiet.unmount()
  })

  // A refresh that failed over rows already on screen. Throwing the rows away
  // to show an error would lose the notifications the user was reading.
  it('keeps the rows when a refresh fails over loaded content', async () => {
    const w = mountCenter({ error: true })
    await openPanel(w)
    expect(rows()).toHaveLength(3)
    const strip = document.querySelector('.nb-notification-center__stale')!
    expect(strip.getAttribute('role')).toBe('status')
    expect(strip.textContent).toContain('These may be out of date.')
    expect(document.querySelector('.nb-notification-center__error')).toBeNull()
    strip.querySelector<HTMLElement>('button')!.click()
    await nextTick()
    expect(w.emitted('retry')).toHaveLength(1)
    w.unmount()
  })

  // Four states, and loading is the one that wins: a request in flight is not
  // yet a failure, and it is certainly not a result.
  it('shows neither error nor empty while the request is still running', async () => {
    const w = mountCenter({ items: [], error: true, loading: true })
    await openPanel(w)
    expect(
      document.querySelector('.nb-notification-center__loading'),
    ).not.toBeNull()
    expect(document.querySelector('.nb-notification-center__error')).toBeNull()
    expect(document.querySelector('.nb-notification-center__stale')).toBeNull()
    expect(document.querySelector('.nb-notification-center__empty')).toBeNull()
    w.unmount()
  })

  it('takes an error override that still gets the retry callback', async () => {
    const w = mountCenter(
      { items: [], error: true },
      {
        slots: {
          error: `<template #error="{ retry }">
            <button class="mine" @click="retry">Reload</button>
          </template>`,
        },
      },
    )
    await openPanel(w)
    const mine = document.querySelector<HTMLElement>('.mine')!
    expect(mine.textContent).toBe('Reload')
    mine.click()
    await nextTick()
    expect(w.emitted('retry')).toHaveLength(1)
    w.unmount()
  })
})

describe('NbNotificationCenter Escape from outside the panel', () => {
  // The panel is deliberately not modal, so the page underneath is live and
  // Escape can arrive from anywhere in it. Dismissing is right. Moving focus
  // is not: the realistic sender of this keystroke is a nested overlay opened
  // from a row action or from #footer (NbModal, NbConfirm, a teleported
  // NbSelect listbox) that is dismissing itself in the same tick, and pulling
  // focus to the bell would drag the user out of what they were doing.
  it('dismisses without touching focus when focus is elsewhere on the page', async () => {
    const w = mountCenter()
    await openPanel(w)

    const outsider = document.createElement('input')
    document.body.appendChild(outsider)
    outsider.focus()
    expect(document.activeElement).toBe(outsider)

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await settle()

    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(outsider)
    expect(document.activeElement).not.toBe(
      w.find('.nb-notification-center__trigger').element,
    )
    w.unmount()
  })

  // The one case where the bell should end up focused is the case where it
  // already is: a panel opened programmatically leaves focus on the trigger,
  // so nothing is moved and nothing is stolen.
  it('leaves focus on the trigger when the trigger is what has it', async () => {
    const w = mountCenter()
    const trigger = w.find('.nb-notification-center__trigger')
      .element as HTMLElement
    trigger.focus()
    ;(w.vm as unknown as { show: () => void }).show()
    await settle()
    trigger.focus()

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await settle()

    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(trigger)
    w.unmount()
  })

  it('ignores keys that are not Escape', async () => {
    const w = mountCenter()
    await openPanel(w)
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', bubbles: true }),
    )
    await settle()
    expect(panel()).not.toBeNull()
    w.unmount()
  })
})

describe('NbNotificationCenter with a second centre on the page', () => {
  // Two bells in one shell is a plausible composition. Two open panels is
  // not: they overlap, they both cycle Tab within themselves, and the one
  // underneath is unreachable. Opening arbitrates.
  it('dismisses the panel that was already open', async () => {
    const first = mountCenter({ label: 'Product' })
    const second = mountCenter({ label: 'Account' })

    await openPanel(first)
    expect(
      document.querySelectorAll('.nb-notification-center__panel'),
    ).toHaveLength(1)

    await openPanel(second)
    const panels = document.querySelectorAll('.nb-notification-center__panel')
    expect(panels).toHaveLength(1)
    expect(panels[0]?.querySelector('h2')?.textContent?.trim()).toBe('Account')
    expect(first.emitted('close')).toHaveLength(1)

    first.unmount()
    second.unmount()
  })

  // The dismissal is not allowed to reach across and grab focus either: the
  // user is on the bell they just pressed.
  it('does not move focus to the centre it dismissed', async () => {
    const first = mountCenter({ label: 'Product' })
    const second = mountCenter({ label: 'Account' })
    await openPanel(first)
    await openPanel(second)

    expect(document.activeElement).not.toBe(
      first.find('.nb-notification-center__trigger').element,
    )
    first.unmount()
    second.unmount()
  })

  // Each instance unbinds its own listeners, so the one still mounted keeps
  // working after the other goes away.
  it('leaves the survivor working when the other unmounts', async () => {
    const first = mountCenter({ label: 'Product' })
    const second = mountCenter({ label: 'Account' })
    await openPanel(first)
    first.unmount()
    await settle()

    await openPanel(second)
    expect(panel()?.querySelector('h2')?.textContent?.trim()).toBe('Account')
    second.unmount()
  })
})

describe('NbNotificationCenter header composition', () => {
  it('keeps the mark-all control when #header-start adds to the header', async () => {
    const w = mountCenter(
      {},
      {
        slots: {
          'header-start': '<input class="filter" aria-label="Filter" />',
        },
      },
    )
    await openPanel(w)
    expect(document.querySelector('.filter')).not.toBeNull()
    expect(
      document.querySelector('.nb-notification-center__mark-all'),
    ).not.toBeNull()
    w.unmount()
  })

  // A host that replaces the header entirely can still spread the pending
  // rules onto its own button rather than re-deriving aria-disabled,
  // aria-busy and the swallowed second click.
  it('hands #header-actions the mark-all bindings, pending rules included', async () => {
    const w = mountCenter(
      { markAllPending: true },
      {
        slots: {
          'header-actions': `<template #header-actions="{ markAllProps, markAllText }">
            <button class="mine" v-bind="markAllProps">{{ markAllText }}</button>
          </template>`,
        },
      },
    )
    await openPanel(w)
    const mine = document.querySelector<HTMLButtonElement>('.mine')!
    expect(mine.getAttribute('type')).toBe('button')
    expect(mine.getAttribute('aria-disabled')).toBe('true')
    expect(mine.getAttribute('aria-busy')).toBe('true')
    // aria-disabled and not disabled, so it keeps focus and still receives
    // the click. The click is swallowed instead of firing a second request.
    expect(mine.hasAttribute('disabled')).toBe(false)
    expect(mine.textContent?.trim()).toBe('Marking all as read')
    mine.click()
    await nextTick()
    expect(w.emitted('mark-all-read')).toBeUndefined()
    w.unmount()
  })

  it('fires mark-all-read through the spread bindings when nothing is pending', async () => {
    const w = mountCenter(
      {},
      {
        slots: {
          'header-actions': `<template #header-actions="{ markAllProps }">
            <button class="mine" v-bind="markAllProps">Mark all</button>
          </template>`,
        },
      },
    )
    await openPanel(w)
    document.querySelector<HTMLButtonElement>('.mine')!.click()
    await nextTick()
    expect(w.emitted('mark-all-read')).toHaveLength(1)
    w.unmount()
  })
})

describe('NbNotificationCenter error association', () => {
  // An id generated to associate things has to associate something. The
  // dialog points at whichever error region exists; they are mutually
  // exclusive, so it is never ambiguous.
  it('describes the dialog with the hard failure region', async () => {
    const w = mountCenter({ items: [], error: true })
    await openPanel(w)
    const describedBy = panel()?.getAttribute('aria-describedby') as string
    expect(describedBy).toBeTruthy()
    const region = document.getElementById(describedBy)
    expect(region?.getAttribute('role')).toBe('alert')
    expect(region?.className).toContain('nb-notification-center__error')
    w.unmount()
  })

  it('describes the dialog with the stale strip when rows survived', async () => {
    const w = mountCenter({ error: true })
    await openPanel(w)
    const describedBy = panel()?.getAttribute('aria-describedby') as string
    const region = document.getElementById(describedBy)
    expect(region?.getAttribute('role')).toBe('status')
    expect(region?.className).toContain('nb-notification-center__stale')
    // The rows are still there. Stale notifications beat no notifications.
    expect(rows()).toHaveLength(3)
    w.unmount()
  })

  it('describes nothing when nothing has failed', async () => {
    const w = mountCenter()
    await openPanel(w)
    expect(panel()?.getAttribute('aria-describedby')).toBeNull()
    w.unmount()
  })
})

describe('NbNotificationCenter cleanup', () => {
  // The panel is teleported, so its node is not a child of anything the
  // component owns. Unmounting mid-leave destroys the owner of that
  // transition; nothing may be left behind in <body>.
  it('leaves no panel node behind when unmounted right after close', async () => {
    const w = mountCenter()
    await openPanel(w)
    ;(w.vm as unknown as { close: (o?: object) => void }).close({
      restoreFocus: false,
    })
    w.unmount()
    await settle()
    expect(
      document.querySelectorAll('.nb-notification-center__panel'),
    ).toHaveLength(0)
  })

  it('leaves no panel node behind when unmounted while open', async () => {
    const w = mountCenter()
    await openPanel(w)
    w.unmount()
    await settle()
    expect(
      document.querySelectorAll('.nb-notification-center__panel'),
    ).toHaveLength(0)
  })

  // The exposed close() takes the documented option, and honouring it means
  // a route watcher can dismiss the panel without a focus jump the user did
  // not ask for.
  it('honours close({ restoreFocus: false }) from the exposed method', async () => {
    const w = mountCenter()
    await openPanel(w)
    expect(document.activeElement).toBe(rows()[0])
    ;(w.vm as unknown as { close: (o?: object) => void }).close({
      restoreFocus: false,
    })
    await settle()
    expect(panel()).toBeNull()
    expect(document.activeElement).not.toBe(
      w.find('.nb-notification-center__trigger').element,
    )
    w.unmount()
  })
})

describe('NbNotificationCenter ships', () => {
  const root = resolve(__dirname, '..')
  const mainSrc = readFileSync(resolve(root, 'src/main.ts'), 'utf8')
  const indexSrc = readFileSync(
    resolve(root, 'src/components/index.ts'),
    'utf8',
  )

  it.each(['NbNotificationCenter', 'NbNotificationCenterItem'])(
    '%s is exported from main.ts and registered by the plugin',
    (name) => {
      expect(mainSrc).toContain(`export { default as ${name} }`)
      expect(indexSrc).toMatch(new RegExp(`^\\s{2}${name},$`, 'm'))
    },
  )

  // A documentation page nothing links to is not a documentation page. This
  // one was written, built and left out of the nav for two rounds, so the
  // sidebar is now something a test owns rather than something a checklist
  // hopes for.
  it('is reachable from the docs sidebar', () => {
    const config = readFileSync(
      resolve(root, 'docs/.vitepress/config.ts'),
      'utf8',
    )
    expect(config).toContain("link: '/ui/components/notification-center'")
  })

  it('has the docs page the sidebar points at', () => {
    const page = resolve(root, 'docs/ui/components/notification-center.md')
    const md = readFileSync(page, 'utf8')
    // Every Nb tag the page renders has to be registered, or that preview is
    // a blank rectangle on the published site.
    const tags = new Set([...md.matchAll(/<(Nb[A-Za-z]+)/g)].map((m) => m[1]))
    for (const tag of tags) {
      expect(
        indexSrc.match(new RegExp(`^\\s{2}${tag},$`, 'm')) !== null,
        `${tag} is used in the docs page but is not registered by the plugin`,
      ).toBe(true)
    }
  })
})

// ── Server rendering ────────────────────────────────────────────────────
// Three of the twelve apps in the audit render on the server, and a shell
// topbar is the first thing on the page: whatever the bell renders, it
// renders twice, once per runtime, and the two have to agree. A relative time
// is the classic way they do not, so the item renders the absolute time until
// it is mounted and swaps afterwards. This is the test that keeps that true.
describe('NbNotificationCenter on the server', () => {
  it('renders both components to a string', async () => {
    const { renderToString } = await import('vue/server-renderer')
    const { createSSRApp } = await import('vue')

    const html = await renderToString(
      createSSRApp({
        components: { NotificationCenter },
        template: `<NotificationCenter label="Notifications" :unread-count="3" />`,
      }),
    )
    expect(html).toContain('aria-label="Notifications, 3 unread"')
    // The panel is teleported and shut, so the server emits the trigger only.
    expect(html).not.toContain('nb-notification-center__panel')
  })

  it('renders an absolute time on the server and the relative one after mount', async () => {
    const { renderToString } = await import('vue/server-renderer')
    const { createSSRApp } = await import('vue')

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-03T12:00:00.000Z'))

    const props = {
      title: 'Build failed',
      time: '2026-09-03T11:58:00.000Z',
      locale: 'en-GB',
    }
    const html = await renderToString(
      createSSRApp({
        components: { NotificationCenterItem },
        data: () => ({ props }),
        template: `<NotificationCenterItem v-bind="props" />`,
      }),
    )
    // "2 minutes ago" would be a different string by the time the client got
    // to it, so the server does not say it.
    expect(html).not.toContain('minutes ago')
    expect(html).toContain('datetime="2026-09-03T11:58:00.000Z"')

    const w = mount(NotificationCenterItem, { props })
    // The first client render matches the server's, which is what makes
    // hydration silent; the clock-dependent text arrives on the next tick.
    expect(w.find('time').text()).not.toContain('minutes ago')
    await nextTick()
    expect(w.find('time').text()).toBe('2 minutes ago')
    w.unmount()
    vi.useRealTimers()
  })
})
