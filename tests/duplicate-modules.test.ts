import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

/**
 * Two copies of the library's modules in one page.
 *
 * Vite's dev server can pre-bundle `@nubisco/ui` (where an app gets its
 * plugins and composables) and `@nubisco/ui/components/<Name>` (where
 * `@nubisco/ui/vite` resolves the components) separately, each with its own
 * copy of a shared source module. In Alter that left NbCommandPalette
 * injecting a different `Symbol('nb-command-palette')` than the plugin had
 * provided, so the palette threw on mount and never opened. A production build
 * merges the copies, which is why it only happened in development.
 *
 * `vi.resetModules()` between two dynamic imports reproduces that exactly:
 * the second import evaluates every library module again, while `vue` (an
 * external dependency) stays one instance, as it does in the browser.
 */

const PALETTE = '../src/composables/useCommandPalette.composable'
const PLUGIN = '../src/plugins/commandPalette'
const PALETTE_COMPONENT = '../src/components/CommandPalette.vue'
const TOAST = '../src/composables/useToast.composable'
const TOASTER = '../src/components/Toaster.vue'

/** Load the modules once, then again as a second, separate copy. */
async function twoCopies<T extends unknown[]>(
  load: () => Promise<T>,
): Promise<[T, T]> {
  vi.resetModules()
  const first = await load()
  vi.resetModules()
  const second = await load()
  return [first, second]
}

beforeEach(() => {
  document.body.replaceChildren()
})

afterEach(() => {
  vi.resetModules()
})

describe('with two copies of the library modules', () => {
  it('really does load two copies (the premise of every test below)', async () => {
    const [[a], [b]] = await twoCopies(() => Promise.all([import(PALETTE)]))
    expect(a.createCommandPaletteState).not.toBe(b.createCommandPaletteState)
  })

  it('NbCommandPalette finds the state the plugin from the other copy provided, and opens', async () => {
    // First copy: what the app installs from the main entry.
    vi.resetModules()
    const { NbCommandPalettePlugin } = await import(PLUGIN)
    // Second copy: what `@nubisco/ui/components/CommandPalette` brings.
    vi.resetModules()
    const NbCommandPalette = (await import(PALETTE_COMPONENT)).default
    const palette = await import(PALETTE)

    const problems: unknown[] = []
    let state: { isOpen: boolean; open: () => void } | undefined
    const Root = defineComponent({
      setup() {
        state = palette.useCommandPalette()
        return () => h(NbCommandPalette)
      },
    })

    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(Root)
    app.config.errorHandler = (error) => void problems.push(error)
    app.config.warnHandler = (message) => void problems.push(message)
    app.use(NbCommandPalettePlugin)
    app.mount(host)

    expect(problems).toEqual([])
    state!.open()
    await nextTick()
    await nextTick()
    expect(state!.isOpen).toBe(true)
    expect(problems).toEqual([])
    expect(document.querySelector('.nb-command-palette__overlay')).not.toBe(
      null,
    )
    app.unmount()
  })

  it('every injection key is the same symbol in both copies', async () => {
    const load = () =>
      Promise.all([
        import(PALETTE),
        import(TOAST),
        import('../src/composables/useShellLayout.composable'),
        import('../src/composables/useShellSlot.composable'),
        import('../src/composables/useSurfaceLayer.composable'),
        import('../src/components/Stepper.context'),
        import('../src/components/TextInput.context'),
        import('../src/components/TreeContext'),
        import('../src/components/Blueprint.context'),
        import('../src/components/Accordion.context'),
        import('../src/components/CheckboxGroup.context'),
      ])
    const [a, b] = await twoCopies(load)
    const keysOf = (mods: Record<string, unknown>[]) =>
      mods.flatMap((mod) =>
        Object.entries(mod)
          .filter(([, value]) => typeof value === 'symbol')
          .map(([name, value]) => [name, value] as const),
      )
    const first = keysOf(a)
    const second = keysOf(b)
    expect(first.map(([name]) => name).sort()).toEqual([
      'NB_ACCORDION_CONTEXT',
      'NB_BLUEPRINT_CONTEXT',
      'NB_BLUEPRINT_CONTROLLER',
      'NB_CHECKBOX_GROUP_CONTEXT',
      'NB_COMMAND_PALETTE_KEY',
      'NB_LAYER_INJECTION_KEY',
      'NB_SHELL_LAYOUT_KEY',
      'NB_SHELL_SLOT_KEY',
      'NB_STEPPER_CONTEXT',
      'NB_TEXT_INPUT_CONTEXT',
      'NB_TOAST_QUEUE_KEY',
      'NB_TREE_ANCESTORS_KEY',
      'NB_TREE_DEPTH_KEY',
      'NB_TREE_KEY',
    ])
    expect(second).toEqual(first)
    for (const [, key] of first) {
      expect(Symbol.keyFor(key as symbol)).toMatch(/^@nubisco\/ui:/)
    }
  })

  it('a toast pushed through one copy is rendered by NbToaster from the other', async () => {
    vi.resetModules()
    const toastA = await import(TOAST)
    toastA.resetToastQueue()
    vi.resetModules()
    const Toaster = (await import(TOASTER)).default
    const toastB = await import(TOAST)
    expect(toastA.useToast).not.toBe(toastB.useToast)

    const host = document.createElement('div')
    host.id = 'nb-dup-toaster'
    document.body.appendChild(host)
    const wrapper = mount(Toaster, {
      props: { to: '#nb-dup-toaster' },
      attachTo: document.body,
    })

    toastA.useToast().info('From the other copy', { duration: 0 })
    await nextTick()
    await nextTick()
    expect(host.textContent).toContain('From the other copy')
    expect(toastB.useToast()).toBe(toastA.useToast())

    wrapper.unmount()
    toastA.resetToastQueue()
  })

  it('an icon registered through one copy is found by the other', async () => {
    const [[a], [b]] = await twoCopies(() =>
      Promise.all([import('../src/composables/iconRegistry')]),
    )
    const Glyph = defineComponent({ render: () => h('svg') })
    a.registerIcons({ 'dup-test-glyph': Glyph })
    expect(b.getRegisteredIcon('dup-test-glyph')).toBe(Glyph)
    b.unregisterIcon('dup-test-glyph')
    expect(a.getRegisteredIcon('dup-test-glyph')).toBeUndefined()
  })

  it('a flag registered through one copy is found by the other', async () => {
    const [[a], [b]] = await twoCopies(() =>
      Promise.all([import('../src/composables/flagRegistry')]),
    )
    const Flag = defineComponent({ render: () => h('svg') })
    a.registerFlags({ zz: Flag })
    expect(b.getRegisteredFlag('zz')).toBe(Flag)
    a.clearRegisteredFlags()
  })

  it('the scroll lock counts owners from both copies as one', async () => {
    const [[a], [b]] = await twoCopies(() =>
      Promise.all([import('../src/composables/useScrollLock.composable')]),
    )
    a.resetScrollLock()
    document.body.style.overflow = ''
    a.acquireScrollLock()
    b.acquireScrollLock()
    expect(a.scrollLockDepth()).toBe(2)
    a.releaseScrollLock()
    // The other copy's owner still holds it.
    expect(document.body.style.overflow).toBe('hidden')
    b.releaseScrollLock()
    expect(document.body.style.overflow).toBe('')
  })

  it('the theme configured through one copy is the theme the other reads and sets', async () => {
    const [[a], [b]] = await twoCopies(() =>
      Promise.all([import('../src/composables/useTheme.composable')]),
    )
    localStorage.clear()
    localStorage.setItem('dup.theme', 'dark')
    a.configureTheme({ storageKey: 'dup.theme', defaultTheme: 'system' })

    const fromB = b.useTheme()
    expect(fromB.theme.value).toBe('dark')
    fromB.setTheme('light')
    await nextTick()
    expect(a.useTheme().theme.value).toBe('light')
    expect(localStorage.getItem('dup.theme')).toBe('light')
    expect(localStorage.getItem('nubisco.theme')).toBe(null)
  })
})
