import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NbMenuItem from '../src/components/MenuItem.vue'
import NbMessage from '../src/components/Message.vue'
import NbNotificationCenterItem from '../src/components/NotificationCenterItem.vue'

// Text the layout clips must still be reachable in full: a title for the
// pointer, the accessible name or a visually hidden copy for a screen reader.
describe('clipped text keeps a route to the full string', () => {
  const long = 'Export the quarterly report for every workspace in the account'

  it('NbMenuItem puts the label in a title', () => {
    const w = mount(NbMenuItem, { props: { label: long } })
    expect(w.find('.nb-menu-item__label').attributes('title')).toBe(long)
  })

  it('NbNotificationCenterItem puts the clamped body in a title', () => {
    const w = mount(NbNotificationCenterItem, {
      props: { title: 'Report ready', body: long },
    })
    expect(w.find('.nb-notification-item__body').attributes('title')).toBe(long)
  })

  it('NbMessage icon-only keeps its text for assistive tech', () => {
    const w = mount(NbMessage, {
      props: { iconOnly: true },
      slots: { default: long },
    })
    const sr = w.find('.nb-message__text')
    expect(sr.exists()).toBe(true)
    expect(sr.text()).toBe(long)
    expect(sr.attributes('aria-hidden')).toBeUndefined()
  })
})
