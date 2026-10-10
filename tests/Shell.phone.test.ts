import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Shell from '../src/components/Shell.vue'
import { useShellLayout } from '../src/composables/useShellLayout.composable'
import {
  NB_PHONE_QUERY,
  resetPhoneLayoutForTests,
} from '../src/composables/usePhoneLayout.composable'

const SHORT_TOUCH =
  '(pointer: coarse) and (hover: none) and (max-height: 500px)'

const setViewport = (px: number) => {
  Object.defineProperty(window, 'innerWidth', {
    value: px,
    configurable: true,
    writable: true,
  })
  window.dispatchEvent(new Event('resize'))
}

type TListener = (e: { matches: boolean }) => void

/** A matchMedia whose answers the test sets, with live change events. */
function stubMedia(matching: Set<string>) {
  const listeners = new Map<string, Set<TListener>>()
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return matching.has(query)
    },
    media: query,
    addEventListener: (_: string, fn: TListener) => {
      if (!listeners.has(query)) listeners.set(query, new Set())
      listeners.get(query)!.add(fn)
    },
    removeEventListener: (_: string, fn: TListener) => {
      listeners.get(query)?.delete(fn)
    },
  }))
  return {
    set(query: string, on: boolean) {
      if (on) matching.add(query)
      else matching.delete(query)
      listeners.get(query)?.forEach((fn) => fn({ matches: on }))
    },
    count: (query: string) => listeners.get(query)?.size ?? 0,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  resetPhoneLayoutForTests()
  setViewport(1024)
  document.body.innerHTML = ''
})

describe('Shell exposes its layout', () => {
  it('exposes collapsed, inspectorOverlay and setContextbarOpen', async () => {
    setViewport(1280)
    const w = mount(Shell, {
      props: { inspectorVisible: true },
      slots: { contextbar: '<a href="#d">Doc</a>', inspector: '<p>i</p>' },
    })
    const vm = w.vm as unknown as {
      collapsed: boolean
      inspectorOverlay: boolean
      setContextbarOpen: (open: boolean) => void
    }
    expect(vm.collapsed).toBe(false)
    expect(vm.inspectorOverlay).toBe(false)
    setViewport(360)
    await nextTick()
    expect(vm.collapsed).toBe(true)
    expect(vm.inspectorOverlay).toBe(true)
    // The contextbar is folded behind its toggle while collapsed.
    expect(
      w.find('.nb-shell__contextbar-toggle').attributes('aria-expanded'),
    ).toBe('false')
    vm.setContextbarOpen(true)
    await nextTick()
    expect(
      w.find('.nb-shell__contextbar-toggle').attributes('aria-expanded'),
    ).toBe('true')
    w.unmount()
  })

  it('gives the inspector slot { overlay, close }', async () => {
    setViewport(360)
    const w = mount(Shell, {
      props: { inspectorVisible: true },
      slots: {
        inspector: `<template #inspector="{ overlay, close }">
          <p class="mode">{{ overlay ? 'sheet' : 'column' }}</p>
          <button class="own-close" @click="close">x</button>
        </template>`,
      },
      attachTo: document.body,
    })
    expect(w.find('.mode').text()).toBe('sheet')
    await w.find('.own-close').trigger('click')
    expect(w.emitted('update:inspectorVisible')).toEqual([[false]])
    w.unmount()
  })

  it('tells the slot it is a column on desktop', () => {
    setViewport(1280)
    const w = mount(Shell, {
      props: { inspectorVisible: true },
      slots: {
        inspector: `<template #inspector="{ overlay }">
          <p class="mode">{{ overlay ? 'sheet' : 'column' }}</p>
        </template>`,
      },
    })
    expect(w.find('.mode').text()).toBe('column')
    w.unmount()
  })

  it('provides useShellLayout() to descendants', async () => {
    setViewport(1280)
    let layout: ReturnType<typeof useShellLayout> | null = null
    const Probe = defineComponent({
      setup() {
        layout = useShellLayout()
        return () => h('span')
      },
    })
    const w = mount(Shell, {
      props: { inspectorVisible: true },
      slots: { default: () => h(Probe) },
    })
    expect(layout!.collapsed.value).toBe(false)
    expect(layout!.inspectorOverlay.value).toBe(false)
    setViewport(360)
    await nextTick()
    expect(layout!.collapsed.value).toBe(true)
    expect(layout!.inspectorOverlay.value).toBe(true)
    w.unmount()
  })

  it('answers desktop outside a shell', () => {
    let layout: ReturnType<typeof useShellLayout> | null = null
    mount(
      defineComponent({
        setup() {
          layout = useShellLayout()
          return () => h('span')
        },
      }),
    )
    expect(layout!.collapsed.value).toBe(false)
    expect(layout!.inspectorOverlay.value).toBe(false)
  })
})

describe('Shell collapsed overlays follow navigation', () => {
  const navSlots = {
    'sidebar-nav': `
      <a href="#a" class="go">Alpha</a>
      <button role="menuitem" class="item">Beta</button>
      <button role="menuitem" aria-haspopup="menu" class="parent">More</button>
      <button role="menuitem" aria-expanded="false" class="group">Group</button>
      <a href="#k" data-nb-keep-open class="keep">Keep</a>
      <button class="plain">Plain</button>`,
    inspector: '<p>i</p>',
    default: '<p>page</p>',
  }

  const mountOpen = (props: Record<string, unknown> = {}) => {
    setViewport(360)
    return mount(Shell, {
      props: { sidebarOpen: true, ...props },
      slots: navSlots,
      attachTo: document.body,
    })
  }

  it('closes the drawer when a link is chosen', async () => {
    const w = mountOpen()
    await w.find('.go').trigger('click')
    expect(w.emitted('update:sidebarOpen')).toEqual([[false]])
    w.unmount()
  })

  it('closes the drawer when a plain menuitem is chosen', async () => {
    const w = mountOpen()
    await w.find('.item').trigger('click')
    expect(w.emitted('update:sidebarOpen')).toEqual([[false]])
    w.unmount()
  })

  it('keeps it open for submenu triggers, groups, opt-outs and non-items', async () => {
    const w = mountOpen()
    await w.find('.parent').trigger('click')
    await w.find('.group').trigger('click')
    await w.find('.keep').trigger('click')
    await w.find('.plain').trigger('click')
    expect(w.emitted('update:sidebarOpen')).toBeUndefined()
    w.unmount()
  })

  it('does nothing on desktop, where the sidebar is a column', async () => {
    setViewport(1280)
    const w = mount(Shell, { slots: navSlots, attachTo: document.body })
    await w.find('.go').trigger('click')
    expect(w.emitted('update:sidebarOpen')).toBeUndefined()
    w.unmount()
  })

  it('closes the drawer when the inspector sheet opens', async () => {
    const w = mountOpen({ inspectorVisible: false })
    await w.setProps({ inspectorVisible: true })
    await nextTick()
    expect(w.emitted('update:sidebarOpen')).toEqual([[false]])
    w.unmount()
  })

  it('closes the contextbar when a link in it is chosen', async () => {
    setViewport(360)
    const w = mount(Shell, {
      slots: {
        contextbar:
          '<a href="#d" class="doc">Doc</a><button class="other">x</button>',
      },
      attachTo: document.body,
    })
    const toggle = w.find('.nb-shell__contextbar-toggle')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    await w.find('.other').trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    await w.find('.doc').trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    w.unmount()
  })
})

describe('Shell Escape respects a handled Escape', () => {
  it('leaves the sheet open when a field already handled Escape', async () => {
    setViewport(360)
    const w = mount(Shell, {
      props: { inspectorVisible: true },
      slots: {
        inspector: '<input class="field" @keydown.esc.prevent="() => {}" />',
      },
      attachTo: document.body,
    })
    await w.find('.field').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('update:inspectorVisible')).toBeUndefined()
    expect(w.find('.nb-shell__inspector--overlay').exists()).toBe(true)
    // An unhandled Escape still closes it.
    await w.find('.nb-shell').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('update:inspectorVisible')).toEqual([[false]])
    w.unmount()
  })
})

describe('Shell landscape phone collapse', () => {
  it('is the second clause of NB_PHONE_QUERY', () => {
    expect(NB_PHONE_QUERY.split(', ')[1]).toBe(SHORT_TOUCH)
    const src = readFileSync(
      resolve(__dirname, '../src/components/Shell.vue'),
      'utf8',
    )
    expect(src).toContain(`'${SHORT_TOUCH}'`)
  })

  it('collapses a wide frame on a short touch screen', async () => {
    const media = stubMedia(new Set([SHORT_TOUCH]))
    setViewport(844)
    const w = mount(Shell, {
      slots: { 'sidebar-nav': '<a href="#a">A</a>' },
    })
    expect(w.classes()).toContain('nb-shell--collapsed')
    expect(w.find('.nb-shell__nav-toggle').exists()).toBe(true)
    media.set(SHORT_TOUCH, false)
    await nextTick()
    expect(w.classes()).not.toContain('nb-shell--collapsed')
    w.unmount()
    expect(media.count(SHORT_TOUCH)).toBe(0)
  })

  it('stays a desktop frame when the query does not match', () => {
    stubMedia(new Set())
    setViewport(844)
    const w = mount(Shell, { slots: { 'sidebar-nav': '<a href="#a">A</a>' } })
    expect(w.classes()).not.toContain('nb-shell--collapsed')
    w.unmount()
  })

  it('never collapses with collapseAt="none"', () => {
    stubMedia(new Set([SHORT_TOUCH]))
    setViewport(844)
    const w = mount(Shell, {
      props: { collapseAt: 'none' },
      slots: { 'sidebar-nav': '<a href="#a">A</a>' },
    })
    expect(w.classes()).not.toContain('nb-shell--collapsed')
    w.unmount()
  })
})

describe('Shell phone styles are gated', () => {
  const src = readFileSync(
    resolve(__dirname, '../src/components/Shell.vue'),
    'utf8',
  )
  const style = src.slice(src.indexOf('<style'))

  it('keeps the desktop topbar-right unshrinkable', () => {
    const base = /\n\.nb-shell__topbar-right \{([^}]*)\}/.exec(style)![1]
    expect(base).toContain('flex-shrink: 0')
    expect(base).not.toContain('overflow')
  })

  it('puts the topbar safety net under phone and collapsed both', () => {
    const net = style.slice(style.indexOf('@include bp.phone {'))
    const block = net.slice(0, net.indexOf('\n}\n'))
    expect(block).toContain('.nb-shell--collapsed {')
    expect(block).toContain('overflow-x: auto')
    expect(block).toContain('min-width: min(40%, 10rem)')
  })
})
