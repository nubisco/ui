import { glyphStubComputed } from './__mocks__/glyphStub'
import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import CommandPalette from '../src/components/CommandPalette.vue'
import {
  NB_COMMAND_PALETTE_KEY,
  createCommandPaletteState,
} from '../src/composables/useCommandPalette.composable'
import type {
  ICommand,
  ICommandPaletteState,
} from '../src/components/CommandPalette.d'

/*
 * The palette is a modal dialog holding a combobox that drives a listbox, the
 * pattern NbSelect's search box already follows: focus stays in the input
 * and the highlighted row is announced through aria-activedescendant.
 */

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  computed: glyphStubComputed,
  template: '<i data-testid="nb-icon" :data-name="resolvedName"></i>',
}

function mountPalette() {
  const state = createCommandPaletteState()
  const wrapper = mount(CommandPalette, {
    attachTo: document.body,
    global: {
      provide: { [NB_COMMAND_PALETTE_KEY as symbol]: state },
      stubs: {
        NbIcon: NbIconStub,
        Transition: { template: '<div><slot /></div>' },
      },
    },
  })
  return { wrapper, state }
}

const cmd = (id: string, label: string, namespace?: string): ICommand => ({
  id,
  label,
  namespace,
  handler: vi.fn(),
})

async function open(state: ICommandPaletteState) {
  state.open()
  await nextTick()
  await nextTick()
  await nextTick()
}

// jsdom has no layout, so no scrollIntoView for the highlight to call.
Element.prototype.scrollIntoView = vi.fn()

const q = <T extends Element = HTMLElement>(sel: string) =>
  document.querySelector<T>(sel)

describe('CommandPalette accessibility', () => {
  it('is a modal dialog with a combobox driving a listbox', async () => {
    const { wrapper, state } = mountPalette()
    state.registerMany([
      cmd('a', 'Create space', 'File'),
      cmd('b', 'Open settings', 'File'),
      cmd('c', 'Undo', 'Edit'),
    ])
    await open(state)

    const dialog = q('[role="dialog"]')!
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-label')).toBe('Command palette')

    const input = q<HTMLInputElement>('.nb-command-palette__input')!
    expect(input.getAttribute('role')).toBe('combobox')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    const listbox = q('[role="listbox"]')!
    expect(input.getAttribute('aria-controls')).toBe(listbox.id)

    const groups = [...document.querySelectorAll('[role="group"]')]
    expect(groups).toHaveLength(2)
    for (const g of groups) {
      const label = document.getElementById(g.getAttribute('aria-labelledby')!)
      expect(['Edit', 'File']).toContain(label?.textContent?.trim())
    }
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(3)
    wrapper.unmount()
  })

  it('points aria-activedescendant at the highlighted option as arrows move', async () => {
    const { wrapper, state } = mountPalette()
    state.registerMany([cmd('a', 'Alpha'), cmd('b', 'Beta')])
    await open(state)
    const input = q<HTMLInputElement>('.nb-command-palette__input')!
    const active = () =>
      document.getElementById(input.getAttribute('aria-activedescendant')!)

    expect(active()?.textContent).toContain('Alpha')
    expect(active()?.getAttribute('aria-selected')).toBe('true')

    q('.nb-command-palette')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    )
    await nextTick()
    expect(active()?.textContent).toContain('Beta')
    const selected = [...document.querySelectorAll('[role="option"]')].filter(
      (o) => o.getAttribute('aria-selected') === 'true',
    )
    expect(selected).toHaveLength(1)
    wrapper.unmount()
  })

  it('collapses the combobox and announces when nothing matches', async () => {
    const { wrapper, state } = mountPalette()
    state.registerMany([cmd('a', 'Alpha')])
    await open(state)
    const input = q<HTMLInputElement>('.nb-command-palette__input')!
    input.value = 'zzzz'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    await nextTick()
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(input.getAttribute('aria-activedescendant')).toBeNull()
    expect(q('[role="status"]')?.textContent?.trim()).toBe('No matches')
    wrapper.unmount()
  })

  it('takes focus into the search box and gives it back on close', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const { wrapper, state } = mountPalette()
    state.registerMany([cmd('a', 'Alpha')])
    await open(state)
    expect(document.activeElement?.classList).toContain(
      'nb-command-palette__input',
    )

    q('.nb-command-palette')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(opener)
    wrapper.unmount()
    opener.remove()
  })
})
