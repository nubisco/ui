import { describe, it, expect } from 'vitest'
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
    const body = wrapper.find('.nb-shell__body')
    const children = body.element.children
    const notificationIndex = Array.from(children).findIndex((el) =>
      el.classList.contains('nb-shell__notification'),
    )
    const topbarIndex = Array.from(children).findIndex((el) =>
      el.classList.contains('nb-shell__topbar'),
    )
    expect(notificationIndex).toBeLessThan(topbarIndex)
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
