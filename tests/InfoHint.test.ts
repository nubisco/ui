import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import InfoHint from '../src/components/InfoHint.vue'

const TeleportStub = { template: '<div><slot /></div>' }

const createWrapper = (props: Record<string, unknown> = {}, slots = {}) =>
  mount(InfoHint, {
    props,
    slots,
    global: { stubs: { Teleport: TeleportStub } },
  })

describe('NbInfoHint', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a button trigger with a default accessible name', () => {
    const wrapper = createWrapper({ text: 'Kept for 90 days, then deleted.' })
    const trigger = wrapper.find('.nb-info-hint--trigger')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('type')).toBe('button')
    expect(trigger.attributes('aria-label')).toBe('More information')
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('uses the info icon by default and honours the icon prop', () => {
    expect(
      createWrapper().find('[data-testid="nb-icon"]').attributes('data-name'),
    ).toBe('info')
    expect(
      createWrapper({ icon: 'question' })
        .find('[data-testid="nb-icon"]')
        .attributes('data-name'),
    ).toBe('question')
  })

  it('defaults to a 14px icon', () => {
    expect(
      createWrapper().findComponent({ name: 'NbIcon' }).props('size'),
    ).toBe(14)
  })

  it('does not render the popover until it is opened', () => {
    const wrapper = createWrapper({ text: 'Hidden until asked for.' })
    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(false)
  })

  it('opens on click and shows the text prop', async () => {
    const wrapper = createWrapper({ text: 'Moved out of the active list.' })
    await wrapper.find('.nb-info-hint--trigger').trigger('click')
    const popover = wrapper.find('.nb-info-hint--popover')
    expect(popover.exists()).toBe(true)
    expect(popover.text()).toContain('Moved out of the active list.')
    expect(popover.attributes('role')).toBe('tooltip')
  })

  it('wires aria-describedby to the popover while it is open', async () => {
    const wrapper = createWrapper({ text: 'Body' })
    const trigger = wrapper.find('.nb-info-hint--trigger')
    expect(trigger.attributes('aria-describedby')).toBeUndefined()

    await trigger.trigger('click')
    const id = wrapper.find('.nb-info-hint--popover').attributes('id')
    expect(id).toBeTruthy()
    expect(trigger.attributes('aria-describedby')).toBe(id)
    expect(trigger.attributes('aria-expanded')).toBe('true')
  })

  it('prefers the default slot over the text prop', async () => {
    const wrapper = createWrapper(
      { text: 'plain' },
      { default: '<strong>rich</strong>' },
    )
    await wrapper.find('.nb-info-hint--trigger').trigger('click')
    const popover = wrapper.find('.nb-info-hint--popover')
    expect(popover.html()).toContain('<strong>rich</strong>')
    expect(popover.text()).not.toContain('plain')
  })

  it('renders an optional title above the body', async () => {
    const wrapper = createWrapper({ title: 'Archived', text: 'body' })
    await wrapper.find('.nb-info-hint--trigger').trigger('click')
    expect(wrapper.find('.nb-info-hint--title').text()).toBe('Archived')
  })

  it('opens on hover after the open delay', async () => {
    const wrapper = createWrapper({ text: 'body', openDelay: 200 })
    await wrapper.find('.nb-info-hint--trigger').trigger('mouseenter')
    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(false)

    vi.advanceTimersByTime(200)
    await nextTick()
    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(true)
  })

  it('closes after the close delay when the pointer leaves', async () => {
    const wrapper = createWrapper({
      text: 'body',
      openDelay: 0,
      closeDelay: 100,
    })
    await wrapper.find('.nb-info-hint--trigger').trigger('mouseenter')
    vi.advanceTimersByTime(0)
    await nextTick()
    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(true)

    await wrapper.find('.nb-info-hint--trigger').trigger('mouseleave')
    vi.advanceTimersByTime(100)
    await nextTick()
    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(false)
  })

  it('keeps a clicked (pinned) popover open when the pointer leaves', async () => {
    const wrapper = createWrapper({ text: 'body', closeDelay: 50 })
    await wrapper.find('.nb-info-hint--trigger').trigger('click')
    await wrapper.find('.nb-info-hint--trigger').trigger('mouseleave')
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(true)
  })

  it('toggles closed on a second click', async () => {
    const wrapper = createWrapper({ text: 'body' })
    const trigger = wrapper.find('.nb-info-hint--trigger')
    await trigger.trigger('click')
    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(true)
    await trigger.trigger('click')
    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(false)
  })

  it('opens on focus for keyboard users', async () => {
    const wrapper = createWrapper({ text: 'body' })
    await wrapper.find('.nb-info-hint--trigger').trigger('focus')
    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(true)
  })

  it('closes on Escape', async () => {
    const wrapper = createWrapper({ text: 'body' })
    await wrapper.find('.nb-info-hint--trigger').trigger('click')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(false)
  })

  it('closes on an outside pointerdown', async () => {
    const wrapper = createWrapper({ text: 'body' })
    await wrapper.find('.nb-info-hint--trigger').trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(false)
  })

  it('does not trigger a clickable host when the hint is clicked', async () => {
    const onHostClick = vi.fn()
    const Host = defineComponent({
      setup() {
        return () =>
          h('div', { class: 'card', onClick: onHostClick }, [
            h(InfoHint, { text: 'body' }),
          ])
      },
    })

    const wrapper = mount(Host, {
      global: { stubs: { Teleport: TeleportStub } },
    })
    await wrapper.find('.nb-info-hint--trigger').trigger('click')

    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(true)
    expect(onHostClick).not.toHaveBeenCalled()
  })

  it('emits activate with the term on a deliberate click', async () => {
    const wrapper = createWrapper({ text: 'body', term: 'status.archived' })
    await wrapper.find('.nb-info-hint--trigger').trigger('click')
    expect(wrapper.emitted('activate')?.[0]).toEqual(['status.archived'])
    expect(wrapper.emitted('open')).toHaveLength(1)
  })

  it('does not emit activate on hover alone', async () => {
    const wrapper = createWrapper({ text: 'body', openDelay: 0 })
    await wrapper.find('.nb-info-hint--trigger').trigger('mouseenter')
    vi.advanceTimersByTime(0)
    await nextTick()
    expect(wrapper.emitted('activate')).toBeUndefined()
  })

  it('mirrors the term onto data-term for glossary tooling', () => {
    const wrapper = createWrapper({ term: 'status.archived' })
    expect(wrapper.find('.nb-info-hint').attributes('data-term')).toBe(
      'status.archived',
    )
  })

  it('emits close when dismissed', async () => {
    const wrapper = createWrapper({ text: 'body' })
    const trigger = wrapper.find('.nb-info-hint--trigger')
    await trigger.trigger('click')
    await trigger.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('applies the placement class to the popover', async () => {
    const wrapper = createWrapper({ text: 'body', placement: 'right' })
    await wrapper.find('.nb-info-hint--trigger').trigger('click')
    expect(wrapper.find('.nb-info-hint--popover').classes()).toContain(
      'nb-info-hint--popover-right',
    )
  })

  it('stays inert when disabled', async () => {
    const wrapper = createWrapper({ text: 'body', disabled: true })
    const trigger = wrapper.find('.nb-info-hint--trigger')
    expect(trigger.attributes('disabled')).toBeDefined()
    await trigger.trigger('click')
    expect(wrapper.find('.nb-info-hint--popover').exists()).toBe(false)
  })

  it('paints the overlay layer wherever it is used', async () => {
    // The popover is teleported, so the depth of its DOM parent is meaningless.
    // It must pin to the top layer rather than inherit whatever it lands in.
    const wrapper = createWrapper({ text: 'body' })
    await wrapper.find('.nb-info-hint--trigger').trigger('click')

    const popover = wrapper.find('.nb-info-hint--popover')
    expect(popover.classes()).toContain('nb-layer-3')
    expect(popover.attributes('data-nb-layer')).toBe('3')
  })

  it('uses only token-driven colours in its styles', async () => {
    const source = await import('node:fs').then(({ readFileSync }) =>
      readFileSync('src/components/InfoHint.vue', 'utf8'),
    )
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(source).not.toMatch(/rgba?\(/)
  })
})
