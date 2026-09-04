import { createApp, defineComponent, h, ref, shallowRef, type App } from 'vue'
import NbConfirm from '@/components/Confirm.vue'
import NbIcon from '@/components/Icon.vue'
import NbGrid from '@/components/Grid.vue'
import { CONFIRM_LEAVE_MS } from '@/components/Confirm.env'
import { prefersReducedMotion } from '@/composables/useReducedMotion.composable'
import type { IConfirmOptions, IConfirmProps } from '@/components/Confirm.d'

/**
 * Awaitable confirmation.
 *
 * ```ts
 * const confirm = useConfirm()
 * if (await confirm({ title: 'Delete environment', subject: env.name })) {
 *   await api.deleteEnvironment(env.id)
 * }
 * ```
 *
 * Resolves `true` only if the user confirmed (and, when `onConfirm` is
 * supplied, only after that work succeeded). Escape, the overlay, the close
 * button and the cancel button all resolve `false`. It never rejects: a
 * failing `onConfirm` keeps the dialog open instead, so a rejected promise
 * would have no honest meaning here.
 */
export type TConfirmFn = (options: IConfirmOptions) => Promise<boolean>

/**
 * One question, and everything that happens to it.
 *
 * The identity of this object is what makes the module state below safe.
 * Every write that follows an `await` is addressed to a specific entry and a
 * specific attempt at it, and is dropped if that entry is no longer the one
 * on screen. Without that, a slow `onConfirm` outliving its own dialog (the
 * user confirms, a router guard calls `dismissConfirms()`, the next question
 * opens, the first request finally lands) resolved whatever question happened
 * to be showing, which is the one thing this component exists to prevent:
 * something confirmed that nobody confirmed.
 */
interface IConfirmEntry {
  options: IConfirmOptions
  resolve: (value: boolean) => void
  /**
   * Bumped by every press of the confirm button. A retry after a timeout
   * leaves the first request in flight, and when it lands it must not answer
   * the question the second one is still working on.
   */
  attempt: number
  /** Answered or abandoned. Either way, nothing may write to it again. */
  done: boolean
}

// How long the finished beat stays on screen before the dialog closes itself.
// Long enough to be read as a result, short enough that nobody waits on it.
// Only ever reached when the caller supplied a `successLabel`.
const SUCCESS_MS = 900

/**
 * Raised internally when `timeout` elapses. It is a distinct type so the
 * caller's `formatError` is not handed a failure it never saw: the request may
 * still be running, and only the dialog has given up on it.
 */
class ConfirmTimeout extends Error {
  constructor() {
    super('confirm timed out')
    this.name = 'ConfirmTimeout'
  }
}

const DEFAULT_TIMEOUT_MESSAGE =
  'This is taking longer than expected. It may still be running. Check ' +
  'before trying again.'

// One dialog, one host, one queue, for the whole page. Two call sites that
// both ask for confirmation at once must not stack two scrims: the second
// question waits for the first to be answered.
const current = shallowRef<IConfirmEntry | null>(null)
const open = ref(false)
const busy = ref(false)
const succeeded = ref(false)
const failure = ref<string | undefined>(undefined)
const queue: IConfirmEntry[] = []

let host: App | null = null
let hostEl: HTMLElement | null = null
let advanceTimer: ReturnType<typeof setTimeout> | null = null
let successTimer: ReturnType<typeof setTimeout> | null = null

/**
 * The settled request stays rendered for the length of its own exit so its
 * text does not blank out mid-fade, and so a queued second question does not
 * read as the first one changing its mind. NbConfirm writes that duration
 * onto the animated nodes itself (see Confirm.env.ts), which is why this can
 * be the same constant rather than a copy of NbModal's stylesheet, and why a
 * user with reduced motion waits nothing at all.
 */
function leaveDelay(): number {
  return prefersReducedMotion() ? 0 : CONFIRM_LEAVE_MS
}

function clearSuccessTimer() {
  if (successTimer) clearTimeout(successTimer)
  successTimer = null
}

function defaultFormatError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  const text = String(error)
  return text === '[object Object]' ? 'Something went wrong.' : text
}

function advance() {
  advanceTimer = null
  const next = queue.shift() ?? null
  current.value = next
  open.value = !!next
}

/**
 * Whether `entry` is still the question on screen, on the attempt that asked.
 * Every write after an `await` goes through this. A `false` here means the
 * work that just finished belongs to a dialog that is gone (dismissed,
 * cancelled, superseded by a retry), so its result is dropped rather than
 * applied to whatever is showing now.
 */
function isLive(entry: IConfirmEntry, attempt: number): boolean {
  return !entry.done && entry.attempt === attempt && current.value === entry
}

/**
 * Answers one specific request. Never "the current one": a caller that has
 * been through an `await` has to say which question it is answering, because
 * by then it may not be the one on screen.
 */
function settle(value: boolean, entry: IConfirmEntry | null = current.value) {
  if (!entry || entry.done) return
  if (entry !== current.value) return
  entry.done = true
  clearSuccessTimer()
  open.value = false
  busy.value = false
  succeeded.value = false
  failure.value = undefined
  entry.resolve(value)
  if (advanceTimer) clearTimeout(advanceTimer)
  advanceTimer = setTimeout(advance, leaveDelay())
}

/**
 * Waits for the work, but not forever. Every control in the dialog is locked
 * while this runs, which is the whole point (a second click is a second
 * DELETE), and that makes a promise that never settles the one failure the
 * user cannot get out of: no cancel, no close, no Escape. The timeout turns
 * an unrecoverable dialog into a readable error with a retry in it.
 *
 * The timer is local to the call. A module-level one was cleared by whichever
 * attempt finished first, so a stale success could cancel a live attempt's
 * deadline and hang the dialog it had nothing to do with.
 */
function runWithTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new ConfirmTimeout()), ms)
    work.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function runConfirm() {
  const entry = current.value
  if (!entry || entry.done || busy.value || succeeded.value) return
  const { onConfirm, formatError, timeout, timeoutMessage, successLabel } =
    entry.options

  if (!onConfirm) {
    settle(true, entry)
    return
  }

  // The attempt is claimed before the work starts, so a reply arriving after
  // a retry has begun can tell that it is no longer the answer to anything.
  const attempt = ++entry.attempt

  // The pending lock lives here rather than at the call site because the
  // failure it prevents (a second click firing a second DELETE) is the same
  // in every app, and every app that hand-rolled a confirm forgot it.
  busy.value = true
  failure.value = undefined
  try {
    const work = Promise.resolve(onConfirm())
    await (timeout && timeout > 0 ? runWithTimeout(work, timeout) : work)
    // Past this line nothing may be assumed about the dialog on screen.
    if (!isLive(entry, attempt)) return
    busy.value = false
    if (successLabel) {
      // The finished beat. The dialog closes itself; the caller's promise
      // resolves with it, so `await confirm(...)` still means "done".
      succeeded.value = true
      successTimer = setTimeout(() => settle(true, entry), SUCCESS_MS)
    } else {
      settle(true, entry)
    }
  } catch (error) {
    // Same guard on the failure path, and for the same reason: a rejection
    // from a dead request used to print its message inside the next
    // question's dialog, which is a lie about a record it never touched.
    if (!isLive(entry, attempt)) return
    busy.value = false
    failure.value =
      error instanceof ConfirmTimeout
        ? (timeoutMessage ?? DEFAULT_TIMEOUT_MESSAGE)
        : (formatError ?? defaultFormatError)(error)
  }
}

/**
 * The presentational half of a request. The three behavioural options are
 * stripped: left in, `formatError` and `body` would fall through onto the DOM
 * as attributes and `onConfirm` would be read as a listener for the
 * component's own `confirm` event, quietly replacing the host's handler.
 */
function dialogPropsFor(options: IConfirmOptions | null): IConfirmProps {
  const dialogProps: IConfirmProps &
    Partial<Pick<IConfirmOptions, 'onConfirm' | 'formatError' | 'body'>> = {
    ...(options ?? { title: '' }),
  }
  delete dialogProps.onConfirm
  delete dialogProps.formatError
  delete dialogProps.body
  return dialogProps
}

const ConfirmHost = defineComponent({
  name: 'NbConfirmHost',
  setup() {
    return () => {
      const options = current.value?.options ?? null
      // `body` is how the default slot is reached from an options object.
      // Without it the slot would be documented but unreachable for every
      // caller who uses the composable, which is nearly all of them.
      const body = options?.body
      return h(
        NbConfirm,
        {
          ...dialogPropsFor(options),
          // The host owns these three, so anything the caller passed for them
          // is ignored rather than fought with.
          open: open.value,
          busy: busy.value,
          succeeded: succeeded.value,
          // Empty rather than undefined: withDefaults resolves the prop to a
          // plain string, and the component treats empty as "no failure".
          error: failure.value ?? '',
          onConfirm: runConfirm,
          onCancel: () => settle(false),
        },
        body ? { default: () => body() } : undefined,
      )
    }
  },
})

function ensureHost() {
  if (host) return
  if (typeof document === 'undefined') {
    // Silence here would be the dangerous outcome: resolving false would read
    // as "the user declined" and resolving true would run the destructive
    // action with nobody asked. Neither is true, so it throws.
    throw new Error(
      '[NbConfirm] confirm() needs a DOM. It cannot run during server-side ' +
        'rendering or in a non-browser environment. Call it from an event ' +
        'handler, not from setup().',
    )
  }
  hostEl = document.createElement('div')
  hostEl.setAttribute('data-nb-confirm-host', '')
  document.body.appendChild(hostEl)

  // Its own app instance, so no application has to remember to mount a host
  // component. That app has no plugin installed, so nothing is registered
  // globally except what is registered here. NbConfirm imports its own
  // children directly; the two below are the ones its descendants resolve by
  // name instead (NbModal renders NbIcon and NbGrid, NbMessage renders
  // NbIcon, NbTextInput renders NbGrid).
  host = createApp(ConfirmHost)
  host.component('NbIcon', NbIcon)
  host.component('NbGrid', NbGrid)

  // A component this host cannot resolve renders as an unknown element with
  // no styling and no behaviour, and Vue only warns about it in development.
  // Inside a confirmation dialog that is a silent failure on the one screen
  // that must not fail silently, so the host promotes the warning: the
  // dialog is still shown (a broken dialog beats a deleted record) but the
  // console carries a message naming this file as the place to fix it.
  host.config.warnHandler = (message, _instance, trace) => {
    if (message.includes('Failed to resolve component')) {
      console.error(
        `[NbConfirm] ${message} The dialog runs in its own Vue app, so a ` +
          'sibling resolved by name has to be registered in ' +
          'useConfirm.composable.ts. Import it in NbConfirm instead where ' +
          'you can.',
      )
      return
    }
    console.warn(`[NbConfirm] ${message}${trace}`)
  }

  host.mount(hostEl)
}

function requestConfirm(options: IConfirmOptions): Promise<boolean> {
  ensureHost()
  return new Promise<boolean>((resolve) => {
    const entry: IConfirmEntry = { options, resolve, attempt: 0, done: false }
    if (current.value) {
      queue.push(entry)
      return
    }
    current.value = entry
    open.value = true
  })
}

/**
 * Cancels the dialog on screen and everything waiting behind it, resolving
 * every outstanding `confirm()` to `false`, then tears the host down.
 *
 * Call it when the ground moves under a pending question: a route change, a
 * signed-out session, a Tauri window closing. Without it a confirm asked
 * about a record that no longer exists sits there waiting for an answer.
 *
 * Work already in flight is not cancelled, because nothing here can cancel a
 * request it did not make. It is disowned: every entry is marked done, so
 * when that request finally lands it resolves nothing, closes nothing and
 * shows its failure to nobody. Pass an AbortSignal inside `onConfirm` if the
 * call itself has to stop too.
 */
export function dismissConfirms(): void {
  if (advanceTimer) {
    clearTimeout(advanceTimer)
    advanceTimer = null
  }
  clearSuccessTimer()
  const pending = [...queue]
  queue.length = 0
  const showing = current.value
  // Marked done BEFORE resolving, so a `.then` on the caller's promise that
  // asks a new question synchronously cannot be answered by the old one.
  for (const entry of showing ? [showing, ...pending] : pending) {
    entry.done = true
  }
  showing?.resolve(false)
  for (const entry of pending) entry.resolve(false)
  current.value = null
  open.value = false
  busy.value = false
  succeeded.value = false
  failure.value = undefined
  // Unmounting is what returns focus to whatever opened the dialog: the
  // close it would otherwise watch for never renders, because the host is
  // gone in the same tick. NbConfirm restores on unmount for exactly this
  // path, so a router guard calling this does not strand a keyboard user on
  // <body>. Order matters: the element has to still be in the document.
  host?.unmount()
  host = null
  hostEl?.remove()
  hostEl = null
}

/**
 * Returns the `confirm()` function. It is a plain function over module state,
 * not an injection, so it works in a component, in a Pinia store, in a router
 * guard and in a plain module.
 *
 * Nothing to install and nothing to mount: the first call creates the host.
 * That matters beyond convenience, because `window.confirm` is a documented
 * no-op inside a Tauri webview and cannot be driven by a gamepad, so the
 * alternative every app reached for is not available to two of ours.
 */
export function useConfirm(): TConfirmFn {
  return requestConfirm
}
