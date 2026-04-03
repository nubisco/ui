import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Message from '../src/components/Message.vue'

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  template: '<i data-testid="nb-icon" :data-name="name"></i>',
}

describe('Message', () => {
  const createWrapper = (props = {}, slots = {}) =>
    mount(Message, {
      props,
      slots,
      global: { stubs: { NbIcon: NbIconStub } },
    })

  it('renders with helper variant by default', () => {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('nb-message--helper')
  })

  it('renders error variant', () => {
    const wrapper = createWrapper({ variant: 'error' })
    expect(wrapper.classes()).toContain('nb-message--error')
  })

  it('renders warning variant', () => {
    const wrapper = createWrapper({ variant: 'warning' })
    expect(wrapper.classes()).toContain('nb-message--warning')
  })

  it('renders slot content in text span', () => {
    const wrapper = createWrapper({}, { default: 'Field is required' })
    expect(wrapper.find('.nb-message__text').text()).toBe('Field is required')
  })

  it('uses warning-circle icon for error variant', () => {
    const wrapper = createWrapper({ variant: 'error' })
    expect(
      wrapper.find('[data-testid="nb-icon"]').attributes('data-name'),
    ).toBe('warning-circle')
  })

  it('uses warning icon for warning variant', () => {
    const wrapper = createWrapper({ variant: 'warning' })
    expect(
      wrapper.find('[data-testid="nb-icon"]').attributes('data-name'),
    ).toBe('warning')
  })

  it('uses info icon for helper variant', () => {
    const wrapper = createWrapper({ variant: 'helper' })
    expect(
      wrapper.find('[data-testid="nb-icon"]').attributes('data-name'),
    ).toBe('info')
  })

  it('applies icon-only class when iconOnly is true', () => {
    const wrapper = createWrapper({ iconOnly: true })
    expect(wrapper.classes()).toContain('nb-message--icon-only')
  })

  it('renders tooltip span in icon-only mode', () => {
    const wrapper = createWrapper(
      { iconOnly: true },
      { default: 'Tooltip text' },
    )
    expect(wrapper.find('.nb-message__tooltip').exists()).toBe(true)
  })

  it('hides text span in icon-only mode', () => {
    const wrapper = createWrapper({ iconOnly: true })
    expect(wrapper.find('.nb-message__text').exists()).toBe(false)
  })

  it('has role status', () => {
    const wrapper = createWrapper()
    expect(wrapper.attributes('role')).toBe('status')
  })

  it('has aria-live assertive for error', () => {
    const wrapper = createWrapper({ variant: 'error' })
    expect(wrapper.attributes('aria-live')).toBe('assertive')
  })

  it('has aria-live polite for helper', () => {
    const wrapper = createWrapper({ variant: 'helper' })
    expect(wrapper.attributes('aria-live')).toBe('polite')
  })
})
