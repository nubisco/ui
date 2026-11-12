import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Panel from '../src/components/Panel.vue'
import Card from '../src/components/Card.vue'
import Layer from '../src/components/Layer.vue'
import { layerClassFor } from '../src/composables/useSurfaceLayer.composable'

afterEach(() => {
  document.body.innerHTML = ''
})

/** The markup with Vue's `v-if` placeholders and the scope attribute taken
 *  out. The placeholders are comment nodes: no box, no text, and `:empty`
 *  ignores them. The scope id changes with the file's contents. */
function markup(el: Element): string {
  return el.outerHTML
    .replace(/<!--[^]*?-->/g, '')
    .replace(/ data-v-[a-z0-9]+=""/g, '')
}

function layerOf(el: Element | null | undefined): number | null {
  if (!el) return null
  for (let level = 0; level <= 3; level++) {
    if (el.classList.contains(layerClassFor(level as 0 | 1 | 2 | 3))) {
      return level
    }
  }
  return null
}

async function mountInBody(template: string) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const wrapper = mount(
    defineComponent({ components: { Panel, Card, Layer }, template }),
    { attachTo: host },
  )
  await nextTick()
  await nextTick()
  return wrapper
}

describe('Panel', () => {
  it('renders with nb-panel class', () => {
    const wrapper = mount(Panel)
    expect(wrapper.classes()).toContain('nb-panel')
  })

  it('renders slot content', () => {
    const wrapper = mount(Panel, {
      slots: { default: '<p class="content">Hello</p>' },
    })
    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.text()).toBe('Hello')
  })

  it('renders as a div element', () => {
    const wrapper = mount(Panel)
    expect(wrapper.element.tagName.toLowerCase()).toBe('div')
  })
})

describe('Panel header', () => {
  it('renders exactly the bare surface it always has without a title or header slots', () => {
    // The markup NbPanel rendered before it had a header. Every product's
    // existing panels must keep it, element for element.
    const wrapper = mount(Panel, {
      slots: { default: '<p class="content">Hello</p>' },
    })
    expect(markup(wrapper.element)).toBe(
      '<div class="nb-panel nb-layer-1" data-nb-layer="1"><p class="content">Hello</p></div>',
    )
    expect(wrapper.find('.nb-panel__header').exists()).toBe(false)
  })

  it('renders the title as an h2 by default', () => {
    const wrapper = mount(Panel, { props: { title: 'Members' } })
    const heading = wrapper.find('.nb-panel__header .nb-panel__title')
    expect(heading.element.tagName).toBe('H2')
    expect(heading.text()).toBe('Members')
  })

  it('takes a heading level for the page outline', () => {
    const wrapper = mount(Panel, {
      props: { title: 'Members', headingLevel: 'h3' },
    })
    expect(wrapper.find('.nb-panel__title').element.tagName).toBe('H3')
  })

  it('renders the description under the title', () => {
    const wrapper = mount(Panel, {
      props: { title: 'Members', description: 'Who can see this space.' },
    })
    expect(wrapper.find('p.nb-panel__description').text()).toBe(
      'Who can see this space.',
    )
  })

  it('renders meta beside the title and actions at the end', () => {
    const wrapper = mount(Panel, {
      props: { title: 'Members' },
      slots: {
        meta: '<span class="count">12</span>',
        actions: '<button class="add">Add</button>',
        default: '<p>Body</p>',
      },
    })
    expect(
      wrapper.find('.nb-panel__title-row .nb-panel__meta .count').exists(),
    ).toBe(true)
    expect(wrapper.find('.nb-panel__actions .add').exists()).toBe(true)
    // The header comes before the body.
    expect(wrapper.element.firstElementChild?.className).toBe(
      'nb-panel__header',
    )
  })

  it('renders a header for actions alone, with no heading element', () => {
    const wrapper = mount(Panel, {
      slots: { actions: '<button>Add</button>' },
    })
    expect(wrapper.find('.nb-panel__header').exists()).toBe(true)
    expect(wrapper.find('.nb-panel__title').exists()).toBe(false)
  })
})

describe('Panel flat', () => {
  it('paints no surface: no layer class and no surface marker', async () => {
    const wrapper = await mountInBody('<Panel flat />')
    expect(wrapper.element.classList.contains('nb-panel--flat')).toBe(true)
    expect(layerOf(wrapper.element)).toBeNull()
    expect(wrapper.element.hasAttribute('data-nb-layer')).toBe(false)
    wrapper.unmount()
  })

  it('does not deepen its contents: a panel inside paints what a sibling would', async () => {
    const wrapper = await mountInBody(
      '<div><Panel class="sibling" /><Panel flat><Panel class="inner" /></Panel></div>',
    )
    const sibling = document.querySelector('.sibling')
    const inner = document.querySelector('.inner')
    expect(layerOf(sibling)).toBe(1)
    expect(layerOf(inner)).toBe(1)
    wrapper.unmount()
  })

  it('keeps the enclosing level inside a raised panel', async () => {
    const wrapper = await mountInBody(
      '<Panel><Panel flat><Panel class="inner"><Panel class="deeper" /></Panel></Panel></Panel>',
    )
    expect(layerOf(document.querySelector('.inner'))).toBe(2)
    expect(layerOf(document.querySelector('.deeper'))).toBe(3)
    wrapper.unmount()
  })

  it('keeps the ground level on a layer-0 ground', async () => {
    const wrapper = await mountInBody(
      '<Layer :level="0"><Panel flat><Panel class="inner" /></Panel></Layer>',
    )
    // Whatever a panel placed straight in this context paints, a panel inside
    // a flat tile in the same context paints too.
    const direct = await mountInBody(
      '<Layer :level="0"><Panel class="direct" /></Layer>',
    )
    expect(layerOf(document.querySelector('.inner'))).toBe(
      layerOf(document.querySelector('.direct')),
    )
    wrapper.unmount()
    direct.unmount()
  })

  it('is raised again when flat is turned off', async () => {
    const wrapper = mount(Panel, { props: { flat: true } })
    expect(layerOf(wrapper.element)).toBeNull()
    await wrapper.setProps({ flat: false })
    expect(layerOf(wrapper.element)).toBe(1)
  })
})

describe('Card header and flat', () => {
  it('renders the title as an h3 by default', () => {
    const wrapper = mount(Card, { props: { title: 'Reverb' } })
    expect(wrapper.find('.nb-card__title').element.tagName).toBe('H3')
  })

  it('keeps the title a span inside a clickable card, which is a button', () => {
    const wrapper = mount(Card, { props: { title: 'Reverb', clickable: true } })
    expect(wrapper.find('.nb-card__title').element.tagName).toBe('SPAN')
  })

  it('renders no heading when there is no title', () => {
    const wrapper = mount(Card)
    expect(wrapper.find('.nb-card__title').element.tagName).toBe('SPAN')
  })

  it('takes description as the line under the title', () => {
    const wrapper = mount(Card, {
      props: { title: 'Reverb', description: 'Places a signal in a room.' },
    })
    expect(wrapper.find('.nb-card__subtitle').text()).toBe(
      'Places a signal in a room.',
    )
  })

  it('lays the head out as a bar with meta and actions', () => {
    const wrapper = mount(Card, {
      props: { title: 'Reverb' },
      slots: { meta: '<span>3</span>', actions: '<button>Open</button>' },
    })
    expect(wrapper.find('.nb-card__head--bar').exists()).toBe(true)
    expect(wrapper.find('.nb-card__meta').text()).toBe('3')
    expect(wrapper.find('.nb-card__actions button').exists()).toBe(true)
  })

  it('does not lay the head out as a bar without them', () => {
    const wrapper = mount(Card, { props: { title: 'Reverb' } })
    expect(wrapper.find('.nb-card__head--bar').exists()).toBe(false)
  })

  it('paints no surface and does not deepen its contents when flat', async () => {
    const wrapper = await mountInBody(
      '<div><Card flat class="tile"><Panel class="inner" /></Card></div>',
    )
    const tile = document.querySelector('.tile')
    expect(tile?.classList.contains('nb-card--flat')).toBe(true)
    expect(layerOf(tile)).toBeNull()
    expect(layerOf(document.querySelector('.inner'))).toBe(1)
    wrapper.unmount()
  })
})

describe('NbPanel icon and hint', () => {
  it('draws no icon markup without the prop', () => {
    const w = mount(Panel, { props: { title: 'Members' } })
    expect(w.find('.nb-panel__lead').exists()).toBe(false)
    expect(w.find('.nb-panel__icon').exists()).toBe(false)
    expect(w.find('h2.nb-panel__title').text()).toBe('Members')
  })

  it('draws a decorative icon before the title', () => {
    const w = mount(Panel, { props: { title: 'Members', icon: 'users' } })
    const kids = [...w.find('.nb-panel__lead').element.children]
    expect(kids[0].classList.contains('nb-panel__icon')).toBe(true)
    expect(kids[0].getAttribute('aria-hidden')).toBe('true')
    expect(kids[1].tagName).toBe('H2')
    expect(w.find('h2').text()).toBe('Members')
  })

  it('puts an NbInfoHint from the meta slot right after the title', () => {
    const w = mount(Panel, {
      props: { title: 'Members', icon: 'users' },
      slots: { meta: '<span class="probe-hint">?</span>' },
    })
    const row = w.find('.nb-panel__title-row').element
    expect(row.children[0].classList.contains('nb-panel__lead')).toBe(true)
    expect(row.children[1].classList.contains('nb-panel__meta')).toBe(true)
    expect(w.find('.nb-panel__meta .probe-hint').exists()).toBe(true)
  })

  it('renders a real NbInfoHint in the meta slot', async () => {
    const InfoHint = (await import('../src/components/InfoHint.vue')).default
    const w = mount(
      defineComponent({
        components: { Panel, InfoHint },
        template:
          '<Panel title="Members"><template #meta><InfoHint text="Who can open this" /></template></Panel>',
      }),
    )
    expect(w.find('.nb-panel__meta .nb-info-hint').exists()).toBe(true)
  })
})
