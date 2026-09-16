import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Avatar from '../src/components/Avatar.vue'
import { initialsOf } from '../src/utils/initials.helper'

describe('initialsOf', () => {
  it('takes the first and last word of a name', () => {
    expect(initialsOf({ name: 'Ana Maria Costa' })).toBe('AC')
    expect(initialsOf({ name: '  ivan  ' })).toBe('I')
  })

  it('falls back to the email local part', () => {
    expect(initialsOf({ email: 'jose@nubisco.io' })).toBe('JO')
    expect(initialsOf({ name: '   ', email: 'x@y.z' })).toBe('X')
  })

  it('is empty with nothing to go on', () => {
    expect(initialsOf({})).toBe('')
  })
})

describe('NbAvatar', () => {
  it('shows the picture when there is one', () => {
    const w = mount(Avatar, {
      props: { name: 'Ana Costa', picture: 'https://example.test/a.png' },
    })
    const img = w.find('img')
    expect(img.attributes('src')).toBe('https://example.test/a.png')
    expect(img.attributes('alt')).toBe('')
    expect(w.text()).toBe('')
  })

  it('shows initials without a picture', () => {
    const w = mount(Avatar, { props: { name: 'Ana Costa', picture: null } })
    expect(w.find('img').exists()).toBe(false)
    expect(w.text()).toBe('AC')
  })

  it('falls back to initials when the picture fails, and retries a new one', async () => {
    const w = mount(Avatar, {
      props: {
        email: 'ivan@nubisco.io',
        picture: 'https://example.test/old.png',
      },
    })
    await w.find('img').trigger('error')
    expect(w.find('img').exists()).toBe(false)
    expect(w.text()).toBe('IV')

    await w.setProps({ picture: 'https://example.test/new.png' })
    expect(w.find('img').attributes('src')).toBe('https://example.test/new.png')
  })

  it('names the person for assistive technology', () => {
    const w = mount(Avatar, { props: { name: 'Ana Costa', email: 'ana@x.io' } })
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('Ana Costa')
    const byEmail = mount(Avatar, { props: { email: 'ana@x.io' } })
    expect(byEmail.attributes('aria-label')).toBe('ana@x.io')
  })

  it('stays silent when decorative', () => {
    const w = mount(Avatar, { props: { name: 'Ana Costa', decorative: true } })
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('aria-label')).toBeUndefined()
  })

  it('applies the size', () => {
    expect(mount(Avatar).classes()).toContain('nb-avatar--md')
    expect(mount(Avatar, { props: { size: 'lg' } }).classes()).toContain(
      'nb-avatar--lg',
    )
  })
})
