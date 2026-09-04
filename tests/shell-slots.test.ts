import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  createCommentVNode,
  defineComponent,
  KeepAlive,
  nextTick,
  ref,
} from 'vue'
import { mount } from '@vue/test-utils'
import Shell from '../src/components/Shell.vue'
import ShellPanel from '../src/components/ShellPanel.vue'
import {
  useShellSlot,
  type TShellSlotName,
} from '../src/composables/useShellSlot.composable'

/**
 * A view that contributes to a shell region, the way a routed page does.
 * `label` is what lands in the region, so a test can tell two views apart.
 */
function makeView(
  name: TShellSlotName,
  label: string,
  options: { order?: number; claim?: 'last' | 'all' } = {},
) {
  return defineComponent({
    name: `View${label}`,
    setup() {
      const slot = useShellSlot(name, options)
      return { slot }
    },
    template: `
      <div class="view">
        <component :is="slot.Outlet">
          <button class="contributed">${label}</button>
        </component>
      </div>
    `,
  })
}

/** Two ticks: one for the region to appear, one for the teleport to land. */
async function settle() {
  await nextTick()
  await nextTick()
}

/**
 * The exact viewport width is tracked through `requestAnimationFrame` (one
 * write per painted frame instead of one per resize event), so a test that
 * narrows the window has to let a frame pass before reading the pixels back.
 * The collapse threshold does not need this: it is latched and written
 * synchronously, which is why the responsive tests below do not call it.
 */
async function flushFrame() {
  await new Promise<void>((resolve) =>
    window.requestAnimationFrame(() => resolve()),
  )
  await nextTick()
}

describe('Shell topbar presence', () => {
  it('does not render the topbar when neither topbar slot has content', () => {
    const w = mount(Shell)
    expect(w.find('.nb-shell__topbar').exists()).toBe(false)
    w.unmount()
  })

  it('renders the topbar when topbar-left has content', () => {
    const w = mount(Shell, { slots: { 'topbar-left': '<h1>Page</h1>' } })
    expect(w.find('.nb-shell__topbar').exists()).toBe(true)
    expect(w.find('.nb-shell__topbar-left h1').exists()).toBe(true)
    w.unmount()
  })

  it('renders the topbar when only topbar-right has content', () => {
    const w = mount(Shell, { slots: { 'topbar-right': '<button>Go</button>' } })
    expect(w.find('.nb-shell__topbar').exists()).toBe(true)
    // Both halves stay in the DOM. The left half is the flex spacer that keeps
    // the right half against the right edge, so removing it would move the
    // controls for every consumer that passes only `topbar-right`.
    expect(w.find('.nb-shell__topbar-left').exists()).toBe(true)
    w.unmount()
  })

  it('treats a slot that renders only a comment as empty', () => {
    // `<template #topbar-left><span v-if="false" /></template>` is a comment
    // placeholder at runtime, which is the shape a conditional page title has.
    const w = mount(Shell, {
      slots: { 'topbar-left': () => [] },
    })
    expect(w.find('.nb-shell__topbar').exists()).toBe(false)
    w.unmount()
  })

  it('renders an empty topbar when topbar="always"', () => {
    const w = mount(Shell, { props: { topbar: 'always' } })
    expect(w.find('.nb-shell__topbar').exists()).toBe(true)
    w.unmount()
  })

  it('hides the topbar when topbar="never", even with slot content', () => {
    const w = mount(Shell, {
      props: { topbar: 'never' },
      slots: { 'topbar-left': '<h1>Page</h1>' },
    })
    expect(w.find('.nb-shell__topbar').exists()).toBe(false)
    w.unmount()
  })

  it('leaves every other region behaving exactly as before', () => {
    const w = mount(Shell, {
      slots: {
        'outer-menu': '<nav>menu</nav>',
        'inner-menu': '<nav>inner</nav>',
        fixedbar: '<span>tabs</span>',
        default: '<p>body</p>',
      },
    })
    expect(w.find('.nb-shell__outer-menu nav').exists()).toBe(true)
    expect(w.find('.nb-shell__inner-menu nav').exists()).toBe(true)
    expect(w.find('.nb-shell__fixedbar span').exists()).toBe(true)
    expect(w.find('.nb-shell__main p').exists()).toBe(true)
    w.unmount()
  })
})

describe('useShellSlot contributions', () => {
  it('renders a view contribution into the topbar and brings the bar back', async () => {
    const w = mount(Shell, {
      slots: { default: makeView('topbar-right', 'Save') },
    })

    // The region does not exist on the first render: the shell renders before
    // its slot children are created. This is the mount-order bug the DOM-id
    // approach hit, and the contract is that it resolves itself.
    await settle()

    expect(w.find('.nb-shell__topbar').exists()).toBe(true)
    const contributed = w.find('.nb-shell__topbar-right .contributed')
    expect(contributed.exists()).toBe(true)
    expect(contributed.text()).toBe('Save')
    w.unmount()
  })

  it('places a contribution alongside static slot content in the same region', async () => {
    const w = mount(Shell, {
      slots: {
        'topbar-left': '<h1 class="static">Reports</h1>',
        default: makeView('topbar-left', 'Export'),
      },
    })
    await settle()
    expect(w.find('.nb-shell__topbar-left .static').exists()).toBe(true)
    expect(w.find('.nb-shell__topbar-left .contributed').text()).toBe('Export')
    w.unmount()
  })

  it('teleports into non-topbar regions and makes them appear too', async () => {
    const w = mount(Shell, {
      slots: { default: makeView('fixedbar', 'Filters') },
    })
    await settle()
    expect(w.find('.nb-shell__fixedbar .contributed').text()).toBe('Filters')
    w.unmount()
  })

  it('removes the region again when the contributing view unmounts', async () => {
    const show = ref(true)
    const Host = defineComponent({
      components: { View: makeView('topbar-right', 'Save') },
      setup: () => ({ show }),
      template: `<View v-if="show" />`,
    })
    const w = mount(Shell, { slots: { default: Host } })
    await settle()
    expect(w.find('.nb-shell__topbar').exists()).toBe(true)

    show.value = false
    await settle()
    expect(w.find('.nb-shell__topbar').exists()).toBe(false)
    w.unmount()
  })

  it('gives the region to the newest view when two hold it at once', async () => {
    // The route-transition case: the arriving view is created before the
    // leaving one is torn down, so for a frame or two both are registered.
    const showOld = ref(true)
    const showNew = ref(false)
    const Host = defineComponent({
      components: {
        Old: makeView('topbar-right', 'Old'),
        New: makeView('topbar-right', 'New'),
      },
      setup: () => ({ showOld, showNew }),
      template: `<Old v-if="showOld" /><New v-if="showNew" />`,
    })
    const w = mount(Shell, { slots: { default: Host } })
    await settle()
    expect(w.find('.nb-shell__topbar-right .contributed').text()).toBe('Old')

    // Arriving view registers while the leaving one is still mounted.
    showNew.value = true
    await settle()
    let rendered = w.findAll('.nb-shell__topbar-right .contributed')
    expect(rendered).toHaveLength(1)
    expect(rendered[0]!.text()).toBe('New')

    // Leaving view finishes tearing down: nothing changes, because it was
    // already standing down.
    showOld.value = false
    await settle()
    rendered = w.findAll('.nb-shell__topbar-right .contributed')
    expect(rendered).toHaveLength(1)
    expect(rendered[0]!.text()).toBe('New')
    w.unmount()
  })

  it('hands the region back to the earlier view when the newer one leaves', async () => {
    // A contribution from a nested route or a dialog is reversible: closing it
    // restores the page's own controls instead of leaving the topbar empty.
    const showNew = ref(false)
    const Host = defineComponent({
      components: {
        Page: makeView('topbar-right', 'Page'),
        Dialog: makeView('topbar-right', 'Dialog'),
      },
      setup: () => ({ showNew }),
      template: `<Page /><Dialog v-if="showNew" />`,
    })
    const w = mount(Shell, { slots: { default: Host } })
    await settle()
    expect(w.find('.nb-shell__topbar-right .contributed').text()).toBe('Page')

    showNew.value = true
    await settle()
    expect(w.find('.nb-shell__topbar-right .contributed').text()).toBe('Dialog')

    showNew.value = false
    await settle()
    const rendered = w.findAll('.nb-shell__topbar-right .contributed')
    expect(rendered).toHaveLength(1)
    expect(rendered[0]!.text()).toBe('Page')
    w.unmount()
  })

  it('renders every contributor under claim="all", ordered by order', async () => {
    const Host = defineComponent({
      components: {
        Second: makeView('topbar-right', 'Second', { claim: 'all', order: 20 }),
        First: makeView('topbar-right', 'First', { claim: 'all', order: 10 }),
      },
      // Declared out of order on purpose: `order` decides, not the DOM.
      template: `<Second /><First />`,
    })
    const w = mount(Shell, { slots: { default: Host } })
    await settle()

    const texts = w
      .findAll('.nb-shell__topbar-right .contributed')
      .map((n) => n.text())
    expect(texts).toHaveLength(2)
    // Both are in the region; `order` sorts them visually, since teleports
    // append in mount order and the DOM cannot be relied on for this.
    const orders = w
      .findAll('.nb-shell__topbar-right .nb-shell-slot-contribution')
      .map((n) => (n.element as HTMLElement).style.order)
    expect(orders).toEqual(['20', '10'])
    expect(texts).toEqual(['Second', 'First'])
    w.unmount()
  })

  it('is inert outside a shell instead of throwing', async () => {
    const View = makeView('topbar-right', 'Orphan')
    const w = mount(View)
    await settle()
    expect(w.find('.view').exists()).toBe(true)
    expect(w.find('.contributed').exists()).toBe(false)
    const vm = w.vm as unknown as { slot: { ready: { value: boolean } } }
    expect(vm.slot.ready.value).toBe(false)
    w.unmount()
  })

  it('reports ready and active to the view', async () => {
    const View = makeView('topbar-left', 'Title')
    const w = mount(Shell, { slots: { default: View } })
    await settle()
    const vm = w.findComponent(View).vm as unknown as {
      slot: {
        ready: { value: boolean }
        active: { value: boolean }
        target: { value: HTMLElement | null }
        name: string
      }
    }
    expect(vm.slot.ready.value).toBe(true)
    expect(vm.slot.active.value).toBe(true)
    expect(vm.slot.name).toBe('topbar-left')
    // The target is the real host element, not a selector string. Nothing in
    // the contract is a magic id a second application could get wrong.
    expect(vm.slot.target.value).toBe(w.find('.nb-shell__topbar-left').element)
    w.unmount()
  })

  it('keeps the contributed DOM node identity across a shell re-render', async () => {
    // The regression guard for the function-ref identity: an inline arrow ref
    // would null the host and restore it on every patch, destroying and
    // rebuilding the teleported controls (and any focus or state in them).
    const w = mount(Shell, {
      props: { inspectorVisible: false },
      slots: { default: makeView('topbar-right', 'Save') },
    })
    await settle()
    const before = w.find('.contributed').element

    await w.setProps({ inspectorVisible: true })
    await settle()

    expect(w.find('.contributed').element).toBe(before)
    w.unmount()
  })
})

describe('ShellPanel fill', () => {
  it('does not carry the fill modifier by default', () => {
    const w = mount(ShellPanel, { props: { title: 'Console' } })
    expect(w.classes()).not.toContain('nb-shell-panel--fill')
    w.unmount()
  })

  it('applies the fill modifier when fill=true', () => {
    const w = mount(ShellPanel, { props: { title: 'Console', fill: true } })
    expect(w.classes()).toContain('nb-shell-panel--fill')
    // The size class is untouched: fill is about the parent's height, size is
    // about sharing the column with siblings.
    expect(w.classes()).toContain('default')
    w.unmount()
  })

  it('can be combined with a size and with fluid', () => {
    const w = mount(ShellPanel, {
      props: { title: 'Console', fill: true, fluid: true, size: 'full' },
    })
    expect(w.classes()).toEqual(
      expect.arrayContaining([
        'full',
        'nb-shell-panel--fluid',
        'nb-shell-panel--fill',
      ]),
    )
    w.unmount()
  })
})

/**
 * The one thing round-one testing could not see: every test above imports the
 * composable from `../src/composables/useShellSlot.composable`, which is a path
 * inside the library, not the package. A consumer writes
 * `import { useShellSlot } from '@nubisco/ui'`, and that is a different
 * question: it is only true if the symbol is on the entry.
 *
 * The entry cannot be imported under vitest (src/main.ts pulls in
 * `virtual:flags` and `virtual:icons`, which only exist under the library's own
 * Vite build), so this reads the entry the way tests/component-registration.ts
 * and tests/Toaster.test.ts already do: parse the re-exports out of the source,
 * then import the module each one points at and check the symbol is really
 * there. Source-matching alone would pass on a typo in the path.
 */
describe('package surface', () => {
  const root = resolve(__dirname, '..')
  const mainSrc = readFileSync(resolve(root, 'src/main.ts'), 'utf8')
  const indexSrc = readFileSync(resolve(root, 'src/index.ts'), 'utf8')

  /** Every `export { a, b } from './x'` and `export type { ... } from './x'`. */
  function reExports(src: string): { names: string[]; from: string }[] {
    const out: { names: string[]; from: string }[] = []
    const re = /export\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'([^']+)'/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) {
      out.push({
        names: m[1]!
          .split(',')
          .map((n) =>
            n
              .trim()
              .split(/\s+as\s+/)[0]!
              .trim(),
          )
          .filter(Boolean),
        from: m[2]!,
      })
    }
    return out
  }

  const entryExports = reExports(mainSrc)

  function sourceOf(name: string): string | undefined {
    return entryExports.find((e) => e.names.includes(name))?.from
  }

  it('re-exports the whole entry from src/index.ts', () => {
    // The published entry is src/index.ts; if this stops forwarding, nothing
    // below means anything.
    expect(indexSrc).toContain("export * from './main'")
  })

  it('exports useShellSlot from the package entry', async () => {
    const from = sourceOf('useShellSlot')
    expect(from).toBe('./composables/useShellSlot.composable')
    // And the path really exports it: a re-export of a name that does not
    // exist is a build error a consumer hits, not us.
    const mod = await import('../src/composables/useShellSlot.composable')
    expect(typeof mod.useShellSlot).toBe('function')
    expect(mod.useShellSlot).toBe(useShellSlot)
  })

  it.each([
    'TShellSlotName',
    'TShellSlotClaim',
    'IShellSlotOptions',
    'IShellSlot',
  ])('exports the %s type from the package entry', (name) => {
    // Types are erased at runtime, so the entry source is the only place they
    // can be checked. A consumer typing a `useShellSlot()` return value needs
    // every one of these.
    expect(sourceOf(name)).toBe('./composables/useShellSlot.composable')
  })

  it.each(['TShellTopbar', 'IShellProps', 'TInspectorSize', 'TSidebarVariant'])(
    'exports the %s shell type from the package entry',
    (name) => {
      expect(sourceOf(name)).toBe('./components/Shell.d')
    },
  )

  it.each(['TShellPanelSize', 'IShellPanelProps'])(
    'exports the %s panel type from the package entry',
    (name) => {
      expect(sourceOf(name)).toBe('./components/ShellPanel.d')
    },
  )

  it('does not leak the shell-to-composable contract onto the entry', () => {
    // The registry factory and the injection key are how NbShell and the
    // composable talk to each other. Exporting them would invite a consumer to
    // build a second shell against a private contract.
    expect(sourceOf('createShellSlotRegistry')).toBeUndefined()
    expect(sourceOf('NB_SHELL_SLOT_KEY')).toBeUndefined()
  })
})

describe('Shell inspector accessibility', () => {
  it('marks the closed inspector inert and hidden', () => {
    const w = mount(Shell, {
      props: { inspectorVisible: false },
      slots: { inspector: '<button class="deep">Rename</button>' },
    })
    const aside = w.find('.nb-shell__inspector')
    // A zero-width column with overflow:hidden is invisible but still
    // tabbable, and its controls are still announced. `inert` is what makes
    // the browser skip it; aria-hidden is the fallback for engines without it.
    expect(aside.attributes('inert')).toBeDefined()
    expect(aside.attributes('aria-hidden')).toBe('true')
    w.unmount()
  })

  it('drops inert and aria-hidden when the inspector opens', async () => {
    const w = mount(Shell, {
      props: { inspectorVisible: false },
      slots: { inspector: '<button class="deep">Rename</button>' },
    })
    await w.setProps({ inspectorVisible: true })
    const aside = w.find('.nb-shell__inspector')
    expect(aside.attributes('inert')).toBeUndefined()
    expect(aside.attributes('aria-hidden')).toBeUndefined()
    w.unmount()
  })

  it('names the inspector and the sidebar landmarks', () => {
    const w = mount(Shell, {
      props: { inspectorLabel: 'Properties', sidebarLabel: 'Sections' },
      slots: { 'sidebar-nav': '<a href="#x">One</a>' },
    })
    expect(w.find('.nb-shell__inspector').attributes('aria-label')).toBe(
      'Properties',
    )
    expect(w.find('nav.nb-shell__sidebar').attributes('aria-label')).toBe(
      'Sections',
    )
    w.unmount()
  })

  it('marks a closed inspector inert even when a view teleported into it', async () => {
    // The composable invites views to contribute to `inspector`, so the closed
    // column is no longer only the consumer's problem.
    const w = mount(Shell, {
      props: { inspectorVisible: false },
      slots: { default: makeView('inspector', 'Panel') },
    })
    await settle()
    expect(w.find('.nb-shell__inspector .contributed').exists()).toBe(true)
    expect(w.find('.nb-shell__inspector').attributes('inert')).toBeDefined()
    w.unmount()
  })
})

describe('Shell skip link', () => {
  it('renders a skip link pointing at the main region', () => {
    const w = mount(Shell)
    const link = w.find('.nb-shell__skip-link')
    expect(link.exists()).toBe(true)
    const main = w.find('main.nb-shell__main')
    expect(main.attributes('id')).toBeTruthy()
    expect(link.attributes('href')).toBe(`#${main.attributes('id')}`)
    // Without this, following the link scrolls but never moves focus.
    expect(main.attributes('tabindex')).toBe('-1')
    w.unmount()
  })

  it('is the first focusable element in the frame', () => {
    const w = mount(Shell, { slots: { 'topbar-left': '<button>A</button>' } })
    const focusables = w.element.querySelectorAll('a[href], button')
    expect(focusables[0]!.classList.contains('nb-shell__skip-link')).toBe(true)
    w.unmount()
  })

  it('honours mainId and skipToContentLabel', () => {
    const w = mount(Shell, {
      props: { mainId: 'app-main', skipToContentLabel: 'Ir al contenido' },
    })
    expect(w.find('main.nb-shell__main').attributes('id')).toBe('app-main')
    const link = w.find('.nb-shell__skip-link')
    expect(link.attributes('href')).toBe('#app-main')
    expect(link.text()).toBe('Ir al contenido')
    w.unmount()
  })

  it('gives two shells on one page different main ids', () => {
    const Host = defineComponent({
      components: { Shell },
      template: '<div><Shell /><Shell /></div>',
    })
    const w = mount(Host)
    const ids = w.findAll('main.nb-shell__main').map((m) => m.attributes('id'))
    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
    w.unmount()
  })

  it('can be turned off for an application that ships its own', () => {
    const w = mount(Shell, { props: { skipToContent: false } })
    expect(w.find('.nb-shell__skip-link').exists()).toBe(false)
    w.unmount()
  })

  it('moves focus to main when the link is activated', async () => {
    const w = mount(Shell, { attachTo: document.body })
    await w.find('.nb-shell__skip-link').trigger('click')
    expect(document.activeElement).toBe(w.find('main.nb-shell__main').element)
    w.unmount()
  })
})

describe('Shell inspector resize', () => {
  const setViewport = (px: number) => {
    Object.defineProperty(window, 'innerWidth', {
      value: px,
      configurable: true,
      writable: true,
    })
    window.dispatchEvent(new Event('resize'))
  }

  const mountResizable = (inspectorWidth: number | null) =>
    mount(Shell, {
      props: { inspectorVisible: true, resizable: true, inspectorWidth },
    })

  it('re-clamps a persisted width when the window narrows', async () => {
    setViewport(1600)
    const w = mountResizable(700)
    // 700 is under half of 1600, so it survives untouched.
    expect(w.find('.nb-shell__inspector').attributes('style')).toContain(
      '700px',
    )

    setViewport(800)
    await flushFrame()
    // Half of 800. Without a resize listener the 700px width persisted from a
    // wide monitor squeezed the body to 100px and stayed there.
    expect(w.find('.nb-shell__inspector').attributes('style')).toContain(
      '400px',
    )
    w.unmount()
  })

  it('never clamps below the floor, however narrow the window gets', async () => {
    setViewport(320)
    const w = mountResizable(700)
    await nextTick()
    expect(w.find('.nb-shell__inspector').attributes('style')).toContain(
      '288px',
    )
    w.unmount()
  })

  it('exposes the handle as a keyboard-operable separator', () => {
    setViewport(1600)
    const w = mountResizable(700)
    const handle = w.find('.nb-shell__inspector-resize')
    expect(handle.attributes('role')).toBe('separator')
    expect(handle.attributes('aria-orientation')).toBe('vertical')
    expect(handle.attributes('tabindex')).toBe('0')
    expect(handle.attributes('aria-valuenow')).toBe('700')
    expect(handle.attributes('aria-valuemin')).toBe('288')
    expect(handle.attributes('aria-valuemax')).toBe('800')
    w.unmount()
  })

  it('resizes with the arrow keys and resets with Enter', async () => {
    setViewport(1600)
    const w = mountResizable(700)
    const handle = w.find('.nb-shell__inspector-resize')

    await handle.trigger('keydown', { key: 'ArrowLeft' })
    await handle.trigger('keydown', { key: 'ArrowRight' })
    await handle.trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
    await handle.trigger('keydown', { key: 'End' })
    await handle.trigger('keydown', { key: 'Home' })
    await handle.trigger('keydown', { key: 'Enter' })

    // The handle sits on the inspector's left edge, so ArrowLeft grows it.
    expect(w.emitted('update:inspectorWidth')).toEqual([
      [716],
      [684],
      [764],
      [800],
      [288],
      [null],
    ])
    w.unmount()
  })

  it('ignores keys it does not own', async () => {
    setViewport(1600)
    const w = mountResizable(700)
    await w.find('.nb-shell__inspector-resize').trigger('keydown', { key: 'a' })
    expect(w.emitted('update:inspectorWidth')).toBeUndefined()
    w.unmount()
  })

  it('renders no handle when the inspector is closed', () => {
    const w = mount(Shell, {
      props: { inspectorVisible: false, resizable: true },
    })
    expect(w.find('.nb-shell__inspector-resize').exists()).toBe(false)
    w.unmount()
  })
})

describe('Shell region presence is uniform', () => {
  // The notification and bottom regions used to test `$slots.x` directly,
  // which is true for a template whose only child is `v-if="false"`.
  // `menubar` is in the list because it was the last region still on the old
  // truthy-slot check: a menubar rendering only a comment used to leave a real
  // flex child in the body, hidden by an `:empty` rule that jsdom cannot even
  // apply, so the DOM said the strip was there and only a browser disagreed.
  it.each(['notification', 'bottom', 'menubar'] as const)(
    'treats a %s slot that renders nothing as empty',
    (region) => {
      const w = mount(Shell, {
        // Exactly what `<span v-if="false" />` compiles to at runtime.
        slots: { [region]: () => [createCommentVNode('v-if')] },
      })
      expect(w.find(`.nb-shell__${region}`).exists()).toBe(false)
      w.unmount()
    },
  )

  it.each(['notification', 'bottom'] as const)(
    'renders %s when a view contributes to it',
    async (region) => {
      const w = mount(Shell, { slots: { default: makeView(region, 'X') } })
      await settle()
      expect(w.find(`.nb-shell__${region} .contributed`).exists()).toBe(true)
      w.unmount()
    },
  )
})

describe('ShellPanel size controls', () => {
  it('renders the size buttons as buttons, not implicit submits', () => {
    // The documented use is a form in an inspector. Without type="button" the
    // first click on Minimize submits it.
    const w = mount(ShellPanel, { props: { title: 'Console' } })
    const buttons = w.findAll('.nb-shell-panel__size-btn')
    expect(buttons).toHaveLength(3)
    for (const b of buttons) expect(b.attributes('type')).toBe('button')
    w.unmount()
  })

  it('reports the active size with aria-pressed', async () => {
    const w = mount(ShellPanel, { props: { title: 'Console', size: 'full' } })
    const pressed = w
      .findAll('.nb-shell-panel__size-btn')
      .map((b) => b.attributes('aria-pressed'))
    expect(pressed).toEqual(['false', 'false', 'true'])

    await w.setProps({ size: 'collapsed' })
    expect(
      w
        .findAll('.nb-shell-panel__size-btn')
        .map((b) => b.attributes('aria-pressed')),
    ).toEqual(['true', 'false', 'false'])
    w.unmount()
  })

  it('names each size button and hides its glyph from assistive tech', () => {
    const w = mount(ShellPanel, { props: { title: 'Console' } })
    expect(
      w
        .findAll('.nb-shell-panel__size-btn')
        .map((b) => b.attributes('aria-label')),
    ).toEqual(['Minimize', 'Default', 'Maximize'])
    for (const svg of w.findAll('.nb-shell-panel__size-btn svg')) {
      expect(svg.attributes('aria-hidden')).toBe('true')
    }
    w.unmount()
  })

  it('groups them under one name so the three read as one control', () => {
    const w = mount(ShellPanel, { props: { title: 'Console' } })
    const group = w.find('.nb-shell-panel__header-right')
    expect(group.attributes('role')).toBe('group')
    expect(group.attributes('aria-label')).toBe('Console panel size')
    w.unmount()
  })

  it('leaves a custom controls slot entirely alone', () => {
    const w = mount(ShellPanel, {
      props: { title: 'Console' },
      slots: { controls: '<button class="mine">Close</button>' },
    })
    expect(w.findAll('.nb-shell-panel__size-btn')).toHaveLength(0)
    expect(w.find('.mine').exists()).toBe(true)
    w.unmount()
  })
})

/**
 * The frame is `height: 100dvh; overflow: hidden`, so a column that does not
 * fit has nowhere to go. Below `collapseAt` the sidebar has to stop being a
 * column and the inspector has to stop being one too, or a 240px rail plus a
 * 288px inspector leaves the page a negative width on a phone (and at 200%
 * browser zoom on a laptop, which is the same arithmetic and is WCAG 1.4.10).
 *
 * These assert the part a browser cannot be asked about in jsdom either way:
 * which elements exist, what they announce, where focus goes. The pixels that
 * follow from the class are asserted against the stylesheet further down.
 */
describe('Shell responsive frame', () => {
  const setViewport = (px: number) => {
    Object.defineProperty(window, 'innerWidth', {
      value: px,
      configurable: true,
      writable: true,
    })
    window.dispatchEvent(new Event('resize'))
  }

  const sidebarSlots = {
    'sidebar-nav': '<a href="#a" class="nav-link">Alpha</a>',
    default: '<p>page</p>',
  }

  const mountShell = (props: Record<string, unknown> = {}) =>
    mount(Shell, { props, slots: sidebarSlots, attachTo: document.body })

  afterEach(() => setViewport(1024))

  it('keeps the three-column frame above the breakpoint', () => {
    setViewport(1024)
    const w = mountShell()
    expect(w.classes()).not.toContain('nb-shell--collapsed')
    // No toggle, and the sidebar is a permanent, non-inert column.
    expect(w.find('.nb-shell__nav-toggle').exists()).toBe(false)
    expect(w.find('.nb-shell__sidebar').attributes('inert')).toBeUndefined()
    w.unmount()
  })

  it('collapses the sidebar into a drawer below the breakpoint', async () => {
    setViewport(1024)
    const w = mountShell()
    setViewport(500)
    await nextTick()

    expect(w.classes()).toContain('nb-shell--collapsed')
    const sidebar = w.find('.nb-shell__sidebar')
    // Closed means inert, not merely translated off screen: a drawer that is
    // still tabbable is the classic hidden-focus trap.
    expect(sidebar.attributes('inert')).toBeDefined()
    expect(sidebar.attributes('aria-hidden')).toBe('true')
    expect(w.find('.nb-shell__scrim').exists()).toBe(false)
    w.unmount()
  })

  it('renders the toggle in a topbar it forces on, even at topbar="never"', async () => {
    setViewport(500)
    const w = mountShell({ topbar: 'never' })
    await nextTick()
    // The bar is the only route back to the navigation at this width, so it
    // outranks the route's request for no topbar.
    expect(w.find('.nb-shell__topbar').exists()).toBe(true)
    const toggle = w.find('.nb-shell__nav-toggle')
    expect(toggle.attributes('type')).toBe('button')
    expect(toggle.attributes('aria-label')).toBe('Navigation')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-controls')).toBe(
      w.find('.nb-shell__sidebar').attributes('id'),
    )
    // The glyph is decoration and must not be read as three empty items.
    expect(
      w.find('.nb-shell__nav-toggle-glyph').attributes('aria-hidden'),
    ).toBe('true')
    w.unmount()
  })

  it('opens and closes the drawer from the toggle, uncontrolled', async () => {
    setViewport(500)
    const w = mountShell()
    await nextTick()

    await w.find('.nb-shell__nav-toggle').trigger('click')
    expect(w.classes()).toContain('nb-shell--drawer-open')
    expect(w.find('.nb-shell__sidebar').attributes('inert')).toBeUndefined()
    expect(w.find('.nb-shell__scrim').exists()).toBe(true)
    expect(w.find('.nb-shell__nav-toggle').attributes('aria-expanded')).toBe(
      'true',
    )
    // Still emits, so an application can persist the state without owning it.
    expect(w.emitted('update:sidebarOpen')).toEqual([[true]])

    await w.find('.nb-shell__nav-toggle').trigger('click')
    expect(w.classes()).not.toContain('nb-shell--drawer-open')
    expect(w.find('.nb-shell__sidebar').attributes('inert')).toBeDefined()
    w.unmount()
  })

  it('lets the application own the drawer with v-model:sidebar-open', async () => {
    setViewport(500)
    const w = mountShell({ sidebarOpen: false })
    await nextTick()

    await w.find('.nb-shell__nav-toggle').trigger('click')
    // Controlled: the shell asked, and rendered nothing until it was told.
    expect(w.emitted('update:sidebarOpen')).toEqual([[true]])
    expect(w.classes()).not.toContain('nb-shell--drawer-open')

    await w.setProps({ sidebarOpen: true })
    expect(w.classes()).toContain('nb-shell--drawer-open')
    w.unmount()
  })

  it('dismisses the drawer with the scrim and with Escape', async () => {
    setViewport(500)
    const w = mountShell()
    await nextTick()

    await w.find('.nb-shell__nav-toggle').trigger('click')
    await w.find('.nb-shell__scrim').trigger('click')
    expect(w.classes()).not.toContain('nb-shell--drawer-open')

    await w.find('.nb-shell__nav-toggle').trigger('click')
    await w.find('.nb-shell').trigger('keydown', { key: 'Escape' })
    expect(w.classes()).not.toContain('nb-shell--drawer-open')
    w.unmount()
  })

  it('moves focus into the drawer and back to the toggle', async () => {
    setViewport(500)
    const w = mountShell()
    await nextTick()

    await w.find('.nb-shell__nav-toggle').trigger('click')
    await settle()
    expect(document.activeElement).toBe(w.find('.nav-link').element)

    await w.find('.nb-shell__nav-toggle').trigger('click')
    await settle()
    // Focus must not be left on an element that just became inert.
    expect(document.activeElement).toBe(w.find('.nb-shell__nav-toggle').element)
    w.unmount()
  })

  it('closes the drawer when the viewport grows back', async () => {
    setViewport(500)
    const w = mountShell()
    await nextTick()
    await w.find('.nb-shell__nav-toggle').trigger('click')
    expect(w.classes()).toContain('nb-shell--drawer-open')

    setViewport(1200)
    await nextTick()
    expect(w.classes()).not.toContain('nb-shell--collapsed')
    expect(w.classes()).not.toContain('nb-shell--drawer-open')
    // The application is told, so a persisted flag cannot go stale.
    expect(w.emitted('update:sidebarOpen')?.at(-1)).toEqual([false])
    w.unmount()
  })

  it('drops the resize handle while collapsed, where width is not negotiable', async () => {
    setViewport(1024)
    const w = mount(Shell, {
      props: { inspectorVisible: true, resizable: true },
      slots: sidebarSlots,
    })
    expect(w.find('.nb-shell__inspector-resize').exists()).toBe(true)
    setViewport(500)
    await nextTick()
    // The inspector is a full-width overlay at this size, so there is no
    // column to widen and nothing honest for the separator to announce.
    expect(w.find('.nb-shell__inspector-resize').exists()).toBe(false)
    w.unmount()
  })

  it('honours collapseAt="lg" and collapseAt="none"', async () => {
    setViewport(900)
    const wide = mountShell({ collapseAt: 'lg' })
    expect(wide.classes()).toContain('nb-shell--collapsed')
    wide.unmount()

    setViewport(320)
    const never = mountShell({ collapseAt: 'none' })
    await nextTick()
    // The opt-out for a frame that is only ever shown on a desktop.
    expect(never.classes()).not.toContain('nb-shell--collapsed')
    expect(never.find('.nb-shell__nav-toggle').exists()).toBe(false)
    never.unmount()
  })

  it('leaves a shell with no sidebar alone at any width', async () => {
    setViewport(320)
    const w = mount(Shell, { slots: { default: '<p>page</p>' } })
    await nextTick()
    // Collapsed layout still applies (the main region gives back padding),
    // but there is no drawer to toggle and no bar forced on for it.
    expect(w.find('.nb-shell__nav-toggle').exists()).toBe(false)
    expect(w.find('.nb-shell__topbar').exists()).toBe(false)
    w.unmount()
  })
})

describe('Shell inspector width, controlled and uncontrolled', () => {
  const setViewport = (px: number) => {
    Object.defineProperty(window, 'innerWidth', {
      value: px,
      configurable: true,
      writable: true,
    })
    window.dispatchEvent(new Event('resize'))
  }

  afterEach(() => setViewport(1024))

  it('announces the rendered width when nothing is bound', () => {
    setViewport(1600)
    // The shipped default: `resizable` with no `v-model:inspector-width`.
    const w = mount(Shell, {
      props: { inspectorVisible: true, resizable: true },
    })
    const handle = w.find('.nb-shell__inspector-resize')
    // A focusable separator with no aria-valuenow is an ARIA violation, and
    // this was the state every consumer starts in. 560px is the `md` preset,
    // which is what the element actually renders.
    expect(handle.attributes('aria-valuenow')).toBe('560')
    expect(handle.attributes('aria-valuemin')).toBe('288')
    expect(handle.attributes('aria-valuemax')).toBe('800')
    w.unmount()
  })

  it('announces the preset for every size, clamped like the CSS', () => {
    setViewport(1000)
    for (const [size, expected] of [
      ['xs', '288'],
      ['sm', '360'],
      ['md', '500'], // 560 preset, clamped to half of a 1000px window
      ['lg', '500'],
      ['xl', '750'], // xl opts out of the ceiling, in CSS and here
    ] as const) {
      const w = mount(Shell, {
        props: { inspectorVisible: true, resizable: true, inspectorSize: size },
      })
      const handle = w.find('.nb-shell__inspector-resize')
      expect([size, handle.attributes('aria-valuenow')]).toEqual([
        size,
        expected,
      ])
      // The announced range always contains the announced value.
      expect(Number(handle.attributes('aria-valuemax'))).toBeGreaterThanOrEqual(
        Number(handle.attributes('aria-valuenow')),
      )
      w.unmount()
    }
  })

  it('actually resizes with no v-model bound', async () => {
    setViewport(1600)
    const w = mount(Shell, {
      props: { inspectorVisible: true, resizable: true },
    })
    const handle = w.find('.nb-shell__inspector-resize')
    await handle.trigger('keydown', { key: 'ArrowLeft' })

    // Uncontrolled: the shell keeps the width, so the handle moves something.
    // Before this it emitted into the void and the panel never changed.
    expect(w.find('.nb-shell__inspector').attributes('style')).toContain(
      '576px',
    )
    expect(handle.attributes('aria-valuenow')).toBe('576')
    // And it still emits, so persistence is possible without ownership.
    expect(w.emitted('update:inspectorWidth')).toEqual([[576]])

    await handle.trigger('keydown', { key: 'Enter' })
    expect(w.find('.nb-shell__inspector').attributes('style')).toBeUndefined()
    w.unmount()
  })

  it('never writes its own width when the consumer passed one', async () => {
    setViewport(1600)
    const w = mount(Shell, {
      props: { inspectorVisible: true, resizable: true, inspectorWidth: 700 },
    })
    await w
      .find('.nb-shell__inspector-resize')
      .trigger('keydown', { key: 'ArrowLeft' })
    // Controlled: it asks and waits. The width is the application's.
    expect(w.emitted('update:inspectorWidth')).toEqual([[716]])
    expect(w.find('.nb-shell__inspector').attributes('style')).toContain(
      '700px',
    )
    w.unmount()
  })

  it('treats a bound null as controlled, not as absent', async () => {
    setViewport(1600)
    const w = mount(Shell, {
      props: {
        inspectorVisible: true,
        resizable: true,
        inspectorWidth: null,
      },
    })
    await w
      .find('.nb-shell__inspector-resize')
      .trigger('keydown', { key: 'ArrowLeft' })
    // `v-model` with a null initial value is the documented reset state, so
    // the shell must not quietly take ownership of it.
    expect(w.emitted('update:inspectorWidth')).toEqual([[576]])
    expect(w.find('.nb-shell__inspector').attributes('style')).toBeUndefined()
    w.unmount()
  })
})

describe('Shell warns about a contribution it cannot place', () => {
  it('warns when a view contributes to a suppressed topbar', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(Shell, {
      props: { topbar: 'never' },
      slots: { default: makeView('topbar-right', 'Save') },
    })
    await settle()

    // The contribution is dropped: no host element means no teleport target.
    expect(w.find('.contributed').exists()).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toContain('topbar="never"')
    warn.mockRestore()
    w.unmount()
  })

  it('says nothing when the region is rendered', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(Shell, {
      slots: { default: makeView('topbar-right', 'Save') },
    })
    await settle()
    expect(w.find('.contributed').exists()).toBe(true)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    w.unmount()
  })
})

/**
 * `fill` is a prop that toggles a class, and two CSS rules that make the class
 * mean something. jsdom applies no stylesheet and measures no layout, so a test
 * that mounts the component can only ever re-assert the class, which is the
 * half that was never in doubt. These read the component's own `<style>` blocks
 * instead: the declarations, and the source order they depend on, are the
 * feature, and an edit that drops one currently breaks nothing that is red.
 */
describe('ShellPanel fill is two CSS rules, so read the CSS', () => {
  const src = readFileSync(
    resolve(__dirname, '../src/components/ShellPanel.vue'),
    'utf8',
  )

  /** The declarations inside the block a selector opens, braces balanced. */
  function ruleBody(css: string, selector: string): string {
    const start = css.indexOf(selector)
    expect(start, `selector not found: ${selector}`).toBeGreaterThan(-1)
    let i = css.indexOf('{', start)
    let depth = 0
    const from = i + 1
    for (; i < css.length; i++) {
      if (css[i] === '{') depth++
      else if (css[i] === '}' && --depth === 0) return css.slice(from, i)
    }
    throw new Error(`unbalanced block for ${selector}`)
  }

  it('claims the parent height rather than only naming a class', () => {
    const body = ruleBody(src, '&--fill:not(.collapsed)')
    // The exact pair two applications were re-declaring across six stylesheets.
    expect(body).toMatch(/flex:\s*1 1 auto/)
    // Without this the panel cannot shrink below its content and the scrollbar
    // lands on the page instead of inside the panel.
    expect(body).toMatch(/min-height:\s*0/)
    // `:not(.collapsed)` is load-bearing: a collapsed panel is header-only and
    // must not grab the column it was put away from.
    expect(src).toContain('&--fill:not(.collapsed)')
  })

  it('puts the scrollbar on the content region', () => {
    const body = ruleBody(
      src,
      '.nb-shell-panel--fill > .nb-shell-panel__content',
    )
    expect(body).toMatch(/overflow:\s*auto/)
    expect(body).toMatch(/min-height:\s*0/)
    // A single child (a table, a log) stacks and stretches rather than sitting
    // in a row, which is what the default `display: flex` would give it.
    expect(body).toMatch(/flex-direction:\s*column/)
  })

  it('beats fluid by source order, which is the only thing separating them', () => {
    // Equal specificity: `.nb-shell-panel--fluid.default` and
    // `.nb-shell-panel--fill:not(.collapsed)` are both two compound selectors,
    // so whichever is written last wins. Reordering the file would silently
    // make a `fill fluid` panel shrink to its content again.
    expect(src.indexOf('&--fill:not(.collapsed)')).toBeGreaterThan(
      src.indexOf('&--fluid.default'),
    )
  })

  it('still loses to a maximized sibling', () => {
    // The sibling-coordination rule is in the unscoped block and carries
    // `!important`, which is what lets it beat `fill`'s `flex: 1 1 auto` on a
    // panel that is both filling and squeezed by a `.full` neighbour.
    const body = ruleBody(
      src,
      ':has(> .nb-shell-panel.full) > .nb-shell-panel:not(.full)',
    )
    expect(body).toMatch(/flex:\s*0 0 auto\s*!important/)
    expect(body).toMatch(/display:\s*none\s*!important/)
  })
})

/**
 * The same argument for the frame: its collapsed layout and its two
 * empty-strip backstops are CSS, and the class that switches them is asserted
 * above by mounting. This checks the other half of the pair.
 */
describe('Shell layout rules the DOM tests cannot see', () => {
  const src = readFileSync(
    resolve(__dirname, '../src/components/Shell.vue'),
    'utf8',
  )

  it('gives the sidebar and the inspector overlay geometry when collapsed', () => {
    const collapsed = src.slice(src.indexOf('.nb-shell--collapsed {'))
    // The drawer comes out of the flow, so the body keeps the full width.
    expect(collapsed).toMatch(/\.nb-shell__sidebar \{[^}]*position: absolute/s)
    expect(collapsed).toMatch(/transform: translateX\(-100%\)/)
    // The inspector stops being a 288px column on a 320px screen. The class it
    // hangs on is `--overlay`, which the component binds to exactly the state
    // the dismiss button, the Escape handler and the body's `inert` react to,
    // so the pixels and the behaviour cannot describe different states.
    expect(collapsed).toMatch(
      /\.nb-shell__inspector--overlay \{[^}]*width: 100%/s,
    )
    expect(collapsed).toMatch(
      /\.nb-shell__inspector--overlay \{[^}]*max-width: none/s,
    )
    // Both need a containing block, declared unconditionally so nothing
    // re-parents at one width and not another.
    expect(src).toMatch(/\.nb-shell__middle \{[^}]*position: relative/s)
    expect(src).toMatch(/\.nb-shell__content-row \{[^}]*position: relative/s)
  })

  it('never hides a topbar that carries the drawer toggle', () => {
    // The `:has()` backstop exists so a topbar whose halves are both empty in
    // the DOM disappears. At collapsed widths the bar also holds the only
    // route back to the navigation, so the rule has to make an exception.
    expect(src).toContain(
      '.nb-shell__topbar:not(:has(> .nb-shell__nav-toggle)):has(',
    )
  })

  it('keeps every non-topbar strip on the :empty backstop', () => {
    for (const region of [
      'outer-menu',
      'inner-menu',
      'menubar',
      'notification',
      'bottom',
      'fixedbar',
    ]) {
      expect(src).toContain(`.nb-shell__${region}:empty`)
    }
  })

  it('names no brand colour and no literal rail width', () => {
    // This component was tokenised precisely so a white-label product never has
    // to name the vendor's ramp; a hex fallback inside it undoes that.
    expect(src).not.toMatch(/#[0-9a-fA-F]{6}/)
    expect(src).toContain('var(--nb-shell-inspector-resize-color)')
    expect(src).toContain('var(--nb-shell-sidebar-width-verbose)')
  })

  it('suppresses the motion it adds under prefers-reduced-motion', () => {
    const reduced = src.slice(src.indexOf('@media (prefers-reduced-motion'))
    // A drawer sliding across the screen is the largest movement the frame has.
    expect(reduced).toContain('.nb-shell__sidebar')
    expect(reduced).toContain('.nb-shell__scrim')
  })
})

describe('Two shells on one page keep their registries apart', () => {
  it('places each view contribution in its own shell', async () => {
    const w = mount(
      defineComponent({
        components: { Shell },
        setup: () => ({
          A: makeView('topbar-right', 'A'),
          B: makeView('topbar-right', 'B'),
        }),
        template: `
          <div>
            <Shell class="one"><component :is="A" /></Shell>
            <Shell class="two"><component :is="B" /></Shell>
          </div>
        `,
      }),
    )
    await settle()

    const [one, two] = w.findAll('.nb-shell')
    // The registry is provided per shell instance, so the arbitration that
    // makes one view stand down for another must not reach across frames.
    expect(one!.find('.nb-shell__topbar-right .contributed').text()).toBe('A')
    expect(two!.find('.nb-shell__topbar-right .contributed').text()).toBe('B')
    w.unmount()
  })
})

/**
 * `<router-view v-slot="{ Component }"><KeepAlive><component :is="Component"
 * /></KeepAlive></router-view>` is the standard way a Vue application keeps a
 * list's scroll position across a detail visit, and it is the one lifecycle
 * that neither `onUnmounted` nor `onScopeDispose` reports: a deactivated
 * component is moved to an off-document container and left alive. Because a
 * teleported subtree does not live in the component's own DOM, KeepAlive has
 * nothing to move, so without `onDeactivated` the cached page's Save button
 * stayed in the topbar of the page that replaced it: visible, focusable and
 * wired to a view that is no longer on screen.
 */
describe('Shell slots under KeepAlive', () => {
  /** A cached pair of routes inside one shell, switched by a ref. */
  function mountRouted(A: unknown, B: unknown) {
    const which = ref<'a' | 'b'>('a')
    const w = mount(
      defineComponent({
        components: { Shell, KeepAlive },
        setup: () => ({ which, A, B }),
        template: `
          <Shell>
            <KeepAlive>
              <component :is="which === 'a' ? A : B" :key="which" />
            </KeepAlive>
          </Shell>
        `,
      }),
      { attachTo: document.body },
    )
    return { w, which }
  }

  it('releases the region when the contributing view is cached away', async () => {
    const A = makeView('topbar-right', 'A')
    const B = defineComponent({
      name: 'ViewB',
      template: '<div class="view-b">plain</div>',
    })
    const { w, which } = mountRouted(A, B)
    await settle()
    expect(w.find('.nb-shell__topbar-right .contributed').text()).toBe('A')

    which.value = 'b'
    await settle()

    // The page is gone from the document, so its controls must be gone from
    // the frame's chrome too.
    expect(w.find('.view').exists()).toBe(false)
    expect(w.find('.nb-shell__topbar-right .contributed').exists()).toBe(false)
    // And with nothing left claiming it, the bar closes exactly as it does for
    // an unmounted view: a deactivated entry is not counted.
    expect(w.find('.nb-shell__topbar').exists()).toBe(false)
    w.unmount()
  })

  it('takes the region back when the cached view is activated again', async () => {
    const A = makeView('topbar-right', 'A')
    const B = defineComponent({
      name: 'ViewB',
      template: '<div class="view-b">plain</div>',
    })
    const { w, which } = mountRouted(A, B)
    await settle()

    which.value = 'b'
    await settle()
    which.value = 'a'
    await settle()

    expect(w.find('.nb-shell__topbar-right .contributed').text()).toBe('A')
    w.unmount()
  })

  it('hands the region over between two cached views, both ways', async () => {
    const A = makeView('topbar-right', 'A')
    const B = makeView('topbar-right', 'B')
    const { w, which } = mountRouted(A, B)
    await settle()
    expect(w.find('.nb-shell__topbar-right .contributed').text()).toBe('A')

    which.value = 'b'
    await settle()
    // Exactly one contribution, and it is the page the user is looking at.
    expect(w.findAll('.nb-shell__topbar-right .contributed')).toHaveLength(1)
    expect(w.find('.nb-shell__topbar-right .contributed').text()).toBe('B')

    // Back again: A is the newest claimant now, which is what `claim: 'last'`
    // has to mean for a cached page that has been navigated back to.
    which.value = 'a'
    await settle()
    expect(w.findAll('.nb-shell__topbar-right .contributed')).toHaveLength(1)
    expect(w.find('.nb-shell__topbar-right .contributed').text()).toBe('A')
    w.unmount()
  })

  it('keeps a shared claim out of the region while it is cached', async () => {
    const A = makeView('notification', 'A', { claim: 'all' })
    const B = makeView('notification', 'B', { claim: 'all' })
    const { w, which } = mountRouted(A, B)
    await settle()

    which.value = 'b'
    await settle()
    // `claim: 'all'` renders every live contributor. A cached one is not live.
    const labels = w
      .findAll('.nb-shell__notification .contributed')
      .map((n) => n.text())
    expect(labels).toEqual(['B'])
    w.unmount()
  })
})

/**
 * Below `collapseAt` the inspector is a sheet over the whole content row, and
 * the content row contains the body, which contains the topbar. So the sheet
 * covers the drawer toggle and any close button a product put in
 * `topbar-right`. Without a way out that the frame itself owns, that is a trap
 * on a phone, and a keyboard user could tab into the page behind it.
 */
describe('Shell inspector sheet has a way out', () => {
  const setViewport = (px: number) => {
    Object.defineProperty(window, 'innerWidth', {
      value: px,
      configurable: true,
      writable: true,
    })
    window.dispatchEvent(new Event('resize'))
  }

  afterEach(() => setViewport(1024))

  const mountSheet = (props: Record<string, unknown> = {}) =>
    mount(Shell, {
      props: { inspectorVisible: true, ...props },
      slots: { inspector: '<p class="panel">details</p>', default: '<p>x</p>' },
      attachTo: document.body,
    })

  it('is a plain column with no extra chrome above the breakpoint', () => {
    setViewport(1280)
    const w = mountSheet()
    expect(w.find('.nb-shell__inspector--overlay').exists()).toBe(false)
    // No dismiss button, because nothing is covered: the product's own close
    // control is still on screen and a second one would be noise.
    expect(w.find('.nb-shell__inspector-dismiss').exists()).toBe(false)
    expect(w.find('.nb-shell__body').attributes('inert')).toBeUndefined()
    w.unmount()
  })

  it('renders its own dismiss control and inerts the body below it', () => {
    setViewport(360)
    const w = mountSheet()
    expect(w.find('.nb-shell__inspector--overlay').exists()).toBe(true)
    const dismiss = w.find('.nb-shell__inspector-dismiss')
    expect(dismiss.exists()).toBe(true)
    // A real button with a name, not a glyph with a click handler.
    expect(dismiss.element.tagName).toBe('BUTTON')
    expect(dismiss.attributes('aria-label')).toBe('Close inspector')
    // The page underneath is covered, so it must not be reachable by Tab and
    // must not be read as page content behind the sheet.
    expect(w.find('.nb-shell__body').attributes('inert')).toBeDefined()
    expect(w.find('.nb-shell__body').attributes('aria-hidden')).toBe('true')
    w.unmount()
  })

  it('takes a localised name for the dismiss control', () => {
    setViewport(360)
    const w = mountSheet({ inspectorCloseLabel: 'Cerrar inspector' })
    expect(
      w.find('.nb-shell__inspector-dismiss').attributes('aria-label'),
    ).toBe('Cerrar inspector')
    w.unmount()
  })

  it('closes on the dismiss button and says so', async () => {
    setViewport(360)
    const w = mountSheet()
    await w.find('.nb-shell__inspector-dismiss').trigger('click')
    expect(w.emitted('update:inspectorVisible')).toEqual([[false]])
    // The prop still says `true` and nothing is listening, so the shell falls
    // back on its own override rather than leaving the sheet up.
    expect(w.find('.nb-shell__inspector--overlay').exists()).toBe(false)
    expect(w.find('.nb-shell__body').attributes('inert')).toBeUndefined()
    w.unmount()
  })

  it('closes on Escape', async () => {
    setViewport(360)
    const w = mountSheet()
    await w.find('.nb-shell').trigger('keydown.esc')
    expect(w.emitted('update:inspectorVisible')).toEqual([[false]])
    expect(w.find('.nb-shell__inspector--overlay').exists()).toBe(false)
    w.unmount()
  })

  it('lets Escape reach the drawer first when both overlays are up', async () => {
    setViewport(360)
    const w = mount(Shell, {
      props: { inspectorVisible: true, sidebarOpen: true },
      slots: {
        'sidebar-nav': '<a href="#a" class="nav-link">Alpha</a>',
        inspector: '<p class="panel">details</p>',
      },
      attachTo: document.body,
    })
    await w.find('.nb-shell').trigger('keydown.esc')
    // Topmost first: the drawer sits above the sheet.
    expect(w.emitted('update:sidebarOpen')).toEqual([[false]])
    expect(w.emitted('update:inspectorVisible')).toBeUndefined()
    w.unmount()
  })

  it('reopens when the application asks for it again after a dismissal', async () => {
    setViewport(360)
    const w = mountSheet()
    await w.find('.nb-shell__inspector-dismiss').trigger('click')
    expect(w.find('.nb-shell__inspector--overlay').exists()).toBe(false)

    // The local override is exactly that: local, and one-shot. An application
    // that toggles the prop off and on gets its sheet back.
    await w.setProps({ inspectorVisible: false })
    await w.setProps({ inspectorVisible: true })
    expect(w.find('.nb-shell__inspector--overlay').exists()).toBe(true)
    w.unmount()
  })

  it('never suppresses the desktop column', async () => {
    setViewport(360)
    const w = mountSheet()
    await w.find('.nb-shell__inspector-dismiss').trigger('click')
    expect(w.find('.nb-shell__inspector--visible').exists()).toBe(false)

    // Growing past the breakpoint is not the frame's decision to reverse: the
    // application still says the inspector is visible, and as a column it is
    // not covering anything.
    setViewport(1280)
    await nextTick()
    expect(w.find('.nb-shell__inspector--visible').exists()).toBe(true)
    expect(w.find('.nb-shell__inspector--overlay').exists()).toBe(false)
    w.unmount()
  })

  it('moves focus into the sheet and back out again', async () => {
    setViewport(1280)
    const w = mount(Shell, {
      props: { inspectorVisible: false },
      slots: {
        'topbar-right': '<button class="opener">Details</button>',
        inspector: '<p class="panel">details</p>',
      },
      attachTo: document.body,
    })
    const opener = w.find('.opener').element as HTMLElement
    opener.focus()

    setViewport(360)
    await w.setProps({ inspectorVisible: true })
    await settle()
    // The body is inert, so focus cannot stay on the button that opened it.
    expect(document.activeElement).toBe(
      w.find('.nb-shell__inspector-dismiss').element,
    )

    await w.find('.nb-shell__inspector-dismiss').trigger('click')
    await settle()
    expect(document.activeElement).toBe(opener)
    w.unmount()
  })

  it('owns the state when nothing is bound at all', async () => {
    setViewport(360)
    const w = mount(Shell, {
      slots: { inspector: '<p class="panel">details</p>' },
      attachTo: document.body,
    })
    // Uncontrolled default is closed, exactly as before this prop grew a
    // second mode.
    expect(w.find('.nb-shell__inspector--visible').exists()).toBe(false)
    const shell = w.vm as unknown as {
      setInspectorVisible: (v: boolean) => void
    }
    shell.setInspectorVisible(true)
    await nextTick()
    expect(w.find('.nb-shell__inspector--overlay').exists()).toBe(true)
    await w.find('.nb-shell__inspector-dismiss').trigger('click')
    expect(w.find('.nb-shell__inspector--visible').exists()).toBe(false)
    w.unmount()
  })
})

/**
 * `order` is a CSS property that only sorts flex and grid children. Three of
 * the eight contributable regions are block containers whose contents belong to
 * the product, so a documented `order` was silently doing nothing in them.
 */
describe('Shell ordered regions', () => {
  const blockRegions: TShellSlotName[] = [
    'outer-menu',
    'inner-menu',
    'notification',
  ]

  it.each(blockRegions)(
    'leaves %s a block container when nobody shares it',
    async (region) => {
      const w = mount(Shell, { slots: { [region]: '<span>static</span>' } })
      await settle()
      expect(
        w.find(`.nb-shell__${region}`).classes('nb-shell__region--ordered'),
      ).toBe(false)
      w.unmount()
    },
  )

  it.each(blockRegions)(
    'makes %s sortable while a shared contribution holds it',
    async (region) => {
      const View = makeView(region, 'A', { claim: 'all', order: 5 })
      const w = mount(Shell, {
        slots: { default: '<div />' },
        global: { components: { View } },
      })
      await settle()
      // No contribution yet, so nothing changed for anyone.
      expect(w.find(`.nb-shell__${region}`).exists()).toBe(false)

      const w2 = mount(
        defineComponent({
          components: { Shell },
          setup: () => ({ View }),
          template: `<Shell><component :is="View" /></Shell>`,
        }),
      )
      await settle()
      const host = w2.find(`.nb-shell__${region}`)
      expect(host.exists()).toBe(true)
      expect(host.classes()).toContain('nb-shell__region--ordered')
      // And the wrapper that carries the order is inside it.
      expect(host.find('.nb-shell-slot-contribution').exists()).toBe(true)
      w.unmount()
      w2.unmount()
    },
  )

  it('drops the flex switch again when the sharing view leaves', async () => {
    const View = makeView('notification', 'A', { claim: 'all' })
    const on = ref(true)
    const w = mount(
      defineComponent({
        components: { Shell },
        setup: () => ({ View, on }),
        template: `
          <Shell>
            <template #notification><span class="static">hi</span></template>
            <component :is="View" v-if="on" />
          </Shell>
        `,
      }),
    )
    await settle()
    expect(w.find('.nb-shell__notification').classes()).toContain(
      'nb-shell__region--ordered',
    )
    on.value = false
    await settle()
    expect(w.find('.nb-shell__notification').classes()).not.toContain(
      'nb-shell__region--ordered',
    )
    w.unmount()
  })
})

/**
 * `<NbShell :sidebar-open="isMobile ? open : undefined">` puts the key on the
 * vnode while binding nothing. Reading presence alone, the shell declared
 * itself controlled by `undefined`, pinned the drawer shut and made the toggle
 * a no-op.
 */
describe('Shell conditional v-model bindings', () => {
  const setViewport = (px: number) => {
    Object.defineProperty(window, 'innerWidth', {
      value: px,
      configurable: true,
      writable: true,
    })
    window.dispatchEvent(new Event('resize'))
  }
  afterEach(() => setViewport(1024))

  it('falls back to owning the drawer when the binding is undefined', async () => {
    setViewport(360)
    const w = mount(Shell, {
      props: { sidebarOpen: undefined },
      slots: { 'sidebar-nav': '<a href="#a" class="nav-link">Alpha</a>' },
      attachTo: document.body,
    })
    await w.find('.nb-shell__nav-toggle').trigger('click')
    // The toggle actually opens something, and still reports it.
    expect(w.find('.nb-shell__nav-toggle').attributes('aria-expanded')).toBe(
      'true',
    )
    expect(w.emitted('update:sidebarOpen')).toEqual([[true]])
    w.unmount()
  })

  it('still follows the prop once the application supplies one', async () => {
    setViewport(360)
    const w = mount(Shell, {
      props: { sidebarOpen: undefined },
      slots: { 'sidebar-nav': '<a href="#a" class="nav-link">Alpha</a>' },
      attachTo: document.body,
    })
    await w.setProps({ sidebarOpen: true })
    expect(w.find('.nb-shell__nav-toggle').attributes('aria-expanded')).toBe(
      'true',
    )
    w.unmount()
  })

  it('is still fully controlled when a real value is bound', async () => {
    setViewport(360)
    const w = mount(Shell, {
      props: { sidebarOpen: false },
      slots: { 'sidebar-nav': '<a href="#a" class="nav-link">Alpha</a>' },
      attachTo: document.body,
    })
    await w.find('.nb-shell__nav-toggle').trigger('click')
    // Emits, but does not move on its own: the application owns it.
    expect(w.emitted('update:sidebarOpen')).toEqual([[true]])
    expect(w.find('.nb-shell__nav-toggle').attributes('aria-expanded')).toBe(
      'false',
    )
    w.unmount()
  })
})

describe('Shell exposes the handles a parent legitimately needs', () => {
  it('hands back its landmarks and its two state setters', async () => {
    const w = mount(Shell, {
      slots: { default: '<p>page</p>' },
      attachTo: document.body,
    })
    const shell = w.vm as unknown as {
      mainEl: HTMLElement | null
      inspectorEl: HTMLElement | null
      focusMain: () => void
      setInspectorVisible: (v: boolean) => void
    }
    expect(shell.mainEl).toBe(w.find('main.nb-shell__main').element)
    expect(shell.inspectorEl).toBe(w.find('.nb-shell__inspector').element)
    shell.focusMain()
    expect(document.activeElement).toBe(w.find('main.nb-shell__main').element)
    shell.setInspectorVisible(true)
    await nextTick()
    expect(w.find('.nb-shell__inspector--visible').exists()).toBe(true)
    w.unmount()
  })
})
