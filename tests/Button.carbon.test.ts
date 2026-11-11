import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createRouter, createMemoryHistory, RouterLink } from 'vue-router'
import Button from '../src/components/Button.vue'

describe('NbButton anatomy', () => {
  it('wraps the label in its own span, before the icon', () => {
    const w = mount(Button, {
      props: { icon: 'arrow-right' },
      slots: { default: 'Continue' },
    })
    const children = Array.from(w.element.children).map((c) => c.className)
    expect(children[0]).toContain('nb-button__label')
    expect(children[1]).toContain('nb-button__decorations')
    expect(w.find('.nb-button__label').text()).toBe('Continue')
  })

  it('renders no div inside the button', () => {
    const w = mount(Button, {
      props: { icon: 'arrow-right' },
      slots: { default: 'Continue' },
    })
    expect(w.find('div').exists()).toBe(false)
  })

  it('marks a labelled button with an icon, and keeps the slot while loading', () => {
    const w = mount(Button, {
      props: { loading: true },
      slots: { default: 'Save' },
    })
    expect(w.classes()).toContain('nb-button--with-icon')
    expect(w.find('.nb-button__spinner').exists()).toBe(true)
  })
})

describe('NbButton danger variants', () => {
  it('renders danger-tertiary as danger outlined', () => {
    const w = mount(Button, { props: { variant: 'danger-tertiary' } })
    expect(w.classes()).toContain('nb-button--danger')
    expect(w.classes()).toContain('nb-button--outlined')
  })

  it('renders danger-ghost as its own class', () => {
    const w = mount(Button, { props: { variant: 'danger-ghost' } })
    expect(w.classes()).toContain('nb-button--danger-ghost')
  })
})

describe('NbButton label', () => {
  it('names an icon-only button and gives it a tooltip', async () => {
    const w = mount(Button, {
      props: { icon: 'trash', label: 'Delete' },
      attachTo: document.body,
    })
    expect(w.attributes('aria-label')).toBe('Delete')
    await w.trigger('focusin')
    await new Promise((r) => setTimeout(r, 0))
    const chip = document.querySelector('.nb-tooltip')
    expect(chip?.textContent).toContain('Delete')
    w.unmount()
  })

  it('lets an explicit aria-label win the spoken name', () => {
    const w = mount(Button, {
      props: { icon: 'trash', label: 'Delete' },
      attrs: { 'aria-label': 'Delete invoice 2026/002' },
    })
    expect(w.attributes('aria-label')).toBe('Delete invoice 2026/002')
  })

  it('ignores label on a labelled button', () => {
    const w = mount(Button, {
      props: { icon: 'trash', label: 'Delete' },
      slots: { default: 'Delete invoice' },
    })
    expect(w.attributes('aria-label')).toBeUndefined()
  })
})

describe('NbButton pressed', () => {
  it('has no aria-pressed unless pressed is set', () => {
    expect(mount(Button).attributes('aria-pressed')).toBeUndefined()
  })

  it('reflects pressed as aria-pressed and a class', () => {
    const on = mount(Button, { props: { pressed: true, variant: 'ghost' } })
    expect(on.attributes('aria-pressed')).toBe('true')
    expect(on.classes()).toContain('nb-button--pressed')
    const off = mount(Button, { props: { pressed: false } })
    expect(off.attributes('aria-pressed')).toBe('false')
  })
})

describe('NbButton disabled link', () => {
  it('drops the href so Enter cannot follow it', () => {
    const w = mount(Button, {
      props: { href: '/invoices', disabled: true },
      slots: { default: 'Invoices' },
    })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBeUndefined()
    expect(w.attributes('aria-disabled')).toBe('true')
  })

  it('renders a plain anchor instead of a RouterLink while disabled', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:p(.*)*', component: { render: () => null } }],
    })
    const Host = defineComponent({
      render: () =>
        h(Button, { to: '/invoices', disabled: true }, () => 'Invoices'),
    })
    const w = mount(Host, { global: { plugins: [router] } })
    expect(w.findComponent(RouterLink).exists()).toBe(false)
    expect(w.find('a').attributes('href')).toBeUndefined()
  })

  it('prevents the default action on click', async () => {
    const w = mount(Button, {
      props: { href: '/invoices', disabled: true },
      slots: { default: 'Invoices' },
    })
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    w.element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(w.emitted('click')).toBeUndefined()
  })
})
