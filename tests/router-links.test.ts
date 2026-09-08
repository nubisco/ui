import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import Button from '../src/components/Button.vue'
import SidebarLink from '../src/components/SidebarLink.vue'
import SidebarMenuItem from '../src/components/SidebarMenuItem.vue'

// Every component that takes `to` renders a real <RouterLink> when the app has
// a router, and a plain <a> when it does not. The two paths produce the href
// differently: we write it on the anchor, RouterLink computes it on the anchor
// it owns. That second path shipped for four minor versions rendering <a> with
// no href at all, because the component bound `:href="isAnchor ? href :
// undefined"`, and an attribute bound to `undefined` still falls through onto
// RouterLink's anchor and clears the href it just computed.
//
// A stubbed RouterLink cannot catch that: the stub has no href of its own to
// lose. So these run against the real router, and they assert the attribute
// rather than the tag, because the tag was never what broke.

const routes = [
  { path: '/', name: 'home', component: { template: '<div />' } },
  { path: '/contact', name: 'contact', component: { template: '<div />' } },
]

let router: Router

beforeEach(async () => {
  router = createRouter({ history: createMemoryHistory(), routes })
  router.push('/')
  await router.isReady()
})

const withRouter = () => ({ global: { plugins: [router] } })

describe('`to` links carry an href when a router is installed', () => {
  it('NbButton: string `to`', () => {
    const w = mount(Button, { props: { to: '/contact' }, ...withRouter() })
    expect(w.element.tagName.toLowerCase()).toBe('a')
    expect(w.attributes('href')).toBe('/contact')
  })

  it('NbButton: named-route `to`', () => {
    const w = mount(Button, {
      props: { to: { name: 'contact' } },
      ...withRouter(),
    })
    expect(w.attributes('href')).toBe('/contact')
  })

  it('NbSidebarLink: string `to`', () => {
    const w = mount(SidebarLink, { props: { to: '/contact' }, ...withRouter() })
    expect(w.attributes('href')).toBe('/contact')
  })

  it('NbSidebarLink: named-route `to`', () => {
    const w = mount(SidebarLink, {
      props: { to: { name: 'contact' } },
      ...withRouter(),
    })
    expect(w.attributes('href')).toBe('/contact')
  })

  it('NbSidebarMenuItem: string `to`', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Contact', to: '/contact' },
      ...withRouter(),
    })
    expect(w.get('a').attributes('href')).toBe('/contact')
  })

  it('NbSidebarMenuItem: named-route `to`', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Contact', to: { name: 'contact' } },
      ...withRouter(),
    })
    expect(w.get('a').attributes('href')).toBe('/contact')
  })
})

describe('`to` links are links, not just clickable elements', () => {
  // The click handler survived the bug, so navigation by mouse kept working
  // and a smoke test kept passing. What an href buys beyond that: link
  // semantics for assistive tech, crawlability, middle-click and open-in-new-
  // tab. `getByRole('link')` is the assertion that notices.
  it('NbButton is exposed as a link, with a router', () => {
    const w = mount(Button, { props: { to: '/contact' }, ...withRouter() })
    // An <a> is only role=link when it has an href.
    expect(w.element.tagName.toLowerCase()).toBe('a')
    expect(w.attributes('href')).toBeTruthy()
  })

  it('NbSidebarLink is exposed as a link, with a router', () => {
    const w = mount(SidebarLink, { props: { to: '/contact' }, ...withRouter() })
    expect(w.element.tagName.toLowerCase()).toBe('a')
    expect(w.attributes('href')).toBeTruthy()
  })
})

describe('the no-router path keeps working', () => {
  it('NbButton renders a plain anchor for a string `to`', () => {
    const w = mount(Button, { props: { to: '/contact' } })
    expect(w.element.tagName.toLowerCase()).toBe('a')
    expect(w.attributes('href')).toBe('/contact')
  })

  it('NbButton still honours href, target and rel on the plain anchor', () => {
    const w = mount(Button, {
      props: { href: '/contact', target: '_blank', rel: 'noopener' },
    })
    expect(w.attributes('href')).toBe('/contact')
    expect(w.attributes('target')).toBe('_blank')
    expect(w.attributes('rel')).toBe('noopener')
  })

  it('NbSidebarLink renders a plain anchor for a string `to`', () => {
    const w = mount(SidebarLink, { props: { to: '/contact' } })
    expect(w.attributes('href')).toBe('/contact')
  })

  it('NbSidebarMenuItem renders a plain anchor for a string `to`', () => {
    const w = mount(SidebarMenuItem, {
      props: { label: 'Contact', to: '/contact' },
    })
    expect(w.get('a').attributes('href')).toBe('/contact')
  })
})

describe('the prerendered markup carries the href too', () => {
  // The consuming site is prerendered, so a missing href is baked into the
  // HTML that ships and that crawlers read, not just into a hydrated DOM.
  it('NbButton server-renders an href for a `to` link', async () => {
    const app = createSSRApp({
      render: () => h(Button, { to: '/contact' }, () => 'Go'),
    })
    app.use(router)
    const html = await renderToString(app)
    expect(html).toContain('href="/contact"')
  })
})
