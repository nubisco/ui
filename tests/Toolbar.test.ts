import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import NbToolbar from '../src/components/Toolbar.vue'
import NbButton from '../src/components/Button.vue'
import NbMenu from '../src/components/Menu.vue'

enableAutoUnmount(afterEach)

afterEach(() => {
  document.body.innerHTML = ''
})

const flush = async () => {
  await nextTick()
  await nextTick()
}

function mountToolbar(props: Record<string, unknown> = {}, slots = {}) {
  return mount(NbToolbar, {
    props: { label: 'Invoice tools', ...props },
    slots: {
      default: () => [
        h(NbButton, { icon: 'funnel', label: 'Filter' }),
        h(NbButton, { icon: 'gear', label: 'Settings' }),
        h(NbButton, { icon: 'trash', label: 'Delete', disabled: true }),
      ],
      end: () => h(NbButton, { variant: 'primary' }, () => 'Add invoice'),
      ...slots,
    },
    attachTo: document.body,
  })
}

describe('NbToolbar', () => {
  it('is a labelled toolbar', () => {
    const w = mountToolbar()
    expect(w.attributes('role')).toBe('toolbar')
    expect(w.attributes('aria-label')).toBe('Invoice tools')
  })

  it('hands its size to buttons that have none, and not to those that do', () => {
    const w = mountToolbar(
      { size: 'sm' },
      {
        start: () => h(NbButton, { size: 'xs' }, () => 'Own size'),
      },
    )
    const buttons = w.findAll('.nb-button')
    expect(buttons[0].classes()).toContain('nb-button--xs')
    expect(buttons[1].classes()).toContain('nb-button--sm')
    expect(buttons.at(-1)!.classes()).toContain('nb-button--sm')
  })

  it('defaults to lg, and a button outside a toolbar to md', () => {
    const w = mountToolbar()
    expect(w.find('.nb-button').classes()).toContain('nb-button--lg')
    expect(mount(NbButton).classes()).toContain('nb-button--md')
  })

  it('squares the buttons only when flush', () => {
    expect(mountToolbar().find('.nb-button--flush').exists()).toBe(false)
    const w = mountToolbar({ flush: true })
    expect(w.classes()).toContain('nb-toolbar--flush')
    expect(w.findAll('.nb-button--flush')).toHaveLength(4)
  })

  it('renders start, tools and end in that order', () => {
    const w = mountToolbar({}, { start: () => h('input', { type: 'search' }) })
    const parts = Array.from(w.element.children).map((c) => c.className)
    expect(parts).toEqual([
      'nb-toolbar__start',
      'nb-toolbar__main',
      'nb-toolbar__end',
    ])
  })

  it('is one tab stop that the arrow keys, Home and End move', async () => {
    const w = mountToolbar()
    await flush()
    const [filter, settings, , add] = w
      .findAll('button')
      .map((b) => b.element as HTMLElement)
    expect(filter.getAttribute('tabindex')).toBe('0')
    expect(settings.getAttribute('tabindex')).toBe('-1')
    filter.focus()
    filter.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    )
    expect(document.activeElement).toBe(settings)
    // The disabled Delete is skipped.
    settings.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    )
    expect(document.activeElement).toBe(add)
    add.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    )
    expect(document.activeElement).toBe(filter)
    filter.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    )
    expect(document.activeElement).toBe(add)
    expect(add.getAttribute('tabindex')).toBe('0')
    expect(filter.getAttribute('tabindex')).toBe('-1')
  })

  it('leaves a field in the start slot its own tab stop', async () => {
    const w = mountToolbar(
      {},
      { start: () => h('input', { type: 'search', class: 'search' }) },
    )
    await flush()
    const input = w.find('.search').element as HTMLInputElement
    expect(input.hasAttribute('tabindex')).toBe(false)
    input.focus()
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    )
    expect(document.activeElement).toBe(input)
  })

  it('does not size buttons inside a menu opened from it', () => {
    const w = mount(NbToolbar, {
      props: { label: 'Tools', size: 'sm' },
      slots: {
        default: () =>
          h(NbMenu, { open: true }, () => h(NbButton, () => 'Apply')),
      },
      attachTo: document.body,
    })
    const inMenu = document.body.querySelector('.nb-menu .nb-button')
    expect(inMenu?.className).toContain('nb-button--md')
    w.unmount()
  })
})
