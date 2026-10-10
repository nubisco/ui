import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Modal from '../src/components/Modal.vue'
import { stubPhone, unstubPhone } from './__mocks__/phoneLayout'

/**
 * NbModal on a phone. The sheet itself is CSS (asserted in
 * phone-styles.test.ts); what script owns is the visible-viewport height the
 * sheet is sized by, which must exist only while a dialog is open on a phone.
 */

const vvh = () => document.documentElement.style.getPropertyValue('--nb-vvh')

function stubViewport(height: number) {
  const target = Object.assign(new EventTarget(), { height, offsetTop: 0 })
  vi.stubGlobal('visualViewport', target)
  return target
}

const mountModal = (open: boolean) =>
  mount(Modal, {
    props: { open, title: 'Edit' },
    global: { stubs: { Teleport: true, Transition: false } },
  })

describe('NbModal in the phone layout', () => {
  afterEach(() => {
    unstubPhone()
    document.documentElement.removeAttribute('style')
  })

  it('sizes itself by the visible viewport while open', async () => {
    stubPhone()
    const viewport = stubViewport(640)
    const wrapper = mountModal(true)
    await nextTick()
    expect(vvh()).toBe('640px')

    // The keyboard comes up and takes the bottom of the screen.
    viewport.height = 360
    viewport.dispatchEvent(new Event('resize'))
    expect(vvh()).toBe('360px')

    await wrapper.setProps({ open: false })
    expect(vvh()).toBe('')
    wrapper.unmount()
  })

  it('keeps the height while a second dialog is still open', async () => {
    stubPhone()
    stubViewport(640)
    const first = mountModal(true)
    const second = mountModal(true)
    await nextTick()
    await first.setProps({ open: false })
    expect(vvh()).toBe('640px')
    await second.setProps({ open: false })
    expect(vvh()).toBe('')
    first.unmount()
    second.unmount()
  })

  it('lets go when unmounted open', async () => {
    stubPhone()
    stubViewport(640)
    const wrapper = mountModal(true)
    await nextTick()
    wrapper.unmount()
    expect(vvh()).toBe('')
  })

  it('writes nothing on a desktop', async () => {
    stubViewport(900)
    const wrapper = mountModal(true)
    await nextTick()
    expect(vvh()).toBe('')
    wrapper.unmount()
  })
})
