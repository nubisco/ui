import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import TableOfContents from '../src/components/TableOfContents.vue'
import type { ITableOfContentsItem } from '../src/components/TableOfContents.d'

const items: ITableOfContentsItem[] = [
  { id: 'intro', label: 'Introduction', level: 2 },
  { id: 'setup', label: 'Setup', level: 4 },
  { id: 'install', label: 'Install', level: 3 },
  { id: 'usage', label: 'Usage', level: 2 },
]

const mounted: VueWrapper[] = []
let page: HTMLElement

/** The sections the contents point at, with their distance from the top. */
function renderPage(tops: Record<string, number>) {
  page = document.createElement('div')
  for (const item of items) {
    const heading = document.createElement('h2')
    heading.id = item.id
    heading.textContent = item.label
    heading.scrollIntoView = vi.fn()
    heading.getBoundingClientRect = () =>
      ({ top: tops[item.id] ?? 0 }) as DOMRect
    page.appendChild(heading)
  }
  document.body.appendChild(page)
}

function mountToc(props: Record<string, unknown> = {}) {
  const wrapper = mount(TableOfContents, {
    props: { items, ...props },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  return wrapper
}

const heading = (id: string) => document.getElementById(id)!

beforeEach(() => {
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
  window.history.replaceState(null, '', '/doc')
})

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('NbTableOfContents structure', () => {
  it('nests flat items by relative level', () => {
    renderPage({})
    const wrapper = mountToc({ spy: false })
    const top = wrapper.find('nav > ol')
    const topLabels = top.findAll(':scope > li > a').map((a) => a.text())
    expect(topLabels).toEqual(['Introduction', 'Usage'])
    // An h4 straight under an h2 is one step in, and the h3 after it is a
    // sibling of the h4, not a child of it.
    const nested = top
      .find(':scope > li > ol')
      .findAll(':scope > li > a')
      .map((a) => a.text())
    expect(nested).toEqual(['Setup', 'Install'])
  })

  it('renders real links in the tab order, in a named navigation landmark', () => {
    renderPage({})
    const wrapper = mountToc({ spy: false })
    const nav = wrapper.find('nav')
    expect(nav.attributes('aria-label')).toBe('Table of contents')
    const links = wrapper.findAll('a')
    expect(links.map((a) => a.attributes('href'))).toEqual([
      '#intro',
      '#setup',
      '#install',
      '#usage',
    ])
    expect(links.every((a) => a.attributes('tabindex') === undefined)).toBe(
      true,
    )
  })
})

describe('NbTableOfContents navigation', () => {
  it('scrolls to a section, marks it current, and moves focus to it', async () => {
    renderPage({})
    const wrapper = mountToc({ spy: false })
    await wrapper.find('a[href="#usage"]').trigger('click')

    expect(heading('usage').scrollIntoView).toHaveBeenCalled()
    expect(document.activeElement).toBe(heading('usage'))
    expect(heading('usage').getAttribute('tabindex')).toBe('-1')
    expect(window.location.hash).toBe('#usage')
    expect(wrapper.emitted('navigate')![0][0]).toMatchObject({ id: 'usage' })
    expect(wrapper.emitted('update:active')!.at(-1)).toEqual(['usage'])
    expect(wrapper.find('a[href="#usage"]').attributes('aria-current')).toBe(
      'location',
    )
  })

  it('leaves a modified click to the browser', async () => {
    renderPage({})
    const wrapper = mountToc({ spy: false })
    await wrapper.find('a[href="#usage"]').trigger('click', { metaKey: true })
    expect(heading('usage').scrollIntoView).not.toHaveBeenCalled()
    expect(wrapper.emitted('navigate')).toBeUndefined()
  })

  it('does not focus a target inside an editable region', async () => {
    renderPage({})
    page.setAttribute('contenteditable', 'true')
    const wrapper = mountToc({ spy: false })
    await wrapper.find('a[href="#setup"]').trigger('click')
    expect(heading('setup').scrollIntoView).toHaveBeenCalled()
    expect(document.activeElement).not.toBe(heading('setup'))
  })

  it('does not write the address bar when updateHash is off', async () => {
    renderPage({})
    const wrapper = mountToc({ spy: false, updateHash: false })
    await wrapper.find('a[href="#usage"]').trigger('click')
    expect(window.location.hash).toBe('')
  })

  it('finds targets with resolveTarget when they have no ids', async () => {
    renderPage({})
    const targets = Array.from(page.children) as HTMLElement[]
    targets.forEach((el) => el.removeAttribute('id'))
    const resolveTarget = vi.fn(
      (_: ITableOfContentsItem, index: number) => targets[index],
    )
    const wrapper = mountToc({ spy: false, resolveTarget })
    await wrapper.find('a[href="#install"]').trigger('click')
    expect(resolveTarget).toHaveBeenCalledWith(items[2], 2)
    expect(targets[2].scrollIntoView).toHaveBeenCalled()
  })

  it('follows the address bar fragment once, when asked to', async () => {
    renderPage({})
    window.history.replaceState(null, '', '/doc#install')
    const wrapper = mountToc({ spy: false, followHash: true })
    await nextTick()
    await nextTick()
    expect(heading('install').scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
    })
    expect(wrapper.emitted('update:active')!.at(-1)).toEqual(['install'])
  })
})

describe('NbTableOfContents scroll spy', () => {
  async function measured(wrapper: VueWrapper) {
    ;(wrapper.vm as unknown as { measure: () => void }).measure()
    await nextTick()
  }

  it('highlights the last section that has scrolled past the offset', async () => {
    renderPage({ intro: -400, setup: -100, install: 60, usage: 500 })
    const wrapper = mountToc({ offset: 96 })
    await measured(wrapper)
    expect(wrapper.find('[aria-current="location"]').text()).toBe('Install')
  })

  it('highlights nothing above the first section', async () => {
    renderPage({ intro: 300, setup: 500, install: 700, usage: 900 })
    const wrapper = mountToc()
    await measured(wrapper)
    expect(wrapper.find('[aria-current="location"]').exists()).toBe(false)
  })

  it('highlights the last section on screen at the bottom of the page', async () => {
    renderPage({ intro: -900, setup: -600, install: 120, usage: 600 })
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1200)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(
      2000,
    )
    const wrapper = mountToc()
    await measured(wrapper)
    expect(wrapper.find('[aria-current="location"]').text()).toBe('Usage')
  })

  it('follows a bound active value instead of its own', async () => {
    renderPage({ intro: -400, setup: -100, install: 60, usage: 500 })
    const wrapper = mountToc({ active: 'usage' })
    await measured(wrapper)
    expect(wrapper.find('[aria-current="location"]').text()).toBe('Usage')
    expect(wrapper.emitted('update:active')!.at(-1)).toEqual(['install'])
  })
})

describe('NbTableOfContents open and closed', () => {
  it('a docked contents hides to a show button and hands it focus', async () => {
    renderPage({})
    const wrapper = mountToc({ spy: false })
    await wrapper.find('button[aria-label="Hide contents"]').trigger('click')
    await nextTick()
    await nextTick()

    const show = wrapper.find('button[aria-label="Show contents"]')
    expect(wrapper.find('nav').exists()).toBe(false)
    expect(show.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(show.element)
    expect(wrapper.emitted('update:open')!.at(-1)).toEqual([false])

    await show.trigger('click')
    expect(wrapper.find('nav').exists()).toBe(true)
  })

  it('a docked contents that is not collapsible has no hide button', () => {
    renderPage({})
    const wrapper = mountToc({ spy: false, collapsible: false })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('a floating contents starts closed and closes after a choice', async () => {
    renderPage({})
    const wrapper = mountToc({ spy: false, variant: 'floating' })
    expect(wrapper.find('nav').exists()).toBe(false)

    await wrapper.find('button[aria-label="Show contents"]').trigger('click')
    expect(wrapper.find('nav').exists()).toBe(true)
    await wrapper.find('a[href="#setup"]').trigger('click')
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('Escape closes a floating contents and returns focus to its button', async () => {
    renderPage({})
    const wrapper = mountToc({ spy: false, variant: 'floating' })
    await wrapper.find('button[aria-label="Show contents"]').trigger('click')
    await wrapper.find('a[href="#setup"]').trigger('keydown', { key: 'Escape' })
    await nextTick()
    await nextTick()
    expect(wrapper.find('nav').exists()).toBe(false)
    expect(document.activeElement).toBe(
      wrapper.find('button[aria-label="Show contents"]').element,
    )
  })

  it('respects a bound open value', async () => {
    renderPage({})
    const wrapper = mountToc({ spy: false, open: false })
    expect(wrapper.find('nav').exists()).toBe(false)
    await wrapper.find('button[aria-label="Show contents"]').trigger('click')
    // Still closed until the host passes the new value back.
    expect(wrapper.find('nav').exists()).toBe(false)
    expect(wrapper.emitted('update:open')!.at(-1)).toEqual([true])
    await wrapper.setProps({ open: true })
    expect(wrapper.find('nav').exists()).toBe(true)
  })
})
