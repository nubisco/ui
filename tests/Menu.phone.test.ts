import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NbMenu from '../src/components/Menu.vue'
import { stubPhone, unstubPhone } from './__mocks__/phoneLayout'

/**
 * NbMenu on a phone: widths capped at the viewport, and a position set after
 * the menu opened is clamped back onto the screen. A desktop keeps the plain
 * pixel widths and exactly the positions it is given.
 */

type TMenu = InstanceType<typeof NbMenu>

const menuEl = () => document.body.querySelector<HTMLElement>('.nb-menu')!

function mountMenu(props: Record<string, unknown> = {}) {
  return mount(NbMenu, {
    props: { open: false, ...props },
    slots: { default: '<li role="menuitem" tabindex="-1">One</li>' },
    attachTo: document.body,
  })
}

/** jsdom lays nothing out, so the menu's box is stubbed: 200 x 120. */
function stubMenuBox() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      const left = parseFloat(this.style.left) || 0
      const top = parseFloat(this.style.top) || 0
      return {
        left,
        top,
        right: left + 200,
        bottom: top + 120,
        width: 200,
        height: 120,
        x: left,
        y: top,
        toJSON: () => ({}),
      } as DOMRect
    },
  )
}

describe('NbMenu in the phone layout', () => {
  afterEach(() => {
    unstubPhone()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('caps both widths at the viewport on a phone', async () => {
    stubPhone()
    const wrapper = mountMenu()
    await wrapper.setProps({ open: true })
    expect(menuEl().style.minWidth).toBe('min(160px, calc(100vw - 16px))')
    expect(menuEl().style.maxWidth).toBe('min(288px, calc(100vw - 16px))')
    wrapper.unmount()
  })

  it('stacks above the inspector sheet and dialogs on a phone', async () => {
    stubPhone()
    const wrapper = mountMenu()
    await wrapper.setProps({ open: true })
    expect(menuEl().style.zIndex).toBe('var(--nb-zindex-modal-dropdown)')
    wrapper.unmount()
  })

  it('keeps the menu tier on a desktop', async () => {
    const wrapper = mountMenu()
    await wrapper.setProps({ open: true })
    expect(menuEl().style.zIndex).toBe('var(--nb-zindex-menu)')
    wrapper.unmount()
  })

  it('keeps plain pixel widths on a desktop', async () => {
    const wrapper = mountMenu()
    await wrapper.setProps({ open: true })
    expect(menuEl().style.minWidth).toBe('160px')
    expect(menuEl().style.maxWidth).toBe('288px')
    wrapper.unmount()
  })

  it('clamps a position set after opening back onto a phone screen', async () => {
    stubPhone()
    stubMenuBox()
    const wrapper = mountMenu()
    await wrapper.setProps({ open: true })
    await nextTick()
    ;(wrapper.vm as unknown as TMenu).setPositionXY(window.innerWidth - 20, 40)
    await nextTick()
    await nextTick()
    expect(parseFloat(menuEl().style.left)).toBe(window.innerWidth - 200 - 8)
    wrapper.unmount()
  })

  it('clamps a position set after opening on a desktop too', async () => {
    stubMenuBox()
    const wrapper = mountMenu()
    await wrapper.setProps({ open: true })
    await nextTick()
    ;(wrapper.vm as unknown as TMenu).setPositionXY(window.innerWidth - 20, 40)
    await nextTick()
    await nextTick()
    expect(parseFloat(menuEl().style.left)).toBe(window.innerWidth - 200 - 8)
    wrapper.unmount()
  })

  it('leaves a position that fits where it was put', async () => {
    stubMenuBox()
    const wrapper = mountMenu()
    await wrapper.setProps({ open: true })
    await nextTick()
    ;(wrapper.vm as unknown as TMenu).setPositionXY(100, 40)
    await nextTick()
    await nextTick()
    expect(parseFloat(menuEl().style.left)).toBe(100)
    wrapper.unmount()
  })
})
