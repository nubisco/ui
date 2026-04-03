import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from '../src/components/Modal.vue'

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  template: '<i data-testid="nb-icon" :data-name="name"></i>',
}

const NbGridStub = {
  name: 'NbGrid',
  props: ['is', 'justify', 'distributed'],
  template:
    '<component :is="is || \'div\'" v-bind="$attrs"><slot /></component>',
}

describe('Modal', () => {
  const createWrapper = (props = {}, slots = {}) =>
    mount(Modal, {
      props,
      slots,
      global: {
        stubs: {
          NbIcon: NbIconStub,
          NbGrid: NbGridStub,
          Teleport: { template: '<div><slot /></div>' },
          Transition: { template: '<div><slot /></div>' },
        },
      },
    })

  it('does not render content when open is false', () => {
    const wrapper = createWrapper({ open: false })
    expect(wrapper.find('.nb-modal--overlay').exists()).toBe(false)
  })

  it('renders content when open is true', () => {
    const wrapper = createWrapper({ open: true })
    expect(wrapper.find('.nb-modal--overlay').exists()).toBe(true)
  })

  it('renders title when provided', () => {
    const wrapper = createWrapper({ open: true, title: 'Confirm Action' })
    expect(wrapper.find('.nb-modal--title').text()).toBe('Confirm Action')
  })

  it('renders close button in header', () => {
    const wrapper = createWrapper({ open: true, title: 'My Modal' })
    expect(wrapper.find('.nb-modal--close').exists()).toBe(true)
  })

  it('emits close when close button is clicked', async () => {
    const wrapper = createWrapper({ open: true, title: 'Test' })
    await wrapper.find('.nb-modal--close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close when overlay is clicked and closeOnOverlay is true', async () => {
    const wrapper = createWrapper({ open: true, closeOnOverlay: true })
    await wrapper.find('.nb-modal--overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does not emit close when overlay clicked and closeOnOverlay is false', async () => {
    const wrapper = createWrapper({ open: true, closeOnOverlay: false })
    await wrapper.find('.nb-modal--overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('renders default slot content', () => {
    const wrapper = createWrapper(
      { open: true },
      { default: '<p class="body-content">Body text</p>' },
    )
    expect(wrapper.find('.body-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Body text')
  })

  it('renders header slot content', () => {
    const wrapper = createWrapper(
      { open: true },
      { header: '<span class="custom-header">Custom</span>' },
    )
    expect(wrapper.find('.custom-header').exists()).toBe(true)
  })

  it('renders footer slot content', () => {
    const wrapper = createWrapper(
      { open: true },
      { footer: '<button class="footer-btn">Confirm</button>' },
    )
    expect(wrapper.find('.footer-btn').exists()).toBe(true)
  })

  it('does not render header section when no title and no header slot', () => {
    const wrapper = createWrapper({ open: true })
    expect(wrapper.find('.nb-modal--header').exists()).toBe(false)
  })

  it('applies correct max-width for each size', () => {
    const sizesMap: Record<string, string> = {
      sm: '400px',
      md: '520px',
      lg: '720px',
      xl: '960px',
    }
    for (const [size, maxWidth] of Object.entries(sizesMap)) {
      const wrapper = createWrapper({ open: true, size })
      expect(wrapper.find('.nb-modal--content').attributes('style')).toContain(
        maxWidth,
      )
    }
  })

  it('has role dialog on content', () => {
    const wrapper = createWrapper({ open: true })
    expect(wrapper.find('.nb-modal--content').attributes('role')).toBe('dialog')
  })
})
