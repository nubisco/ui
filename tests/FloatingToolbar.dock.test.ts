import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import FloatingToolbar from '../src/components/FloatingToolbar.vue'
import { stubPhone, unstubPhone } from './__mocks__/phoneLayout'

/**
 * `dock="phone"`: in the phone layout the toolbar is a bar across the bottom
 * of the visible viewport rather than a float over the selection. Anywhere
 * else, and with the default `dock="none"`, it floats at its anchor.
 */

const mounted: VueWrapper[] = []
const rect = { top: 300, left: 100, width: 120, height: 18 }

function mountToolbar(props: Record<string, unknown> = {}) {
  const wrapper = mount(FloatingToolbar, {
    props: { open: true, label: 'Text formatting', anchor: rect, ...props },
    slots: { default: () => h('button', { type: 'button' }, 'Bold') },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  return wrapper
}

const toolbar = () =>
  document.body.querySelector<HTMLElement>('.nb-floating-toolbar')!
const vvh = () => document.documentElement.style.getPropertyValue('--nb-vvh')

async function settle() {
  await nextTick()
  await nextTick()
}

describe('NbFloatingToolbar dock', () => {
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount())
    unstubPhone()
    document.body.innerHTML = ''
    document.documentElement.removeAttribute('style')
  })

  it('docks to the bottom on a phone when asked', async () => {
    stubPhone()
    const viewport = Object.assign(new EventTarget(), {
      height: 420,
      offsetTop: 0,
    })
    vi.stubGlobal('visualViewport', viewport)
    mountToolbar({ dock: 'phone' })
    await settle()
    expect(toolbar().classList).toContain('nb-floating-toolbar--docked')
    // Placed by its class, so no anchored top/left.
    expect(toolbar().getAttribute('style')).toBeNull()
    // Sized against the visible viewport, which is what keeps it on top of
    // the keyboard.
    expect(vvh()).toBe('420px')
  })

  it('keeps showing while docked even when the anchor scrolls away', async () => {
    stubPhone()
    mountToolbar({ dock: 'phone', anchor: { ...rect, top: -500 } })
    await settle()
    expect(toolbar().classList).not.toContain(
      'nb-floating-toolbar--anchor-hidden',
    )
  })

  it('floats at its anchor on a desktop even with dock="phone"', async () => {
    mountToolbar({ dock: 'phone' })
    await settle()
    expect(toolbar().classList).not.toContain('nb-floating-toolbar--docked')
    expect(toolbar().style.top).toMatch(/px$/)
    expect(vvh()).toBe('')
  })

  it('floats on a phone by default', async () => {
    stubPhone()
    mountToolbar()
    await settle()
    expect(toolbar().classList).not.toContain('nb-floating-toolbar--docked')
    expect(toolbar().style.left).toMatch(/px$/)
  })
})
