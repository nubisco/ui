import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import NbBackToTop from '../src/components/BackToTop.vue'
import tooltipDirective from '@/directives/ToolTip.directive'

// Transitions are stubbed so leaving is immediate: in a browser the button
// stays only for its fade-out.
const global = {
  plugins: [{ install: tooltipDirective }],
  stubs: { transition: true },
}

enableAutoUnmount(afterEach)

const scrollTo = vi.fn()

function scrollPageTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

/** requestAnimationFrame, run at once, so one scroll is one read. */
beforeEach(() => {
  scrollTo.mockReset()
  vi.stubGlobal('scrollTo', scrollTo)
  // Runs the frame at once and reports no frame pending, as a browser does
  // once the frame has run.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 0
  })
  Object.defineProperty(window, 'innerHeight', {
    value: 800,
    configurable: true,
  })
  scrollPageTo(0)
})

afterEach(() => vi.unstubAllGlobals())

describe('NbBackToTop', () => {
  it('is absent on the first screen and appears past one screen height', async () => {
    const view = mount(NbBackToTop, { global, attachTo: document.body })
    await flushPromises()
    expect(view.find('button').exists(), 'on the first screen').toBe(false)

    scrollPageTo(801)
    await flushPromises()
    expect(view.find('button').exists()).toBe(true)
    expect(view.find('button').attributes('aria-label')).toBe('Back to top')

    scrollPageTo(100)
    await flushPromises()
    expect(view.find('button').exists(), 'back near the top').toBe(false)
  })

  it('honours a threshold', async () => {
    const view = mount(NbBackToTop, { props: { threshold: 200 }, global })
    scrollPageTo(201)
    await flushPromises()
    expect(view.find('button').exists()).toBe(true)
  })

  it('scrolls to the top, and moves focus to the top only from the keyboard', async () => {
    document.body.innerHTML = '<a id="first" href="#">first</a>'
    const view = mount(NbBackToTop, { global, attachTo: document.body })
    scrollPageTo(2000)
    await flushPromises()

    const click = async (detail: number) => {
      view
        .find('button')
        .element.dispatchEvent(
          new MouseEvent('click', { detail, bubbles: true }),
        )
      await flushPromises()
    }

    // A mouse click: detail 1.
    await click(1)
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }))
    expect(document.activeElement?.id).not.toBe('first')

    // Enter or Space on the button: a click with detail 0.
    await click(0)
    expect(document.activeElement?.id).toBe('first')
  })
})
