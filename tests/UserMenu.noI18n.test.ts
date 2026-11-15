import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserMenu from '../src/components/UserMenu.vue'

// A product that never installed vue-i18n still gets a working menu, in the built-in
// English strings, the way NbSidebarHeaderToggle already behaves.
describe('NbUserMenu without vue-i18n', () => {
  it('mounts and names itself in the built-in strings', () => {
    const wrapper = mount(UserMenu, {
      props: { user: { email: 'person@example.com', name: 'A Person' } },
      attachTo: document.body,
    })
    const trigger = wrapper.find('button')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('aria-label')).toContain('Account menu')
    wrapper.unmount()
  })
})
