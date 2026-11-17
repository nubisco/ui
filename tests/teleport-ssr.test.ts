import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSSRApp, createApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import NubiscoUI from '../src/main'
import Select from '../src/components/Select.vue'
import Modal from '../src/components/Modal.vue'

// Teleports and server rendering (useTeleportReady.composable.ts).
//
// A server-rendered `<Teleport to="body">` writes nothing in place: Vue puts
// its children in `ctx.teleports` for the server to inject. A prerenderer that
// never injects them (vite-ssg) sends a page without, and the browser then
// hydrates the teleport against body's first child, which is the app's own
// root. nubisco.io hit exactly that. `app.use(NubiscoUI, { ssr: true })` keeps
// every teleport in place until the app has hydrated.

const options = [
  { label: 'English', value: 'en' },
  { label: 'Português', value: 'pt' },
]

// A page with the two kinds of overlay a website carries: a closed dropdown
// (the language switcher) and a closed dialog.
const Page = defineComponent({
  setup() {
    const lang = ref('en')
    return () =>
      h('main', [
        h(Select, { label: 'Language', options, modelValue: lang.value }),
        h(Modal, { open: false, title: 'Cookies' }),
      ])
  },
})

function hydrationMessages(spies: ReturnType<typeof vi.spyOn>[]): string[] {
  return spies
    .flatMap((s) => s.mock.calls.map((c) => c.map(String).join(' ')))
    .filter((m) => /hydrat/i.test(m))
}

async function serverRender(
  ssr: boolean,
): Promise<{ html: string; teleports: Record<string, string> }> {
  const app = createSSRApp(Page)
  app.use(NubiscoUI, { ssr })
  const ctx: { teleports?: Record<string, string> } = {}
  const html = await renderToString(app, ctx)
  return { html, teleports: ctx.teleports ?? {} }
}

/** The browser side of a prerendered page: the server markup inside #app, as body's first child. */
async function hydrate(html: string, ssr: boolean) {
  document.body.innerHTML = `<div id="app">${html}</div>`
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const app = createSSRApp(Page)
  app.use(NubiscoUI, { ssr })
  const root = document.getElementById('app')!
  app.mount(root)
  await nextTick()
  return { app, root, messages: hydrationMessages([warn, error]) }
}

// jsdom has no scrollIntoView, which Select calls when it opens.
Element.prototype.scrollIntoView = function () {}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('teleports on a server-rendered page', () => {
  it('without the option, the server sends the teleports away and hydration fails', async () => {
    const { html, teleports } = await serverRender(false)
    expect(Object.keys(teleports)).toContain('body')
    const { messages } = await hydrate(html, false)
    // This is the bug, kept as a test so the reason for the option stays visible.
    expect(messages.length).toBeGreaterThan(0)
  })

  it('with `ssr: true`, the server renders the teleports in place', async () => {
    const { html, teleports } = await serverRender(true)
    // Vue still records the empty anchors there, but none of the content.
    expect((teleports.body ?? '').replace(/<!--[^>]*-->/g, '')).toBe('')
    expect(html).toContain('<!--teleport start-->')
  })

  it('with `ssr: true`, the browser hydrates without a single mismatch and keeps #app', async () => {
    const { html } = await serverRender(true)
    const { root, messages } = await hydrate(html, true)
    expect(messages).toEqual([])
    expect(document.getElementById('app')).toBe(root)
    expect(root.querySelector('main')).not.toBeNull()
  })

  it('once hydrated, an opened dropdown is in body, not inside the app', async () => {
    const { html } = await serverRender(true)
    const { root } = await hydrate(html, true)
    root
      .querySelector<HTMLElement>('.nb-select__trigger, [role="combobox"]')!
      .click()
    await nextTick()
    await nextTick()
    const dropdown = document.querySelector('.nb-select__dropdown')
    expect(dropdown).not.toBeNull()
    expect(root.contains(dropdown)).toBe(false)
  })
})

describe('teleports in an app that only renders in the browser', () => {
  it('without the option, a teleport is in body from the very first render', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const open = ref(true)
    const app = createApp({
      setup: () => () => h(Modal, { open: open.value, title: 'Now' }),
    })
    app.use(NubiscoUI)
    // Checked synchronously inside the first render's mount: no frame in place.
    const root = document.getElementById('app')!
    app.mount(root)
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(root.contains(dialog)).toBe(false)
    app.unmount()
  })

  it('with the option, an overlay created after mount teleports at once too', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    const show = ref(false)
    const app = createApp({
      setup: () => () =>
        show.value ? h(Modal, { open: true, title: 'Later' }) : h('p', 'idle'),
    })
    app.use(NubiscoUI, { ssr: true })
    const root = document.getElementById('app')!
    app.mount(root)
    show.value = true
    await nextTick()
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(root.contains(dialog)).toBe(false)
    app.unmount()
  })
})
