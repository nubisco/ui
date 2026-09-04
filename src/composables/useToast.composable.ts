import {
  computed,
  getCurrentInstance,
  inject,
  ref,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue'
import type { TToastVariant, IToastCta } from '../components/Toast.vue'

/**
 * The toast queue: the clock, the cap and the ordering that `NbToaster`
 * renders.
 *
 * The split matters. `NbToast` knows how one message looks, `NbToaster` knows
 * where the stack sits and how it moves, and this file knows *when* a message
 * leaves. Timing lives here rather than in the item because the whole region
 * pauses together: while the pointer rests on the top toast, the two below it
 * must stop counting down as well, and an item that owns its own timer cannot
 * know that. Three applications hand-rolled a host over `NbToast` and all
 * three got a different part of this wrong, which is why it is now library
 * code.
 */

/**
 * Why a toast ended. Passed to `IToastOptions.onDismiss`.
 *
 * - `user`: the close button, or Escape while the toast held focus.
 * - `timeout`: the countdown ran out.
 * - `action`: the reader pressed the toast's own action.
 * - `replaced`: a newer message took its place, either because a `key` push
 *   claimed its slot or because the stack was full of toasts that can never
 *   expire.
 * - `navigated`: `dismissTransient()`, from a router guard.
 * - `cleared`: `dismissAll()`, typically sign-out.
 *
 * The reason is the only thing that separates "Deleted. [Undo]" committing
 * from cancelling, so it is never collapsed into a boolean.
 */
export type TToastDismissReason =
  | 'user'
  | 'timeout'
  | 'action'
  | 'replaced'
  | 'navigated'
  | 'cleared'

/** Everything a caller can say about a toast. Only `message` is required. */
export interface IToastOptions {
  /** The news, in one sentence. Written in the past tense: "Draft saved". */
  message: string
  /** Tone. Also decides the icon, the politeness and the default duration. */
  variant?: TToastVariant
  /** Optional short heading. Skip it when the message already stands alone. */
  title?: string
  /**
   * Milliseconds on screen. `0` means it stays until dismissed. Omit it and
   * the variant decides (see `NB_TOAST_DURATIONS`).
   */
  duration?: number
  /**
   * One action. A toast that carries one never auto-dismisses unless an
   * explicit `duration` says it should: an action that removes itself while
   * it is being reached for is not an action.
   */
  cta?: IToastCta
  /**
   * De-duplication key. Pushing again with a key that is already queued takes
   * over that toast's slot instead of adding a second one, so a double-clicked
   * Save button produces one "Saved", not two.
   *
   * The second push replaces the message wholesale: only the id, the slot and
   * the position survive, and every field the new call leaves out goes back to
   * its default rather than lingering from the previous one. A first push with
   * a `title` and an `error` variant followed by a bare
   * `push({ key, message })` is a plain info toast, not the old error wearing
   * a new sentence. The displaced message's `onDismiss` fires with reason
   * `replaced` before the new one takes the slot.
   */
  key?: string
  /**
   * Survive a route change.
   *
   * A toast is scoped to the moment, and the moment usually ends with the
   * route: "Draft saved" outliving the draft's page is news about a screen
   * the user has left, and its `Undo` acts on a record they can no longer
   * see. `dismissTransient()`, called from a router guard, clears everything
   * that does not set this.
   *
   * Set it for news that is true wherever the user ends up: "Signed out",
   * "Export ready", "Connection restored".
   */
  retain?: boolean
  /**
   * Called once, when the toast leaves the queue, with the reason it left.
   *
   * This is the observation point the CTA pattern needs. "Deleted. [Undo]"
   * only works if something commits the delete when the toast goes and
   * cancels it when Undo is pressed, and the difference between those two is
   * exactly the reason:
   *
   * ```ts
   * let undone = false
   * toast.push({
   *   message: 'Comment deleted',
   *   cta: { label: 'Undo', action: () => { undone = true; restore(row) } },
   *   onDismiss: (reason) => { if (!undone) commitDelete(row) },
   * })
   * ```
   *
   * It fires exactly once per pushed message, and the reason is always the
   * true one. Two rules keep that promise:
   *
   * - `update()` is not an end of life, so a progress toast that becomes a
   *   result calls it once, at the end. `update()` therefore cannot change
   *   the callback either: it is not in `TToastPatch`.
   * - A second `push()` sharing a `key` is a *different* message taking over
   *   the slot, so the message being displaced ends first, with reason
   *   `replaced`, and the new callback takes over from there. Deleting row 1
   *   and then row 2 under one key commits row 1 and then row 2, in that
   *   order, rather than committing row 1 twice.
   */
  onDismiss?: (reason: TToastDismissReason) => void
}

/**
 * A partial change to a live toast, as accepted by `IToastHandle.update()`.
 *
 * `onDismiss` is deliberately not in it. The callback is the commit point of
 * the message that was pushed, and an update only rewrites the words of that
 * same message: swapping the callback halfway would either drop a commit or
 * run it twice, which is the one thing this queue promises never to do. When
 * the *message* really is a new one, push it (with a `key` if it should reuse
 * the slot) and the queue ends the old one first, with reason `replaced`.
 *
 * Passing it anyway is ignored, and warns outside production.
 */
export type TToastPatch = Omit<Partial<IToastOptions>, 'onDismiss'>

/** A queued toast, as `NbToaster` reads it. */
export interface IToastRecord extends IToastOptions {
  /** Queue-unique id. Stable for the life of the toast. */
  id: string
  variant: TToastVariant
  /** Resolved duration: never undefined here, `0` means persistent. */
  duration: number
  /** `true` once it holds one of the visible slots. */
  visible: boolean
  /**
   * Incremented every time the countdown restarts (admission, or an update
   * that changed the message). `NbToaster` keys the timer bar on it so the
   * bar restarts with the clock instead of continuing from where it was.
   */
  cycle: number
}

/**
 * What `push()` hands back so the caller can keep talking about a toast it
 * created: the save-in-progress that becomes a save-succeeded.
 */
export interface IToastHandle {
  /** The record id, for `queue.dismiss(id)` or logging. */
  readonly id: string
  /**
   * Rewrite the toast in place. It keeps its slot and its position, so the
   * stack does not jump. The countdown restarts, because the words changed
   * and the reader has not seen the new ones yet.
   *
   * Passing a `variant` without a `duration` adopts that variant's default,
   * which is what turns a persistent "Saving..." into a self-clearing
   * "Saved". Fields left out of the patch are left alone.
   *
   * `onDismiss` is not patchable: see `TToastPatch`.
   */
  update(patch: TToastPatch): void
  /**
   * Remove it now. Safe to call after it has already gone. The reason is
   * forwarded to `onDismiss`; it defaults to `user` because the usual caller
   * is a control the reader pressed.
   */
  dismiss(reason?: TToastDismissReason): void
  /** `false` once it has been dismissed or has expired. */
  isActive(): boolean
}

/** Options for a standalone queue. */
export interface IToastQueueOptions {
  /** How many toasts may be on screen at once. Default `3`. */
  max?: number
  /** Per-variant duration overrides, merged over `NB_TOAST_DURATIONS`. */
  durations?: Partial<Record<TToastVariant, number>>
  /**
   * The visually hidden severity word each variant is announced with, for
   * applications that are not in English. Merged over `NB_TOAST_STATUS_LABELS`.
   * An empty string suppresses the word for that variant.
   */
  statusLabels?: Partial<Record<TToastVariant, string>>
  /** Accessible name of every close button in this queue. */
  closeLabel?: string
}

/** The strings `NbToaster` reads out of its queue. */
export interface IToastLabels {
  status: Record<TToastVariant, string>
  close: string
}

/** The queue object shared by `useToast()` and `NbToaster`. */
export interface IToastQueue {
  /** Everything queued: the visible slots first, then whatever is waiting. */
  readonly items: ComputedRef<IToastRecord[]>
  /** The records `NbToaster` renders, oldest first. */
  readonly visible: ComputedRef<IToastRecord[]>
  /** Records admitted but waiting for a free slot. */
  readonly pending: ComputedRef<IToastRecord[]>
  /** `true` while the clock is held (pointer, focus, or a hidden tab). */
  readonly paused: Ref<boolean>
  /** Visible-slot cap. Writable, so a host can widen it for one screen. */
  readonly max: Ref<number>
  /**
   * Translated strings for this queue. `NbToaster` passes them to every
   * toast, so a Spanish product states them once instead of per call.
   */
  readonly labels: IToastLabels
  /** Queue a toast. Returns the handle. */
  push(options: IToastOptions): IToastHandle
  /** `variant: 'info'`, message-first for the common call. */
  info(
    message: string,
    options?: Omit<IToastOptions, 'message' | 'variant'>,
  ): IToastHandle
  /** `variant: 'success'`. */
  success(
    message: string,
    options?: Omit<IToastOptions, 'message' | 'variant'>,
  ): IToastHandle
  /** `variant: 'warning'`. */
  warning(
    message: string,
    options?: Omit<IToastOptions, 'message' | 'variant'>,
  ): IToastHandle
  /** `variant: 'error'`. Persistent by default. */
  error(
    message: string,
    options?: Omit<IToastOptions, 'message' | 'variant'>,
  ): IToastHandle
  /** Rewrite a live toast by id, field by field. No-op if it has gone. */
  update(id: string, patch: TToastPatch): void
  /** Remove one toast and let the next pending one in. */
  dismiss(id: string, reason?: TToastDismissReason): void
  /**
   * Clear the whole queue, visible and pending, `retain` included. Sign-out,
   * tenant switch, anything after which no queued message is still true.
   */
  dismissAll(reason?: TToastDismissReason): void
  /**
   * Clear everything that did not ask to survive a route change. Call it from
   * a router guard:
   *
   * ```ts
   * router.afterEach(() => toast.dismissTransient())
   * ```
   *
   * Nothing in this file knows about a router, and it must not: the library
   * has no dependency on one and cannot guess whether a product's tab switch
   * is a navigation. The queue provides the operation, the application says
   * when.
   */
  dismissTransient(reason?: TToastDismissReason): void
  /** Hold every countdown. Idempotent. */
  pause(): void
  /** Resume from the exact remaining time, not from the start. */
  resume(): void
  /** Remaining milliseconds for a record, for tests and instrumentation. */
  remaining(id: string): number
}

/**
 * Default time on screen, per variant.
 *
 * The scale is reading time, not importance: a success is four words the user
 * expected, a warning is a sentence they did not. An error stays until it is
 * dismissed, because "it failed" is the start of a task and a message that
 * removes itself before the user can act on it is worse than no message.
 */
export const NB_TOAST_DURATIONS: Record<TToastVariant, number> = {
  success: 4000,
  info: 6000,
  warning: 8000,
  error: 0,
}

/**
 * The word a screen reader hears before the message, per variant.
 *
 * Severity is otherwise carried by an icon (aria-hidden) and an accent colour,
 * which is exactly the WCAG 1.4.1 failure: "Could not reach the server" with
 * no indication that it is an error. Override the map per queue rather than
 * per toast when the product is not in English.
 */
export const NB_TOAST_STATUS_LABELS: Record<TToastVariant, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
}

let sequence = 0

interface IClockEntry {
  timer: ReturnType<typeof setTimeout> | null
  remaining: number
  startedAt: number
}

/**
 * Build an isolated queue. Applications use `useToast()`, which shares one
 * queue per page; tests and stories want their own so one spec cannot leave a
 * toast behind for the next.
 */
export function createToastQueue(
  options: IToastQueueOptions = {},
): IToastQueue {
  const max = ref(options.max ?? 3)
  const durations: Record<TToastVariant, number> = {
    ...NB_TOAST_DURATIONS,
    ...options.durations,
  }
  const labels: IToastLabels = {
    status: { ...NB_TOAST_STATUS_LABELS, ...options.statusLabels },
    close: options.closeLabel ?? 'Close',
  }

  const records = ref<IToastRecord[]>([])
  const paused = ref(false)
  const clocks = new Map<string, IClockEntry>()

  const items = computed(() => records.value as IToastRecord[])
  const visible = computed(() =>
    records.value.filter((record) => record.visible),
  )
  const pending = computed(() =>
    records.value.filter((record) => !record.visible),
  )

  function find(id: string): IToastRecord | undefined {
    return records.value.find((record) => record.id === id)
  }

  function stopClock(id: string) {
    const clock = clocks.get(id)
    if (clock?.timer) clearTimeout(clock.timer)
    clocks.delete(id)
  }

  function schedule(record: IToastRecord) {
    const clock = clocks.get(record.id)
    if (!clock || clock.remaining <= 0 || paused.value) return
    clock.startedAt = Date.now()
    clock.timer = setTimeout(
      () => dismiss(record.id, 'timeout'),
      clock.remaining,
    )
  }

  /** Start a fresh countdown and restart the timer bar with it. */
  function restartClock(record: IToastRecord) {
    stopClock(record.id)
    record.cycle += 1
    if (record.duration <= 0) return
    clocks.set(record.id, {
      timer: null,
      remaining: record.duration,
      startedAt: Date.now(),
    })
    schedule(record)
  }

  function show(record: IToastRecord) {
    record.visible = true
    restartClock(record)
  }

  /**
   * The single exit. Every path that ends a toast comes through here, which
   * is what makes "onDismiss fires exactly once, with the true reason" a
   * property of the queue rather than a promise each call site has to keep.
   */
  /**
   * Run one `onDismiss`, once, without letting it take the queue with it: the
   * other toasts are still on screen and still have to expire.
   */
  function fire(
    callback: ((reason: TToastDismissReason) => void) | undefined,
    reason: TToastDismissReason,
  ) {
    if (!callback) return
    try {
      callback(reason)
    } catch (error) {
      console.error('[NbToaster] onDismiss threw', error)
    }
  }

  function remove(id: string, reason: TToastDismissReason) {
    stopClock(id)
    const index = records.value.findIndex((record) => record.id === id)
    if (index === -1) return
    const [record] = records.value.splice(index, 1)
    fire(record.onDismiss, reason)
  }

  /**
   * Fill any free slot from the head of the queue.
   *
   * The cap is there so a burst cannot bury the page, and the overflow rule
   * is plain FIFO: extras wait their turn and slide in as toasts expire. The
   * one exception is a screen where nothing can expire, which happens when
   * every visible slot is held by an error. Waiting forever behind three
   * errors would silently swallow every later message, so in that case (and
   * only that case) the oldest visible toast is retired to let the newest
   * news through.
   */
  function settle() {
    for (const record of [...records.value]) {
      if (record.visible) continue
      if (visible.value.length < max.value) {
        show(record)
        continue
      }
      const somethingCanExpire = visible.value.some(
        (other) => other.duration > 0,
      )
      if (somethingCanExpire) break
      const victim = visible.value[0]
      if (!victim) break
      remove(victim.id, 'replaced')
      show(record)
    }
  }

  function applyPatch(record: IToastRecord, patch: TToastPatch) {
    if (
      'onDismiss' in patch &&
      typeof process !== 'undefined' &&
      process.env.NODE_ENV !== 'production'
    ) {
      console.warn(
        '[NbToaster] update() cannot change onDismiss, and this patch was ' +
          'ignored. The callback belongs to the message that was pushed. To ' +
          'hand the slot to a new message with its own callback, push again ' +
          'with the same key: the message being displaced ends first, with ' +
          'reason "replaced".',
      )
    }
    if (patch.message !== undefined) record.message = patch.message
    if (patch.title !== undefined) record.title = patch.title
    if (patch.cta !== undefined) record.cta = patch.cta
    if (patch.key !== undefined) record.key = patch.key
    if (patch.retain !== undefined) record.retain = patch.retain
    if (patch.variant !== undefined) record.variant = patch.variant
    if (patch.duration !== undefined) record.duration = patch.duration
    else if (patch.variant !== undefined)
      record.duration = defaultDuration(patch.variant, record.cta)
    if (record.visible) restartClock(record)
  }

  function handleFor(id: string): IToastHandle {
    return {
      id,
      update: (patch: TToastPatch) => update(id, patch),
      dismiss: (reason: TToastDismissReason = 'user') => dismiss(id, reason),
      isActive: () => find(id) !== undefined,
    }
  }

  /**
   * A toast with an action does not auto-dismiss unless a duration says so.
   *
   * The alternative is a button that removes itself while it is being aimed
   * at, which is worse for a keyboard user than for anyone: the only route to
   * an action in the stack is to tab there, and an info toast's six seconds
   * are gone before the tab ring arrives. Reaching the action is therefore
   * never a race (WCAG 2.2.1).
   */
  function defaultDuration(variant: TToastVariant, cta?: IToastCta): number {
    if (cta) return 0
    return durations[variant]
  }

  /**
   * A keyed push landing on a slot that is already taken.
   *
   * Two things have to be true at once here. The reader must not get a second
   * copy of a message that is already on screen, and the message that is being
   * displaced must still end properly: it may be holding an optimistic delete
   * that nothing else will ever commit. So the old record's `onDismiss` runs
   * with `replaced` before the new one takes over, and the content is replaced
   * in full rather than merged, because merging leaves the first message's
   * title and variant attached to the second message's sentence.
   */
  function supersede(record: IToastRecord, options: IToastOptions) {
    const previous = record.onDismiss
    // Detached before firing, so a callback that pushes the same key again
    // cannot re-enter this and dismiss the same message twice.
    record.onDismiss = undefined
    if (previous && previous !== options.onDismiss) fire(previous, 'replaced')
    record.onDismiss = options.onDismiss

    const variant = options.variant ?? 'info'
    record.title = options.title
    record.cta = options.cta
    record.retain = options.retain
    record.variant = variant
    record.message = options.message
    record.duration = options.duration ?? defaultDuration(variant, options.cta)
    if (record.visible) restartClock(record)
  }

  function push(options: IToastOptions): IToastHandle {
    if (options.key) {
      const existing = records.value.find(
        (record) => record.key === options.key,
      )
      if (existing) {
        supersede(existing, options)
        return handleFor(existing.id)
      }
    }

    const variant = options.variant ?? 'info'
    const record: IToastRecord = {
      ...options,
      id: `nb-toast-${++sequence}`,
      variant,
      duration: options.duration ?? defaultDuration(variant, options.cta),
      visible: false,
      cycle: 0,
    }
    records.value.push(record)
    settle()
    return handleFor(record.id)
  }

  function update(id: string, patch: TToastPatch) {
    const record = find(id)
    if (record) applyPatch(record, patch)
  }

  function dismiss(id: string, reason: TToastDismissReason = 'user') {
    remove(id, reason)
    settle()
  }

  function dismissAll(reason: TToastDismissReason = 'cleared') {
    for (const record of [...records.value]) remove(record.id, reason)
  }

  function dismissTransient(reason: TToastDismissReason = 'navigated') {
    for (const record of [...records.value]) {
      if (record.retain) continue
      remove(record.id, reason)
    }
    settle()
  }

  function pause() {
    if (paused.value) return
    paused.value = true
    const now = Date.now()
    for (const clock of clocks.values()) {
      if (!clock.timer) continue
      clearTimeout(clock.timer)
      clock.timer = null
      clock.remaining = Math.max(0, clock.remaining - (now - clock.startedAt))
    }
  }

  function resume() {
    if (!paused.value) return
    paused.value = false
    for (const record of visible.value) schedule(record)
  }

  function remaining(id: string): number {
    const clock = clocks.get(id)
    if (!clock) return 0
    if (paused.value || !clock.timer) return clock.remaining
    return Math.max(0, clock.remaining - (Date.now() - clock.startedAt))
  }

  const shorthand =
    (variant: TToastVariant) =>
    (message: string, extra: Omit<IToastOptions, 'message' | 'variant'> = {}) =>
      push({ ...extra, message, variant })

  return {
    items,
    visible,
    pending,
    paused,
    max,
    labels,
    push,
    info: shorthand('info'),
    success: shorthand('success'),
    warning: shorthand('warning'),
    error: shorthand('error'),
    update,
    dismiss,
    dismissAll,
    dismissTransient,
    pause,
    resume,
    remaining,
  }
}

let defaultQueue: IToastQueue | null = null

/**
 * Injection key for a queue scoped to one application instance.
 *
 * ```ts
 * app.provide(NB_TOAST_QUEUE_KEY, createToastQueue())
 * ```
 *
 * `useToast()` prefers it whenever it is called from a component, and
 * `NbToaster` renders it without being given a `:queue`. Two reasons to use
 * it: server rendering, where a module-level singleton is shared by every
 * request the Node process is handling concurrently, and a host application
 * that mounts several Vue apps in one page and does not want one app's toasts
 * announced by another's toaster.
 *
 * It cannot be reached from a plain module (a service, a router guard, a
 * store action) because there is no component instance there, which is why the
 * shared queue below stays the default rather than being replaced by this.
 */
export const NB_TOAST_QUEUE_KEY: InjectionKey<IToastQueue> =
  Symbol('nb-toast-queue')

/**
 * The toast queue for the current context.
 *
 * Inside a component, an app-scoped queue provided under
 * `NB_TOAST_QUEUE_KEY` wins. Everywhere else, and when nothing was provided,
 * this is one shared queue per page, created on first use, so a service
 * module, a route guard and a deeply nested component all reach the same
 * stack without prop drilling or a plugin install. Mount a single
 * `<NbToaster />` to render it.
 *
 * @example
 * const toast = useToast()
 * toast.success('Draft saved')
 *
 * @example Progress that resolves into its own result
 * const saving = toast.info('Saving changes...', { duration: 0 })
 * try {
 *   await save()
 *   saving.update({ variant: 'success', message: 'Changes saved' })
 * } catch {
 *   saving.update({ variant: 'error', message: 'Could not save changes' })
 * }
 */
export function useToast(): IToastQueue {
  // Guarded, because `inject()` outside a component warns, and this function
  // is meant to be callable from a store or a router guard.
  if (getCurrentInstance()) {
    const provided = inject(NB_TOAST_QUEUE_KEY, null)
    if (provided) return provided
  }
  if (!defaultQueue) defaultQueue = createToastQueue()
  return defaultQueue
}

/**
 * Drop the shared queue, clearing whatever was in it.
 *
 * For tests, so one spec cannot leave a toast behind for the next, and for a
 * single-render script (a static build, a prerender pass) that wants the
 * module back in its initial state.
 *
 * It is not request isolation. A module-level singleton is shared by every
 * request a Node process is serving at once, and resetting it globally
 * between awaits would empty a queue another request is still filling. Server
 * rendering with concurrent requests wants a queue per application instance:
 * `app.provide(NB_TOAST_QUEUE_KEY, createToastQueue())`, which is scoped to
 * the app that `createSSRApp()` returned and dies with it.
 */
export function resetToastQueue() {
  defaultQueue?.dismissAll()
  defaultQueue = null
}
