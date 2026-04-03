import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Toast from '../src/components/Toast.vue'

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  template: '<i data-testid="nb-icon" :data-name="name"></i>',
}

describe('Toast', () => {
  const createWrapper = (props = {}) =>
    mount(Toast, {
      props: { message: 'Something happened', ...props },
      global: { stubs: { NbIcon: NbIconStub } },
    })

  it('renders the message', () => {
    const wrapper = createWrapper({ message: 'Upload complete' })
    expect(wrapper.find('.nb-toast__message').text()).toBe('Upload complete')
  })

  it('renders title when provided', () => {
    const wrapper = createWrapper({ title: 'Success' })
    expect(wrapper.find('.nb-toast__title').text()).toBe('Success')
  })

  it('does not render title element when not provided', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-toast__title').exists()).toBe(false)
  })

  it('applies default info variant class', () => {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('nb-toast--info')
  })

  it('applies correct variant class', () => {
    const variants = ['success', 'error', 'warning', 'info'] as const
    for (const variant of variants) {
      const wrapper = createWrapper({ variant })
      expect(wrapper.classes()).toContain(`nb-toast--${variant}`)
    }
  })

  it('shows correct icon for each variant', () => {
    const iconMap = {
      success: 'check-circle',
      error: 'warning-circle',
      warning: 'warning',
      info: 'info',
    } as const
    for (const [variant, iconName] of Object.entries(iconMap)) {
      const wrapper = createWrapper({ variant })
      const icons = wrapper.findAll('[data-testid="nb-icon"]')
      expect(icons[0].attributes('data-name')).toBe(iconName)
    }
  })

  it('emits close when close button is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.nb-toast__close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('renders CTA button when cta prop is provided', () => {
    const wrapper = createWrapper({
      cta: { label: 'Undo', action: () => {} },
    })
    expect(wrapper.find('.nb-toast__cta').text()).toBe('Undo')
  })

  it('calls cta action and emits close when CTA is clicked', async () => {
    const action = { called: false }
    const wrapper = createWrapper({
      cta: {
        label: 'Retry',
        action: () => {
          action.called = true
        },
      },
    })
    await wrapper.find('.nb-toast__cta').trigger('click')
    expect(action.called).toBe(true)
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does not render CTA when not provided', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-toast__cta').exists()).toBe(false)
  })

  it('has role alert', () => {
    const wrapper = createWrapper()
    expect(wrapper.attributes('role')).toBe('alert')
  })

  it('renders progress bar when duration is set', () => {
    const wrapper = createWrapper({ duration: 3000 })
    expect(wrapper.find('.nb-toast__progress').exists()).toBe(true)
  })
})
