import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Banner from '../src/components/Banner.vue'

describe('Banner', () => {
  const createWrapper = (props = {}, slots = {}) =>
    mount(Banner, { props, slots })

  it('renders as an info inline banner by default', () => {
    const wrapper = createWrapper({}, { default: 'Something happened' })
    expect(wrapper.find('.nb-banner').exists()).toBe(true)
    expect(wrapper.classes()).toContain('nb-banner--info')
    expect(wrapper.classes()).toContain('nb-banner--inline')
    expect(wrapper.text()).toContain('Something happened')
  })

  it.each(['info', 'success', 'warning', 'error', 'neutral'] as const)(
    'applies the %s status class',
    (status) => {
      expect(createWrapper({ status }).classes()).toContain(
        `nb-banner--${status}`,
      )
    },
  )

  it('renders the title ahead of the body, in one paragraph', () => {
    const wrapper = createWrapper(
      { title: 'Rebuild queued' },
      { default: 'The site may still serve old HTML.' },
    )
    const body = wrapper.find('.nb-banner__body')
    expect(body.find('.nb-banner__title').text()).toBe('Rebuild queued')
    // One paragraph, so a screen reader reads it as a single sentence.
    expect(body.element.tagName).toBe('P')
    expect(body.text()).toContain('The site may still serve old HTML.')
  })

  it('is not dismissible unless asked', () => {
    expect(createWrapper().find('.nb-banner__close').exists()).toBe(false)
  })

  it('dismisses, emitting the event and removing itself', async () => {
    const wrapper = createWrapper({ dismissible: true })
    await wrapper.find('.nb-banner__close').trigger('click')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    expect(wrapper.find('.nb-banner').exists()).toBe(false)
  })

  // The distinction that makes the two variants worth having: a callout states
  // something that stays true after you stop looking at it.
  it('refuses to be dismissible as a callout, even when told to be', () => {
    const wrapper = createWrapper({ variant: 'callout', dismissible: true })
    expect(wrapper.find('.nb-banner__close').exists()).toBe(false)
  })

  it('interrupts for errors and waits its turn for everything else', () => {
    expect(createWrapper({ status: 'error' }).attributes('role')).toBe('alert')
    expect(createWrapper({ status: 'error' }).attributes('aria-live')).toBe(
      'assertive',
    )
    expect(createWrapper({ status: 'warning' }).attributes('role')).toBe(
      'status',
    )
    expect(createWrapper({ status: 'warning' }).attributes('aria-live')).toBe(
      'polite',
    )
  })

  it('renders an icon by default, hides it on request, and takes an override', () => {
    expect(createWrapper().find('.nb-banner__icon').exists()).toBe(true)
    expect(
      createWrapper({ hideIcon: true }).find('.nb-banner__icon').exists(),
    ).toBe(false)
    const custom = createWrapper({ icon: 'rocket' })
    expect(custom.findComponent({ name: 'NbIcon' }).props('name')).toBe(
      'rocket',
    )
  })

  it('renders the action slot only when given one', () => {
    expect(createWrapper().find('.nb-banner__actions').exists()).toBe(false)
    const wrapper = createWrapper({}, { action: '<button>Retry</button>' })
    expect(wrapper.find('.nb-banner__actions').text()).toBe('Retry')
  })

  it('drops its side borders when flush', () => {
    expect(createWrapper({ flush: true }).classes()).toContain(
      'nb-banner--flush',
    )
  })
})
