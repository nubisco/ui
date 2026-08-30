import type {
  IWalkthroughRecord,
  IWalkthroughStorage,
} from '@/components/Walkthrough.d'

export const WALKTHROUGH_STORAGE_PREFIX = 'nb:walkthrough:'

function isRecord(value: unknown): value is IWalkthroughRecord {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as IWalkthroughRecord).version === 'number'
  )
}

/**
 * The default adapter: one localStorage entry per walkthrough id.
 *
 * Every access is wrapped, because localStorage throws rather than degrading
 * in two situations a shipped app will meet: Safari in private mode (quota
 * exceeded on write) and a cross-origin iframe with storage blocked (a
 * SecurityError on mere property access). A tour failing to remember itself
 * is a nuisance; a tour taking the host app down with it is not acceptable,
 * so a broken store reads as "never seen" and writes become no-ops.
 */
export function createLocalStorageWalkthroughStorage(
  prefix: string = WALKTHROUGH_STORAGE_PREFIX,
): IWalkthroughStorage {
  const key = (id: string) => `${prefix}${id}`

  return {
    get(id) {
      try {
        const raw = window.localStorage.getItem(key(id))
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return isRecord(parsed) ? parsed : null
      } catch {
        return null
      }
    },
    set(id, record) {
      try {
        window.localStorage.setItem(key(id), JSON.stringify(record))
      } catch {
        // Storage unavailable or full: the tour still runs, it just will not
        // be remembered across reloads.
      }
    },
    remove(id) {
      try {
        window.localStorage.removeItem(key(id))
      } catch {
        // See above.
      }
    },
  }
}

/**
 * Non-persistent adapter. Useful in tests, in Storybook-style docs previews
 * where every reload should show the tour again, and as a fallback in
 * environments with no `window`.
 */
export function createMemoryWalkthroughStorage(
  seed: Record<string, IWalkthroughRecord> = {},
): IWalkthroughStorage {
  const store = new Map<string, IWalkthroughRecord>(Object.entries(seed))

  return {
    get: (id) => store.get(id) ?? null,
    set: (id, record) => void store.set(id, record),
    remove: (id) => void store.delete(id),
  }
}

/** Picks the persistent adapter when there is a DOM, memory otherwise (SSR). */
export function createDefaultWalkthroughStorage(): IWalkthroughStorage {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return createMemoryWalkthroughStorage()
  }
  return createLocalStorageWalkthroughStorage()
}
