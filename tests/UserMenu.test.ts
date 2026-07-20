import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
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
})
