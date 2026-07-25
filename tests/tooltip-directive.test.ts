import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  defineComponent,
  h,
  nextTick,
  resolveDirective,
  withDirectives,
  type Directive,
} from 'vue'
import { mount } from '@vue/test-utils'
import tooltipDirective from '@/directives/ToolTip.directive'
import type { ITooltipOptions } from '@/directives/ToolTip.directive'

const OPTIONS: ITooltipOptions = { header: 'Header', body: 'Body' }
const SHOW_DELAY = 400
const HIDE_DELAY = 150
const HIDE_ANIMATION = 200

const chips = () => document.querySelectorAll('span.nb-tooltip')

/**
 * Host that applies `v-nb-tooltip` to a span. `bump` forces a host
 * re-render; `inline` re-creates the binding object on every render so
 * the binding identity changes while its effective content does not,
 * which is the shape that used to force a synchronous layout per frame.
 */
const Anchor = defineComponent({
  props: {
    opts: {
      type: Object as () => ITooltipOptions | undefined,
      required: false,
      default: undefined,
    },
    bump: { type: Number, default: 0 },
    inline: { type: Boolean, default: false },
  },
  render() {
    const value =
      this.inline && this.opts ? { ...this.opts } : (this.opts as unknown)
    return withDirectives(
      h('span', { id: 'anchor', 'data-bump': this.bump }, 'anchor'),
      [[resolveDirective('nb-tooltip') as Directive, value]],
    )
  },
})

const mountAnchor = (props: Record<string, unknown> = {}) =>
  mount(Anchor, {
    props: { opts: OPTIONS, bump: 0, inline: false, ...props },
    global: { plugins: [tooltipDirective] },
    attachTo: document.body,
  })

const anchorEl = (wrapper: ReturnType<typeof mountAnchor>) =>
  wrapper.element as HTMLElement

describe('v-nb-tooltip lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('(a) leaves no chip after mouseenter -> mouseleave', () => {
    const wrapper = mountAnchor()
    const el = anchorEl(wrapper)

    el.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)

    el.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION)
    expect(chips().length).toBe(0)

    wrapper.unmount()
  })

  it('(b) rapid retriggers within the show delay leave exactly one chip', () => {
    const wrapper = mountAnchor()
    const el = anchorEl(wrapper)

    // Each retrigger lands inside the 400 ms window of the previous one.
    for (let i = 0; i < 10; i++) {
      el.dispatchEvent(new MouseEvent('mouseenter'))
      vi.advanceTimersByTime(100)
    }
    expect(chips().length).toBe(0)

    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)

    el.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION)
    expect(chips().length).toBe(0)

    wrapper.unmount()
  })

  it('(b2) retriggering after a chip is shown never stacks chips', () => {
    const wrapper = mountAnchor()
    const el = anchorEl(wrapper)

    for (let i = 0; i < 5; i++) {
      el.dispatchEvent(new MouseEvent('mouseenter'))
      vi.advanceTimersByTime(SHOW_DELAY)
      expect(chips().length).toBe(1)
    }

    el.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION)
    expect(chips().length).toBe(0)

    wrapper.unmount()
  })

  it('(c) re-rendering the host with an unchanged binding is O(1) layout', async () => {
    const wrapper = mountAnchor({ inline: true })
    const el = anchorEl(wrapper)

    el.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)

    // Count layout reads only for the re-render phase.
    const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect')

    const N = 500
    for (let i = 1; i <= N; i++) {
      await wrapper.setProps({ bump: i })
    }
    await nextTick()

    expect(spy).toHaveBeenCalledTimes(0)
    // Still exactly one chip, still shown.
    expect(chips().length).toBe(1)

    spy.mockRestore()
    wrapper.unmount()
  })

  it('(c2) a genuine content change still repositions', async () => {
    const wrapper = mountAnchor({ inline: true })
    const el = anchorEl(wrapper)

    el.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)

    const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect')
    await wrapper.setProps({ opts: { header: 'Header', body: 'Changed' } })

    expect(spy.mock.calls.length).toBeGreaterThan(0)
    expect(document.querySelector('.nb-tooltip-body')?.textContent).toBe(
      'Changed',
    )

    spy.mockRestore()
    wrapper.unmount()
  })

  it('(d) unmounting the anchor removes every chip it created', () => {
    const wrapper = mountAnchor()
    const el = anchorEl(wrapper)

    el.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)

    // A second show is pending when the anchor goes away.
    el.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(100)

    wrapper.unmount()
    expect(chips().length).toBe(0)

    // The pending show must not resurrect a chip on a dead anchor.
    vi.advanceTimersByTime(SHOW_DELAY + HIDE_DELAY + HIDE_ANIMATION)
    expect(chips().length).toBe(0)
  })

  it('(e) a shown chip reaps itself with no gesture and no dismissAllTooltips', () => {
    const wrapper = mountAnchor()
    const el = anchorEl(wrapper)

    // Hover, then the pointer goes away WITHOUT a mouseleave ever
    // firing (window switch, always-mounted chrome, anchor re-rendered
    // under a stationary cursor). Nothing else sweeps.
    el.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)

    vi.advanceTimersByTime(5000)
    expect(chips().length).toBe(0)

    wrapper.unmount()
  })

  it('(e2) a detached anchor cannot leave a chip behind', () => {
    const wrapper = mountAnchor()
    const el = anchorEl(wrapper)

    el.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)

    // Anchor ripped out of the document without the directive's
    // unmounted hook running (v-if inside a teleport, host crash).
    el.remove()
    vi.advanceTimersByTime(WATCHDOG_MAX_WAIT)
    expect(chips().length).toBe(0)

    wrapper.unmount()
  })

  it('setting the binding to a falsy value hides immediately', async () => {
    const wrapper = mountAnchor()
    const el = anchorEl(wrapper)

    el.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)

    await wrapper.setProps({ opts: undefined })
    expect(chips().length).toBe(0)

    wrapper.unmount()
  })
})

// Watchdog interval (1 s) times the miss budget (2), plus slack.
const WATCHDOG_MAX_WAIT = 3000
