import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NbMenuItem from '../src/components/MenuItem.vue'

/**
 * A menu row that names a person shows their face, the way every other list
 * of people in the fleet does. Before, the only way to put an avatar in a row
 * was the trailing slot, which is the wrong side.
 */
describe('NbMenuItem leading', () => {
  it('draws a 16px decorative avatar in the icon place when given a picture', () => {
    const w = mount(NbMenuItem, {
      props: { label: 'Ada Lovelace', icon: 'user', picture: null },
    })
    const avatar = w.find('.nb-menu-item__picture')
    expect(avatar.exists()).toBe(true)
    expect(avatar.classes()).toContain('nb-menu-item__icon')
    expect(avatar.attributes('aria-hidden')).toBe('true')
    expect(avatar.text()).toBe('AL')
    expect(w.find('.nb-icon').exists()).toBe(false)
  })

  it('keeps the icon when there is no picture', () => {
    const w = mount(NbMenuItem, { props: { label: 'Copy', icon: 'copy' } })
    expect(w.find('.nb-menu-item__picture').exists()).toBe(false)
    expect(w.find('.nb-menu-item__icon').exists()).toBe(true)
  })

  it('lets the leading slot replace both', () => {
    const w = mount(NbMenuItem, {
      props: { label: 'Copy', icon: 'copy', picture: null },
      slots: { leading: '<i class="custom">x</i>' },
    })
    expect(w.find('.custom').exists()).toBe(true)
    expect(w.find('.nb-menu-item__picture').exists()).toBe(false)
    expect(w.find('.nb-menu-item__icon').exists()).toBe(false)
    expect(w.find('.custom').element.nextElementSibling?.className).toBe(
      'nb-menu-item__label',
    )
  })
})
