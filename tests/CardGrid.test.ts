import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CardGrid from '../src/components/CardGrid.vue'
import Card from '../src/components/Card.vue'

describe('NbCardGrid', () => {
  it('lays out columns from a minimum card width, not a page span', () => {
    // The reason this is not an NbGrid prop: NbGrid answers "how much of the
    // page does this take", a card grid answers "how many of these fit".
    const w = mount(CardGrid)
    expect(w.attributes('style')).toContain(
      'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
    )
  })

  it('takes a custom minimum', () => {
    const w = mount(CardGrid, { props: { min: '18rem' } })
    expect(w.attributes('style')).toContain('minmax(min(18rem, 100%), 1fr)')
  })

  it('clamps the minimum to the container so a narrow panel does not overflow', () => {
    // `min(min, 100%)` rather than the bare value: a fixed minimum wider than
    // its container overflows instead of shrinking, which is a phone and an
    // inspector.
    const w = mount(CardGrid, { props: { min: '400px' } })
    expect(w.attributes('style')).toContain('min(400px, 100%)')
  })

  it('can collapse empty columns with auto-fit', () => {
    const w = mount(CardGrid, { props: { fill: 'auto-fit' } })
    expect(w.attributes('style')).toContain('repeat(auto-fit')
  })

  it('exposes the gap on the same scale as NbGrid', () => {
    expect(mount(CardGrid).attributes('data-gap')).toBe('md')
    expect(
      mount(CardGrid, { props: { gap: 'lg' } }).attributes('data-gap'),
    ).toBe('lg')
  })
})

describe('NbCard', () => {
  it('renders as a link when given an href, so the browser affordances work', () => {
    const w = mount(Card, { props: { title: 'Plugin', href: '/plugins/1' } })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBe('/plugins/1')
  })

  it('adds rel=noopener when it opens a new tab', () => {
    const w = mount(Card, {
      props: { href: 'https://example.com', target: '_blank' },
    })
    expect(w.attributes('rel')).toBe('noopener')
  })

  it('acts as a button when clickable and not a link', async () => {
    const w = mount(Card, { props: { title: 'Type', clickable: true } })
    expect(w.attributes('role')).toBe('button')
    expect(w.attributes('tabindex')).toBe('0')
    await w.trigger('click')
    expect(w.emitted('select')).toHaveLength(1)
  })

  it('activates from the keyboard when it acts as a button', async () => {
    const w = mount(Card, { props: { clickable: true } })
    await w.trigger('keydown', { key: 'Enter' })
    await w.trigger('keydown', { key: ' ' })
    expect(w.emitted('select')).toHaveLength(2)
  })

  it('is inert when disabled', async () => {
    const w = mount(Card, { props: { clickable: true, disabled: true } })
    await w.trigger('click')
    await w.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('select')).toBeUndefined()
  })

  it('is a plain div when it neither navigates nor acts', () => {
    // A card that does nothing should not advertise that it does.
    const w = mount(Card, { props: { title: 'Fact' } })
    expect(w.element.tagName).toBe('DIV')
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('tabindex')).toBeUndefined()
  })

  it('renders title, subtitle, body and footer', () => {
    const w = mount(Card, {
      props: { title: 'Reverb', subtitle: 'effect', icon: 'tray' },
      slots: { default: 'A room simulator', footer: '<span>audio</span>' },
    })
    expect(w.find('.nb-card__title').text()).toBe('Reverb')
    expect(w.find('.nb-card__subtitle').text()).toBe('effect')
    expect(w.find('.nb-card__body').text()).toBe('A room simulator')
    expect(w.find('.nb-card__footer').text()).toBe('audio')
  })

  it('omits the optional regions when nothing fills them', () => {
    const w = mount(Card, { props: { title: 'Bare' } })
    expect(w.find('.nb-card__body').exists()).toBe(false)
    expect(w.find('.nb-card__footer').exists()).toBe(false)
    expect(w.find('.nb-card__icon').exists()).toBe(false)
  })
})
