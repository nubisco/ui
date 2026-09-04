import { ref, readonly, type Ref } from 'vue'
import { suppressLoadingAnnouncement } from './useLoadingAnnouncer.composable'

type TInlineLoadingStatus = 'inactive' | 'active' | 'finished' | 'error'

interface IUseInlineLoadingOptions {
  /** Called when the wrapped action rejects, before the status flips to `error`. */
  onError?: (error: unknown) => void
}

interface IUseInlineLoading {
  /** Bind to `NbInlineLoading`'s `status` prop. */
  status: Readonly<Ref<TInlineLoadingStatus>>
  /** Whatever the last failed run rejected with, for logging or a message. */
  error: Readonly<Ref<unknown>>
  /** Runs an async action and drives the status through the four states. */
  run: <T>(action: () => Promise<T>) => Promise<T | undefined>
  /** Back to `inactive`. Bind to the component's `success` event. */
  reset: () => void
}

/**
 * Drives the NbInlineLoading state machine for a single action.
 *
 * The audit found four apps that confirmed a successful save with nothing at
 * all, and none of them were being careless: they were all writing the same
 * try/catch/finally by hand and the finally reset the flag before anything
 * could be shown. Handing the sequence over removes the chance to get it
 * wrong.
 *
 * Two behaviours are worth knowing about:
 *
 * - Overlapping runs. If a second `run` starts while the first is in flight,
 *   only the newest one is allowed to write the status. A slow first save can
 *   no longer land on top of a fast second one and report the wrong outcome.
 * - Rejections are absorbed, not rethrown. `run` is meant to be called from a
 *   click handler, where a rethrown rejection becomes an unhandled promise.
 *   The reason is kept in `error` and passed to `onError`, and the failure is
 *   visible in the UI, which is what the caller actually wanted.
 *
 * @example
 * const save = useInlineLoading()
 * // <NbButton @click="save.run(() => api.save(form))">Save</NbButton>
 * // <NbInlineLoading :status="save.status.value" @success="save.reset" />
 */
// #region useInlineLoading
export function useInlineLoading(
  options: IUseInlineLoadingOptions = {},
): IUseInlineLoading {
  const status = ref<TInlineLoadingStatus>('inactive')
  const error = ref<unknown>(null)

  let runId = 0

  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    const id = ++runId
    error.value = null
    status.value = 'active'

    try {
      const result = await action()
      if (id === runId) status.value = 'finished'
      return result
    } catch (reason) {
      // Whatever indicator was covering this action is about to be replaced by
      // a failure, so no completion may be announced for it. Doing it here is
      // what keeps the correct behaviour from depending on the caller
      // remembering; see useLoadingAnnouncer.composable.ts.
      suppressLoadingAnnouncement()
      if (id === runId) {
        error.value = reason
        status.value = 'error'
      }
      options.onError?.(reason)
      return undefined
    }
  }

  function reset() {
    runId++
    error.value = null
    status.value = 'inactive'
  }

  return {
    status: readonly(status),
    error: readonly(error),
    run,
    reset,
  }
}
// #endregion useInlineLoading

export type {
  TInlineLoadingStatus,
  IUseInlineLoading,
  IUseInlineLoadingOptions,
}
