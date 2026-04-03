import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../src/components/Button.vue'

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  template: '<i data-testid="nb-icon" :data-name="name"></i>',
}

describe('Button', () => {
  const createWrapper = (props = {}, slots = {}) =>
    mount(Button, {
      props,
      slots,
      global: { stubs: { NbIcon: NbIconStub } },
    })

  it('renders as a button element by default', () => {
    const wrapper = createWrapper()
    expect(wrapper.element.tagName.toLowerCase()).toBe('button')
  })

  it('renders as an anchor when href is provided', () => {
    const wrapper = createWrapper({ href: 'https://example.com' })
    expect(wrapper.element.tagName.toLowerCase()).toBe('a')
    expect(wrapper.attributes('href')).toBe('https://example.com')
  })

  it('renders slot content', () => {
    const wrapper = createWrapper({}, { default: 'Click me' })
    expect(wrapper.text()).toContain('Click me')
  })

  it('applies variant class', () => {
    const wrapper = createWrapper({ variant: 'primary' })
    expect(wrapper.classes()).toContain('nb-button--primary')
  })

  it('applies all variants', () => {
    const variants = [
      'primary',
      'secondary',
      'ghost',
      'warning',
      'danger',
      'success',
      'info',
    ]
    for (const variant of variants) {
      const wrapper = createWrapper({ variant })
      expect(wrapper.classes()).toContain(`nb-button--${variant}`)
    }
  })

  it('applies size class', () => {
    const wrapper = createWrapper({ size: 'lg' })
    expect(wrapper.classes()).toContain('nb-button--lg')
  })

  it('applies default medium size class', () => {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('nb-button--md')
  })

  it('applies outlined class when outlined prop is true', () => {
    const wrapper = createWrapper({ outlined: true })
    expect(wrapper.classes()).toContain('nb-button--outlined')
  })

  it('is disabled when disabled prop is true', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.element.disabled).toBe(true)
  })

  it('applies loading class when loading', () => {
    const wrapper = createWrapper({ loading: true })
    expect(wrapper.classes()).toContain('nb-button--loading')
  })

  it('shows spinner when loading', () => {
    const wrapper = createWrapper({ loading: true })
    expect(wrapper.find('.nb-button__spinner').exists()).toBe(true)
  })

  it('shows icon when icon prop provided', () => {
    const wrapper = createWrapper({ icon: 'check' })
    const icon = wrapper.find('[data-testid="nb-icon"]')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-name')).toBe('check')
  })

  it('does not show icon while loading (spinner takes precedence)', () => {
    const wrapper = createWrapper({ loading: true, icon: 'check' })
    expect(wrapper.find('.nb-button__spinner').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nb-icon"]').exists()).toBe(false)
  })

  it('applies icon-only class when icon provided without slot', () => {
    const wrapper = createWrapper({ icon: 'check' })
    expect(wrapper.classes()).toContain('nb-button--icon-only')
  })

  it('does not apply icon-only class when slot content is present', () => {
    const wrapper = createWrapper({ icon: 'check' }, { default: 'Submit' })
    expect(wrapper.classes()).not.toContain('nb-button--icon-only')
  })

  it('emits click event on click', async () => {
    const wrapper = createWrapper()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click when disabled', async () => {
    const wrapper = createWrapper({ disabled: true })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('sets native button type', () => {
    const wrapper = createWrapper({ type: 'submit' })
    expect(wrapper.attributes('type')).toBe('submit')
  })

  it('sets target and rel on anchor', () => {
    const wrapper = createWrapper({
      href: 'https://example.com',
      target: '_blank',
      rel: 'noopener',
    })
    expect(wrapper.attributes('target')).toBe('_blank')
    expect(wrapper.attributes('rel')).toBe('noopener')
  })
})
