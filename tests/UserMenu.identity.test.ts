import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { createI18n } from 'vue-i18n'
import UserMenu from '../src/components/UserMenu.vue'

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {} } })

const JOSE = { email: 'jose@nubisco.io', name: 'José Silva' }

function mountMenu(props: Record<string, unknown> = {}) {
  return mount(UserMenu, {
    props: { user: JOSE, ...props },
    global: { plugins: [i18n] },
    attachTo: document.body,
  })
}

/** Mount inside something that provides the rail variant, as NbShell does. */
function mountInRail(
  variant: Ref<'compact' | 'verbose'>,
  props: Record<string, unknown>,
) {
  const Host = defineComponent({
    provide: { 'nb-shell-sidebar-variant': variant },
    render: () => h(UserMenu, { user: JOSE, ...props }),
  })
  return mount(Host, { global: { plugins: [i18n] }, attachTo: document.body })
}

describe('NbUserMenu, unchanged by default', () => {
  // The opt-in promise, pinned: a product that passes neither `trigger` nor
  // `picture` must get exactly the trigger it had before.
  it('renders only the initials button, with no image and no identity row', () => {
    const w = mountMenu()
    const button = w.find('button.nb-user-menu__avatar')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('JS')
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('.nb-user-menu__identity').exists()).toBe(false)
    expect(w.classes()).not.toContain('nb-user-menu--identity')
    w.unmount()
  })

  it('stays an avatar inside an expanded rail unless identity is asked for', () => {
    const w = mountInRail(ref('verbose'), {})
    expect(w.find('.nb-user-menu__identity').exists()).toBe(false)
    expect(w.find('button.nb-user-menu__avatar').exists()).toBe(true)
    w.unmount()
  })
})

describe('NbUserMenu picture', () => {
  it('shows the image instead of initials', () => {
    const w = mountMenu({
      user: { ...JOSE, picture: 'https://platform.test/api/avatars/abc' },
    })
    const img = w.find('button.nb-user-menu__avatar img')
    expect(img.attributes('src')).toBe('https://platform.test/api/avatars/abc')
    expect(img.attributes('alt')).toBe('')
    expect(w.find('button.nb-user-menu__avatar').text()).toBe('')
    w.unmount()
  })

  it('falls back to initials when the image fails, as a replaced avatar URL does', async () => {
    const w = mountMenu({
      user: { ...JOSE, picture: 'https://platform.test/api/avatars/gone' },
    })
    await w.find('img').trigger('error')
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('button.nb-user-menu__avatar').text()).toBe('JS')
    w.unmount()
  })

  it('tries again when the picture URL changes', async () => {
    const w = mountMenu({
      user: { ...JOSE, picture: 'https://platform.test/a' },
    })
    await w.find('img').trigger('error')
    expect(w.find('img').exists()).toBe(false)
    await w.setProps({ user: { ...JOSE, picture: 'https://platform.test/b' } })
    expect(w.find('img').attributes('src')).toBe('https://platform.test/b')
    w.unmount()
  })

  it('treats a null picture as no picture', () => {
    const w = mountMenu({ user: { ...JOSE, picture: null } })
    expect(w.find('img').exists()).toBe(false)
    expect(w.text()).toContain('JS')
    w.unmount()
  })
})

describe('NbUserMenu identity trigger', () => {
  it('shows name and email as a labelled row in an expanded rail', () => {
    const w = mountInRail(ref('verbose'), { trigger: 'identity' })
    const row = w.find('button.nb-user-menu__identity')
    expect(row.exists()).toBe(true)
    expect(row.find('.nb-user-menu__identity-name').text()).toBe('José Silva')
    expect(row.find('.nb-user-menu__identity-email').text()).toBe(
      'jose@nubisco.io',
    )
    // The visible name is the accessible name: nothing overrides it.
    expect(row.attributes('aria-label')).toBeUndefined()
    expect(row.attributes('aria-haspopup')).toBe('menu')
    w.unmount()
  })

  it('collapses to the avatar alone in a collapsed rail, and follows the rail live', async () => {
    const variant = ref<'compact' | 'verbose'>('compact')
    const w = mountInRail(variant, { trigger: 'identity' })
    expect(w.find('.nb-user-menu__identity').exists()).toBe(false)
    expect(w.find('button.nb-user-menu__avatar').attributes('aria-label')).toBe(
      'Account menu',
    )

    variant.value = 'verbose'
    await nextTick()
    expect(w.find('.nb-user-menu__identity').exists()).toBe(true)
    w.unmount()
  })

  it('shows the row outside a shell, where there is no rail to follow', () => {
    const w = mountMenu({ trigger: 'identity' })
    expect(w.find('.nb-user-menu__identity').exists()).toBe(true)
    w.unmount()
  })

  it('uses the email as the only line when there is no name', () => {
    const w = mountMenu({
      trigger: 'identity',
      user: { email: 'ivan@nubisco.io' },
    })
    expect(w.find('.nb-user-menu__identity-name').text()).toBe(
      'ivan@nubisco.io',
    )
    expect(w.find('.nb-user-menu__identity-email').exists()).toBe(false)
    w.unmount()
  })

  it('does not repeat the email when the name is the email', () => {
    const w = mountMenu({
      trigger: 'identity',
      user: { email: 'jose@nubisco.io', name: ' Jose@Nubisco.io ' },
    })
    expect(w.find('.nb-user-menu__identity-name').text()).toBe(
      'Jose@Nubisco.io',
    )
    expect(w.find('.nb-user-menu__identity-email').exists()).toBe(false)
    w.unmount()
  })

  it('opens the same panel as the avatar does', async () => {
    const w = mountMenu({ trigger: 'identity' })
    await w.find('button.nb-user-menu__identity').trigger('click')
    const panel = document.body.querySelector('.nb-user-menu__panel')
    expect(panel?.textContent).toContain('Signed in as')
    expect(
      w.find('button.nb-user-menu__identity').attributes('aria-expanded'),
    ).toBe('true')
    w.unmount()
  })
})
