import { glyphStubComputed } from './__mocks__/glyphStub'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Breadcrumbs from '../src/components/Breadcrumbs.vue'

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  computed: glyphStubComputed,
  template: '<i data-testid="nb-icon" :data-name="resolvedName"></i>',
}

const mountTrail = (items: unknown[]) =>
  mount(Breadcrumbs, {
    props: { items },
    global: { stubs: { NbIcon: NbIconStub } },
  })

/**
 * A crumb that is a key keeps the chip whatever it renders as, and a crumb
 * that is a name never gets one.
 */
describe('Breadcrumbs code crumbs', () => {
  it('draws the current crumb as a code chip', () => {
    const w = mountTrail([
      { label: 'Records', to: '/records' },
      { label: 'REC-2041', code: true },
    ])
    const current = w.find('.nb-breadcrumbs__current')
    expect(current.find('code.nb-breadcrumbs__code').text()).toBe('REC-2041')
    expect(current.attributes('aria-current')).toBe('page')
  })

  it('keeps a linked key a link, with the chip inside it', () => {
    const w = mountTrail([
      { label: 'REC-2041', to: '/records/2041', code: true },
      { label: 'Edit' },
    ])
    const link = w.find('.nb-breadcrumbs__link')
    expect(link.exists()).toBe(true)
    expect(link.find('code.nb-breadcrumbs__code').text()).toBe('REC-2041')
    expect(w.find('.nb-breadcrumbs__current').find('code').exists()).toBe(false)
  })

  it('draws a plain parent key as a chip too', () => {
    const w = mountTrail([{ label: 'v5.46.0', code: true }, { label: 'Notes' }])
    expect(
      w.find('.nb-breadcrumbs__parent code.nb-breadcrumbs__code').text(),
    ).toBe('v5.46.0')
  })

  it('renders a name without any code element', () => {
    const w = mountTrail([{ label: 'Home', to: '/' }, { label: 'Settings' }])
    expect(w.find('code').exists()).toBe(false)
  })
})
