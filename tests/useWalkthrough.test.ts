import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useWalkthrough } from '../src/composables/useWalkthrough.composable'
import {
  createLocalStorageWalkthroughStorage,
  createMemoryWalkthroughStorage,
  WALKTHROUGH_STORAGE_PREFIX,
} from '../src/utils/walkthroughStorage.helper'
import type { IWalkthrough } from '../src/components/Walkthrough.d'

const tour: IWalkthrough = {
  id: 'intro',
  version: 1,
  steps: [
    { target: '#a', title: 'A', body: 'first' },
    { target: '#b', title: 'B', body: 'second' },
    { target: '#c', title: 'C', body: 'third' },
  ],
}

describe('useWalkthrough', () => {
  let storage: ReturnType<typeof createMemoryWalkthroughStorage>

  beforeEach(() => {
    storage = createMemoryWalkthroughStorage()
  })

  it('starts inactive on step 0', () => {
    const wt = useWalkthrough(tour, { storage })
    expect(wt.active.value).toBe(false)
    expect(wt.stepIndex.value).toBe(0)
    expect(wt.stepCount.value).toBe(3)
  })

  it('exposes the current step', () => {
    const wt = useWalkthrough(tour, { storage })
    wt.start()
    expect(wt.active.value).toBe(true)
    expect(wt.step.value?.title).toBe('A')
    expect(wt.isFirst.value).toBe(true)
    expect(wt.isLast.value).toBe(false)
  })

  it('refuses to start a walkthrough with no steps', () => {
    const wt = useWalkthrough(
      { id: 'empty', version: 1, steps: [] },
      { storage },
    )
    wt.start()
    expect(wt.active.value).toBe(false)
  })

  it('advances and rewinds through steps', () => {
    const wt = useWalkthrough(tour, { storage })
    wt.start()
    wt.next()
    expect(wt.stepIndex.value).toBe(1)
    wt.next()
    expect(wt.isLast.value).toBe(true)
    wt.back()
    expect(wt.stepIndex.value).toBe(1)
  })

  it('does not rewind past the first step', () => {
    const wt = useWalkthrough(tour, { storage })
    wt.start()
    wt.back()
    expect(wt.stepIndex.value).toBe(0)
  })

  it('ignores navigation while inactive', () => {
    const wt = useWalkthrough(tour, { storage })
    wt.next()
    wt.goTo(2)
    expect(wt.stepIndex.value).toBe(0)
    expect(wt.active.value).toBe(false)
  })

  it('clamps goTo to the step range', () => {
    const wt = useWalkthrough(tour, { storage })
    wt.start()
    wt.goTo(99)
    expect(wt.stepIndex.value).toBe(2)
    wt.goTo(-5)
    expect(wt.stepIndex.value).toBe(0)
  })

  it('finishes when next is pressed on the last step', async () => {
    const onFinish = vi.fn()
    const wt = useWalkthrough(tour, { storage, onFinish })
    wt.start()
    wt.goTo(2)
    wt.next()
    await Promise.resolve()
    expect(wt.active.value).toBe(false)
    expect(onFinish).toHaveBeenCalledWith(tour)
  })

  it('records the version and outcome on finish', async () => {
    const wt = useWalkthrough(tour, { storage })
    wt.start()
    await wt.finish()
    expect(await storage.get('intro')).toMatchObject({
      version: 1,
      outcome: 'finish',
    })
  })

  it('records a skip with the step it was abandoned on', async () => {
    const onSkip = vi.fn()
    const wt = useWalkthrough(tour, { storage, onSkip })
    wt.start()
    wt.goTo(1)
    await wt.skip()
    expect(onSkip).toHaveBeenCalledWith(tour, 1)
    expect(await storage.get('intro')).toMatchObject({ outcome: 'skip' })
  })

  it('reports every step landed on through onStepChange', () => {
    const onStepChange = vi.fn()
    const wt = useWalkthrough(tour, { storage, onStepChange })
    wt.start()
    wt.next()
    expect(onStepChange).toHaveBeenCalledTimes(2)
    expect(onStepChange).toHaveBeenLastCalledWith(tour.steps[1], 1)
  })

  describe('version-gated auto-start', () => {
    it('runs when nothing has been recorded', async () => {
      const wt = useWalkthrough(tour, { storage })
      expect(await wt.maybeAutoStart()).toBe(true)
      expect(wt.active.value).toBe(true)
    })

    it('does not run for a returning user on the same version', async () => {
      const wt = useWalkthrough(tour, { storage })
      await wt.finish()
      const again = useWalkthrough(tour, { storage })
      expect(await again.maybeAutoStart()).toBe(false)
      expect(again.active.value).toBe(false)
    })

    it('runs again once the version is bumped', async () => {
      const source = ref<IWalkthrough>(tour)
      const wt = useWalkthrough(source, { storage })
      wt.start()
      await wt.finish()

      source.value = { ...tour, version: 2 }
      expect(await wt.maybeAutoStart()).toBe(true)
    })

    it('stays quiet when the stored version is newer than the current one', async () => {
      await storage.set('intro', {
        version: 5,
        outcome: 'finish',
        completedAt: new Date().toISOString(),
      })
      const wt = useWalkthrough(tour, { storage })
      expect(await wt.maybeAutoStart()).toBe(false)
    })

    it('does not restart a run already in progress', async () => {
      const wt = useWalkthrough(tour, { storage })
      wt.start()
      wt.goTo(2)
      expect(await wt.maybeAutoStart()).toBe(false)
      expect(wt.stepIndex.value).toBe(2)
    })
  })

  it('restart clears the record and replays from step 0', async () => {
    const wt = useWalkthrough(tour, { storage })
    wt.start()
    wt.goTo(2)
    await wt.finish()

    await wt.restart()
    expect(wt.active.value).toBe(true)
    expect(wt.stepIndex.value).toBe(0)
    expect(await storage.get('intro')).toBeNull()
  })

  it('reset forgets the record without starting', async () => {
    const wt = useWalkthrough(tour, { storage })
    await wt.finish()
    await wt.reset()
    expect(await wt.isCompleted()).toBe(false)
    expect(wt.active.value).toBe(false)
  })

  it('tracks a reactive walkthrough source', () => {
    const source = ref<IWalkthrough>(tour)
    const wt = useWalkthrough(source, { storage })
    expect(wt.stepCount.value).toBe(3)
    source.value = { ...tour, steps: tour.steps.slice(0, 1) }
    expect(wt.stepCount.value).toBe(1)
  })

  it('accepts a getter as the walkthrough source', () => {
    const wt = useWalkthrough(() => tour, { storage })
    expect(wt.walkthrough.value.id).toBe('intro')
  })

  it('works with an async storage adapter', async () => {
    const backend = new Map<string, unknown>()
    const asyncStorage = {
      get: async (id: string) => (backend.get(id) as never) ?? null,
      set: async (id: string, record: never) => void backend.set(id, record),
      remove: async (id: string) => void backend.delete(id),
    }

    const wt = useWalkthrough(tour, { storage: asyncStorage })
    expect(await wt.maybeAutoStart()).toBe(true)
    await wt.finish()
    expect(await wt.isCompleted()).toBe(true)
  })
})

describe('walkthrough storage adapters', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('namespaces localStorage keys', () => {
    const store = createLocalStorageWalkthroughStorage()
    store.set('intro', {
      version: 2,
      outcome: 'finish',
      completedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(
      window.localStorage.getItem(`${WALKTHROUGH_STORAGE_PREFIX}intro`),
    ).toContain('"version":2')
    expect(store.get('intro')).toMatchObject({ version: 2 })
  })

  it('removes a record', () => {
    const store = createLocalStorageWalkthroughStorage()
    store.set('intro', {
      version: 1,
      outcome: 'skip',
      completedAt: '2026-01-01T00:00:00.000Z',
    })
    store.remove('intro')
    expect(store.get('intro')).toBeNull()
  })

  it('reads corrupted entries as "never seen" instead of throwing', () => {
    window.localStorage.setItem(
      `${WALKTHROUGH_STORAGE_PREFIX}intro`,
      'not json',
    )
    expect(createLocalStorageWalkthroughStorage().get('intro')).toBeNull()
  })

  it('survives a localStorage that throws (private mode, blocked iframe)', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
    const store = createLocalStorageWalkthroughStorage()
    expect(() =>
      store.set('intro', {
        version: 1,
        outcome: 'finish',
        completedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).not.toThrow()
    setItem.mockRestore()
  })

  it('accepts a custom prefix', () => {
    const store = createLocalStorageWalkthroughStorage('the white-label product:tour:')
    store.set('intro', {
      version: 1,
      outcome: 'finish',
      completedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(window.localStorage.getItem('the white-label product:tour:intro')).toBeTruthy()
  })

  it('seeds a memory adapter', () => {
    const store = createMemoryWalkthroughStorage({
      intro: {
        version: 3,
        outcome: 'finish',
        completedAt: '2026-01-01T00:00:00.000Z',
      },
    })
    expect(store.get('intro')).toMatchObject({ version: 3 })
  })
})
