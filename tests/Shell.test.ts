import { afterEach, describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Shell from '../src/components/Shell.vue'

describe('Shell', () => {
  const createWrapper = (props = {}, slots = {}) =>
    mount(Shell, { props, slots })

  it('renders the shell container', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-shell').exists()).toBe(true)
  })

  it('renders the sidebar when sidebar slots are used', () => {
    const wrapper = createWrapper(
      {},
      { 'sidebar-logo': '<img src="/logo.svg" />' },
    )
    expect(wrapper.find('.nb-shell__sidebar').exists()).toBe(true)
  })

  it('hides the sidebar when no sidebar slots are used', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-shell__sidebar').exists()).toBe(false)
  })

  it('renders sidebar-logo slot content', () => {
    const wrapper = createWrapper(
      {},
      { 'sidebar-logo': '<img src="/logo.svg" />' },
    )
    expect(wrapper.find('.nb-shell__sidebar-logo img').exists()).toBe(true)
  })

  it('renders sidebar-nav slot content', () => {
    const wrapper = createWrapper({}, { 'sidebar-nav': '<a href="/">Home</a>' })
    expect(wrapper.find('.nb-shell__sidebar-nav a').exists()).toBe(true)
  })

  it('renders sidebar-bottom slot content', () => {
    const wrapper = createWrapper(
      {},
      { 'sidebar-bottom': '<span>Settings</span>' },
    )
    expect(wrapper.find('.nb-shell__sidebar-bottom span').exists()).toBe(true)
  })

  it('renders topbar-left slot content', () => {
    const wrapper = createWrapper({}, { 'topbar-left': '<h1>Title</h1>' })
    expect(wrapper.find('.nb-shell__topbar-left h1').exists()).toBe(true)
  })

  it('renders topbar-right slot content', () => {
    const wrapper = createWrapper(
      {},
      { 'topbar-right': '<button>Profile</button>' },
    )
    expect(wrapper.find('.nb-shell__topbar-right button').exists()).toBe(true)
  })

  it('renders the contextbar when its slot is used', () => {
    const wrapper = createWrapper(
      { contextbarLabel: 'Documents' },
      { contextbar: '<nav class="tree">tree</nav>' },
    )
    const bar = wrapper.find('.nb-shell__contextbar')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('aria-label')).toBe('Documents')
    expect(bar.find('.tree').exists()).toBe(true)
    // Main sits beside it inside the row.
    expect(wrapper.find('.nb-shell__main-row .nb-shell__main').exists()).toBe(
      true,
    )
  })

  it('hides the contextbar and its toggle when the slot is empty', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-shell__contextbar').exists()).toBe(false)
    expect(wrapper.find('.nb-shell__contextbar-toggle').exists()).toBe(false)
  })

  it('is attached by default and detached on request', () => {
    expect(createWrapper().classes()).not.toContain('nb-shell--detached')
    expect(createWrapper({ frame: 'attached' }).classes()).not.toContain(
      'nb-shell--detached',
    )
    expect(createWrapper({ frame: 'detached' }).classes()).toContain(
      'nb-shell--detached',
    )
  })

  it('keeps the page and the bottom panel as siblings inside the body', () => {
    const wrapper = createWrapper(
      {},
      { fixedbar: '<nav>tabs</nav>', bottom: '<div class="console" />' },
    )
    const body = wrapper.find('.nb-shell__body')
    const page = body.find(':scope > .nb-shell__page')
    expect(page.exists()).toBe(true)
    expect(page.find('.nb-shell__fixedbar nav').exists()).toBe(true)
    expect(page.find('.nb-shell__main-row .nb-shell__main').exists()).toBe(true)
    expect(body.find(':scope > .nb-shell__bottom .console').exists()).toBe(true)
    expect(page.find('.nb-shell__bottom').exists()).toBe(false)
  })

  describe('rail collapse order', () => {
    const stubReducedMotion = (reduce: boolean) =>
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: reduce && query.includes('reduce'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }))

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.useRealTimers()
    })

    const mountRail = (sidebarVariant: 'compact' | 'verbose') =>
      mount(Shell, {
        props: { sidebarVariant },
        slots: { 'sidebar-nav': '<a href="/">Home</a>' },
      })

    it('narrows at once and keeps the rows verbose until the width settles', async () => {
      stubReducedMotion(false)
      vi.useFakeTimers()
      const w = mountRail('verbose')
      await w.setProps({ sidebarVariant: 'compact' })
      // The width class follows the prop, the layout class lags.
      expect(w.classes()).not.toContain('nb-shell--rail-wide')
      expect(w.classes()).toContain('nb-shell--sidebar-verbose')
      expect(w.classes()).toContain('nb-shell--rail-collapsing')
      vi.advanceTimersByTime(240)
      await nextTick()
      expect(w.classes()).toContain('nb-shell--sidebar-compact')
      expect(w.classes()).not.toContain('nb-shell--rail-collapsing')
    })

    it('widens and switches the rows at once on expand', async () => {
      stubReducedMotion(false)
      vi.useFakeTimers()
      const w = mountRail('compact')
      await w.setProps({ sidebarVariant: 'verbose' })
      expect(w.classes()).toContain('nb-shell--rail-wide')
      expect(w.classes()).toContain('nb-shell--sidebar-verbose')
      expect(w.classes()).toContain('nb-shell--rail-expanding')
      vi.advanceTimersByTime(240)
      await nextTick()
      expect(w.classes()).not.toContain('nb-shell--rail-expanding')
    })

    it('switches immediately under reduced motion', async () => {
      stubReducedMotion(true)
      const w = mountRail('verbose')
      await w.setProps({ sidebarVariant: 'compact' })
      expect(w.classes()).toContain('nb-shell--sidebar-compact')
      expect(w.classes()).not.toContain('nb-shell--rail-collapsing')
    })
  })

  it('renders default slot content in main', () => {
    const wrapper = createWrapper({}, { default: '<p>Page content</p>' })
    expect(wrapper.find('.nb-shell__main p').exists()).toBe(true)
  })

  // ── Notification slot ──────────────────────────────────────────────────────

  it('does not render notification area when slot is not provided', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-shell__notification').exists()).toBe(false)
  })

  it('renders notification area when slot is provided', () => {
    const wrapper = createWrapper(
      {},
      { notification: '<div class="banner">Alert!</div>' },
    )
    expect(wrapper.find('.nb-shell__notification').exists()).toBe(true)
    expect(wrapper.find('.nb-shell__notification .banner').exists()).toBe(true)
  })

  it('places notification above the topbar', () => {
    // `topbar-left` is passed because the topbar is now only rendered when it
    // has something to show; the ordering claim is unchanged.
    const wrapper = createWrapper(
      {},
      { notification: '<div>Notice</div>', 'topbar-left': '<h1>Page</h1>' },
    )
    /*
     * Document order, not position within one container. Both rows now span
     * the frame and live above the content row rather than inside the body,
     * so asserting on `.nb-shell__body`'s children pinned the implementation
     * rather than the claim. What has to hold is that the notice comes first.
     */
    const notification = wrapper.find('.nb-shell__notification').element
    const topbar = wrapper.find('.nb-shell__topbar').element
    expect(notification).toBeTruthy()
    expect(topbar).toBeTruthy()
    expect(
      notification.compareDocumentPosition(topbar) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  // ── Fixedbar slot ──────────────────────────────────────────────────────────

  it('does not render fixedbar when slot is empty', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-shell__fixedbar').exists()).toBe(false)
  })

  it('renders fixedbar when slot has content', () => {
    const wrapper = createWrapper({}, { fixedbar: '<div>Tabs</div>' })
    expect(wrapper.find('.nb-shell__fixedbar').exists()).toBe(true)
  })

  // A component in the slot (typically <RouterView name="fixedbar" />) is
  // renderable as a vnode even on routes that register no fixedbar view, so
  // the wrapper is emitted with nothing inside it. Left visible it stacks its
  // 1px border under the topbar's, doubling the header rule. The CSS guard
  // (:empty) is what actually hides it in the browser; this asserts the DOM
  // shape that guard relies on, since comments do not defeat :empty.
  it('leaves the fixedbar wrapper empty when a component slot renders nothing', () => {
    const RendersNothing = { render: () => null }
    const wrapper = mount(Shell, {
      slots: { fixedbar: RendersNothing },
    })
    const fixedbar = wrapper.find('.nb-shell__fixedbar')
    expect(fixedbar.exists()).toBe(true)
    expect(fixedbar.element.children.length).toBe(0)
    expect(fixedbar.text()).toBe('')
  })

  // ── Inspector ──────────────────────────────────────────────────────────────

  it('renders inspector without visible class by default', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-shell__inspector').exists()).toBe(true)
    expect(wrapper.find('.nb-shell__inspector--visible').exists()).toBe(false)
  })

  it('applies visible class when inspectorVisible is true', () => {
    const wrapper = createWrapper({ inspectorVisible: true })
    expect(wrapper.find('.nb-shell__inspector--visible').exists()).toBe(true)
  })

  it('applies expanded class when both visible and expanded', () => {
    const wrapper = createWrapper({
      inspectorVisible: true,
      inspectorExpanded: true,
    })
    expect(wrapper.find('.nb-shell__inspector--expanded').exists()).toBe(true)
  })

  it('does not apply expanded class when not visible', () => {
    const wrapper = createWrapper({
      inspectorVisible: false,
      inspectorExpanded: true,
    })
    expect(wrapper.find('.nb-shell__inspector--expanded').exists()).toBe(false)
  })

  it('defaults inspectorSize to md', () => {
    const wrapper = createWrapper({ inspectorVisible: true })
    expect(wrapper.find('.nb-shell__inspector--md').exists()).toBe(true)
  })

  it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
    'applies inspector size class --%s when visible',
    (size) => {
      const wrapper = createWrapper({
        inspectorVisible: true,
        inspectorSize: size,
      })
      expect(wrapper.find(`.nb-shell__inspector--${size}`).exists()).toBe(true)
    },
  )

  it('does not apply inspector size class when not visible', () => {
    const wrapper = createWrapper({
      inspectorVisible: false,
      inspectorSize: 'sm',
    })
    expect(wrapper.find('.nb-shell__inspector--sm').exists()).toBe(false)
  })

  it('renders inspector slot content', () => {
    const wrapper = createWrapper(
      { inspectorVisible: true },
      { inspector: '<div class="detail-panel">Details</div>' },
    )
    expect(wrapper.find('.nb-shell__inspector .detail-panel').exists()).toBe(
      true,
    )
  })
})
