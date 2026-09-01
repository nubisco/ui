import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createI18n } from 'vue-i18n'
import UserMenu from '../src/components/UserMenu.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {} } })

function mountMenu(props = {}, options = {}) {
  return mount(UserMenu, {
    props: { user: { email: 'jose@nubisco.io', name: 'José' }, ...props },
    global: { plugins: [i18n] },
    attachTo: document.body,
    ...options,
  })
}

async function openMenu(wrapper: ReturnType<typeof mountMenu>) {
  await wrapper.find('.nb-user-menu__avatar').trigger('click')
}

function panel(): HTMLElement | null {
  return document.body.querySelector('.nb-user-menu__panel')
}

describe('UserMenu', () => {
  it('renders the avatar trigger with initials from the name', () => {
    const wrapper = mountMenu()
    expect(wrapper.find('.nb-user-menu__avatar').text()).toBe('J')
    wrapper.unmount()
  })

  it('opens the panel with the signed-in header and default items', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)
    const el = panel()
    expect(el).toBeTruthy()
    expect(el?.textContent).toContain('Signed in as')
    expect(el?.textContent).toContain('jose@nubisco.io')
    expect(el?.textContent).toContain('Use another account')
    expect(el?.textContent).toContain('Profile')
    expect(el?.textContent).toContain('Sign out')
    wrapper.unmount()
  })

  it('renders inline accounts and emits switch for non-current rows', async () => {
    const wrapper = mountMenu({
      accounts: [
        { id: 'a', email: 'jose@nubisco.io', current: true },
        { id: 'b', email: 'tools@nubisco.io' },
      ],
    })
    await openMenu(wrapper)
    const rows = document.body.querySelectorAll('.nb-user-menu__account')
    expect(rows.length).toBe(2)
    ;(rows[1] as HTMLElement).click()
    expect(wrapper.emitted('switch')?.[0]?.[0]).toMatchObject({ id: 'b' })
    wrapper.unmount()
  })

  it('shows the generic switch action when accounts are unknown', async () => {
    const wrapper = mountMenu({ accountsUnknown: true })
    await openMenu(wrapper)
    expect(panel()?.textContent).toContain('Switch account')
    wrapper.unmount()
  })

  it('hides account actions and profile when disabled via props', async () => {
    const wrapper = mountMenu({ showAccountActions: false, showProfile: false })
    await openMenu(wrapper)
    const el = panel()
    expect(el?.textContent).not.toContain('Use another account')
    expect(el?.textContent).not.toContain('Profile')
    expect(el?.textContent).toContain('Sign out')
    wrapper.unmount()
  })

  it('emits sign-out and closes the panel', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)
    const actions = document.body.querySelectorAll('.nb-user-menu__action')
    ;(actions[actions.length - 1] as HTMLElement).click()
    expect(wrapper.emitted('sign-out')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  it('renders product-specific items via the default slot', async () => {
    const wrapper = mountMenu(
      {},
      {
        props: { user: { email: 'jose@nubisco.io' } },
        slots: { default: '<button class="extra">Billing</button>' },
        global: { plugins: [i18n] },
        attachTo: document.body,
      },
    )
    await openMenu(wrapper)
    expect(document.body.querySelector('.extra')?.textContent).toBe('Billing')
    wrapper.unmount()
  })

  it('uses host translations for locales without built-in defaults', async () => {
    const hostI18n = createI18n({
      legacy: false,
      locale: 'de',
      fallbackLocale: 'en',
      messages: { de: { userMenu: { SIGN_OUT: 'Abmelden' } }, en: {} },
    })
    const wrapper = mount(UserMenu, {
      props: { user: { email: 'jose@nubisco.io' } },
      global: { plugins: [hostI18n] },
      attachTo: document.body,
    })
    await wrapper.find('.nb-user-menu__avatar').trigger('click')
    expect(panel()?.textContent).toContain('Abmelden')
    wrapper.unmount()
  })

  it('renders the brand lockup by default, with the product name emphasised', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)
    const brand = panel()?.querySelector('.nb-user-menu__brand')
    expect(brand?.textContent).toBe('Powered by Nubisco Platform')
    expect(brand?.querySelector('.nb-user-menu__brand-name')?.textContent).toBe(
      'Nubisco Platform',
    )
    const mark = brand?.querySelector('svg')
    expect(mark?.getAttribute('width')).toBe('13px')
    expect(mark?.getAttribute('aria-hidden')).toBe('true')
    wrapper.unmount()
  })

  it('adds no tab stop and no role for the lockup', async () => {
    const wrapper = mountMenu()
    await openMenu(wrapper)
    const brand = panel()?.querySelector('.nb-user-menu__brand') as HTMLElement
    expect(brand.tagName).toBe('P')
    expect(brand.getAttribute('role')).toBe(null)
    expect(brand.getAttribute('tabindex')).toBe(null)
    expect(brand.querySelectorAll('a, button, [tabindex]').length).toBe(0)
    wrapper.unmount()
  })

  it('renders nothing for brand="none"', async () => {
    const wrapper = mountMenu({ brand: 'none' })
    await openMenu(wrapper)
    expect(panel()?.querySelector('.nb-user-menu__brand')).toBe(null)
    expect(panel()?.textContent).not.toContain('Nubisco Platform')
    wrapper.unmount()
  })

  it('localises the lockup and keeps the product name emphasised', async () => {
    const ptI18n = createI18n({
      legacy: false,
      locale: 'pt',
      fallbackLocale: 'en',
      messages: { pt: {}, en: {} },
    })
    const wrapper = mount(UserMenu, {
      props: { user: { email: 'jose@nubisco.io' } },
      global: { plugins: [ptI18n] },
      attachTo: document.body,
    })
    await wrapper.find('.nb-user-menu__avatar').trigger('click')
    const brand = panel()?.querySelector('.nb-user-menu__brand')
    expect(brand?.textContent).toBe('Fornecido pela Nubisco Platform')
    expect(brand?.querySelector('.nb-user-menu__brand-name')?.textContent).toBe(
      'Nubisco Platform',
    )
    wrapper.unmount()
  })

  it('emphasises the whole line when a host translation drops the product name', async () => {
    const hostI18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: { en: { userMenu: { poweredBy: 'Powered by the platform' } } },
    })
    const wrapper = mount(UserMenu, {
      props: { user: { email: 'jose@nubisco.io' } },
      global: { plugins: [hostI18n] },
      attachTo: document.body,
    })
    await wrapper.find('.nb-user-menu__avatar').trigger('click')
    expect(
      panel()?.querySelector('.nb-user-menu__brand-name')?.textContent,
    ).toBe('Powered by the platform')
    wrapper.unmount()
  })

  it('replaces the lockup with the brand slot', async () => {
    const wrapper = mount(UserMenu, {
      props: { user: { email: 'jose@nubisco.io' } },
      slots: { brand: '<span class="own-brand">Acme</span>' },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    await wrapper.find('.nb-user-menu__avatar').trigger('click')
    expect(panel()?.querySelector('.own-brand')?.textContent).toBe('Acme')
    expect(panel()?.querySelector('.nb-user-menu__brand')).toBe(null)
    wrapper.unmount()
  })

  it('scopes gradient ids per instance so several menus do not collide', async () => {
    const host = defineComponent({
      components: { UserMenu },
      template: `
        <div>
          <UserMenu :user="{ email: 'jose@nubisco.io' }" />
          <UserMenu :user="{ email: 'tools@nubisco.io' }" />
        </div>
      `,
    })
    const wrapper = mount(host, {
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    for (const trigger of wrapper.findAll('.nb-user-menu__avatar')) {
      await trigger.trigger('click')
    }
    const marks = document.body.querySelectorAll('.nb-user-menu__mark')
    expect(marks.length).toBe(2)
    const ids = [
      ...document.body.querySelectorAll('.nb-user-menu__mark linearGradient'),
    ].map((node) => node.getAttribute('id'))
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^nb-nubisco-mark-/)
    // Every fill points at a gradient defined inside its own mark.
    for (const mark of marks) {
      const own = new Set(
        [...mark.querySelectorAll('linearGradient')].map((n) => n.id),
      )
      for (const painted of mark.querySelectorAll('[fill^="url("]')) {
        const ref = painted.getAttribute('fill')?.slice(5, -1)
        expect(own.has(String(ref))).toBe(true)
      }
    }
    wrapper.unmount()
  })
})
