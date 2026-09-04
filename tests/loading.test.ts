import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import Spinner from '../src/components/Spinner.vue'
import InlineLoading from '../src/components/InlineLoading.vue'
import Skeleton from '../src/components/Skeleton.vue'
import Modal from '../src/components/Modal.vue'
import Toaster from '../src/components/Toaster.vue'
import {
  markOverlayExempt,
  resetPageOverlays,
} from '../src/components/Spinner.overlay'
import {
  createToastQueue,
  resetToastQueue,
} from '../src/composables/useToast.composable'
import {
  resetScrollLock,
  scrollLockDepth,
} from '../src/composables/useScrollLock.composable'
import {
  announceLoadingComplete,
  loadingAnnouncerRegion,
  resetLoadingAnnouncer,
  suppressLoadingAnnouncement,
} from '../src/composables/useLoadingAnnouncer.composable'
import { useInlineLoading } from '../src/composables/useInlineLoading.composable'

/**
 * `prefers-reduced-motion` is a CSS media query, and the rules that answer it
 * live in the SFC where no test can meaningfully read them. Both components
 * therefore also mirror the preference onto a class, which is a real runtime
 * behaviour (it reacts to the OS setting changing while the page is open) and
 * is what these tests assert on. Reading the raw <style> text instead would
 * assert that a string exists in a source file, which is not the same claim.
 */
function stubReducedMotion(matches: boolean) {
  const original = window.matchMedia
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  return () => {
    window.matchMedia = original
  }
}

/**
 * NbSpinner's root is a <Teleport> (disabled unless overlay="page"), so the
 * wrapper covers a fragment rather than one element. Every assertion about the
 * spinner itself goes through its own node.
 */
function spinnerRoot(wrapper: ReturnType<typeof mount>) {
  return wrapper.get('.nb-spinner')
}

/** One macrotask, which is when a live region is filled in. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('NbSpinner', () => {
  it('announces itself as a polite status region', () => {
    const wrapper = mount(Spinner, { props: { label: 'Loading invoices' } })
    expect(spinnerRoot(wrapper).attributes('role')).toBe('status')
    expect(spinnerRoot(wrapper).attributes('aria-live')).toBe('polite')
  })

  it('mounts the live region empty and fills it a task later', async () => {
    // Inserted and filled in the same frame is the announcement that gets
    // missed: there is no previous content for assistive tech to diff
    // against, so nothing is reported as having changed.
    const wrapper = mount(Spinner, { props: { label: 'Loading invoices' } })
    expect(wrapper.find('.nb-spinner__announcement').text()).toBe('')

    await settle()
    expect(wrapper.find('.nb-spinner__announcement').text()).toBe(
      'Loading invoices',
    )
  })

  it('keeps the visible label out of the accessibility tree', async () => {
    // The visible text and the announced text are separate nodes. If the
    // visible one were also exposed, the label would be read twice.
    const wrapper = mount(Spinner, {
      props: { label: 'Loading invoices', showLabel: true },
    })
    await settle()
    const visible = wrapper.find('.nb-spinner__label')
    expect(visible.text()).toBe('Loading invoices')
    expect(visible.attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.nb-spinner__announcement').text()).toBe(
      'Loading invoices',
    )
  })

  it('shows no visible text until showLabel is set', () => {
    expect(mount(Spinner).find('.nb-spinner__label').exists()).toBe(false)
    expect(
      mount(Spinner, { props: { showLabel: true } })
        .find('.nb-spinner__label')
        .exists(),
    ).toBe(true)
  })

  it('keeps the ring itself out of the accessibility tree', () => {
    const wrapper = mount(Spinner)
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('svg').attributes('focusable')).toBe('false')
  })

  it('drops the role and the label when decorative', () => {
    const wrapper = mount(Spinner, { props: { decorative: true } })
    expect(spinnerRoot(wrapper).attributes('role')).toBeUndefined()
    expect(spinnerRoot(wrapper).attributes('aria-live')).toBeUndefined()
    expect(spinnerRoot(wrapper).attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.nb-spinner__label').exists()).toBe(false)
  })

  it('carries size, tone and overlay as classes', () => {
    const wrapper = mount(Spinner, {
      props: { size: 'lg', tone: 'inherit', overlay: 'container' },
    })
    expect(spinnerRoot(wrapper).classes()).toContain('nb-spinner--lg')
    expect(spinnerRoot(wrapper).classes()).toContain('nb-spinner--tone-inherit')
    expect(spinnerRoot(wrapper).classes()).toContain(
      'nb-spinner--overlay-container',
    )
  })

  it('passes a caller class through to the ring despite the teleport root', () => {
    // The root is a <Teleport>, which has no element for Vue to fall
    // attributes through to, so the component rebinds $attrs by hand. NbButton
    // and NbInlineLoading both style the nested spinner this way.
    const wrapper = mount(Spinner, {
      attrs: { class: 'row-status__spinner', 'data-testid': 'saving' },
    })
    expect(spinnerRoot(wrapper).classes()).toContain('row-status__spinner')
    expect(spinnerRoot(wrapper).classes()).toContain('nb-spinner')
    expect(spinnerRoot(wrapper).attributes('data-testid')).toBe('saving')
  })

  describe('delay', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('renders nothing at all until the delay elapses', async () => {
      const wrapper = mount(Spinner, { props: { delay: 300 } })
      // Nothing in the DOM means nothing in the accessibility tree either, so
      // an operation that finishes inside the delay never announces a load.
      expect(wrapper.find('.nb-spinner').exists()).toBe(false)

      vi.advanceTimersByTime(300)
      await nextTick()
      expect(wrapper.find('.nb-spinner').exists()).toBe(true)
    })

    it('renders immediately without a delay', () => {
      expect(mount(Spinner).find('.nb-spinner').exists()).toBe(true)
    })

    it('re-arms when the delay prop changes before it fires', async () => {
      const wrapper = mount(Spinner, { props: { delay: 300 } })
      await wrapper.setProps({ delay: 1000 })

      vi.advanceTimersByTime(300)
      await nextTick()
      expect(wrapper.find('.nb-spinner').exists()).toBe(false)

      vi.advanceTimersByTime(700)
      await nextTick()
      expect(wrapper.find('.nb-spinner').exists()).toBe(true)
    })

    it('shows immediately when the delay is dropped to zero', async () => {
      const wrapper = mount(Spinner, { props: { delay: 300 } })
      await wrapper.setProps({ delay: 0 })
      expect(wrapper.find('.nb-spinner').exists()).toBe(true)
    })

    it('never takes an already visible spinner back out of the tree', async () => {
      // Removing an announced indicator to re-delay it is worse than leaving
      // it: the live region has already spoken.
      const wrapper = mount(Spinner, { props: { delay: 0 } })
      await wrapper.setProps({ delay: 5000 })
      expect(wrapper.find('.nb-spinner').exists()).toBe(true)
    })

    it('clears its pending timer on unmount', () => {
      const wrapper = mount(Spinner, { props: { delay: 300 } })
      wrapper.unmount()
      expect(() => vi.advanceTimersByTime(600)).not.toThrow()
    })
  })

  it('marks itself reduced-motion so the arc can breathe instead of freezing', () => {
    const restore = stubReducedMotion(true)
    try {
      // The class is the hook the SFC uses to swap rotation for a fade. A
      // frozen crescent reads as a hung process, which is the exact message
      // the component exists to disprove, so the branch swaps the animation
      // rather than cancelling it.
      expect(spinnerRoot(mount(Spinner)).classes()).toContain(
        'nb-spinner--reduced-motion',
      )
    } finally {
      restore()
    }
  })

  it('carries no reduced-motion class when the user has not asked for one', () => {
    const restore = stubReducedMotion(false)
    try {
      expect(spinnerRoot(mount(Spinner)).classes()).not.toContain(
        'nb-spinner--reduced-motion',
      )
    } finally {
      restore()
    }
  })

  describe('the page overlay', () => {
    let opener: HTMLButtonElement

    beforeEach(() => {
      opener = document.createElement('button')
      opener.textContent = 'Switch tenant'
      document.body.appendChild(opener)
      opener.focus()
    })

    afterEach(() => {
      resetPageOverlays()
      document.body.style.overflow = ''
      document.body.innerHTML = ''
    })

    const mountPage = (props: Record<string, unknown> = {}) =>
      mount(Spinner, {
        props: { overlay: 'page', label: 'Switching tenant', ...props },
        attachTo: document.body,
      })

    const overlayEl = () =>
      document.body.querySelector<HTMLElement>('.nb-spinner--overlay-page')

    it('teleports out of its parent so `fixed` cannot be captured', () => {
      // position: fixed resolves against the nearest transformed, filtered or
      // contained ancestor. A sidebar with a transition on it is enough to pin
      // a "page" overlay inside the sidebar, so the node leaves the tree.
      const wrapper = mountPage()
      const el = overlayEl()
      expect(el).not.toBeNull()
      expect(el?.parentElement).toBe(document.body)
      expect(wrapper.element.contains(el as Node)).toBe(false)
    })

    it('takes focus itself and marks the application inert', () => {
      // `inert` is the containment, not a focusin listener that pulls focus
      // back. The attribute removes the subtree from the tab order, from hit
      // testing and from the accessibility tree in one move, and it cannot get
      // into a fight with a widget that refocuses itself.
      mountPage()
      const el = overlayEl() as HTMLElement
      expect(document.activeElement).toBe(el)
      expect(opener.hasAttribute('inert')).toBe(true)
      expect(el.hasAttribute('inert')).toBe(false)
    })

    it('marks the rest of the document inert and restores it afterwards', () => {
      const wrapper = mountPage()
      expect(opener.hasAttribute('inert')).toBe(true)
      expect(overlayEl()?.hasAttribute('inert')).toBe(false)

      wrapper.unmount()
      expect(opener.hasAttribute('inert')).toBe(false)
    })

    it('locks body scroll while it is up and restores the previous value', () => {
      document.body.style.overflow = 'auto'
      const wrapper = mountPage()
      expect(document.body.style.overflow).toBe('hidden')

      wrapper.unmount()
      expect(document.body.style.overflow).toBe('auto')
    })

    it('holds one share of the counted lock, not a second lock of its own', () => {
      const wrapper = mountPage()
      expect(scrollLockDepth()).toBe(1)
      wrapper.unmount()
      expect(scrollLockDepth()).toBe(0)
    })

    it('returns focus to whatever started the work', () => {
      const wrapper = mountPage()
      expect(document.activeElement).not.toBe(opener)

      wrapper.unmount()
      expect(document.activeElement).toBe(opener)
    })

    it('falls back to something focusable that survived', () => {
      // The work an overlay covers routinely deletes the control that started
      // it. The fallback only ever lands on an element that could already take
      // focus: nothing here writes tabindex into a tree we do not own.
      const row = document.createElement('div')
      const remove = document.createElement('button')
      const undo = document.createElement('button')
      row.append(remove, undo)
      document.body.appendChild(row)
      remove.focus()

      const wrapper = mountPage()
      remove.remove()
      wrapper.unmount()

      expect(document.activeElement).toBe(undo)
      expect(row.hasAttribute('tabindex')).toBe(false)
    })

    it('leaves focus alone when nothing focusable survived', () => {
      const row = document.createElement('div')
      const button = document.createElement('button')
      row.appendChild(button)
      document.body.appendChild(row)
      button.focus()

      const wrapper = mountPage()
      button.remove()
      wrapper.unmount()

      // The alternative is writing tabindex="-1" onto the consumer's div,
      // which outlives the spinner and turns an ordinary container into a
      // permanent focus target.
      expect(row.hasAttribute('tabindex')).toBe(false)
      expect(document.activeElement).toBe(document.body)
    })

    it('lets only the first of two overlays paint the scrim', async () => {
      const first = mountPage()
      const second = mountPage({ label: 'Reloading workspace' })
      await nextTick()

      const overlays = Array.from(
        document.body.querySelectorAll('.nb-spinner--overlay-page'),
      )
      expect(overlays).toHaveLength(2)
      expect(
        overlays.filter((el) =>
          el.classList.contains('nb-spinner--overlay-stacked'),
        ),
      ).toHaveLength(1)

      // The survivor takes over the paint rather than blocking invisibly.
      first.unmount()
      await nextTick()
      const survivor = overlayEl() as HTMLElement
      expect(survivor.classList.contains('nb-spinner--overlay-stacked')).toBe(
        false,
      )

      second.unmount()
      expect(document.body.style.overflow).toBe('')
    })

    it('keeps the page inert until the last overlay has gone', () => {
      // Both overlays inerted the same opener. Counting owners is what stops
      // the first release from unblocking half the application underneath a
      // scrim that is still up.
      const first = mountPage()
      const second = mountPage()
      expect(opener.hasAttribute('inert')).toBe(true)

      first.unmount()
      expect(opener.hasAttribute('inert')).toBe(true)
      expect(scrollLockDepth()).toBe(1)

      second.unmount()
      expect(opener.hasAttribute('inert')).toBe(false)
      expect(scrollLockDepth()).toBe(0)
    })

    it('claims nothing at all while its delay is still running', async () => {
      vi.useFakeTimers()
      try {
        mountPage({ delay: 300 })
        expect(overlayEl()).toBeNull()
        expect(opener.hasAttribute('inert')).toBe(false)

        vi.advanceTimersByTime(300)
        await nextTick()
        await nextTick()
        expect(overlayEl()).not.toBeNull()
        expect(opener.hasAttribute('inert')).toBe(true)
      } finally {
        vi.useRealTimers()
      }
    })

    it('leaves an inline spinner out of all of it', () => {
      mount(Spinner, { attachTo: document.body })
      expect(document.body.style.overflow).not.toBe('hidden')
      expect(opener.hasAttribute('inert')).toBe(false)
    })

    it('keeps a name on the scrim even when asked to be decorative', async () => {
      // A page overlay is the element holding focus and the only thing on the
      // screen. aria-hidden on it would leave a screen reader user focused on
      // a node that reports nothing, so `decorative` does not apply here.
      mountPage({ decorative: true })
      const el = overlayEl() as HTMLElement
      expect(el.getAttribute('aria-hidden')).toBeNull()
      expect(el.getAttribute('role')).toBe('status')
      await settle()
      expect(el.querySelector('.nb-spinner__announcement')?.textContent).toBe(
        'Switching tenant',
      )
    })

    describe('what arrives after the claim', () => {
      // The rule is document order, and it is the same rule NbModal uses to
      // decide which dialog answers Escape. A page overlay blocks the
      // application as it stood when it went up; anything appended to <body>
      // afterwards paints above it (equal z-index, later in the tree) and is
      // left reachable, because an element that is painted on top and cannot
      // be focused is worse than no containment at all.

      it('leaves a dialog opened on top of it usable', async () => {
        const wrapper = mountPage()

        const dialog = document.createElement('div')
        dialog.setAttribute('role', 'dialog')
        dialog.setAttribute('aria-modal', 'true')
        const input = document.createElement('input')
        dialog.appendChild(input)
        document.body.appendChild(dialog)
        await settle()

        // The assertion the previous design could not make: not inert, so in a
        // real browser the input can actually take focus.
        expect(dialog.hasAttribute('inert')).toBe(false)
        input.focus()
        expect(document.activeElement).toBe(input)

        wrapper.unmount()
        // And releasing does not yank the user back out of it.
        expect(document.activeElement).toBe(input)
        dialog.remove()
      })

      it('blocks a dialog that was already open when it claimed', () => {
        const dialog = document.createElement('div')
        dialog.setAttribute('role', 'dialog')
        dialog.setAttribute('aria-modal', 'true')
        document.body.appendChild(dialog)

        const wrapper = mountPage()
        expect(dialog.hasAttribute('inert')).toBe(true)

        wrapper.unmount()
        expect(dialog.hasAttribute('inert')).toBe(false)
      })

      it('leaves an inert the application set for its own reasons alone', () => {
        const theirs = document.createElement('div')
        theirs.setAttribute('inert', '')
        document.body.appendChild(theirs)

        const wrapper = mountPage()
        wrapper.unmount()

        // Ours to remove only if ours to add.
        expect(theirs.hasAttribute('inert')).toBe(true)
      })
    })

    it('keeps a way out of the block reachable', async () => {
      // A page overlay whose request never resolves is an application the user
      // cannot leave. The default slot is the escape hatch, and it has to be
      // genuinely operable: the overlay subtree is the one part of the page
      // that is not inert, and the control sits above the scrim it belongs to.
      const wrapper = mount(Spinner, {
        props: { overlay: 'page', label: 'Switching tenant' },
        slots: { default: '<button type="button">Cancel</button>' },
        attachTo: document.body,
      })
      await nextTick()

      const cancel = overlayEl()?.querySelector('button') as HTMLButtonElement
      expect(cancel).not.toBeNull()
      expect(cancel.closest('[inert]')).toBeNull()
      cancel.focus()
      expect(document.activeElement).toBe(cancel)

      // Not part of the announced status: it is a control, not the sentence.
      expect(cancel.closest('[aria-live="off"]')).not.toBeNull()

      wrapper.unmount()
    })

    it('renders no actions container when nothing is slotted', () => {
      const wrapper = mountPage()
      expect(overlayEl()?.querySelector('.nb-spinner__actions')).toBeNull()
      wrapper.unmount()
    })

    describe('what it must never block', () => {
      // The rule above has one exception, and getting it wrong is the worst
      // failure in this file: `inert` removes a subtree from the accessibility
      // tree as well as from the tab order, so a live region caught by the
      // snapshot is painted above the scrim (toasts sit 50 layers above it by
      // token) and silent. "Session expired" would be on screen and unspoken,
      // for exactly the user who cannot see it.
      //
      // The contract is one attribute, data-nb-overlay-exempt, so an
      // application can opt its own announcer out without knowing anything
      // about this module.

      const NbIconStub = {
        name: 'NbIcon',
        props: ['name', 'size'],
        template: '<i></i>',
      }

      afterEach(() => {
        resetToastQueue()
      })

      it('leaves a toast raised during the overlay announced and reachable', async () => {
        // The whole defect, end to end, with the real Toaster: the announcer
        // is mounted for the life of the host, so it is a body child at claim
        // time and the snapshot would otherwise take it.
        const queue = createToastQueue()
        const toaster = mount(Toaster, {
          props: { queue },
          attachTo: document.body,
          global: { stubs: { NbIcon: NbIconStub } },
        })
        await nextTick()

        const announcer = document.body.querySelector<HTMLElement>(
          '.nb-toaster__announcer',
        )
        expect(announcer).not.toBeNull()

        const spinner = mountPage()
        expect(announcer?.hasAttribute('inert')).toBe(false)
        expect(announcer?.closest('[inert]')).toBeNull()

        let undone = false
        queue.error('Session expired', {
          cta: { label: 'Sign in again', action: () => (undone = true) },
        })
        await nextTick()
        await nextTick()
        await nextTick()

        // Announced: the region has the text, and nothing between it and the
        // document is inert, so a screen reader still reports it.
        const assertive = announcer?.querySelector('[aria-live="assertive"]')
        expect(assertive?.textContent).toContain('Session expired')

        // And reachable: the toast's own action can still take focus, which is
        // what makes the message actionable rather than decoration.
        const stack = document.body.querySelector<HTMLElement>('.nb-toaster')
        expect(stack?.closest('[inert]')).toBeNull()
        const action = stack?.querySelector('button')
        expect(action).not.toBeNull()
        action?.focus()
        expect(document.activeElement).toBe(action)
        action?.click()
        expect(undone).toBe(true)

        spinner.unmount()
        toaster.unmount()
      })

      it('exempts any host that carries the attribute, whoever mounted it', () => {
        // The contract an application uses for its own live region. No class
        // name, no import: one attribute read at claim time.
        const region = document.createElement('div')
        region.setAttribute('data-nb-overlay-exempt', '')
        region.setAttribute('role', 'status')
        document.body.appendChild(region)

        const wrapper = mountPage()
        expect(region.hasAttribute('inert')).toBe(false)
        wrapper.unmount()
        region.remove()
      })

      it('marks and unmarks a host through markOverlayExempt', () => {
        const region = document.createElement('div')
        document.body.appendChild(region)

        const undo = markOverlayExempt(region)
        const first = mountPage()
        expect(region.hasAttribute('inert')).toBe(false)
        first.unmount()

        undo()
        expect(region.hasAttribute('data-nb-overlay-exempt')).toBe(false)
        const second = mountPage()
        expect(region.hasAttribute('inert')).toBe(true)
        second.unmount()
        region.remove()
      })

      it('descends into a wrapper rather than blocking the announcer inside it', () => {
        // A toaster teleported into a host of the application's own. The
        // wrapper cannot be blocked whole without silencing what is in it, so
        // the question is asked again of each child: the announcer stays live,
        // its siblings do not.
        const wrapper = document.createElement('div')
        const announcer = document.createElement('div')
        announcer.setAttribute('data-nb-overlay-exempt', '')
        const sibling = document.createElement('button')
        wrapper.append(sibling, announcer)
        document.body.appendChild(wrapper)

        const spinner = mountPage()
        expect(wrapper.hasAttribute('inert')).toBe(false)
        expect(announcer.hasAttribute('inert')).toBe(false)
        expect(sibling.hasAttribute('inert')).toBe(true)

        spinner.unmount()
        expect(sibling.hasAttribute('inert')).toBe(false)
        wrapper.remove()
      })

      it('still exempts the library announcers when the attribute is absent', () => {
        // The floor under the contract. A Toaster from an older build carries
        // no attribute, and a silent toast is a worse outcome than a slightly
        // over-permissive snapshot, so the class name is honoured too.
        const legacy = document.createElement('div')
        legacy.className = 'nb-toaster__announcer'
        document.body.appendChild(legacy)

        const wrapper = mountPage()
        expect(legacy.hasAttribute('inert')).toBe(false)
        wrapper.unmount()
        legacy.remove()
      })

      it('keeps the shared completion announcer speaking under the scrim', async () => {
        // The other half of the same defect: a spinner elsewhere on the page
        // finishes while the overlay is up, and "Invoices loaded" goes to the
        // shared region. It exists before the claim, so the snapshot sees it.
        announceLoadingComplete('Invoices loaded')
        const region = loadingAnnouncerRegion() as HTMLElement
        expect(region).not.toBeNull()

        const wrapper = mountPage()
        expect(region.hasAttribute('inert')).toBe(false)
        expect(region.closest('[inert]')).toBeNull()

        await new Promise((resolve) => setTimeout(resolve, 80))
        expect(region.textContent).toBe('Invoices loaded')

        wrapper.unmount()
        resetLoadingAnnouncer()
      })

      it('blocks an exempt host buried deeper than the descent limit', () => {
        // Honest about the limit: the walk stops after eight levels, because
        // the alternative is an unbounded query over the whole application on
        // every claim. Anything exempt that deep is treated as part of the
        // page, which is the safe direction to be wrong in.
        let node = document.createElement('div')
        const outermost = node
        for (let depth = 0; depth < 10; depth++) {
          const child = document.createElement('div')
          node.appendChild(child)
          node = child
        }
        node.setAttribute('data-nb-overlay-exempt', '')
        document.body.appendChild(outermost)

        const wrapper = mountPage()
        // The leaf is inside a blocked branch: the walk gave up above it.
        expect(node.closest('[inert]')).not.toBeNull()

        wrapper.unmount()
        outermost.remove()
      })
    })

    describe('sharing the page with NbModal', () => {
      // The sequence that used to leave the page permanently unscrollable with
      // nothing on screen: two owners of body overflow, neither counting.
      it('hands the scrollbar back exactly once, whatever the order', async () => {
        document.body.style.overflow = ''

        const spinner = mountPage()
        expect(document.body.style.overflow).toBe('hidden')

        const modal = mount(Modal, {
          props: { open: true, title: 'Session expired' },
          attachTo: document.body,
        })
        await nextTick()
        expect(scrollLockDepth()).toBe(2)

        // The save finishes while the dialog is still open.
        spinner.unmount()
        await nextTick()
        expect(document.body.style.overflow).toBe('hidden')

        modal.unmount()
        await nextTick()
        expect(document.body.style.overflow).toBe('')
        expect(scrollLockDepth()).toBe(0)
      })
    })
  })

  describe('the container overlay', () => {
    // A scrim that stops the mouse and nothing else is the most common
    // hand-rolled loading bug in the audit: the region looks unavailable, and
    // a keyboard user tabs straight into it and submits the form underneath.
    // The region is a real component, because the thing being contained is
    // the spinner's DOM parent: whatever the consumer positioned.
    const Panel = defineComponent({
      components: { Spinner },
      props: { overlay: { type: String, default: 'container' } },
      template: `
        <div class="panel" style="position: relative">
          <form><input /></form>
          <Spinner :overlay="overlay" label="Reloading chart" />
        </div>
      `,
    })

    function mountRegion(props: Record<string, unknown> = {}) {
      const wrapper = mount(Panel, { props, attachTo: document.body })
      const host = wrapper.get('.panel').element as HTMLElement
      const form = host.querySelector('form') as HTMLElement
      return { host, form, wrapper }
    }

    afterEach(() => {
      resetPageOverlays()
      resetScrollLock()
      document.body.innerHTML = ''
    })

    it('blocks the region it covers rather than only shading it', () => {
      const { host, form, wrapper } = mountRegion()
      expect(host.getAttribute('aria-busy')).toBe('true')
      expect(form.hasAttribute('inert')).toBe(true)
      expect(host.querySelector('.nb-spinner')?.hasAttribute('inert')).toBe(
        false,
      )

      wrapper.unmount()
      expect(host.hasAttribute('aria-busy')).toBe(false)
      expect(form.hasAttribute('inert')).toBe(false)
    })

    it('puts an aria-busy the consumer already had back as it was', async () => {
      const { host, wrapper } = mountRegion({ overlay: 'none' })
      host.setAttribute('aria-busy', 'false')

      await wrapper.setProps({ overlay: 'container' })
      await nextTick()
      expect(host.getAttribute('aria-busy')).toBe('true')

      wrapper.unmount()
      // Restoring by removal would change what the application said.
      expect(host.getAttribute('aria-busy')).toBe('false')
    })

    it('never touches the page scroll lock', () => {
      const { wrapper } = mountRegion()
      expect(scrollLockDepth()).toBe(0)
      expect(document.body.style.overflow).not.toBe('hidden')
      wrapper.unmount()
    })

    it('says so in development when the covered parent is static', () => {
      // `absolute; inset: 0` resolves against the nearest positioned ancestor,
      // so a static parent shades some ancestor further up while only the
      // parent is blocked: the scrim and the containment end up on two
      // different elements. It reads as a styling mistake, so it gets reported
      // as one, and the fix is one line in the consumer.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const Static = defineComponent({
        components: { Spinner },
        template: `
          <div class="panel"><Spinner overlay="container" /></div>
        `,
      })
      const wrapper = mount(Static, { attachTo: document.body })
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('position: relative'),
      )
      wrapper.unmount()
      warn.mockRestore()
    })

    it('stays quiet when the parent is positioned', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { wrapper } = mountRegion()
      expect(warn).not.toHaveBeenCalled()
      wrapper.unmount()
      warn.mockRestore()
    })

    it('releases the region when the mode changes to inline', async () => {
      const { host, form, wrapper } = mountRegion()
      await wrapper.setProps({ overlay: 'none' })
      await nextTick()
      expect(form.hasAttribute('inert')).toBe(false)
      expect(host.hasAttribute('aria-busy')).toBe(false)
      wrapper.unmount()
    })
  })

  describe('announcing completion', () => {
    // The unmount IS the completion: the live region that said "loading" is
    // removed at the moment the content arrives, so a screen reader user gets
    // silence unless someone else speaks.
    afterEach(() => {
      resetLoadingAnnouncer()
      vi.useRealTimers()
    })

    it('speaks completeLabel through a region that outlives the spinner', () => {
      vi.useFakeTimers()
      const wrapper = mount(Spinner, {
        props: { label: 'Loading invoices', completeLabel: 'Invoices loaded' },
      })
      wrapper.unmount()

      const region = loadingAnnouncerRegion() as HTMLElement
      expect(region).not.toBeNull()
      expect(region.getAttribute('aria-live')).toBe('polite')
      // Written on a later task: a region filled in the same frame it is
      // inserted is routinely missed.
      expect(region.textContent).toBe('')

      vi.advanceTimersByTime(60)
      expect(region.textContent).toBe('Invoices loaded')
    })

    it('says nothing when the spinner never became visible', () => {
      vi.useFakeTimers()
      const wrapper = mount(Spinner, {
        props: { delay: 300, completeLabel: 'Invoices loaded' },
      })
      // The request beat the delay, so no load was ever announced and there is
      // no completion to report.
      wrapper.unmount()
      vi.advanceTimersByTime(300)
      expect(loadingAnnouncerRegion()).toBeNull()
    })

    it('stays silent for a decorative spinner', () => {
      vi.useFakeTimers()
      const wrapper = mount(Spinner, {
        props: { decorative: true, completeLabel: 'Saved' },
      })
      wrapper.unmount()
      vi.advanceTimersByTime(60)
      expect(loadingAnnouncerRegion()).toBeNull()
    })

    it('re-speaks the same message by clearing the region first', () => {
      vi.useFakeTimers()
      announceLoadingComplete('Comments loaded')
      vi.advanceTimersByTime(60)
      const region = loadingAnnouncerRegion() as HTMLElement
      expect(region.textContent).toBe('Comments loaded')

      announceLoadingComplete('Comments loaded')
      // Cleared synchronously, so the second write is a real change and is
      // spoken rather than swallowed as a no-op.
      expect(region.textContent).toBe('')
      vi.advanceTimersByTime(60)
      expect(region.textContent).toBe('Comments loaded')
    })
  })
})

describe('NbInlineLoading', () => {
  const mountInline = (props = {}) => mount(InlineLoading, { props })

  it('renders an empty live region while inactive', () => {
    const wrapper = mountInline()
    // The node has to exist before the first message lands in it, or the
    // announcement is unreliable. It is silenced with aria-live="off" instead.
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-live')).toBe('off')
    expect(wrapper.find('.nb-inline-loading__text').text()).toBe('')
    expect(wrapper.findComponent(Spinner).exists()).toBe(false)
  })

  it('shows a decorative spinner and the active label while active', () => {
    const wrapper = mountInline({ status: 'active', label: 'Saving contact' })
    expect(wrapper.attributes('aria-live')).toBe('polite')
    expect(wrapper.find('.nb-inline-loading__text').text()).toBe(
      'Saving contact',
    )
    // One announcement, not two: the nested spinner must stay silent.
    expect(wrapper.findComponent(Spinner).props('decorative')).toBe(true)
  })

  it('confirms success with an icon and past-tense text', () => {
    const wrapper = mountInline({
      status: 'finished',
      finishedLabel: 'Contact saved',
    })
    expect(
      wrapper.find('[data-testid="nb-icon"]').attributes('data-name'),
    ).toBe('check-circle')
    expect(wrapper.find('.nb-inline-loading__text').text()).toBe(
      'Contact saved',
    )
    expect(wrapper.classes()).toContain('nb-inline-loading--finished')
  })

  it('interrupts for errors but not for progress', () => {
    expect(mountInline({ status: 'error' }).attributes('aria-live')).toBe(
      'assertive',
    )
    expect(mountInline({ status: 'active' }).attributes('aria-live')).toBe(
      'polite',
    )
    expect(mountInline({ status: 'finished' }).attributes('aria-live')).toBe(
      'polite',
    )
  })

  it('shows the error icon and label on failure', () => {
    const wrapper = mountInline({
      status: 'error',
      errorLabel: 'Could not reach the server',
    })
    expect(
      wrapper.find('[data-testid="nb-icon"]').attributes('data-name'),
    ).toBe('warning-circle')
    expect(wrapper.find('.nb-inline-loading__text').text()).toBe(
      'Could not reach the server',
    )
  })

  it('reserves width for the longest label so the row cannot jump', () => {
    const wrapper = mountInline({
      label: 'Saving',
      finishedLabel: 'Saved',
      errorLabel: 'Could not save',
    })
    expect(wrapper.attributes('style')).toContain(
      '--nb-inline-loading-reserve: 15ch',
    )
  })

  it('reserves nothing when reserveSpace is off', () => {
    const wrapper = mountInline({ reserveSpace: false })
    expect(wrapper.attributes('style')).toBeUndefined()
  })

  describe('the success dwell', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('holds the confirmation for the dwell before emitting success', async () => {
      const wrapper = mountInline({ status: 'inactive', dwell: 1600 })
      await wrapper.setProps({ status: 'finished' })

      vi.advanceTimersByTime(1599)
      expect(wrapper.emitted('success')).toBeUndefined()

      vi.advanceTimersByTime(1)
      expect(wrapper.emitted('success')).toHaveLength(1)
    })

    it('does not arm the dwell for any other status', async () => {
      const wrapper = mountInline({ status: 'active' })
      vi.advanceTimersByTime(5000)
      await wrapper.setProps({ status: 'error' })
      vi.advanceTimersByTime(5000)
      expect(wrapper.emitted('success')).toBeUndefined()
    })

    it('cancels a pending dwell when a second run starts', async () => {
      const wrapper = mountInline({ status: 'finished', dwell: 1600 })
      vi.advanceTimersByTime(800)
      // Second save begins before the first confirmation faded.
      await wrapper.setProps({ status: 'active' })
      vi.advanceTimersByTime(5000)
      expect(wrapper.emitted('success')).toBeUndefined()
    })

    it('does not emit after unmount', () => {
      const wrapper = mountInline({ status: 'finished' })
      wrapper.unmount()
      vi.advanceTimersByTime(5000)
      expect(wrapper.emitted('success')).toBeUndefined()
    })
  })

  describe('the default slot', () => {
    it('replaces the resolved text so a failure can offer a way out', () => {
      const wrapper = mount(InlineLoading, {
        props: { status: 'error', errorLabel: 'Could not save' },
        slots: {
          default: `<template #default="{ status, text }">
            <span>{{ text }}</span>
            <button v-if="status === 'error'" type="button">Retry</button>
          </template>`,
        },
      })

      // The string prop is still the default, and it is still what the slot
      // is handed, so adopting the slot does not mean restating the copy.
      expect(wrapper.find('.nb-inline-loading__text').text()).toContain(
        'Could not save',
      )
      expect(wrapper.find('button').text()).toBe('Retry')
    })

    it('still resolves the strings when no slot is given', () => {
      expect(
        mountInline({ status: 'finished', finishedLabel: 'Saved' }).text(),
      ).toBe('Saved')
    })
  })
})

describe('useInlineLoading', () => {
  it('walks a successful action from active to finished', async () => {
    const state = useInlineLoading()
    let resolveAction: (value: string) => void = () => {}
    const pending = state.run(
      () =>
        new Promise<string>((resolve) => {
          resolveAction = resolve
        }),
    )

    expect(state.status.value).toBe('active')
    resolveAction('saved')
    await expect(pending).resolves.toBe('saved')
    expect(state.status.value).toBe('finished')
  })

  it('absorbs a rejection into the error state rather than rethrowing', async () => {
    const onError = vi.fn()
    const state = useInlineLoading({ onError })
    const reason = new Error('offline')

    await expect(
      state.run(() => Promise.reject(reason)),
    ).resolves.toBeUndefined()
    expect(state.status.value).toBe('error')
    expect(state.error.value).toBe(reason)
    expect(onError).toHaveBeenCalledWith(reason)
  })

  it('lets only the newest run write the status', async () => {
    const state = useInlineLoading()
    let failFirst: (reason: Error) => void = () => {}

    const first = state.run(
      () =>
        new Promise<void>((_resolve, reject) => {
          failFirst = reject
        }),
    )
    const second = state.run(() => Promise.resolve('second'))
    await second

    failFirst(new Error('slow failure landing late'))
    await first
    await flushPromises()

    expect(state.status.value).toBe('finished')
    expect(state.error.value).toBeNull()
  })

  it('suppresses a completion announcement when the run fails', async () => {
    // Getting this right by hand means remembering, in every catch, that an
    // indicator somewhere else is about to claim the load succeeded. The
    // composable owns the sequence, so it owns this too.
    vi.useFakeTimers()
    try {
      resetLoadingAnnouncer()
      const skeleton = mount(Skeleton, {
        props: { label: 'Loading comments', completeLabel: 'Comments loaded' },
      })

      const loading = useInlineLoading()
      await loading.run(() => Promise.reject(new Error('offline')))
      skeleton.unmount()

      vi.advanceTimersByTime(60)
      expect(loadingAnnouncerRegion()?.textContent ?? '').toBe('')
    } finally {
      resetLoadingAnnouncer()
      vi.useRealTimers()
    }
  })

  it('resets back to inactive', async () => {
    const state = useInlineLoading()
    await state.run(() => Promise.resolve(1))
    state.reset()
    expect(state.status.value).toBe('inactive')
    expect(state.error.value).toBeNull()
  })
})

describe('NbSkeleton', () => {
  const mountSkeleton = (props = {}) => mount(Skeleton, { props })

  it('is invisible to assistive tech unless it carries a label', async () => {
    const silent = mountSkeleton()
    expect(silent.attributes('aria-hidden')).toBe('true')
    expect(silent.attributes('role')).toBeUndefined()

    const announced = mountSkeleton({ label: 'Loading contacts' })
    expect(announced.attributes('aria-hidden')).toBeUndefined()
    expect(announced.attributes('role')).toBe('status')

    // Empty on first paint, filled a task later: the same rule the spinner
    // and the shared announcer follow.
    expect(announced.find('.nb-skeleton__label').text()).toBe('')
    await settle()
    expect(announced.find('.nb-skeleton__label').text()).toBe(
      'Loading contacts',
    )
  })

  it('keeps aria-busy off the live region so the label is actually spoken', () => {
    const wrapper = mountSkeleton({ label: 'Loading contacts' })
    // aria-busy on a live region tells assistive tech to withhold updates
    // until it clears, and a skeleton is unmounted rather than flipped to
    // busy=false, so the announcement would never arrive. It sits on the
    // shapes, which are the content being built.
    expect(wrapper.attributes('aria-busy')).toBeUndefined()
    expect(wrapper.find('.nb-skeleton__lines').attributes('aria-busy')).toBe(
      'true',
    )
  })

  it('borrows monospaced metrics for code placeholders', () => {
    // A JSON viewer measured with body metrics is a different height from the
    // code that lands in it, which is the shift the component exists to stop.
    const style = mountSkeleton({ type: 'code-md', lines: 6 }).attributes(
      'style',
    )
    expect(style).toContain(
      '--nb-skeleton-font-size: var(--nb-type-code-md-size)',
    )
    expect(style).toContain(
      '--nb-skeleton-line-height: var(--nb-type-code-md-line-height)',
    )
  })

  it('sizes text lines from the type set so the swap cannot shift layout', () => {
    const style = mountSkeleton({ type: 'body-sm' }).attributes('style')
    expect(style).toContain(
      '--nb-skeleton-font-size: var(--nb-type-body-sm-size)',
    )
    expect(style).toContain(
      '--nb-skeleton-line-height: var(--nb-type-body-sm-line-height)',
    )
  })

  it('defaults text to body-md and headings to heading-02', () => {
    expect(mountSkeleton().attributes('style')).toContain(
      'var(--nb-type-body-md-size)',
    )
    expect(mountSkeleton({ variant: 'heading' }).attributes('style')).toContain(
      'var(--nb-type-heading-02-size)',
    )
  })

  it('falls back to a real type set when given an unknown one', () => {
    // An unchecked name would resolve to an empty custom property and collapse
    // the line to zero height, which is the shift the component prevents.
    const style = mountSkeleton({
      type: 'body-xl' as unknown as 'body-md',
    }).attributes('style')
    expect(style).toContain('var(--nb-type-body-md-size)')
  })

  it('renders one element per line and shortens only the last', () => {
    const wrapper = mountSkeleton({ lines: 3, lastLineWidth: '45%' })
    const fills = wrapper.findAll('.nb-skeleton__fill')
    expect(fills).toHaveLength(3)
    expect(fills[0].attributes('style')).toBeUndefined()
    expect(fills[2].attributes('style')).toContain('width: 45%')
  })

  it('keeps a single line full width', () => {
    const wrapper = mountSkeleton({ lines: 1 })
    expect(
      wrapper.findAll('.nb-skeleton__fill')[0].attributes('style'),
    ).toBeUndefined()
  })

  it('clamps the line count to at least one', () => {
    expect(
      mountSkeleton({ lines: 0 }).findAll('.nb-skeleton__fill'),
    ).toHaveLength(1)
  })

  it('ignores lines outside the text variant', () => {
    expect(
      mountSkeleton({ variant: 'block', lines: 4 }).findAll(
        '.nb-skeleton__fill',
      ),
    ).toHaveLength(1)
  })

  it('takes numbers as pixels for block dimensions', () => {
    const style = mountSkeleton({
      variant: 'block',
      width: 240,
      height: 120,
    }).attributes('style')
    expect(style).toContain('width: 240px')
    expect(style).toContain('--nb-skeleton-height: 120px')
  })

  it('accepts any CSS length as a string', () => {
    const style = mountSkeleton({
      variant: 'block',
      width: '50%',
      height: 'var(--nb-field-height-lg)',
    }).attributes('style')
    expect(style).toContain('width: 50%')
    expect(style).toContain('--nb-skeleton-height: var(--nb-field-height-lg)')
  })

  it('drives both axes of a circle from one measurement', () => {
    const fromWidth = mountSkeleton({ variant: 'circle', width: 32 })
    expect(fromWidth.attributes('style')).toContain('width: 32px')
    expect(fromWidth.attributes('style')).toContain(
      '--nb-skeleton-height: 32px',
    )

    const fromHeight = mountSkeleton({ variant: 'circle', height: 48 })
    expect(fromHeight.attributes('style')).toContain('width: 48px')
    expect(fromHeight.attributes('style')).toContain(
      '--nb-skeleton-height: 48px',
    )
  })

  it('never sizes text lines from an explicit height', () => {
    const style = mountSkeleton({ height: 200 }).attributes('style')
    expect(style).not.toContain('--nb-skeleton-height')
  })

  it('exposes the variant and radius as classes', () => {
    const wrapper = mountSkeleton({ variant: 'block', radius: 'md' })
    expect(wrapper.classes()).toContain('nb-skeleton--block')
    expect(wrapper.classes()).toContain('nb-skeleton--radius-md')
  })

  it('marks itself static when the shimmer is turned off', () => {
    expect(mountSkeleton({ animated: false }).classes()).toContain(
      'nb-skeleton--static',
    )
  })

  describe('announcing completion', () => {
    beforeEach(() => {
      resetLoadingAnnouncer()
    })

    afterEach(() => {
      resetLoadingAnnouncer()
      vi.useRealTimers()
    })

    it('announces the arrival that replaces it', () => {
      vi.useFakeTimers()
      const wrapper = mountSkeleton({
        label: 'Loading comments',
        completeLabel: 'Comments loaded',
      })
      wrapper.unmount()
      vi.advanceTimersByTime(60)
      expect(loadingAnnouncerRegion()?.textContent).toBe('Comments loaded')
    })

    it('says nothing when no completeLabel is set', () => {
      vi.useFakeTimers()
      // Forty placeholders in a table must not produce forty announcements,
      // so silence stays the default on both halves of the load.
      mountSkeleton({ label: 'Loading comments' }).unmount()
      vi.advanceTimersByTime(60)
      expect(loadingAnnouncerRegion()).toBeNull()
    })

    it('does not report an arrival for a load that failed', () => {
      // The documented failure path swaps the skeleton for a banner. Without
      // this, the screen reader user who cannot see the banner is told
      // "Comments loaded" instead.
      vi.useFakeTimers()
      const wrapper = mountSkeleton({
        label: 'Loading comments',
        completeLabel: 'Comments loaded',
      })

      // Where the error is caught, before the state change that removes the
      // skeleton. The component cannot make this call itself: Vue does not
      // update props on the render that unmounts a component, so a `:failed`
      // prop set in the same tick is never seen by the teardown handler.
      suppressLoadingAnnouncement()
      wrapper.unmount()

      vi.advanceTimersByTime(60)
      expect(loadingAnnouncerRegion()?.textContent ?? '').toBe('')
    })

    it('lets the next load announce normally', () => {
      vi.useFakeTimers()
      suppressLoadingAnnouncement()
      // The suppression covers the load that is ending, not the session.
      vi.advanceTimersByTime(1)

      mountSkeleton({
        label: 'Loading comments',
        completeLabel: 'Comments loaded',
      }).unmount()
      vi.advanceTimersByTime(60)
      expect(loadingAnnouncerRegion()?.textContent).toBe('Comments loaded')
    })
  })

  it('marks itself reduced-motion so the sweep can become a fade', () => {
    const restore = stubReducedMotion(true)
    try {
      const wrapper = mountSkeleton()
      expect(wrapper.classes()).toContain('nb-skeleton--reduced-motion')
      // The static opt-out has to survive: `animated: false` means still, and
      // the reduced-motion branch must not reanimate it.
      expect(mountSkeleton({ animated: false }).classes()).toContain(
        'nb-skeleton--static',
      )
    } finally {
      restore()
    }
  })
})
