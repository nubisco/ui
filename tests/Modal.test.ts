import { glyphStubComputed } from './__mocks__/glyphStub'
import { describe, it, expect, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Modal from '../src/components/Modal.vue'

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  computed: glyphStubComputed,
  template: '<i data-testid="nb-icon" :data-name="resolvedName"></i>',
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

  it('defaults to the md size class', () => {
    const wrapper = createWrapper({ open: true })
    expect(wrapper.find('.nb-modal--content').classes()).toContain(
      'nb-modal--content--md',
    )
  })

  it('applies the size class for each size', () => {
    for (const size of ['sm', 'md', 'lg', 'xl', 'immersive']) {
      const wrapper = createWrapper({ open: true, size })
      expect(wrapper.find('.nb-modal--content').classes()).toContain(
        `nb-modal--content--${size}`,
      )
    }
  })

  // The larger steps are additive. A dialog that asked for sm, md or lg must
  // come out of this change byte-identical, which is what this pins down.
  it('gives the larger sizes their own class and leaves the others alone', () => {
    for (const size of ['xl', 'immersive']) {
      const classes = createWrapper({ open: true, size })
        .find('.nb-modal--content')
        .classes()
      for (const old of ['sm', 'md', 'lg']) {
        expect(classes).not.toContain(`nb-modal--content--${old}`)
      }
    }
  })

  it('has role dialog on content', () => {
    const wrapper = createWrapper({ open: true })
    expect(wrapper.find('.nb-modal--content').attributes('role')).toBe('dialog')
  })
})

/**
 * The showcase reproduced all of this in three keypresses: open the dialog,
 * focus stayed on the trigger; Tab, focus landed on a heading anchor behind
 * the scrim; Escape, nothing. The page above it promised a focus trap.
 *
 * These mount against the real document, because the thing under test is
 * where `document.activeElement` ends up, and they keep Teleport unstubbed so
 * the dialog sits where it really sits.
 */
describe('Modal focus management', () => {
  const mountOpen = (props = {}, slots = {}) =>
    mount(Modal, {
      props: { open: true, ...props },
      slots: {
        default:
          '<button class="inside-a">A</button><button class="inside-b">B</button>',
        ...slots,
      },
      attachTo: document.body,
      global: {
        stubs: {
          NbIcon: NbIconStub,
          NbGrid: NbGridStub,
          Transition: { template: '<div><slot /></div>' },
        },
      },
    })

  const pressTab = (shiftKey = false) => {
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(event)
    return event
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('moves focus into the dialog when it opens', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const wrapper = mount(Modal, {
      props: { open: false },
      slots: { default: '<button class="inside-a">A</button>' },
      attachTo: document.body,
      global: {
        stubs: {
          NbIcon: NbIconStub,
          NbGrid: NbGridStub,
          Transition: { template: '<div><slot /></div>' },
        },
      },
    })

    await wrapper.setProps({ open: true })
    await nextTick()

    expect(document.activeElement).toBe(document.querySelector('.inside-a'))
    wrapper.unmount()
  })

  it('keeps Tab inside the dialog instead of reaching the page behind it', async () => {
    const behind = document.createElement('a')
    behind.href = '#behind'
    document.body.appendChild(behind)

    const wrapper = mountOpen()
    await nextTick()

    const last = document.querySelector<HTMLElement>('.inside-b')!
    last.focus()

    const event = pressTab()

    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).not.toBe(behind)
    // Teleport is unstubbed here, so the dialog lives on document.body
    // rather than inside the wrapper's own tree.
    const dialog = document.querySelector('.nb-modal--content')!
    expect(dialog.contains(document.activeElement)).toBe(true)
    wrapper.unmount()
  })

  it('cycles backwards from the first control to the last on Shift+Tab', async () => {
    const wrapper = mountOpen()
    await nextTick()

    const first = document.querySelector<HTMLElement>('.inside-a')!
    first.focus()

    const event = pressTab(true)

    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(document.querySelector('.inside-b'))
    wrapper.unmount()
  })

  it('pulls focus back when it is outside the dialog entirely', async () => {
    const behind = document.createElement('button')
    document.body.appendChild(behind)

    const wrapper = mountOpen()
    await nextTick()

    behind.focus()
    const event = pressTab()

    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(document.querySelector('.inside-a'))
    wrapper.unmount()
  })

  it('returns focus to the trigger when the dialog closes', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = mount(Modal, {
      props: { open: false },
      slots: { default: '<button class="inside-a">A</button>' },
      attachTo: document.body,
      global: {
        stubs: {
          NbIcon: NbIconStub,
          NbGrid: NbGridStub,
          Transition: { template: '<div><slot /></div>' },
        },
      },
    })

    await wrapper.setProps({ open: true })
    await nextTick()
    expect(document.activeElement).not.toBe(trigger)

    await wrapper.setProps({ open: false })
    await nextTick()

    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
  })

  // A trigger inside the row the dialog just deleted is gone by the time
  // focus is handed back. The restore must not throw, and must not leave
  // focus on a detached node.
  it('survives a trigger that no longer exists on close', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = mount(Modal, {
      props: { open: false },
      slots: { default: '<button class="inside-a">A</button>' },
      attachTo: document.body,
      global: {
        stubs: {
          NbIcon: NbIconStub,
          NbGrid: NbGridStub,
          Transition: { template: '<div><slot /></div>' },
        },
      },
    })

    await wrapper.setProps({ open: true })
    await nextTick()
    trigger.remove()

    await expect(wrapper.setProps({ open: false })).resolves.not.toThrow()
    expect((document.activeElement as HTMLElement)?.isConnected).toBe(true)
    wrapper.unmount()
  })

  // NbConfirm runs its own trap and switches this one off. Two traps on one
  // surface pull focus in opposite directions.
  it('leaves focus alone when trapFocus is false', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = mount(Modal, {
      props: { open: false, trapFocus: false },
      slots: { default: '<button class="inside-a">A</button>' },
      attachTo: document.body,
      global: {
        stubs: {
          NbIcon: NbIconStub,
          NbGrid: NbGridStub,
          Transition: { template: '<div><slot /></div>' },
        },
      },
    })

    await wrapper.setProps({ open: true })
    await nextTick()

    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
  })

  // Escape already emitted `close`; the showcase simply never listened. This
  // pins the emit down so the documentation fix stays honest.
  it('emits close on Escape', async () => {
    const wrapper = mountOpen()
    await nextTick()

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await nextTick()

    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  // The dialog box carries tabindex="-1" so there is somewhere to stand when
  // every control in it is disabled, which is the pending state.
  it('holds focus on the dialog when it has no focusable controls', async () => {
    const wrapper = mountOpen({}, { default: '<p>Nothing to focus</p>' })
    await nextTick()

    expect(document.activeElement).toBe(
      document.querySelector('.nb-modal--content'),
    )
    wrapper.unmount()
  })
})
