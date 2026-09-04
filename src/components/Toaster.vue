<template>
  <Teleport :to="teleportTo" :disabled="props.to === false">
    <!--
      The announcer is mounted for the life of the host, empty, whether or not
      anything is on screen. A live region and its first message inserted into
      the DOM in the same tick is the single most common reason a toast is
      never heard: NVDA and JAWS both routinely miss it, because the node was
      not being observed when the text arrived. Mounting the container early
      and writing text into it later is the only reliable order.

      Two regions rather than one, because politeness cannot be changed after
      the fact: an assertive region that is sometimes polite still interrupts.
    -->
    <div class="nb-toaster__announcer">
      <div role="status" aria-live="polite" aria-atomic="true">
        {{ politeText }}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {{ assertiveText }}
      </div>
    </div>
    <div
      v-if="visible.length > 0"
      ref="regionRef"
      :class="['nb-toaster', `nb-toaster--${props.placement}`]"
      role="region"
      :aria-label="props.label"
      :data-paused="queue.paused.value ? 'true' : undefined"
      @mouseenter="hold('pointer')"
      @mouseleave="release('pointer')"
      @focusin="onFocusIn"
      @focusout="onFocusOut"
      @keydown="onKeydown"
    >
      <TransitionGroup tag="div" class="nb-toaster__stack" name="nb-toaster">
        <div
          v-for="record in rendered"
          :key="record.id"
          class="nb-toaster__item"
          :data-toast-id="record.id"
        >
          <!--
            The default is the whole component. The slot exists so a product
            with its own toast body (a thumbnail, two actions, a progress
            number) keeps the queue, the clock, the cap and the focus handling
            and replaces only the painting.
          -->
          <slot
            name="toast"
            :toast="record"
            :paused="queue.paused.value"
            :dismiss="
              (reason?: TToastDismissReason) => dismiss(record.id, reason)
            "
            :action="() => actioned.add(record.id)"
          >
            <NbToast
              :message="record.message"
              :title="record.title"
              :variant="record.variant"
              :cta="record.cta"
              :duration="record.duration"
              :cycle="record.cycle"
              managed
              :paused="queue.paused.value"
              role="none"
              aria-live="off"
              :status-label="queue.labels.status[record.variant]"
              :close-label="queue.labels.close"
              @action="actioned.add(record.id)"
              @close="dismiss(record.id)"
            />
          </slot>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script lang="ts">
import type { IToastQueue } from '../composables/useToast.composable'

export type { TToasterPlacement } from './Toaster.d'

/**
 * How many hosts are rendering each queue. Module scope on purpose: a
 * `<script setup>` binding is per instance, and the whole point of this
 * counter is to see the other instance.
 */
const hostsPerQueue = new Map<IToastQueue, number>()

function countInstance(target: IToastQueue, delta: number) {
  const count = (hostsPerQueue.get(target) ?? 0) + delta
  if (count <= 0) hostsPerQueue.delete(target)
  else hostsPerQueue.set(target, count)
  if (delta < 0 || count < 2) return
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return
  }
  console.warn(
    '[NbToaster] Two hosts are rendering the same queue. Every toast will be ' +
      'shown and announced twice, and both hosts write to queue.max. Mount ' +
      'one NbToaster per application, and give any second host (a demo, a ' +
      'dialog) its own createToastQueue().',
  )
}
</script>

<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import type { Ref } from 'vue'
import NbToast from './Toast.vue'
import type { IToasterProps } from './Toaster.d'
import {
  NB_TOAST_QUEUE_KEY,
  useToast,
  type IToastRecord,
  type TToastDismissReason,
} from '../composables/useToast.composable'

const props = withDefaults(defineProps<IToasterProps>(), {
  queue: undefined,
  placement: 'bottom-end',
  max: undefined,
  label: 'Notifications',
  to: 'body',
  hotkey: 'alt+t',
  hotkeyHint: 'Press Alt plus T to reach it.',
})

/**
 * The queue is resolved reactively, in three steps: the `queue` prop, then an
 * app-scoped queue provided under `NB_TOAST_QUEUE_KEY` (which is how a server
 * render keeps one request's toasts out of another's), then the shared one
 * from `useToast()`.
 *
 * Reactively, because binding `:queue` to a ref that starts undefined (a store
 * created after the shell mounts, a per-tenant queue) is an ordinary thing to
 * do in an application, and reading it once in setup would silently keep
 * rendering the first queue for ever. The injected value cannot change for the
 * life of the component, so that one is read in setup, where `inject()` is
 * allowed.
 */
const provided = inject(NB_TOAST_QUEUE_KEY, null)
const queue = computed<IToastQueue>(() => props.queue ?? provided ?? useToast())
const visible = computed(() => queue.value.visible.value)

/**
 * Newest first, in the DOM.
 *
 * The queue keeps arrival order, and the stack is painted the other way
 * round: the newest toast sits against the edge the stack is anchored to and
 * the older ones are pushed away from it, so the message that just arrived is
 * always in the same place instead of landing a row lower on every push. That
 * has to be the DOM order rather than a `column-reverse` on every placement,
 * because reversing visually would leave a screen reader in browse mode and a
 * Tab press walking the stack oldest first, reading yesterday's news before
 * the sentence that was just announced. The placement rules then only choose
 * which end of the box the flow starts from.
 */
const rendered = computed(() => [...visible.value].reverse())
const regionRef = ref<HTMLElement | null>(null)

/**
 * Where the stack is teleported.
 *
 * `to: false` renders it in place instead. That is the server-rendering
 * escape hatch: `<Teleport>` does not emit its children where the component
 * sits during SSR, it collects them into `ctx.teleports`, and unless the
 * server template writes that buffer into the target element the client
 * hydrates a stack the server never sent. Rendering in place keeps server
 * and client markup identical, at the cost of inheriting any transformed
 * ancestor's positioning context, so put the host at the root of the app
 * when you use it.
 *
 * A disabled `<Teleport>` still validates its target, so a real selector is
 * kept here even when the teleport is off.
 */
const teleportTo = computed(() => (props.to === false ? 'body' : props.to))

/**
 * `max` is a property of the queue, not of the host, because the cap decides
 * which records are admitted and admission happens in `push()`, long before
 * any host renders. Writing it through therefore mutates shared state, so the
 * previous value is restored when this host lets go of the queue: a demo
 * Toaster with `:max="1"` inside a page must not leave the application's
 * stack capped at one after it unmounts.
 */
let capOwner: { queue: IToastQueue; previous: number } | null = null

function releaseCap() {
  if (capOwner) capOwner.queue.max.value = capOwner.previous
  capOwner = null
}

watch(
  [queue, () => props.max],
  ([next, max]) => {
    if (capOwner && (capOwner.queue !== next || max === undefined)) {
      releaseCap()
    }
    // An absent prop is not a cap of three. The queue's own `max` is the
    // default, so `createToastQueue({ max: 2 })` rendered by a bare
    // `<NbToaster :queue="toast" />` shows two, not the host's idea of two.
    // Writing a prop default through here is how a host silently overrules
    // the queue every consumer configured, and it is why this prop has no
    // default value at all.
    if (max === undefined) return
    if (!capOwner) capOwner = { queue: next, previous: next.max.value }
    next.max.value = max
  },
  { immediate: true },
)

/**
 * Two hosts on one queue is a real mistake with a quiet symptom: the same
 * records render twice, both announcers speak, and the two `max` writes
 * fight. It happens the moment someone drops a second `<NbToaster />` into a
 * docs page or a dialog on top of the app-level one. Only a dev-time warning
 * is appropriate: rendering nothing would be worse than rendering twice,
 * since the second host may be the only one on screen.
 */
let tracked: IToastQueue | null = null

function retrack(next: IToastQueue | null) {
  if (tracked === next) return
  if (tracked) countInstance(tracked, -1)
  tracked = next
  if (next) countInstance(next, 1)
}

watch(queue, (next) => {
  if (tracked) retrack(next)
})

/**
 * Severity decides how loudly this is announced. An error or a warning
 * interrupts whatever the screen reader is saying, because it changes what
 * the user should do next. A success or a note waits its turn: interrupting
 * someone to tell them the thing they asked for worked is rude in a screen
 * reader too.
 */
function isUrgent(record: IToastRecord): boolean {
  return record.variant === 'error' || record.variant === 'warning'
}

/* ── Announcement ──────────────────────────────────────────────────────── */

/*
 * Two FIFO buffers, one per politeness, drained one sentence at a time.
 *
 * The obvious implementation is a scalar ref per region, assigned on every
 * push. It is wrong, and it is wrong in exactly the situation a queue exists
 * for. A live region is read by observing a mutation, so the sentence has to
 * sit in the DOM long enough to be observed; writing a second sentence over
 * the first in the same frame means only the second is ever seen. Two saves
 * confirmed in one tick, or the four-at-once burst the overflow rule is
 * written for, would announce once. A cruder one-live-region-per-toast design
 * does not lose them, so the buffering is not sophistication for its own
 * sake: without it this component would be a regression on the thing it is
 * sold on.
 *
 * The two channels drain independently, because an error must not wait behind
 * a queue of successes.
 */
type TPoliteness = 'polite' | 'assertive'

interface IAnnounceChannel {
  /** The rendered text of one live region. */
  text: Ref<string>
  /** Sentences still to be spoken, oldest first. */
  buffer: string[]
  /** Set while a sentence is on screen and the next one is scheduled. */
  draining: boolean
  handle: ReturnType<typeof setTimeout> | null
}

/**
 * How long each sentence stays in its region before the next replaces it.
 *
 * Long enough for the assistive technology to observe the mutation and take
 * its copy (a screen reader queues polite text itself, so this is not the
 * speaking time), short enough that a burst of four is fully announced in
 * about two seconds rather than outliving the toasts it describes.
 */
const ANNOUNCE_INTERVAL = 500

const politeText = ref('')
const assertiveText = ref('')

const channels: Record<TPoliteness, IAnnounceChannel> = {
  polite: { text: politeText, buffer: [], draining: false, handle: null },
  assertive: {
    text: assertiveText,
    buffer: [],
    draining: false,
    handle: null,
  },
}

/**
 * What is read out. The severity word comes first because it changes how the
 * rest of the sentence should be heard, and an action is named rather than
 * left to be discovered, together with the key that reaches it.
 *
 * Only the announcer speaks. Two live regions saying the same sentence is
 * worse than one, and the region that reliably speaks is the one that was
 * already being observed, so each toast is rendered with `aria-live="off"`,
 * which switches off the live region `NbToast`'s default `role="alert"` would
 * otherwise create. They still carry the severity word visually hidden, so
 * browse mode reads it.
 *
 * `role="none"` goes with it, but do not read more into that attribute than
 * it delivers: presentational-role conflict resolution discards `role="none"`
 * on any element carrying a global ARIA attribute, and `aria-live` is one. The
 * effective role is therefore the div's own, generic, which is exactly what is
 * wanted here and would also be the result of dropping the attribute. It is
 * kept because `NbToast` defaults `role` to `alert` for standalone use, and
 * something has to override that.
 */
function announcementFor(record: IToastRecord): string {
  const parts = [
    queue.value.labels.status[record.variant],
    record.title,
    record.message,
  ]
  const sentence = parts.filter(Boolean).join('. ')
  if (!record.cta) return sentence
  const hint = props.hotkey ? ` ${props.hotkeyHint}` : ''
  return `${sentence}. ${record.cta.label} action available.${hint}`
}

/**
 * Clearing before writing matters: an identical string written twice is not a
 * change, and a live region only speaks when its content changes. Two
 * consecutive failed saves would otherwise announce once. The clear and the
 * write are separate frames for the same reason.
 */
async function drain(channel: IAnnounceChannel) {
  const sentence = channel.buffer.shift()
  if (sentence === undefined) {
    channel.draining = false
    return
  }
  channel.draining = true
  channel.text.value = ''
  await nextTick()
  channel.text.value = sentence
  channel.handle = setTimeout(() => {
    channel.handle = null
    void drain(channel)
  }, ANNOUNCE_INTERVAL)
}

function announce(record: IToastRecord) {
  const channel = channels[isUrgent(record) ? 'assertive' : 'polite']
  channel.buffer.push(announcementFor(record))
  // Already draining means a timer is pending and will pick this up in turn.
  if (!channel.draining) void drain(channel)
}

onBeforeUnmount(() => {
  for (const channel of Object.values(channels)) {
    if (channel.handle) clearTimeout(channel.handle)
    channel.handle = null
    channel.buffer.length = 0
    channel.draining = false
  }
})

const announced = new Set<string>()

watch(
  visible,
  (records) => {
    const live = new Set(records.map((record) => record.id))
    for (const stamp of [...announced]) {
      if (!live.has(stamp.slice(0, stamp.lastIndexOf(':')))) {
        announced.delete(stamp)
      }
    }
    for (const record of records) {
      const stamp = `${record.id}:${record.cycle}`
      if (announced.has(stamp)) continue
      announced.add(stamp)
      announce(record)
    }
  },
  { deep: true, immediate: true },
)

/* ── The clock ─────────────────────────────────────────────────────────── */

/**
 * Reasons the clock is being held. A set rather than a boolean because they
 * overlap: the pointer can leave while focus is still inside a toast, and
 * whoever leaves last must not resume on behalf of the other.
 */
const holds = new Set<'pointer' | 'focus' | 'hidden'>()

/**
 * Whether the application had already stopped the clock when this host took
 * its first hold.
 *
 * `pause()` is public: a product pauses the queue while a long import runs, or
 * while a video is playing, and it expects the clock to still be stopped
 * afterwards. Resuming unconditionally when the pointer leaves would restart
 * somebody else's paused clock, so the host only ever undoes a pause it owns,
 * the same way it gives `queue.max` back on unmount.
 */
let pausedBeforeHold = false

function hold(reason: 'pointer' | 'focus' | 'hidden') {
  if (holds.size === 0) pausedBeforeHold = queue.value.paused.value
  holds.add(reason)
  queue.value.pause()
}

function release(reason: 'pointer' | 'focus' | 'hidden') {
  // Releasing a hold that was never taken must not resume anything: the host
  // evaluates the tab's visibility on mount, and a queue the application
  // paused before the toaster existed has to stay paused.
  if (!holds.delete(reason)) return
  if (holds.size === 0 && !pausedBeforeHold) queue.value.resume()
}

/* ── Focus ─────────────────────────────────────────────────────────────── */

/**
 * The last element outside the stack that held focus, tracked on the
 * document rather than read from `relatedTarget`. A toast can be dismissed
 * long after the user tabbed into it, and by then the event that carried the
 * previous target is gone.
 */
let returnFocus: HTMLElement | null = null

function onDocumentFocusIn(event: FocusEvent) {
  const target = event.target as HTMLElement | null
  if (!target || target === document.body) return
  if (regionRef.value?.contains(target)) return
  returnFocus = target
}

function onFocusIn() {
  hold('focus')
}

function onFocusOut(event: FocusEvent) {
  const to = event.relatedTarget as HTMLElement | null
  if (to && regionRef.value?.contains(to)) return
  release('focus')
}

/**
 * Escape dismisses the toast the user is in, not the whole stack. Clearing
 * everything on one key press would take away messages they have not read,
 * and toasts arrive independently of each other.
 */
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  const active = document.activeElement as HTMLElement | null
  const item = active?.closest<HTMLElement>('.nb-toaster__item')
  const id = item?.dataset.toastId ?? rendered.value[0]?.id
  if (!id) return
  event.stopPropagation()
  event.preventDefault()
  dismiss(id)
}

/**
 * The elements a keyboard can land on inside one toast.
 *
 * Queried from the item wrapper, which is the host's own DOM, rather than
 * from `.nb-toast`, which is the default body's. The `#toast` slot replaces
 * that body wholesale, and a product using it still gets the hotkey and the
 * roving focus on dismissal: the contract the slot has to keep is only that
 * something inside it is focusable, not that it is called `.nb-toast__close`.
 */
const FOCUSABLE = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function itemFor(id: string): HTMLElement | null {
  // Ids are minted by the queue (`nb-toast-1`, `nb-toast-2`), never taken
  // from a caller, so there is nothing here that needs escaping.
  return (
    regionRef.value?.querySelector<HTMLElement>(`[data-toast-id="${id}"]`) ??
    null
  )
}

function firstFocusableIn(id: string): HTMLElement | null {
  const item = itemFor(id)
  if (!item) return null
  if (item.matches(FOCUSABLE)) return item
  return item.querySelector<HTMLElement>(FOCUSABLE)
}

/**
 * Ids whose own action was pressed, so the dismissal that follows reports
 * `action` rather than `user`. The distinction is the whole point of the
 * "Deleted. [Undo]" pattern: one reason commits the delete, the other does
 * not.
 */
const actioned = new Set<string>()

/**
 * Dismissal has to answer "where does focus go now". Losing it to `<body>`
 * drops a keyboard user back at the top of the document, so focus moves to
 * the nearest surviving toast when there is one and otherwise returns to
 * whatever they were doing before they came in here.
 *
 * This is a watcher on the queue and not a step inside `dismiss()`, and the
 * difference is the whole point. Only the close button and Escape reach
 * `dismiss()`. Most removals do not: an auto-dismissal whose clock ran out
 * while the pointer was elsewhere, a `dismissAll()` on sign-out, the
 * `router.afterEach(() => toast.dismissTransient())` recipe this component's
 * own page teaches, a keyed message superseded by its successor. Every one of
 * those can take away the element that currently holds focus, and putting the
 * restore in `dismiss()` left all of them dropping focus to `<body>`.
 *
 * Watching the queue catches the removal whatever caused it. The callback
 * runs before the DOM is patched (a pre-flush watcher), which is the only
 * moment where both facts are still true: the focused element is still
 * attached, and `returnFocus` has not yet been cleared by the `focusout` that
 * removing it will fire.
 */
watch(visible, (records, previous) => {
  if (!previous) return
  const active = document.activeElement as HTMLElement | null
  if (!active || !regionRef.value?.contains(active)) return

  const item = active.closest<HTMLElement>('[data-toast-id]')
  const goneId = item?.dataset.toastId
  if (!goneId) return
  if (records.some((record) => record.id === goneId)) return

  // Rendered order, not queue order: focus should roll onto the toast the
  // user can see next to the one that just went, which is the next item down
  // the stack. `dismissAll()` removes several at once, so the search skips
  // any neighbour that is leaving too rather than focusing a dying node.
  const order = [...previous].reverse().map((record) => record.id)
  const live = new Set(records.map((record) => record.id))
  const index = order.indexOf(goneId)
  let neighbour: string | undefined
  for (let i = index + 1; i < order.length && !neighbour; i += 1) {
    if (live.has(order[i])) neighbour = order[i]
  }
  for (let i = index - 1; i >= 0 && !neighbour; i -= 1) {
    if (live.has(order[i])) neighbour = order[i]
  }

  const restoreTo = returnFocus
  void nextTick(() => {
    const next = neighbour ? firstFocusableIn(neighbour) : null
    if (next) {
      next.focus()
      return
    }
    if (restoreTo?.isConnected) restoreTo.focus()
    returnFocus = null
  })
})

/**
 * Take a toast off the queue on the user's behalf.
 *
 * The reason is what separates "Deleted. [Undo]" committing the delete from
 * cancelling it, so a slot that renders its own action button can name it:
 * `dismiss('action')`. Left unsaid, pressing the toast's own call to action
 * first is enough, because that records the id here.
 */
function dismiss(id: string, reason?: TToastDismissReason) {
  queue.value.dismiss(id, reason ?? (actioned.has(id) ? 'action' : 'user'))
  actioned.delete(id)
}

/* ── The hotkey ───────────────────────────────────────────────────────────
 *
 * A round trip, not a jump. Pressing it from the page moves focus into the
 * newest toast, which also pauses the clock; pressing it again puts focus
 * back exactly where it was, so reading a toast costs a keyboard user two
 * keystrokes and no lost place.
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * Physical key, not typed character.
 *
 * `event.key` is what the keystroke produced, and on macOS Option is a
 * character modifier: Option+T produces a dagger (U+2020) in Chrome, Safari
 * and Firefox alike, never 't'. A hotkey matched on `event.key` is therefore dead on the
 * platform most of the fleet develops on, and it is layout-dependent
 * everywhere else, since the letter engraved on a key differs between QWERTY,
 * AZERTY and Dvorak. `event.code` is the key's position, which is what a
 * shortcut means. It is also why the spoken hint is a prop: a product whose
 * users are not on a QWERTY board should say the letter they actually have.
 */
const NAMED_CODES: Record<string, string> = {
  space: 'Space',
  enter: 'Enter',
  escape: 'Escape',
  comma: 'Comma',
  period: 'Period',
  slash: 'Slash',
  backslash: 'Backslash',
  backquote: 'Backquote',
  minus: 'Minus',
  equal: 'Equal',
}

/** `'t'` becomes `'KeyT'`, `'1'` becomes `'Digit1'`. */
function codeFor(key: string): string | null {
  if (/^[a-z]$/.test(key)) return `Key${key.toUpperCase()}`
  if (/^[0-9]$/.test(key)) return `Digit${key}`
  return NAMED_CODES[key] ?? null
}

function matchesHotkey(event: KeyboardEvent): boolean {
  if (!props.hotkey) return false
  const parts = props.hotkey.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const code = codeFor(key)
  // Unrecognised terminal keys fall back to the character, which is the best
  // that can be done for a key this map does not name.
  if (code ? event.code !== code : event.key.toLowerCase() !== key) return false
  const wants = (name: string) => parts.includes(name)
  return (
    event.altKey === wants('alt') &&
    event.ctrlKey === wants('ctrl') &&
    event.shiftKey === wants('shift') &&
    event.metaKey === wants('meta')
  )
}

/**
 * A modal dialog currently on screen, if any.
 *
 * The stack is teleported to `body` and painted above dialogs, so the hotkey
 * would happily move focus out of an open modal and past whatever focus
 * management it has: either the dialog snatches focus straight back, leaving
 * the reader nowhere, or it does not and the reader is now outside a surface
 * that told assistive technology everything else is inert, with nothing to
 * hand focus back afterwards. A toast raised by the dialog's own Save is the
 * common case, so this has to be answered rather than left to chance.
 *
 * The answer is to stand down. The toast is still announced by the live
 * region, which works from inside a dialog because a live region is not part
 * of the modal's node tree, and it is still there to be reached with the same
 * two keystrokes once the dialog closes. Anything the reader must be able to
 * act on while a dialog is open belongs in the dialog, not in a toast behind
 * it.
 */
function openModal(): HTMLElement | null {
  const dialogs = document.querySelectorAll<HTMLElement>('[aria-modal="true"]')
  for (const dialog of dialogs) {
    // A dialog that contains the stack (a host teleported into one) is not in
    // the way of it.
    if (regionRef.value && dialog.contains(regionRef.value)) continue
    return dialog
  }
  return null
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (!matchesHotkey(event)) return
  if (rendered.value.length === 0) return

  if (regionRef.value?.contains(document.activeElement)) {
    event.preventDefault()
    if (returnFocus?.isConnected) returnFocus.focus()
    else (document.activeElement as HTMLElement | null)?.blur()
    return
  }
  if (openModal()) return
  // The newest toast, which is the one nearest the anchored edge and the one
  // just announced. Resolved before preventDefault: under a `#toast` slot with
  // nothing focusable in it there is nowhere to go, and swallowing the key
  // stroke to then do nothing is worse than leaving it to the page.
  const target = firstFocusableIn(rendered.value[0].id)
  if (!target) return
  event.preventDefault()
  target.focus()
}

/**
 * A toast that expires in a tab the user is not looking at was never read.
 * Holding the clock while the document is hidden is the same promise
 * pause-on-hover makes: the countdown measures reading time, so it only runs
 * while reading is possible.
 */
function onVisibilityChange() {
  if (document.visibilityState === 'hidden') hold('hidden')
  else release('hidden')
}

onMounted(() => {
  retrack(queue.value)
  // Evaluate it once rather than only waiting for the next change. A host
  // mounted into a tab that is already in the background (a route restored on
  // a reload, a print preview, a prerendered shell) would otherwise run its
  // clock and expire toasts nobody has seen, which is the exact failure the
  // hold exists to prevent.
  onVisibilityChange()
  document.addEventListener('visibilitychange', onVisibilityChange)
  document.addEventListener('focusin', onDocumentFocusIn)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  document.removeEventListener('focusin', onDocumentFocusIn)
  document.removeEventListener('keydown', onDocumentKeydown)
  // Only a pause this host owns is undone. Holding nothing means the clock is
  // in whatever state the application left it, and unmounting is not a reason
  // to change that.
  const owned = holds.size > 0 && !pausedBeforeHold
  holds.clear()
  if (owned) queue.value.resume()
  retrack(null)
  releaseCap()
})

/**
 * The pointer can leave with no `mouseleave`: the toast under the cursor is
 * removed and the cursor ends up over the page, not over the region. Emptying
 * the stack therefore drops the pointer hold explicitly, or the queue would
 * stay paused for good.
 */
watch(
  () => visible.value.length,
  (count) => {
    if (count > 0) return
    const hadPointer = holds.delete('pointer')
    const hadFocus = holds.delete('focus')
    if (!hadPointer && !hadFocus) return
    if (holds.size === 0 && !pausedBeforeHold) queue.value.resume()
  },
)

defineExpose({ queue })
</script>

<style scoped lang="scss">
@use '../styles/variables/breakpoints' as bp;

/*
 * --nb-zindex-toast is a real token (styles/variables/_layout.scss), defined
 * as modal + 50 so a toast raised by a dialog is not painted behind it. Do
 * not invent a name here: a var() typo falls back silently and the stack
 * ends up under whatever it was supposed to sit above.
 */
.nb-toaster {
  position: fixed;
  z-index: var(--nb-zindex-toast);
  display: flex;
  /*
   * The knobs named below are the public override surface, and they are read
   * with a fallback on purpose: declaring them here would shadow the value an
   * application sets on :root or on a themed wrapper, and a knob you cannot
   * reach without :deep() is not a knob. They are the only --nb-* properties
   * in the library that are written by the consumer rather than by the theme,
   * which is why the token-discipline test allows a fallback for these names
   * and for no others.
   *
   *   --nb-toaster-inset      distance from the viewport edges
   *   --nb-toaster-inset-sm   the same, below the md breakpoint
   *   --nb-toaster-gap        space between stacked toasts, and the travel
   *                           of the enter and exit motion
   *   --nb-toaster-max-width  widest a toast may be
   *
   * Overriding --nb-spacing-24 to move the stack would move the whole product
   * instead: that is a global step on the spacing scale, not a toaster knob.
   */
  padding: var(--nb-toaster-inset, var(--nb-spacing-24));
  /* The region spans an edge of the viewport, so it must not intercept
     clicks meant for the page behind it. Only the toasts themselves do. */
  pointer-events: none;
  /* Never wider than the viewport, whatever the toast asks for. */
  max-width: 100vw;
  box-sizing: border-box;

  /*
   * Below the md breakpoint (672px, the library's real scale) the inset
   * halves and the stack spans the width: 24px of padding on each side of a
   * 280px toast does not fit a 320px phone, and a toast that overflows the
   * viewport takes the horizontal scrollbar of the whole page with it.
   */
  @media (max-width: #{bp.$bp-md - 1}px) {
    padding: var(--nb-toaster-inset-sm, var(--nb-spacing-12));
    inset-inline: 0;

    .nb-toaster__stack,
    .nb-toaster__item {
      width: 100%;
    }
  }
}

.nb-toaster__stack {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--nb-toaster-gap, var(--nb-spacing-12));
  max-width: 100%;
}

.nb-toaster__item {
  position: relative;
  pointer-events: auto;
  max-width: 100%;
}

/*
 * The width knob reaches the default body, which carries its own maximum.
 * Without this, a branded product that wants a wider toast has to write
 * :deep(.nb-toast) in its own stylesheet, which is precisely the kind of
 * reach-inside the audit found in four applications.
 */
.nb-toaster__item :deep(.nb-toast) {
  max-width: min(var(--nb-toaster-max-width, 23.75rem), 100%);
}

.nb-toaster__announcer {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/*
 * Placement. The newest toast sits against the edge the stack is anchored to
 * and the older ones are pushed away from it, so the message that just
 * arrived is in the same place every time instead of landing one row further
 * out on every push. That holds for all six placements, and it takes both
 * halves: the host renders the records newest first, and the flow direction
 * decides which end of the box that first item is laid out from.
 *
 * Top anchors: plain column, so the first item (the newest) is at the top,
 * against the top edge. Bottom anchors: column-reverse, so the first item is
 * at the bottom, against the bottom edge. Reversing the DOM instead of the
 * flow for the bottom half would put the stack in the wrong order for browse
 * mode and for Tab.
 */
.nb-toaster--top-start,
.nb-toaster--top,
.nb-toaster--top-end {
  top: 0;
  --nb-toaster-shift: 0 calc(var(--nb-toaster-gap, var(--nb-spacing-12)) * -1);

  .nb-toaster__stack {
    flex-direction: column;
  }
}

.nb-toaster--bottom-start,
.nb-toaster--bottom,
.nb-toaster--bottom-end {
  bottom: 0;
  --nb-toaster-shift: 0 var(--nb-toaster-gap, var(--nb-spacing-12));

  .nb-toaster__stack {
    flex-direction: column-reverse;
  }
}

.nb-toaster--top-start,
.nb-toaster--bottom-start {
  inset-inline-start: 0;
  justify-content: flex-start;
  --nb-toaster-shift: calc(var(--nb-toaster-inset, var(--nb-spacing-24)) * -1) 0;
}

.nb-toaster--top-end,
.nb-toaster--bottom-end {
  inset-inline-end: 0;
  justify-content: flex-end;
  --nb-toaster-shift: var(--nb-toaster-inset, var(--nb-spacing-24)) 0;
}

.nb-toaster--top,
.nb-toaster--bottom {
  inset-inline: 0;
  justify-content: center;
}

/*
 * Enter and exit. The shift is a custom property set by the placement rules,
 * so a toast always arrives from the edge it is anchored to. `translate` is
 * used rather than `transform` so the countdown bar's scaleX inside the toast
 * and the centred placements can keep their own transforms.
 */
.nb-toaster-enter-active,
.nb-toaster-leave-active,
.nb-toaster-move {
  transition:
    opacity var(--nb-animation-fast) ease,
    translate var(--nb-animation-fast) ease;
}

.nb-toaster-enter-from,
.nb-toaster-leave-to {
  opacity: 0;
  translate: var(--nb-toaster-shift);
}

/* Taken out of flow while leaving so the toasts below it slide up into the
   gap instead of snapping. */
.nb-toaster-leave-active {
  position: absolute;
}

.nb-toaster--top-end .nb-toaster-leave-active,
.nb-toaster--bottom-end .nb-toaster-leave-active {
  inset-inline-end: 0;
}

.nb-toaster--top-start .nb-toaster-leave-active,
.nb-toaster--bottom-start .nb-toaster-leave-active {
  inset-inline-start: 0;
}

/*
 * Windows high contrast.
 *
 * The paint that forced colours breaks belongs to the toast body, and
 * `Toast.vue` repaints it: system-palette surface, border and accent, plus a
 * visible countdown. The host owns one case that file cannot see. When the
 * `#toast` slot replaces the default body, nothing guarantees the replacement
 * draws a boundary of its own, and with the drop shadow discarded a stack of
 * three slotted toasts reads as one undivided block over the page. So the
 * item draws the boundary itself, but only where the default body is absent,
 * which keeps it from doubling up into a 2px ring around a normal toast.
 */
@media (forced-colors: active) {
  .nb-toaster__item:not(:has(.nb-toast)) {
    outline: 1px solid CanvasText;
    background: Canvas;
  }
}

/*
 * Reduced motion removes the travel, not the message: toasts cross-fade in
 * place and the stack reflows immediately.
 */
@media (prefers-reduced-motion: reduce) {
  .nb-toaster {
    --nb-toaster-shift: 0 0;
  }

  .nb-toaster-enter-active,
  .nb-toaster-leave-active {
    transition: opacity var(--nb-animation-fast) ease;
  }

  .nb-toaster-move {
    transition: none;
  }
}
</style>
