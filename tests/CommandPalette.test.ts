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

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  computed: glyphStubComputed,
  template: '<i data-testid="nb-icon" :data-name="resolvedName"></i>',
}

function mountPalette(props: Record<string, unknown> = {}) {
  const state = createCommandPaletteState()
  const wrapper = mount(CommandPalette, {
    props,
    global: {
      provide: { [NB_COMMAND_PALETTE_KEY as symbol]: state },
      stubs: {
        NbIcon: NbIconStub,
        Teleport: { template: '<div><slot /></div>' },
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

async function type(
  wrapper: ReturnType<typeof mountPalette>['wrapper'],
  value: string,
) {
  const input = wrapper.find('.nb-command-palette__input')
  await input.setValue(value)
}

const rows = (wrapper: ReturnType<typeof mountPalette>['wrapper']) =>
  wrapper.findAll('.nb-command-palette__item-label').map((n) => n.text())

async function open(state: ICommandPaletteState) {
  state.open()
  await nextTick()
  await nextTick()
}

describe('CommandPalette', () => {
  it('filters the registered commands, as it always has', async () => {
    const { wrapper, state } = mountPalette()
    state.registerMany([cmd('a', 'Create space'), cmd('b', 'Open settings')])
    await open(state)
    await type(wrapper, 'settings')
    expect(rows(wrapper)).toEqual(['Open settings'])
  })

  describe('with a suggester', () => {
    /**
     * The palette could only ever show a fixed list of registered actions,
     * which is right for commands and useless for content: no app can
     * register a command per ticket. Everything here is additive, so a host
     * that passes no suggester must behave exactly as before.
     */
    it('asks the suggester for what was typed and shows the results', async () => {
      const suggest = vi.fn(async () => [cmd('t:1', 'ACTA-12 Fix login')])
      const { wrapper, state } = mountPalette({ suggest, suggestDebounce: 0 })
      state.register(cmd('a', 'Create space'))
      await open(state)

      await type(wrapper, 'login')
      await vi.waitFor(() => expect(suggest).toHaveBeenCalledWith('login'))
      await nextTick()

      expect(rows(wrapper)).toContain('ACTA-12 Fix login')
    })

    it("shows a result the palette's own filter would have thrown away", async () => {
      // A ticket that matched on its body has nothing in its label matching
      // the query. Re-filtering the suggester's output would drop it again
      // the moment it arrived, which is the whole bug this guards.
      const suggest = async () => [cmd('t:1', 'Quarterly planning')]
      const { wrapper, state } = mountPalette({ suggest, suggestDebounce: 0 })
      await open(state)

      await type(wrapper, 'zzz-unrelated')
      await vi.waitFor(() =>
        expect(rows(wrapper)).toContain('Quarterly planning'),
      )
    })

    it('ignores a slow answer to an older query', async () => {
      // "inv" resolving after "invoice" would replace the right answers with
      // stale ones, which reads as the palette ignoring what was typed.
      //
      // The timings matter. The slow request has to still be in flight when
      // the second query is typed, or there is no race and the guard is
      // never exercised: an earlier version of this test used a 50ms delay
      // and polled at vi.waitFor's 50ms default, so the "stale" answer had
      // already landed before the second keystroke and the test passed with
      // the guard deleted.
      let releaseSlow: (v: ICommand[]) => void = () => {}
      const slow = new Promise<ICommand[]>((r) => {
        releaseSlow = r
      })
      const suggest = vi.fn((q: string) =>
        q === 'inv' ? slow : Promise.resolve([cmd('fast', 'Fresh result')]),
      )
      const { wrapper, state } = mountPalette({ suggest, suggestDebounce: 0 })
      await open(state)

      await type(wrapper, 'inv')
      await vi.waitFor(() => expect(suggest).toHaveBeenCalledWith('inv'), {
        interval: 5,
      })

      await type(wrapper, 'invoice')
      await vi.waitFor(() => expect(rows(wrapper)).toContain('Fresh result'), {
        interval: 5,
      })

      // Only now does the old request come back.
      releaseSlow([cmd('slow', 'Stale result')])
      await slow
      await nextTick()
      await nextTick()

      expect(rows(wrapper)).toContain('Fresh result')
      expect(rows(wrapper)).not.toContain('Stale result')
    })

    it('keeps working when the suggester fails', async () => {
      // The palette is still a command palette when the network is down.
      const suggest = vi.fn(async () => {
        throw new Error('offline')
      })
      const { wrapper, state } = mountPalette({ suggest, suggestDebounce: 0 })
      state.register(cmd('a', 'Create space'))
      await open(state)

      await type(wrapper, 'create')
      await vi.waitFor(() => expect(suggest).toHaveBeenCalled())
      await nextTick()

      expect(rows(wrapper)).toContain('Create space')
    })

    it('highlights a suggested result so Enter runs it', async () => {
      // With only suggestions matching, the highlight used to be cleared,
      // leaving Enter doing nothing on the one row on screen.
      const handler = vi.fn()
      const suggest = async () => [
        { id: 't:1', label: 'ACTA-12 Fix login', handler },
      ]
      const { wrapper, state } = mountPalette({ suggest, suggestDebounce: 0 })
      await open(state)

      await type(wrapper, 'login')
      await vi.waitFor(() =>
        expect(
          wrapper.find('.nb-command-palette__item--highlighted').exists(),
        ).toBe(true),
      )

      await wrapper
        .find('.nb-command-palette')
        .trigger('keydown', { key: 'Enter' })
      expect(handler).toHaveBeenCalled()
    })

    it('forgets the last query when it is reopened', async () => {
      const suggest = async () => [cmd('t:1', 'Old result')]
      const { wrapper, state } = mountPalette({ suggest, suggestDebounce: 0 })
      await open(state)
      await type(wrapper, 'old')
      await vi.waitFor(() => expect(rows(wrapper)).toContain('Old result'))

      state.close()
      await nextTick()
      await open(state)

      expect(rows(wrapper)).not.toContain('Old result')
    })
  })
})
