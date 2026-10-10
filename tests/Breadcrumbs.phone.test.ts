import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Breadcrumbs from '../src/components/Breadcrumbs.vue'
import {
  NB_PHONE_QUERY,
  resetPhoneLayoutForTests,
} from '../src/composables/usePhoneLayout.composable'

function stubPhone(on: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: on && query === NB_PHONE_QUERY,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

const trail = {
  default: '<a href="/">Home</a><a href="/s">Space</a><span>Card</span>',
}

afterEach(() => {
  vi.unstubAllGlobals()
  resetPhoneLayoutForTests()
})

describe('Breadcrumbs collapse', () => {
  it('renders the same DOM on a phone without the prop', () => {
    stubPhone(false)
    const desktop = mount(Breadcrumbs, {
      props: { title: 'Acme' },
      slots: trail,
    }).html()
    resetPhoneLayoutForTests()
    stubPhone(true)
    const phone = mount(Breadcrumbs, {
      props: { title: 'Acme' },
      slots: trail,
    }).html()
    expect(phone).toBe(desktop)
  })

  it('renders the same DOM on a desktop with collapse="phone"', () => {
    stubPhone(false)
    const plain = mount(Breadcrumbs, {
      props: { title: 'Acme' },
      slots: trail,
    }).html()
    const opted = mount(Breadcrumbs, {
      props: { title: 'Acme', collapse: 'phone' },
      slots: trail,
    }).html()
    expect(opted).toBe(plain)
  })

  it('collapses to the last crumb on a phone when opted in', () => {
    stubPhone(true)
    const w = mount(Breadcrumbs, {
      props: { title: 'Acme', collapse: 'phone' },
      slots: trail,
    })
    expect(w.classes()).toContain('nb-breadcrumbs--collapsed')
    // Every crumb stays in the DOM: the stylesheet hides all but the last.
    expect(w.findAll('.nb-breadcrumbs__crumbs > *')).toHaveLength(3)
  })

  it('keeps a brand-only trail as it is', () => {
    stubPhone(true)
    const w = mount(Breadcrumbs, {
      props: { title: 'Acme', collapse: 'phone' },
    })
    expect(w.classes()).not.toContain('nb-breadcrumbs--collapsed')
  })
})
