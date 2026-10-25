import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CardGrid from '../src/components/CardGrid.vue'
import Card from '../src/components/Card.vue'
import Panel from '../src/components/Panel.vue'
import { defineComponent } from 'vue'

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

describe('NbCard and the layer system', () => {
  // A card is a surface, so it derives its depth exactly as NbPanel does. It
  // used to paint whatever `--nb-c-surface` it inherited, the surface of its
  // container, so a card straight on a shell page was the page's own colour.
  const mountTree = (template: string) =>
    mount(defineComponent({ components: { Card, Panel }, template }), {
      attachTo: document.body,
    })

  it('paints layer 1 at the top of a tree, the first surface on a page', () => {
    const w = mountTree('<Card title="A" />')
    expect(w.find('.nb-card').classes()).toContain('nb-layer-1')
    expect(w.find('.nb-card').attributes('data-nb-layer')).toBe('1')
    w.unmount()
  })

  it('goes one deeper inside a panel', () => {
    const w = mountTree('<Panel><Card title="A" /></Panel>')
    expect(w.find('.nb-card').classes()).toContain('nb-layer-2')
    w.unmount()
  })

  it('keeps a layer class the consumer writes', () => {
    const w = mountTree('<Card title="A" class="nb-layer-3" />')
    expect(w.find('.nb-card').classes()).toContain('nb-layer-3')
    expect(w.find('.nb-card').classes()).not.toContain('nb-layer-1')
    w.unmount()
  })
})

describe('NbCard orientation', () => {
  it('is vertical by default, with no horizontal class', () => {
    const w = mount(Card, { props: { title: 'A' } })
    expect(w.classes()).not.toContain('nb-card--horizontal')
  })

  it('puts the media beside the text when horizontal', () => {
    const w = mount(Card, {
      props: { title: 'Notes', orientation: 'horizontal', icon: 'tray' },
      slots: { default: 'Write things down' },
    })
    expect(w.classes()).toContain('nb-card--horizontal')
    // The markup is the vertical card's, laid out by the grid, so the reading
    // order stays icon, title, description.
    const order = Array.from(w.element.children).map((el) => el.className)
    expect(order[0]).toContain('nb-card__icon')
    expect(order[1]).toContain('nb-card__head')
    expect(order[2]).toContain('nb-card__body')
  })

  it('stays a link when horizontal, for a launcher tile', () => {
    const w = mount(Card, {
      props: { title: 'Notes', orientation: 'horizontal', href: '/notes' },
    })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBe('/notes')
  })
})

describe('NbCard media', () => {
  it('has no media box unless asked for one', () => {
    const w = mount(Card, { props: { title: 'A' } })
    expect(w.find('.nb-card__media').exists()).toBe(false)
  })

  it('renders the image, lazily, decorative unless given alt text', () => {
    const w = mount(Card, { props: { title: 'A', image: '/a.png' } })
    const img = w.find('.nb-card__media img')
    expect(img.attributes('src')).toBe('/a.png')
    expect(img.attributes('alt')).toBe('')
    expect(img.attributes('loading')).toBe('lazy')

    const named = mount(Card, {
      props: { title: 'A', image: '/a.png', imageAlt: 'A chart' },
    })
    expect(named.find('img').attributes('alt')).toBe('A chart')
  })

  it('draws a placeholder in the same box when the image is missing', () => {
    for (const image of ['', null]) {
      const w = mount(Card, { props: { title: 'A', image } })
      const media = w.find('.nb-card__media')
      expect(media.exists()).toBe(true)
      expect(media.classes()).toContain('nb-card__media--empty')
      expect(media.find('img').exists()).toBe(false)
      expect(media.find('.nb-card__placeholder').exists()).toBe(true)
    }
  })

  it('falls back to the placeholder when the image fails to load, and retries a new one', async () => {
    const w = mount(Card, { props: { title: 'A', image: '/broken.png' } })
    await w.find('img').trigger('error')
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('.nb-card__placeholder').exists()).toBe(true)

    await w.setProps({ image: '/fixed.png' })
    expect(w.find('img').attributes('src')).toBe('/fixed.png')
  })

  it('takes a ratio and a fit', () => {
    const w = mount(Card, {
      props: { image: '/a.png', imageRatio: '1', imageFit: 'contain' },
    })
    const style = w.find('.nb-card__media').attributes('style')
    expect(style).toContain('--nb-card-image-ratio: 1')
    expect(style).toContain('--nb-card-image-fit: contain')
  })

  it('takes anything in the media slot instead of the image', () => {
    const w = mount(Card, {
      props: { title: 'A' },
      slots: { media: '<video class="clip" />' },
    })
    expect(w.find('.nb-card__media .clip').exists()).toBe(true)
    expect(w.find('.nb-card__media--empty').exists()).toBe(false)
  })

  it('paints the media box one layer below the card', () => {
    const w = mount(
      defineComponent({
        components: { Card, Panel },
        template: '<Panel><Card image="" /></Panel>',
      }),
      { attachTo: document.body },
    )
    expect(w.find('.nb-card').classes()).toContain('nb-layer-2')
    expect(w.find('.nb-card__media').classes()).toContain('nb-layer-3')
    w.unmount()
  })
})
