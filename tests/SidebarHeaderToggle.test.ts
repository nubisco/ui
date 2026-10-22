import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { createI18n } from 'vue-i18n'
import tooltipDirective from '@/directives/ToolTip.directive'
import SidebarHeaderToggle from '../src/components/SidebarHeaderToggle.vue'
import Shell from '../src/components/Shell.vue'
import type { TSidebarHeaderActionPosition } from '../src/components/Shell.d'

enableAutoUnmount(afterEach)

const tooltip = { install: tooltipDirective }
const en = () =>
  createI18n({ legacy: false, locale: 'en', messages: { en: {} } })

function inHeader(
  variant: Ref<'compact' | 'verbose'>,
  options: {
    position?: Ref<TSidebarHeaderActionPosition>
    props?: Record<string, unknown>
    plugins?: unknown[]
    onToggle?: () => void
  } = {},
) {
  const Host = defineComponent({
    provide: {
      'nb-shell-sidebar-variant': variant,
      ...(options.position
        ? { 'nb-shell-sidebar-header-action-position': options.position }
        : {}),
    },
    render: () =>
      h(SidebarHeaderToggle, {
        ...options.props,
        onToggle: options.onToggle ?? (() => {}),
      }),
  })
  return mount(Host, {
    global: { plugins: [tooltip, ...(options.plugins ?? [])] as never[] },
    attachTo: document.body,
  })
}

describe('NbSidebarHeaderToggle', () => {
  it('is a real button named for collapsing an expanded rail', () => {
    const w = inHeader(ref('verbose'), { plugins: [en()] })
    const button = w.find('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-label')).toBe('Collapse sidebar')
    expect(button.attributes('aria-expanded')).toBe('true')
  })

  it('follows the rail it sits in, so its name cannot disagree with it', async () => {
    const variant = ref<'compact' | 'verbose'>('verbose')
    const w = inHeader(variant, { plugins: [en()] })
    variant.value = 'compact'
    await nextTick()
    const button = w.find('button')
    expect(button.attributes('aria-label')).toBe('Expand sidebar')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('emits toggle when pressed, holding no state of its own', async () => {
    let toggles = 0
    const w = inHeader(ref('verbose'), { onToggle: () => toggles++ })
    await w.find('button').trigger('click')
    expect(toggles).toBe(1)
  })

  it('takes product labels over the built-in ones', () => {
    const w = inHeader(ref('compact'), {
      props: { expandLabel: 'Show navigation' },
      plugins: [en()],
    })
    expect(w.find('button').attributes('aria-label')).toBe('Show navigation')
  })

  it('shares the bottom toggle catalogue keys, so one entry covers both', () => {
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: { en: { sidebarCollapseToggle: { COLLAPSE: 'Hide menu' } } },
    })
    const w = inHeader(ref('verbose'), { plugins: [i18n] })
    expect(w.find('button').attributes('aria-label')).toBe('Hide menu')
  })

  it('uses the built-in Portuguese for a pt locale', () => {
    const pt = createI18n({
      legacy: false,
      locale: 'pt-PT',
      messages: { 'pt-PT': {} },
    })
    const w = inHeader(ref('verbose'), { plugins: [pt] })
    expect(w.find('button').attributes('aria-label')).toBe(
      'Recolher barra lateral',
    )
  })

  it('works with no vue-i18n at all, falling back to English', () => {
    const w = inHeader(ref('verbose'))
    expect(w.find('button').attributes('aria-label')).toBe('Collapse sidebar')
  })

  it('dresses itself as a tab when the shell hangs it on the rail edge', async () => {
    const position = ref<TSidebarHeaderActionPosition>('end')
    const w = inHeader(ref('verbose'), { position })
    expect(w.find('.nb-sidebar-header-toggle--edge').exists()).toBe(false)
    position.value = 'edge'
    await nextTick()
    expect(w.find('.nb-sidebar-header-toggle--edge').exists()).toBe(true)
  })
})

describe('NbShell #sidebar-header-action', () => {
  const brand = { 'sidebar-logo': '<span class="brand">B</span>' }

  it('changes nothing for a shell that leaves the slot empty', () => {
    const w = mount(Shell, { slots: brand })
    expect(w.find('.nb-shell__sidebar-header').exists()).toBe(false)
    // The logo is still the rail's direct child, exactly as before.
    expect(
      w.find('.nb-shell__sidebar > .nb-shell__sidebar-logo .brand').exists(),
    ).toBe(true)
  })

  it('puts the action and the brand in one header row when filled', () => {
    const w = mount(Shell, {
      slots: { ...brand, 'sidebar-header-action': '<button class="act" />' },
    })
    const header = w.find('.nb-shell__sidebar-header')
    expect(header.find('.nb-shell__sidebar-logo .brand').exists()).toBe(true)
    expect(header.find('.nb-shell__sidebar-header-action .act').exists()).toBe(
      true,
    )
  })

  it('defaults to the end position and the stacked collapsed rail', () => {
    const w = mount(Shell, {
      slots: { ...brand, 'sidebar-header-action': '<button />' },
    })
    const classes = w.find('.nb-shell__sidebar-header').classes()
    expect(classes).toContain('nb-shell__sidebar-header--end')
    expect(classes).toContain('nb-shell__sidebar-header--compact-stack')
  })

  it.each([
    ['start', 'swap'],
    ['end', 'replace'],
    ['edge', 'stack'],
  ] as const)('reflects position %s and collapsed rail %s', (pos, compact) => {
    const w = mount(Shell, {
      props: {
        sidebarHeaderActionPosition: pos,
        sidebarHeaderActionCompact: compact,
      },
      slots: { ...brand, 'sidebar-header-action': '<button />' },
    })
    const classes = w.find('.nb-shell__sidebar-header').classes()
    expect(classes).toContain(`nb-shell__sidebar-header--${pos}`)
    expect(classes).toContain(`nb-shell__sidebar-header--compact-${compact}`)
  })

  it('hands the position to the toggle inside it', () => {
    const w = mount(Shell, {
      props: { sidebarHeaderActionPosition: 'edge' },
      slots: {
        ...brand,
        'sidebar-header-action': () => h(SidebarHeaderToggle),
      },
      global: { plugins: [tooltip] },
    })
    expect(w.find('.nb-sidebar-header-toggle--edge').exists()).toBe(true)
  })

  it('drops the action in the drawer, where the topbar nav toggle owns it', async () => {
    const original = window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      value: 400,
      configurable: true,
      writable: true,
    })
    try {
      const w = mount(Shell, {
        slots: { ...brand, 'sidebar-header-action': '<button class="act" />' },
      })
      await nextTick()
      expect(w.find('.nb-shell__sidebar-header').exists()).toBe(false)
      expect(w.find('.act').exists()).toBe(false)
      // The brand is still there, in its usual place.
      expect(w.find('.nb-shell__sidebar-logo .brand').exists()).toBe(true)
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        value: original,
        configurable: true,
        writable: true,
      })
    }
  })
})
