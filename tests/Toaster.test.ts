import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineComponent, h, nextTick, shallowRef } from 'vue'
import Toaster from '../src/components/Toaster.vue'
import NbToast from '../src/components/Toast.vue'
import {
  createToastQueue,
  NB_TOAST_DURATIONS,
  NB_TOAST_STATUS_LABELS,
  useToast,
  resetToastQueue,
  NB_TOAST_QUEUE_KEY,
  type IToastQueue,
  type TToastPatch,
} from '../src/composables/useToast.composable'

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  template: '<i data-testid="nb-icon" :data-name="name"></i>',
}

/**
 * A real teleport target, not a stub.
 *
 * Stubbing Teleport is the obvious shortcut and it is wrong here: the stub is
 * re-created on every render, so every toast is unmounted and remounted each
 * time the queue pauses. Under the stub, focus inside a toast is lost on the
 * first hover, which is exactly the behaviour these tests exist to prove.
 * Teleporting into a real element in the document keeps the DOM identity the
 * component actually has in an application.
 */
let host: HTMLElement

function mountToaster(queue: IToastQueue, props: Record<string, unknown> = {}) {
  return mount(Toaster, {
    props: { queue, to: '#nb-toaster-host', ...props },
    attachTo: document.body,
    global: { stubs: { NbIcon: NbIconStub } },
  })
}

/** Everything below queries the teleported DOM, where the stack really is. */
function find(selector: string) {
  return new DOMWrapper(host.querySelector(selector) ?? undefined)
}

function findAll(selector: string) {
  return [...host.querySelectorAll(selector)].map(
    (element) => new DOMWrapper(element),
  )
}

/**
 * Three ticks, not one. The announcement deliberately clears its live region
 * and writes the text on the following tick, so the render that inserts the
 * toast and the render that fills the region are two separate frames.
 */
async function flush() {
  await nextTick()
  await nextTick()
  await nextTick()
}

/**
 * Announcements are buffered per politeness and drained one sentence at a
 * time, so reaching the *next* sentence costs the clock as well as the tick.
 * 500 is NbToaster's ANNOUNCE_INTERVAL.
 */
async function nextAnnouncement() {
  vi.advanceTimersByTime(500)
  await flush()
}

const toasts = () => findAll('.nb-toaster__item')
const messages = () => findAll('.nb-toast__message').map((node) => node.text())

describe('useToast queue', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    resetToastQueue()
  })

  it('clears what a route change made stale, and keeps what it did not', () => {
    const queue = createToastQueue()
    const stale = vi.fn()
    const kept = vi.fn()

    queue.success('Draft saved', { onDismiss: stale })
    queue.info('Export ready', { retain: true, onDismiss: kept })

    // A toast raised by a page the user has since left is news about a screen
    // they cannot see, and its Undo acts on a record they cannot see either.
    // The queue provides the operation; a router guard says when.
    queue.dismissTransient()

    expect(stale).toHaveBeenCalledWith('navigated')
    expect(kept).not.toHaveBeenCalled()
    expect(queue.visible.value.map((record) => record.message)).toEqual([
      'Export ready',
    ])
  })

  it('lets a pending toast in when a route change frees a slot', () => {
    const queue = createToastQueue({ max: 1 })
    queue.info('Draft saved')
    queue.info('A new version is available')
    expect(queue.pending.value).toHaveLength(1)

    queue.dismissTransient()
    expect(queue.visible.value).toHaveLength(0)
    expect(queue.pending.value).toHaveLength(0)
  })

  it('clears everything on dismissAll, retained toasts included', () => {
    const queue = createToastQueue()
    const onDismiss = vi.fn()
    queue.info('Export ready', { retain: true, onDismiss })

    // Sign-out is not a navigation: nothing queued is still true afterwards.
    queue.dismissAll()
    expect(onDismiss).toHaveBeenCalledWith('cleared')
    expect(queue.items.value).toHaveLength(0)
  })

  it('resolves a default duration from the variant', () => {
    const queue = createToastQueue()
    queue.success('Draft saved')
    queue.warning('Two collaborators are editing this page')
    queue.error('Could not reach the server')

    const [success, warning, error] = queue.items.value
    expect(success.duration).toBe(NB_TOAST_DURATIONS.success)
    expect(warning.duration).toBe(NB_TOAST_DURATIONS.warning)
    expect(error.duration).toBe(0)
  })

  it('never auto-dismisses an error', async () => {
    const queue = createToastQueue()
    queue.error('Could not reach the server')

    await vi.advanceTimersByTimeAsync(60_000)
    expect(queue.visible.value).toHaveLength(1)
  })

  it('auto-dismisses everything else on its own clock', async () => {
    const queue = createToastQueue()
    queue.success('Draft saved')

    await vi.advanceTimersByTimeAsync(NB_TOAST_DURATIONS.success - 1)
    expect(queue.visible.value).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(2)
    expect(queue.visible.value).toHaveLength(0)
  })

  it('honours an explicit duration of 0 on any variant', async () => {
    const queue = createToastQueue()
    queue.info('You are in read-only mode', { duration: 0 })

    await vi.advanceTimersByTimeAsync(60_000)
    expect(queue.visible.value).toHaveLength(1)
  })

  it('caps the visible stack and lets the queue drain in order', async () => {
    const queue = createToastQueue({ max: 2 })
    queue.success('One', { duration: 1000 })
    queue.success('Two', { duration: 9000 })
    queue.success('Three', { duration: 9000 })

    expect(queue.visible.value.map((r) => r.message)).toEqual(['One', 'Two'])
    expect(queue.pending.value.map((r) => r.message)).toEqual(['Three'])

    await vi.advanceTimersByTimeAsync(1100)
    expect(queue.visible.value.map((r) => r.message)).toEqual(['Two', 'Three'])
    expect(queue.pending.value).toHaveLength(0)
  })

  it('retires the oldest toast only when nothing on screen can expire', () => {
    const queue = createToastQueue({ max: 2 })
    queue.error('First failure')
    queue.error('Second failure')
    queue.error('Third failure')

    // Three persistent toasts and two slots: waiting would silence every
    // later message for good, so the oldest gives up its slot.
    expect(queue.visible.value.map((r) => r.message)).toEqual([
      'Second failure',
      'Third failure',
    ])
    expect(queue.pending.value).toHaveLength(0)
  })

  it('runs the documented three-errors-then-a-success sequence', () => {
    // The exact snippet on the component page, asserted so the prose cannot
    // drift from the code again: an earlier revision claimed the success
    // waits. It does not. Nothing on screen can expire, so the oldest error
    // is retired with reason 'replaced' and the success is admitted at once.
    const queue = createToastQueue()
    const replaced = vi.fn()
    queue.error('Upload 1 failed', { onDismiss: replaced })
    queue.error('Upload 2 failed')
    queue.error('Upload 3 failed')
    queue.success('Upload 4 finished')

    expect(queue.visible.value.map((r) => r.message)).toEqual([
      'Upload 2 failed',
      'Upload 3 failed',
      'Upload 4 finished',
    ])
    expect(queue.pending.value).toHaveLength(0)
    expect(replaced).toHaveBeenCalledExactlyOnceWith('replaced')
  })

  it('makes the fourth wait when one visible toast can still expire', () => {
    // The other branch of the same snippet, at the same cap of three.
    const queue = createToastQueue()
    queue.error('Upload 1 failed')
    queue.error('Upload 2 failed')
    queue.success('Upload 3 finished')
    queue.success('Upload 4 finished')

    expect(queue.visible.value.map((r) => r.message)).toEqual([
      'Upload 1 failed',
      'Upload 2 failed',
      'Upload 3 finished',
    ])
    expect(queue.pending.value.map((r) => r.message)).toEqual([
      'Upload 4 finished',
    ])
  })

  it('drops a guard toast raised during the navigation it precedes', () => {
    // Why the docs cannot print `router.afterEach(dismissTransient)` without
    // the caveat: the guard's toast is raised inside the navigation, so the
    // afterEach that follows clears it before it is ever painted.
    const queue = createToastQueue()
    const ended = vi.fn()
    queue.error('Your session expired', { onDismiss: ended })
    queue.dismissTransient()

    expect(queue.visible.value).toHaveLength(0)
    expect(ended).toHaveBeenCalledExactlyOnceWith('navigated')

    // retain: true is the fix the docs now prescribe.
    queue.error('Your session expired', { retain: true })
    queue.dismissTransient()
    expect(queue.visible.value).toHaveLength(1)
  })

  it('does not retire a toast while a visible one can still expire', () => {
    const queue = createToastQueue({ max: 2 })
    queue.error('Could not reach the server')
    queue.success('Draft saved')
    queue.info('A new version is available')

    expect(queue.visible.value).toHaveLength(2)
    expect(queue.pending.value.map((r) => r.message)).toEqual([
      'A new version is available',
    ])
  })

  it('pauses and resumes from the remaining time, not from the start', async () => {
    const queue = createToastQueue()
    const handle = queue.success('Draft saved')

    await vi.advanceTimersByTimeAsync(3000)
    queue.pause()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(handle.isActive()).toBe(true)
    expect(queue.remaining(handle.id)).toBe(NB_TOAST_DURATIONS.success - 3000)

    queue.resume()
    await vi.advanceTimersByTimeAsync(NB_TOAST_DURATIONS.success - 3000 + 10)
    expect(handle.isActive()).toBe(false)
  })

  it('updates a live toast in place and restarts its clock', async () => {
    const queue = createToastQueue()
    const saving = queue.info('Saving changes...', { duration: 0 })

    await vi.advanceTimersByTimeAsync(2000)
    saving.update({ variant: 'success', message: 'Changes saved' })

    const record = queue.visible.value[0]
    expect(queue.visible.value).toHaveLength(1)
    expect(record.id).toBe(saving.id)
    expect(record.message).toBe('Changes saved')
    // A variant change with no explicit duration adopts that variant's
    // default, which is what turns a persistent progress toast into one that
    // clears itself.
    expect(record.duration).toBe(NB_TOAST_DURATIONS.success)

    await vi.advanceTimersByTimeAsync(NB_TOAST_DURATIONS.success + 10)
    expect(saving.isActive()).toBe(false)
  })

  it('restarts the timer bar cycle when the message changes', () => {
    const queue = createToastQueue()
    const handle = queue.success('Draft saved')
    const before = queue.visible.value[0].cycle

    handle.update({ message: 'Draft saved to the server' })
    expect(queue.visible.value[0].cycle).toBe(before + 1)
  })

  it('dismisses through the handle and reports it is no longer active', () => {
    const queue = createToastQueue()
    const handle = queue.error('Could not reach the server')

    handle.dismiss()
    expect(handle.isActive()).toBe(false)
    expect(queue.items.value).toHaveLength(0)
    // Dismissing twice is a no-op, not a crash.
    expect(() => handle.dismiss()).not.toThrow()
  })

  it('collapses repeats that share a key instead of stacking them', () => {
    const queue = createToastQueue()
    const first = queue.push({ message: 'Saving...', key: 'save', duration: 0 })
    const second = queue.push({
      message: 'Saving...',
      key: 'save',
      duration: 0,
    })

    expect(queue.items.value).toHaveLength(1)
    expect(second.id).toBe(first.id)
  })

  /**
   * The key path is a replacement, not a merge.
   *
   * Merging is the tempting implementation and it is wrong in a way nobody
   * sees in review: the second call's sentence arrives wearing the first
   * call's title and severity, so "Row 2 deleted" is still shown as an error
   * headed "Could not delete row 1".
   */
  it('replaces the whole message when a key takes over a slot', () => {
    const queue = createToastQueue()
    queue.push({
      key: 'row',
      variant: 'error',
      title: 'Could not delete',
      message: 'Row 1 is still there',
      retain: true,
      duration: 0,
    })
    queue.push({ key: 'row', message: 'Row 2 deleted' })

    const [record] = queue.items.value
    expect(queue.items.value).toHaveLength(1)
    expect(record.message).toBe('Row 2 deleted')
    expect(record.variant).toBe('info')
    expect(record.title).toBeUndefined()
    expect(record.retain).toBeUndefined()
    // The variant decided the duration again, rather than the displaced
    // message's explicit 0 outliving it.
    expect(record.duration).toBe(NB_TOAST_DURATIONS.info)
  })

  /**
   * The regression this queue exists to prevent.
   *
   * The docs teach `key` for per-row bulk actions and `onDismiss` as the
   * commit point of an optimistic delete, so composing the two is not an edge
   * case, it is the documented path. An earlier revision kept the first
   * toast's callback while showing the second toast's message: deleting two
   * rows quickly committed row 1 twice and never committed row 2.
   */
  it('commits the message it displaces before adopting the newer one', () => {
    const queue = createToastQueue()
    const commits: string[] = []

    queue.push({
      key: 'delete-row',
      message: 'Row 1 deleted',
      onDismiss: (reason) => commits.push(`row-1:${reason}`),
    })
    expect(commits).toEqual([])

    queue.push({
      key: 'delete-row',
      message: 'Row 2 deleted',
      onDismiss: (reason) => commits.push(`row-2:${reason}`),
    })
    // Row 1 is off the screen, so its delete is committed now, and named as
    // displaced rather than dismissed by anybody.
    expect(commits).toEqual(['row-1:replaced'])

    queue.dismissAll()
    expect(commits).toEqual(['row-1:replaced', 'row-2:cleared'])
  })

  it('drops a callback the newer push does not carry, once', () => {
    const queue = createToastQueue()
    const first = vi.fn()

    queue.push({ key: 'save', message: 'Draft saved', onDismiss: first })
    queue.push({ key: 'save', message: 'Draft saved again' })
    expect(first).toHaveBeenCalledExactlyOnceWith('replaced')

    queue.dismissAll()
    expect(first).toHaveBeenCalledTimes(1)
  })

  it('keeps the same callback quiet when a key is pushed with it twice', () => {
    const queue = createToastQueue()
    const commit = vi.fn()
    const options = { key: 'save', message: 'Draft saved', onDismiss: commit }

    queue.push({ ...options })
    queue.push({ ...options, onDismiss: commit })
    // Same callback, so nothing has been displaced: an autosave firing twice
    // must not commit twice.
    expect(commit).not.toHaveBeenCalled()

    queue.dismissAll()
    expect(commit).toHaveBeenCalledExactlyOnceWith('cleared')
  })

  it('refuses to change onDismiss through update(), and says so', () => {
    const queue = createToastQueue()
    const original = vi.fn()
    const replacement = vi.fn()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const saving = queue.info('Saving changes...', {
      duration: 0,
      onDismiss: original,
    })

    // Not typeable: TToastPatch omits the field. The cast is the test.
    saving.update({
      message: 'Changes saved',
      onDismiss: replacement,
    } as TToastPatch)

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('cannot change onDismiss'),
    )
    saving.dismiss()
    expect(replacement).not.toHaveBeenCalled()
    expect(original).toHaveBeenCalledExactlyOnceWith('user')
    warn.mockRestore()
  })

  it('scopes a queue to one app when it is provided, singleton otherwise', () => {
    const scoped = createToastQueue()
    let inside: IToastQueue | null = null

    const wrapper = mount(
      defineComponent({
        setup() {
          inside = useToast()
          return () => h('div')
        },
      }),
      { global: { provide: { [NB_TOAST_QUEUE_KEY as symbol]: scoped } } },
    )

    // Inside that app, the provided queue. Outside it (a store, a router
    // guard, another app), still the shared one, which is why the singleton
    // stays the default rather than being replaced by the injection.
    expect(inside).toBe(scoped)
    expect(useToast()).not.toBe(scoped)
    wrapper.unmount()
  })

  it('shares one queue across every useToast() call', () => {
    expect(useToast()).toBe(useToast())
  })

  it('keeps a toast with an action on screen until it is dealt with', async () => {
    const queue = createToastQueue()
    queue.info('Comment deleted', { cta: { label: 'Undo', action: () => {} } })

    // info would otherwise expire in six seconds, before a keyboard user can
    // tab to the action at all.
    expect(queue.visible.value[0].duration).toBe(0)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(queue.visible.value).toHaveLength(1)
  })

  it('still honours an explicit duration on a toast with an action', async () => {
    const queue = createToastQueue()
    queue.info('Comment deleted', {
      duration: 2000,
      cta: { label: 'Undo', action: () => {} },
    })

    await vi.advanceTimersByTimeAsync(2100)
    expect(queue.visible.value).toHaveLength(0)
  })

  it('reports why a toast ended: timeout', async () => {
    const queue = createToastQueue()
    const onDismiss = vi.fn()
    queue.success('Draft saved', { onDismiss })

    await vi.advanceTimersByTimeAsync(NB_TOAST_DURATIONS.success + 10)
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledWith('timeout')
  })

  it('reports why a toast ended: user, cleared and replaced', () => {
    const queue = createToastQueue({ max: 1 })
    const user = vi.fn()
    const cleared = vi.fn()
    const replaced = vi.fn()

    const handle = queue.error('First failure', { onDismiss: user })
    handle.dismiss()
    expect(user).toHaveBeenCalledWith('user')

    queue.error('Second failure', { onDismiss: replaced })
    queue.error('Third failure', { onDismiss: cleared })
    // One slot, two toasts that can never expire: the older one is retired.
    expect(replaced).toHaveBeenCalledWith('replaced')

    queue.dismissAll()
    expect(cleared).toHaveBeenCalledWith('cleared')
  })

  it('reports the reason exactly once, even on a double dismissal', () => {
    const queue = createToastQueue()
    const onDismiss = vi.fn()
    const handle = queue.error('Could not reach the server', { onDismiss })

    handle.dismiss()
    handle.dismiss()
    queue.dismiss(handle.id)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not call onDismiss for an update: that is not an end of life', async () => {
    const queue = createToastQueue()
    const onDismiss = vi.fn()
    const saving = queue.info('Saving changes...', { duration: 0, onDismiss })

    saving.update({ variant: 'success', message: 'Changes saved' })
    expect(onDismiss).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(NB_TOAST_DURATIONS.success + 10)
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith('timeout')
  })

  it('survives a callback that throws', () => {
    const queue = createToastQueue()
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const handle = queue.error('First failure', {
      onDismiss: () => {
        throw new Error('consumer bug')
      },
    })
    const survivor = queue.error('Second failure')

    expect(() => handle.dismiss()).not.toThrow()
    expect(survivor.isActive()).toBe(true)
    error.mockRestore()
  })

  it('carries the queue labels a host reads', () => {
    const queue = createToastQueue({
      statusLabels: { success: 'Correcto' },
      closeLabel: 'Cerrar',
    })
    expect(queue.labels.status.success).toBe('Correcto')
    expect(queue.labels.status.error).toBe(NB_TOAST_STATUS_LABELS.error)
    expect(queue.labels.close).toBe('Cerrar')
  })
})

describe('NbToaster', () => {
  /**
   * Unmount, do not just empty the body.
   *
   * Every host registers document-level listeners for the hotkey and for
   * focus tracking. Wiping innerHTML leaves those attached to a detached
   * component, so a toaster from an earlier test still answers Alt+T and
   * moves focus into a node that is no longer in the document. That is a
   * test-hygiene bug with the same shape as the real one it hides.
   */
  enableAutoUnmount(afterEach)

  beforeEach(() => {
    vi.useFakeTimers()
    host = document.createElement('div')
    host.id = 'nb-toaster-host'
    document.body.appendChild(host)
  })
  afterEach(() => {
    vi.useRealTimers()
    resetToastQueue()
    document.body.innerHTML = ''
  })

  it('renders nothing while the queue is empty', () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)
    expect(find('.nb-toaster').exists()).toBe(false)
  })

  it('renders one toast per visible record', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.success('Draft saved')
    queue.error('Could not reach the server')
    await nextTick()

    expect(toasts()).toHaveLength(2)
    // Newest first in the DOM: see the stack-order suite for why.
    expect(messages()).toEqual(['Could not reach the server', 'Draft saved'])
  })

  it('is a labelled region so the stack can be found', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue, { label: 'Alerts' })

    queue.success('Draft saved')
    await nextTick()

    const region = find('.nb-toaster')
    expect(region.attributes('role')).toBe('region')
    expect(region.attributes('aria-label')).toBe('Alerts')
  })

  it('mounts both live regions before there is anything to say', () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    // The region and its first message must not enter the DOM in the same
    // tick, or the screen reader was not observing when the text arrived.
    expect(find('.nb-toaster').exists()).toBe(false)
    const polite = find('[aria-live="polite"]')
    const assertive = find('[aria-live="assertive"]')
    expect(polite.exists()).toBe(true)
    expect(assertive.exists()).toBe(true)
    expect(polite.attributes('role')).toBe('status')
    expect(assertive.attributes('role')).toBe('alert')
    expect(polite.text()).toBe('')
    expect(assertive.text()).toBe('')
  })

  it('announces politely for success and info, severity word first', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.success('Draft saved')
    await flush()

    expect(find('[aria-live="polite"]').text()).toBe('Success. Draft saved')
    expect(find('[aria-live="assertive"]').text()).toBe('')
  })

  it('interrupts for errors and warnings', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.error('Could not reach the server', { title: 'Save failed' })
    await flush()

    expect(find('[aria-live="assertive"]').text()).toBe(
      'Error. Save failed. Could not reach the server',
    )
    expect(find('[aria-live="polite"]').text()).toBe('')
  })

  it('names the action and the key that reaches it', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.info('Comment deleted', { cta: { label: 'Undo', action: () => {} } })
    await flush()

    expect(find('[aria-live="polite"]').text()).toContain(
      'Undo action available. Press Alt plus T to reach it.',
    )
  })

  it('re-announces an identical repeat instead of going silent', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.error('Could not reach the server')
    await flush()
    const region = find('[aria-live="assertive"]')
    expect(region.text()).toContain('Could not reach the server')

    // A live region only speaks when its content changes, so the second
    // identical failure has to clear the region before rewriting it.
    queue.error('Could not reach the server')
    vi.advanceTimersByTime(500)
    await nextTick()
    expect(find('[aria-live="assertive"]').text()).toBe('')
    await flush()
    expect(find('[aria-live="assertive"]').text()).toContain(
      'Could not reach the server',
    )
  })

  /**
   * The one that a scalar ref per region cannot pass, and the reason the
   * announcer buffers.
   *
   * Two successes raised in the same tick is not an exotic case: it is a save
   * that confirms two things, and the documented overflow example pushes four
   * in a row. Writing both sentences into one region in one frame means the
   * second overwrites the first before any assistive technology has observed
   * the mutation, so a screen reader user hears one of the two a sighted user
   * can see. The buffer holds them and drains in order.
   */
  it('announces every toast of a burst, in order, not just the last', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    // One tick, no await between them.
    queue.success('First thing saved')
    queue.success('Second thing saved')
    await flush()

    const heard: string[] = [find('[aria-live="polite"]').text()]
    await nextAnnouncement()
    heard.push(find('[aria-live="polite"]').text())

    expect(heard).toEqual([
      'Success. First thing saved',
      'Success. Second thing saved',
    ])
    expect(toasts()).toHaveLength(2)
  })

  /**
   * The channels are independent, so a failure never waits behind a queue of
   * confirmations it is more urgent than.
   */
  it('does not make an error wait behind buffered successes', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.success('First thing saved')
    queue.success('Second thing saved')
    queue.error('Could not reach the server')
    await flush()

    expect(find('[aria-live="assertive"]').text()).toBe(
      'Error. Could not reach the server',
    )
    expect(find('[aria-live="polite"]').text()).toBe(
      'Success. First thing saved',
    )
  })

  /**
   * The Accessibility tab states that a toast still waiting for a slot is
   * announced when it is admitted, not when it was raised. That is a claim
   * about what a screen reader user hears, so it is pinned rather than left
   * to the reader's trust: announcing a `Retry` that is not on screen for
   * anybody else is worse than announcing it a moment later.
   */
  it('announces a queued toast when it is admitted, not when it was raised', async () => {
    const queue = createToastQueue({ max: 1 })
    const wrapper = mountToaster(queue, { max: 1 })

    const first = queue.success('Draft saved')
    await flush()
    expect(find('[aria-live="polite"]').text()).toBe('Success. Draft saved')

    // Over the cap, so it is queued rather than shown, and the announcer is
    // still on the message that is actually on screen.
    queue.success('Export ready')
    await flush()
    expect(queue.pending.value).toHaveLength(1)
    expect(find('[aria-live="polite"]').text()).toBe('Success. Draft saved')

    // Admitted, and only now spoken.
    first.dismiss()
    await nextAnnouncement()
    expect(queue.pending.value).toHaveLength(0)
    expect(find('[aria-live="polite"]').text()).toBe('Success. Export ready')
  })

  it('does not let the visible toasts announce a second time', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.success('Draft saved')
    await nextTick()

    // Announcement is the announcer's job. A toast that is also a live region
    // says the same sentence twice.
    const toast = find('.nb-toast')
    expect(toast.attributes('role')).toBe('none')
    expect(toast.attributes('aria-live')).toBe('off')
    // The severity is still in the toast itself, for browse mode.
    expect(toast.find('.nb-toast__status').text()).toBe('Success')
  })

  it('takes its severity words and close label from the queue', async () => {
    const queue = createToastQueue({
      statusLabels: { error: 'Error de la aplicacion' },
      closeLabel: 'Cerrar',
    })
    const wrapper = mountToaster(queue)

    queue.error('No se pudo contactar con el servidor')
    await flush()

    expect(find('.nb-toast__status').text()).toBe('Error de la aplicacion')
    expect(find('.nb-toast__close').attributes('aria-label')).toBe('Cerrar')
    expect(find('[aria-live="assertive"]').text()).toContain(
      'Error de la aplicacion',
    )
  })

  it('applies the placement class and defaults to the bottom inline end', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)
    queue.info('A new version is available')
    await nextTick()
    expect(find('.nb-toaster').classes()).toContain('nb-toaster--bottom-end')

    await wrapper.setProps({ placement: 'top-start' })
    expect(find('.nb-toaster').classes()).toContain('nb-toaster--top-start')
  })

  it('draws a countdown bar only for toasts that expire', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.success('Draft saved')
    queue.error('Could not reach the server')
    await nextTick()

    const bars = findAll('.nb-toast__progress')
    expect(bars).toHaveLength(1)
    expect(bars[0].attributes('style')).toContain(
      `animation-duration: ${NB_TOAST_DURATIONS.success}ms`,
    )
  })

  it('runs one clock, not one per toast', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.success('Draft saved')
    await nextTick()

    // NbToast times itself when it is used bare. Under a host it is managed,
    // so the only timer is the queue's and the only pause is the queue's.
    const toast = wrapper.findComponent(NbToast)
    expect(toast.props('managed')).toBe(true)
    expect(toast.props('paused')).toBe(false)

    await find('.nb-toaster').trigger('mouseenter')
    await nextTick()
    expect(wrapper.findComponent(NbToast).props('paused')).toBe(true)
    expect(find('.nb-toast__progress').attributes('style')).toContain(
      'animation-play-state: paused',
    )
  })

  it('renders the toast slot in place of the default body', async () => {
    const queue = createToastQueue()
    mount(Toaster, {
      props: { queue, to: '#nb-toaster-host' },
      attachTo: document.body,
      global: { stubs: { NbIcon: NbIconStub } },
      slots: {
        toast: `<template #toast="{ toast, dismiss }">
          <div class="custom">{{ toast.message }}<button class="custom-close" @click="dismiss">x</button></div>
        </template>`,
      },
    })

    queue.success('Draft saved')
    await nextTick()

    expect(find('.nb-toast').exists()).toBe(false)
    expect(find('.custom').text()).toContain('Draft saved')

    await find('.custom-close').trigger('click')
    expect(queue.visible.value).toHaveLength(0)
  })

  /**
   * The event a Mac really produces.
   *
   * Option is a character modifier on macOS: Option+T types a dagger, in
   * Chrome, Safari and Firefox alike, so `event.key` is never 't' there. The
   * previous revision of this test dispatched `{ key: 't', altKey: true }`,
   * an event no macOS browser emits, and so certified a hotkey that did
   * nothing on the platform the fleet develops on. Every hotkey assertion
   * below now uses the physical key, which is what a shortcut is.
   */
  function pressAltT(over: Partial<KeyboardEventInit> = {}) {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: '\u2020',
        code: 'KeyT',
        altKey: true,
        ...over,
      }),
    )
  }

  it('moves focus into the stack and back on the hotkey', async () => {
    const queue = createToastQueue()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    mountToaster(queue)

    queue.info('Comment deleted', { cta: { label: 'Undo', action: () => {} } })
    await nextTick()
    trigger.focus()

    // The first control in the newest toast, which is its action when it has
    // one: Undo is the reason the user came, and Close is one Tab further on.
    pressAltT()
    await nextTick()
    expect(document.activeElement).toBe(find('.nb-toast__cta').element)

    pressAltT()
    await nextTick()
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('lands on the close button when the toast has no action', async () => {
    const queue = createToastQueue()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    mountToaster(queue)

    queue.error('Could not reach the server')
    queue.error('Could not reach the server either')
    await nextTick()
    trigger.focus()

    pressAltT()
    await nextTick()
    // The newest toast, which is the one that was just announced, the one
    // nearest the anchored edge, and the first in the DOM.
    const newest = queue.visible.value[queue.visible.value.length - 1].id
    expect(document.activeElement).toBe(
      find(`[data-toast-id="${newest}"] .nb-toast__close`).element,
    )
    trigger.remove()
  })

  it('matches the hotkey on the physical key, not the character', async () => {
    const queue = createToastQueue()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    mountToaster(queue)

    queue.info('A new version is available')
    await nextTick()
    trigger.focus()

    // Same character, different key: an AZERTY user pressing the key that
    // types 't' on QWERTY. The shortcut is a position, so this is not it.
    pressAltT({ key: 't', code: 'KeyY' })
    await nextTick()
    expect(document.activeElement).toBe(trigger)

    // The same physical key on a layout that types something else entirely.
    pressAltT({ key: '\u03c4' })
    await nextTick()
    expect(document.activeElement).toBe(find('.nb-toast__close').element)
    trigger.remove()
  })

  it('reaches a custom body through the toast slot', async () => {
    const queue = createToastQueue()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    mount(Toaster, {
      props: { queue, to: '#nb-toaster-host' },
      attachTo: document.body,
      global: { stubs: { NbIcon: NbIconStub } },
      slots: {
        toast: `<template #toast="{ toast, dismiss }">
          <article class="custom">{{ toast.message }}<button class="custom-close" @click="dismiss">x</button></article>
        </template>`,
      },
    })

    queue.info('Export ready', { cta: { label: 'Open', action: () => {} } })
    await nextTick()
    trigger.focus()

    // The slot replaces the whole body, so nothing called .nb-toast__close
    // exists. The host queries what is focusable inside its own item wrapper,
    // which is the only contract the slot can be asked to keep.
    pressAltT()
    await nextTick()
    expect(document.activeElement).toBe(find('.custom-close').element)

    pressAltT()
    await nextTick()
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('rolls focus onto the neighbouring toast under the slot too', async () => {
    const queue = createToastQueue()
    mount(Toaster, {
      props: { queue, to: '#nb-toaster-host' },
      attachTo: document.body,
      global: { stubs: { NbIcon: NbIconStub } },
      slots: {
        toast: `<template #toast="{ toast, dismiss }">
          <article class="custom" :data-id="toast.id">{{ toast.message }}<button class="custom-close" @click="dismiss">x</button></article>
        </template>`,
      },
    })

    queue.error('First failure')
    queue.error('Second failure')
    await nextTick()

    const [first, second] = findAll('.custom-close')
    ;(first.element as HTMLElement).focus()
    await first.trigger('click')
    await flush()

    expect(queue.visible.value).toHaveLength(1)
    expect(document.activeElement).toBe(second.element)
  })

  it('does not swallow the hotkey when the slot has nowhere to focus', async () => {
    const queue = createToastQueue()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    mount(Toaster, {
      props: { queue, to: '#nb-toaster-host' },
      attachTo: document.body,
      global: { stubs: { NbIcon: NbIconStub } },
      slots: {
        toast: `<template #toast="{ toast }"><p class="custom">{{ toast.message }}</p></template>`,
      },
    })

    queue.info('Read only')
    await nextTick()
    trigger.focus()

    const event = new KeyboardEvent('keydown', {
      key: '\u2020',
      code: 'KeyT',
      altKey: true,
      cancelable: true,
    })
    document.dispatchEvent(event)
    await nextTick()
    // Nothing to move to, so the key is left to the page rather than being
    // preventDefault'ed into silence.
    expect(event.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('ignores the hotkey when it is turned off', async () => {
    const queue = createToastQueue()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    mountToaster(queue, { hotkey: null })

    queue.info('A new version is available')
    await nextTick()
    trigger.focus()

    pressAltT()
    await nextTick()
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('pauses the whole stack while the pointer is over it', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.success('First')
    queue.success('Second')
    await nextTick()

    await find('.nb-toaster').trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(60_000)
    // The pointer is over one toast; neither of them may expire.
    expect(queue.visible.value).toHaveLength(2)
    expect(find('.nb-toaster').attributes('data-paused')).toBe('true')

    await find('.nb-toaster').trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(NB_TOAST_DURATIONS.success + 10)
    expect(queue.visible.value).toHaveLength(0)
  })

  it('pauses while focus is inside and resumes when it leaves', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.success('Draft saved')
    await nextTick()

    await find('.nb-toaster').trigger('focusin', { relatedTarget: null })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(queue.visible.value).toHaveLength(1)

    await find('.nb-toaster').trigger('focusout', {
      relatedTarget: document.body,
    })
    await vi.advanceTimersByTimeAsync(NB_TOAST_DURATIONS.success + 10)
    expect(queue.visible.value).toHaveLength(0)
  })

  it('keeps the clock held while the tab is hidden', async () => {
    const queue = createToastQueue()
    mountToaster(queue)
    queue.success('Draft saved')
    await nextTick()

    const state = vi.spyOn(document, 'visibilityState', 'get')
    state.mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(queue.visible.value).toHaveLength(1)

    state.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(NB_TOAST_DURATIONS.success + 10)
    expect(queue.visible.value).toHaveLength(0)
    state.mockRestore()
  })

  it('holds the clock when it mounts into a tab that is already hidden', async () => {
    const state = vi.spyOn(document, 'visibilityState', 'get')
    state.mockReturnValue('hidden')

    const queue = createToastQueue()
    mountToaster(queue)
    queue.success('Draft saved')
    await nextTick()

    // No visibilitychange fires for a document that was already hidden when
    // the host mounted (a route restored on reload, a background tab).
    // Listening without reading the state once expires toasts nobody saw,
    // which is the exact failure the hold exists to prevent.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(queue.visible.value).toHaveLength(1)

    state.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(NB_TOAST_DURATIONS.success + 10)
    expect(queue.visible.value).toHaveLength(0)
    state.mockRestore()
  })

  it('follows the queue it is bound to when that queue changes', async () => {
    const first = createToastQueue()
    const second = createToastQueue()
    const bound = shallowRef(first)
    // Rendered through a parent rather than with setProps, because the test
    // utility stores props in a deep `reactive()` and hands the component a
    // proxy of the queue rather than the queue. An application binds a ref.
    const Parent = defineComponent({
      setup: () => () =>
        h(Toaster, { queue: bound.value, to: '#nb-toaster-host' }),
    })
    mount(Parent, {
      attachTo: document.body,
      global: { stubs: { NbIcon: NbIconStub } },
    })

    first.success('From the first queue')
    await nextTick()
    expect(messages()).toEqual(['From the first queue'])

    // Binding :queue to something created after mount (a per-tenant store, a
    // queue behind an async setup) is ordinary. Reading the prop once in
    // setup renders the first queue for ever.
    bound.value = second
    await nextTick()
    second.error('From the second queue')
    await flush()
    expect(messages()).toEqual(['From the second queue'])
    expect(first.visible.value).toHaveLength(1)
  })

  it('gives the cap back to the queue when it unmounts', async () => {
    const queue = createToastQueue({ max: 3 })
    const wrapper = mountToaster(queue, { max: 1 })
    expect(queue.max.value).toBe(1)

    // A demo or a dialog with its own :max must not leave the application's
    // stack capped at one after it goes.
    wrapper.unmount()
    expect(queue.max.value).toBe(3)
  })

  it('leaves the queue cap alone when no max prop is given', async () => {
    // The regression this exists for: a default on the host's `max` prop is
    // written through on mount, so `createToastQueue({ max: 5 })` rendered by
    // a bare host silently showed three and parked two in `pending`. The
    // docs' own i18n snippet is exactly this shape.
    const queue = createToastQueue({ max: 5 })
    mountToaster(queue)

    for (let index = 1; index <= 5; index += 1) {
      queue.error(`Upload ${index} failed`)
    }
    await flush()

    expect(queue.max.value).toBe(5)
    expect(queue.pending.value).toHaveLength(0)
    expect(toasts()).toHaveLength(5)
  })

  it('honours a queue cap smaller than the old host default too', async () => {
    // The other direction, so the assertion above cannot pass by accident on
    // a host that simply stopped capping anything.
    const queue = createToastQueue({ max: 1 })
    mountToaster(queue)

    queue.success('Draft saved')
    queue.success('Second draft saved')
    await flush()

    expect(queue.max.value).toBe(1)
    expect(toasts()).toHaveLength(1)
    expect(queue.pending.value).toHaveLength(1)
  })

  it('still writes the cap through when the prop is given', async () => {
    const queue = createToastQueue({ max: 5 })
    const wrapper = mountToaster(queue, { max: 2 })
    expect(queue.max.value).toBe(2)

    wrapper.unmount()
    expect(queue.max.value).toBe(5)
  })

  it('renders in place, without a teleport, when to is false', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue, { to: false })
    queue.success('Draft saved')
    await flush()

    // The SSR escape hatch: server and client render the same tree in the
    // same place, so there is nothing in `ctx.teleports` for the app to
    // splice in and nothing to mismatch at hydration.
    expect(wrapper.findAll('.nb-toaster__item')).toHaveLength(1)
    expect(host.querySelectorAll('.nb-toaster__item')).toHaveLength(0)
    wrapper.unmount()
  })

  it('warns in development when two hosts share one queue', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const queue = createToastQueue()
    const first = mountToaster(queue)
    expect(warn).not.toHaveBeenCalled()

    const second = mountToaster(queue)
    expect(warn.mock.calls[0][0]).toContain('[NbToaster]')
    expect(warn.mock.calls[0][0]).toContain('twice')

    // And it is a warning, not a refusal: both hosts still render, because
    // the second one may be the only one on screen.
    queue.success('Draft saved')
    await nextTick()
    expect(messages()).toEqual(['Draft saved', 'Draft saved'])

    second.unmount()
    first.unmount()
    warn.mockRestore()
  })

  it('reports an action press as its own dismissal reason', async () => {
    const queue = createToastQueue()
    const onDismiss = vi.fn()
    const action = vi.fn()
    const wrapper = mountToaster(queue)

    queue.info('Comment deleted', { cta: { label: 'Undo', action }, onDismiss })
    await nextTick()

    await find('.nb-toast__cta').trigger('click')
    expect(action).toHaveBeenCalledTimes(1)
    // The whole point of the pattern: 'action' means the reader took it back,
    // every other reason means commit the delete.
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith('action')
  })

  it('dismisses through the toast close button', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.error('Could not reach the server')
    await nextTick()

    await find('.nb-toast__close').trigger('click')
    expect(queue.visible.value).toHaveLength(0)
  })

  it('dismisses the focused toast on Escape and leaves the others alone', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.error('First failure')
    queue.error('Second failure')
    await nextTick()

    // The first close button in the DOM belongs to the newest toast.
    const closeButtons = findAll('.nb-toast__close')
    ;(closeButtons[0].element as HTMLElement).focus()
    await closeButtons[0].trigger('keydown', { key: 'Escape' })

    expect(queue.visible.value.map((r) => r.message)).toEqual(['First failure'])
  })

  it('moves focus to the neighbouring toast when the focused one goes', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.error('First failure')
    queue.error('Second failure')
    await nextTick()

    const closeButtons = findAll('.nb-toast__close')
    ;(closeButtons[0].element as HTMLElement).focus()
    await closeButtons[0].trigger('keydown', { key: 'Escape' })
    await flush()

    // Queried by id, not by position: the dismissed toast is still in the DOM
    // while its leave transition runs, so "the first close button" is the one
    // on its way out.
    const survivor = queue.visible.value[0].id
    expect(document.activeElement).toBe(
      find(`[data-toast-id="${survivor}"] .nb-toast__close`).element,
    )
  })

  it('returns focus to where the user came from when the stack empties', async () => {
    const queue = createToastQueue()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    const wrapper = mountToaster(queue)

    queue.error('Could not reach the server')
    await nextTick()

    trigger.focus()
    const close = find('.nb-toast__close')
    ;(close.element as HTMLElement).focus()
    await close.trigger('keydown', { key: 'Escape' })
    await nextTick()
    await nextTick()

    expect(document.activeElement).toBe(trigger)
  })

  /**
   * The three that a dismiss-time restore cannot cover, and the reason focus
   * is handled by watching the queue instead.
   *
   * Nothing in this group goes through the close button or Escape, and each
   * one is a recipe this component's own page teaches: a sign-out that clears
   * the stack, the `router.afterEach(() => toast.dismissTransient())` guard,
   * and a clock that simply ran out while the user was reading. Every one of
   * them removes the element holding focus. "Focus never falls to <body>" is
   * an absolute claim, so it is pinned three times.
   */
  describe('focus survives a removal the user did not ask for', () => {
    async function withFocusInsideAToast() {
      const queue = createToastQueue()
      const trigger = document.createElement('button')
      document.body.appendChild(trigger)
      const wrapper = mountToaster(queue)

      queue.error('Could not reach the server')
      await nextTick()
      trigger.focus()
      ;(find('.nb-toast__close').element as HTMLElement).focus()
      return { queue, trigger, wrapper }
    }

    it('dismissAll, the sign-out recipe', async () => {
      const { queue, trigger } = await withFocusInsideAToast()

      queue.dismissAll()
      await flush()

      expect(document.activeElement).not.toBe(document.body)
      expect(document.activeElement).toBe(trigger)
    })

    it('dismissTransient, the router guard recipe', async () => {
      const { queue, trigger } = await withFocusInsideAToast()

      queue.dismissTransient()
      await flush()

      expect(document.activeElement).toBe(trigger)
    })

    it('an auto-dismissal whose clock simply ran out', async () => {
      const queue = createToastQueue()
      const trigger = document.createElement('button')
      document.body.appendChild(trigger)
      const wrapper = mountToaster(queue)

      // Success, so it is timed. Errors never expire on their own.
      queue.success('Draft saved')
      await nextTick()
      trigger.focus()
      const close = find('.nb-toast__close')
      ;(close.element as HTMLElement).focus()
      // Focus inside holds the clock, so the queue has to be let go first:
      // the point here is the expiry path, not the pause.
      await find('.nb-toaster').trigger('focusout', {
        relatedTarget: document.body,
      })
      vi.advanceTimersByTime(NB_TOAST_DURATIONS.success + 50)
      await flush()

      expect(queue.visible.value).toHaveLength(0)
      expect(document.activeElement).toBe(trigger)
    })

    it('rolls onto a survivor rather than out of the stack', async () => {
      const queue = createToastQueue()
      const wrapper = mountToaster(queue)

      queue.error('First failure')
      const second = queue.error('Second failure')
      await nextTick()

      const first = queue.visible.value[0].id
      ;(
        find(`[data-toast-id="${first}"] .nb-toast__close`)
          .element as HTMLElement
      ).focus()

      // Removed by the queue, not by the button that has focus.
      queue.dismiss(first, 'programmatic')
      await flush()

      expect(document.activeElement).toBe(
        find(`[data-toast-id="${second.id}"] .nb-toast__close`).element,
      )
    })
  })

  /**
   * `reason` is the only thing separating "Deleted. [Undo]" committing the
   * delete from cancelling it, so a slot that paints its own action button
   * has to be able to say which one happened. Reporting `user` for every
   * slotted dismissal would make the undo contract unusable in exactly the
   * case the slot exists for.
   */
  it('lets a slotted body name the dismissal reason', async () => {
    const queue = createToastQueue()
    const reasons: string[] = []
    const wrapper = mount(Toaster, {
      props: { queue, to: '#nb-toaster-host' },
      attachTo: document.body,
      global: { stubs: { NbIcon: NbIconStub } },
      slots: {
        toast: `
          <button class="own-undo" @click="dismiss('action')">Undo</button>
          <button class="own-close" @click="dismiss()">Close</button>
        `,
      },
    })

    queue.info('Comment deleted', {
      onDismiss: (reason) => reasons.push(reason),
    })
    await nextTick()
    await find('.own-undo').trigger('click')
    await flush()

    queue.info('Comment deleted', {
      onDismiss: (reason) => reasons.push(reason),
    })
    await nextTick()
    await find('.own-close').trigger('click')
    await flush()

    expect(reasons).toEqual(['action', 'user'])
  })

  /**
   * The `action` slot prop is the other half: a body that keeps NbToast's
   * close affordance but renders its own call to action marks the id, so the
   * dismissal that follows reports `action` without being told.
   */
  it('lets a slotted body mark its action without naming a reason', async () => {
    const queue = createToastQueue()
    const reasons: string[] = []
    const wrapper = mount(Toaster, {
      props: { queue, to: '#nb-toaster-host' },
      attachTo: document.body,
      global: { stubs: { NbIcon: NbIconStub } },
      slots: {
        toast: `
          <button class="own-undo" @click="action(); dismiss()">Undo</button>
        `,
      },
    })

    queue.info('Comment deleted', {
      onDismiss: (reason) => reasons.push(reason),
    })
    await nextTick()
    await find('.own-undo').trigger('click')
    await flush()

    expect(reasons).toEqual(['action'])
  })

  it('takes its visible cap from the max prop', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue, { max: 1 })

    queue.error('First failure')
    queue.error('Second failure')
    await nextTick()

    expect(toasts()).toHaveLength(1)
  })

  /**
   * Where the newest toast lands.
   *
   * The page promises that the arriving message appears in the same place
   * every time, which only holds if the newest toast is the one against the
   * anchored edge for every placement, not just the bottom three. An earlier
   * revision reversed the flow for the bottom anchors only, so under
   * `top-end` the newest toast landed one row further from the edge on every
   * push and the promise was false for half the values of the prop.
   */
  it.each([
    'top-start',
    'top',
    'top-end',
    'bottom-start',
    'bottom',
    'bottom-end',
  ])('renders the newest toast first under %s', async (placement) => {
    const queue = createToastQueue()
    mountToaster(queue, { placement })

    queue.info('First')
    queue.info('Second')
    queue.info('Third')
    await nextTick()

    expect(messages()).toEqual(['Third', 'Second', 'First'])
  })

  it('lays the stack out from the edge it is anchored to', () => {
    const source = readFileSync(
      join(__dirname, '../src/components/Toaster.vue'),
      'utf8',
    )
    const styles = source.slice(source.indexOf('<style'))
    const block = (selector: string) => {
      const start = styles.indexOf(selector)
      expect(start, selector).toBeGreaterThan(-1)
      return styles.slice(start, styles.indexOf('\n}', start))
    }

    // Newest first in the DOM plus a plain column puts it against the top
    // edge; newest first plus column-reverse puts it against the bottom edge.
    // Both halves are needed, and neither is asserted by the DOM-order test
    // above, because jsdom does not lay anything out.
    expect(block('.nb-toaster--top-end {')).toContain('flex-direction: column;')
    expect(block('.nb-toaster--bottom-end {')).toContain(
      'flex-direction: column-reverse;',
    )
  })

  it('stands down on the hotkey while a modal dialog is open', async () => {
    const queue = createToastQueue()
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    const inside = document.createElement('button')
    dialog.appendChild(inside)
    document.body.appendChild(dialog)
    mountToaster(queue)

    queue.error('Could not save the settings')
    await nextTick()
    inside.focus()

    // Moving focus out of a modal surface would either be undone by the
    // dialog's own focus management or leave the reader outside a surface
    // that declared everything else inert. The toast has already been
    // announced by the live region, which reaches inside the dialog.
    pressAltT()
    await nextTick()
    expect(document.activeElement).toBe(inside)

    dialog.remove()
    // With the dialog gone, the same two keystrokes reach the same toast.
    inside.remove()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    pressAltT()
    await nextTick()
    expect(document.activeElement).toBe(find('.nb-toast__close').element)
    trigger.remove()
  })

  it('leaves a clock the application paused deliberately alone', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.success('Draft saved')
    await nextTick()
    // The application stops the clock itself: an import is running, a video is
    // playing, the window lost focus in a way the host cannot see.
    queue.pause()

    await find('.nb-toaster').trigger('mouseenter')
    await find('.nb-toaster').trigger('mouseleave')
    expect(queue.paused.value).toBe(true)

    wrapper.unmount()
    expect(queue.paused.value).toBe(true)
    await vi.advanceTimersByTimeAsync(NB_TOAST_DURATIONS.success + 10)
    expect(queue.visible.value).toHaveLength(1)
  })

  it('renders an app-provided queue with no queue prop at all', async () => {
    const scoped = createToastQueue()
    const wrapper = mount(Toaster, {
      props: { to: '#nb-toaster-host' },
      attachTo: document.body,
      global: {
        stubs: { NbIcon: NbIconStub },
        provide: { [NB_TOAST_QUEUE_KEY as symbol]: scoped },
      },
    })

    scoped.success('Draft saved')
    useToast().success('From the shared queue')
    await nextTick()

    expect(messages()).toEqual(['Draft saved'])
    wrapper.unmount()
  })

  it('releases the clock when it unmounts mid-hover', async () => {
    const queue = createToastQueue()
    const wrapper = mountToaster(queue)

    queue.success('Draft saved')
    await nextTick()
    await find('.nb-toaster').trigger('mouseenter')
    wrapper.unmount()

    await vi.advanceTimersByTimeAsync(NB_TOAST_DURATIONS.success + 10)
    expect(queue.visible.value).toHaveLength(0)
  })
})

describe('NbToaster stacking context', () => {
  // One of the three hand-built hosts referenced var(--nb-z-toast), a name
  // that does not exist, and shipped for months painting under the modal it
  // was raised from. The fallback is silent, so the guard has to be a test.
  const source = readFileSync(
    join(__dirname, '../src/components/Toaster.vue'),
    'utf8',
  )
  const tokens = readFileSync(
    join(__dirname, '../src/styles/variables/_layout.scss'),
    'utf8',
  )

  it('uses the z-index token that actually exists', () => {
    expect(source).toContain('z-index: var(--nb-zindex-toast)')
    expect(source).not.toContain('--nb-z-toast:')
    expect(tokens).toMatch(/\n\s*toast:/)
  })
})

describe('token discipline', () => {
  /**
   * The earlier version of this test read only Toaster.vue, which had nothing
   * to violate, while the component actually painted on screen carried
   * `border-radius: 10px`, a fixed `rgba(0, 0, 0, 0.1)` shadow that reads as
   * a smudge on the dark theme, and four hardcoded hex fallbacks. A guarantee
   * that only inspects the file that already complies is not a guarantee, so
   * both files are covered here.
   */
  const files = ['Toaster.vue', 'Toast.vue']

  it.each(files)('%s names no colour outside the token system', (file) => {
    const src = readFileSync(join(__dirname, '../src/components', file), 'utf8')
    const styles = src.slice(src.indexOf('<style'))
    expect(styles).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(styles).not.toMatch(/rgba?\(/i)
  })

  /**
   * Design tokens are read without a fallback; the component's own override
   * knobs are read with one.
   *
   * `var(--nb-c-success, #4acf7b)` is a second, unthemed colour that nobody
   * ever sees fail: the fallback only appears when the token is missing,
   * which is exactly when someone needed to be told. `--nb-toaster-inset` is
   * the opposite case. It is written by the application, not by the theme, and
   * the fallback is where its default lives, because declaring the default on
   * `.nb-toaster` would shadow anything set further up the tree and leave the
   * consumer reaching for `:deep()`. So the ban stands for every name except
   * the documented knobs, and each of those must fall back to a real token.
   */
  const KNOBS = [
    '--nb-toaster-inset',
    '--nb-toaster-inset-sm',
    '--nb-toaster-gap',
    '--nb-toaster-max-width',
  ]

  it.each(files)('%s takes no design token with a fallback value', (file) => {
    const src = readFileSync(join(__dirname, '../src/components', file), 'utf8')
    const styles = src.slice(src.indexOf('<style'))
    const withFallback = [
      ...styles.matchAll(/var\((--nb-[a-z0-9-]+)\s*,/gi),
    ].map((match) => match[1])
    expect(withFallback.filter((name) => !KNOBS.includes(name))).toEqual([])
  })

  it('gives every public knob a token default', () => {
    const src = readFileSync(
      join(__dirname, '../src/components/Toaster.vue'),
      'utf8',
    )
    const styles = src.slice(src.indexOf('<style'))
    for (const knob of KNOBS) {
      const uses = [
        ...styles.matchAll(
          new RegExp(`var\\(${knob}\\s*,\\s*([^)]+\\)?)`, 'g'),
        ),
      ].map((match) => match[1].trim().replace(/\)$/, ''))
      expect(uses.length, knob).toBeGreaterThan(0)
      for (const value of uses) {
        // A length is only acceptable where no token expresses it: the
        // toast's own maximum width is one of those.
        expect(value, `${knob}: ${value}`).toMatch(/var\(--nb-|rem$/)
      }
      // And the knob is never declared on the host, which would shadow it.
      expect(styles, knob).not.toMatch(new RegExp(`^\\s*${knob}:`, 'm'))
    }
  })

  it('Toast.vue reads its spacing, radius and type from tokens', () => {
    const src = readFileSync(
      join(__dirname, '../src/components/Toast.vue'),
      'utf8',
    )
    const styles = src.slice(src.indexOf('<style'))
    for (const property of [
      'gap',
      'padding',
      'border-radius',
      'font-size',
      'font-weight',
      'line-height',
    ]) {
      const declarations = [
        ...styles.matchAll(
          new RegExp(`(?<![a-z-])${property}:\\s*([^;]+);`, 'g'),
        ),
      ].map((match) => match[1])
      expect(declarations.length).toBeGreaterThan(0)
      for (const value of declarations) {
        // Zero and `inherit` name no value, so there is nothing to tokenise.
        expect(value.trim(), `${property}: ${value}`).toMatch(
          /var\(--nb-|^0$|inherit/,
        )
      }
    }
  })

  /**
   * Windows high contrast throws away every author colour and every box
   * shadow. A toast is a floating surface made of exactly those two things
   * plus a 3px accent rule, so with no answer here the stack loses both its
   * boundary and its only non-text severity cue: three toasts read as one
   * undivided block painted over the page.
   */
  it.each(files)('%s answers forced colours', (file) => {
    const src = readFileSync(join(__dirname, '../src/components', file), 'utf8')
    const styles = src.slice(src.indexOf('<style'))
    expect(styles).toMatch(/@media \(forced-colors: active\)/)
    // System keywords, not author colours: those are discarded.
    expect(styles).toMatch(/Canvas|CanvasText|Highlight/)
  })

  /**
   * The host anchors the stack with `inset-inline-start` / `inset-inline-end`
   * so an Arabic build flips to the other edge. A physical `border-left` on
   * the accent would then draw the rule on the far side of the toast from the
   * edge it marks, which is the RTL bug the logical placement exists to
   * avoid.
   */
  it('places the variant accent logically, not on the left', () => {
    const src = readFileSync(
      join(__dirname, '../src/components/Toast.vue'),
      'utf8',
    )
    const styles = src.slice(src.indexOf('<style'))
    expect(styles).not.toMatch(/border-left\s*:/)
    expect([...styles.matchAll(/border-inline-start:\s*3px/g)]).toHaveLength(4)
  })

  it('wraps long unbroken content instead of clipping it', () => {
    const src = readFileSync(
      join(__dirname, '../src/components/Toast.vue'),
      'utf8',
    )
    // A pasted id or URL has nowhere to break, and the toast clips its
    // overflow, so without this it simply disappears under the close button.
    expect(src).toContain('overflow-wrap: anywhere')
    expect(src).toContain('max-width: min(')
  })
})

describe('delivery', () => {
  /**
   * The reason this component exists is that three applications hand-built a
   * host. It only stops being their problem when they can import it, and the
   * two lists that make that true are the package entry and the map the
   * plugin installs. Both usages the documentation teaches are asserted here:
   * `import { useToast } from '@nubisco/ui'` and `<NbToaster />`.
   *
   * Read as text rather than imported, the way component-registration.test.ts
   * does: src/main.ts pulls in `virtual:icons`, which exists only under the
   * library's own vite config.
   */
  const main = readFileSync(join(__dirname, '../src/main.ts'), 'utf8')
  const registry = readFileSync(
    join(__dirname, '../src/components/index.ts'),
    'utf8',
  )

  it('exports the host from the package entry', () => {
    expect(main).toMatch(
      /export \{ default as NbToaster \} from '\.\/components\/Toaster\.vue'/,
    )
  })

  it('registers the host with the plugin, so <NbToaster /> resolves', () => {
    expect(registry).toContain("import NbToaster from './Toaster.vue'")
    expect(registry).toMatch(/^\s{2}NbToaster,\s*$/m)
  })

  it.each([
    'useToast',
    'createToastQueue',
    'resetToastQueue',
    'NB_TOAST_DURATIONS',
    'NB_TOAST_STATUS_LABELS',
  ])('exports %s from the package entry', (name) => {
    expect(main).toMatch(
      new RegExp(
        `export \\{[^}]*\\b${name}\\b[^}]*\\}\\s*from '\\./composables/useToast\\.composable'`,
        's',
      ),
    )
  })

  it.each([
    'IToastQueue',
    'IToastOptions',
    'IToastHandle',
    'IToastRecord',
    'IToastLabels',
    'TToastDismissReason',
    'TToastPatch',
  ])('exports the %s type from the package entry', (name) => {
    expect(main).toMatch(
      new RegExp(
        `export type \\{[^}]*\\b${name}\\b[^}]*\\}\\s*from '\\./composables/useToast\\.composable'`,
        's',
      ),
    )
  })

  it('exports the placement type with the host', () => {
    expect(main).toMatch(
      /export type \{[^}]*TToasterPlacement[^}]*\} from '\.\/components\/Toaster\.vue'/s,
    )
  })
})

/**
 * The audit's root cause was not that the host was missing. It was that the
 * page three teams read told them to build one, and nothing pointed anywhere
 * else. A component nobody can find is the same defect with a different
 * shape, so the pages are asserted like code: every public member documented,
 * every knob named, and no claim left standing that the source contradicts.
 */
describe('documentation', () => {
  const root = join(__dirname, '..')
  const page = readFileSync(join(root, 'docs/ui/components/toaster.md'), 'utf8')
  const composablePage = readFileSync(
    join(root, 'docs/ui/composables/use-toast.md'),
    'utf8',
  )
  const source = readFileSync(
    join(root, 'src/composables/useToast.composable.ts'),
    'utf8',
  )
  const host = readFileSync(join(root, 'src/components/Toaster.vue'), 'utf8')

  /** Every method declared on IToastQueue, read from the interface itself. */
  const members = [
    ...source
      .slice(
        source.indexOf('export interface IToastQueue'),
        source.indexOf('export const NB_TOAST_DURATIONS'),
      )
      .matchAll(/^\s{2}(?:readonly )?([a-z][A-Za-z]*)[(:]/gm),
  ].map((match) => match[1])

  it('finds something to document', () => {
    expect(members).toContain('dismissTransient')
    expect(members.length).toBeGreaterThan(12)
  })

  it.each([...new Set(members)])('documents queue.%s', (member) => {
    expect(page + composablePage).toContain(member)
  })

  it('documents every override knob the host reads, and no others', () => {
    const used = new Set(
      [...host.matchAll(/var\((--nb-toaster-[a-z-]+)\s*,/g)].map(
        (match) => match[1],
      ),
    )
    expect(used.size).toBeGreaterThan(0)
    for (const knob of used) expect(page, knob).toContain(knob)
    // And the page invents none: a documented knob the host never reads is a
    // consumer writing CSS that silently does nothing.
    for (const knob of [...page.matchAll(/--nb-toaster-[a-z-]+/g)]) {
      expect([...used, '--nb-toaster-shift']).toContain(knob[0])
    }
  })

  it('does not promise a hotkey the source does not honour', () => {
    // The announcement names a key, so the claim and the matcher have to
    // agree. They did not: the hint said Alt plus T while the matcher tested
    // event.key, which never produces 't' on macOS.
    expect(host).toContain('event.code !== code')
    expect(host).toContain("hotkeyHint: 'Press Alt plus T to reach it.'")
    expect(page).toContain('KeyT')
  })

  it('tells migrating teams what did change in NbToast', () => {
    // The severity word is rendered into every bare NbToast, so it changes
    // the accessible text and wrapper.text() of every existing usage.
    const toast = readFileSync(join(root, 'src/components/Toast.vue'), 'utf8')
    expect(toast).toContain('nb-toast__status')
    expect(page).not.toContain(
      'Nothing about `NbToast` changed in a breaking way',
    )
    expect(page).toContain('status-label=""')
  })

  /**
   * Five claims a blind read of this page found to be false against the
   * source. Each one is now pinned to the mechanism that has to keep it true.
   */
  it('does not promise an ordering the placement rules do not deliver', () => {
    expect(page).not.toContain(
      'The newest toast always lands nearest the anchored edge',
    )
    // Both halves of the mechanism, named on the page and present in the host.
    expect(host).toContain('[...visible.value].reverse()')
    expect(page).toContain('rendered newest first')
  })

  it('states that onDismiss is not patchable', () => {
    expect(source).toContain("Omit<Partial<IToastOptions>, 'onDismiss'>")
    expect(page).toContain("Omit<Partial<IToastOptions>, 'onDismiss'>")
    // And the key path says what happens to the callback it displaces.
    expect(source).toContain("fire(previous, 'replaced')")
    expect(page).toContain('ends first, with reason `replaced`')
  })

  it('does not present role="none" as something an AT acts on', () => {
    const a11y = page.slice(page.indexOf('name="Accessibility"'))
    expect(a11y).toContain('presentational-role conflict resolution')
    expect(a11y).not.toContain('rendered with `role="none"` and')
  })

  it('does not sell the shared reset as request isolation', () => {
    expect(page).not.toContain(
      'a queue cannot outlive the request that filled it',
    )
    expect(page).toContain('NB_TOAST_QUEUE_KEY')
    expect(source).toContain('NB_TOAST_QUEUE_KEY')
  })

  it('answers the modal collision with more than a z-index', () => {
    expect(host).toContain('[aria-modal="true"]')
    expect(page).toContain('[aria-modal="true"]')
  })

  it('states what a route change does to a toast', () => {
    expect(page).toContain('dismissTransient()')
    expect(page).toContain('retain: true')
  })

  it('does not present global spacing tokens as toaster knobs', () => {
    const tokens = page.slice(page.indexOf('## Tokens'))
    const knobTable = tokens.slice(tokens.indexOf('**Knobs you set.**'))
    // Overriding --nb-spacing-24 to move the stack moves the whole product.
    expect(knobTable).not.toContain('| `--nb-spacing-24`')
    expect(tokens).toContain('moving them moves everything')
  })
})

/**
 * Round one of this component shipped a documented symbol the package did not
 * export, it was fixed by hand, and the next revision shipped the same defect
 * again with a different symbol: `NB_TOAST_QUEUE_KEY`, named by both pages as
 * the answer to server-side request isolation and re-exported by neither
 * entry line. A reader who copies the snippet gets a build error on the one
 * hazard the documentation correctly identifies.
 *
 * A one-line export does not stop that recurring, so the rule is asserted
 * instead of the symbol. Every identifier a reader can copy out of a fenced
 * example on these two pages, that is shaped like this library's public API
 * and is not bound inside the example itself, has to be re-exported from
 * `src/main.ts`. Adding an example that names something unexported now fails
 * here rather than in a consumer's build.
 */
describe('delivery: every documented identifier is importable', () => {
  const root = join(__dirname, '..')
  // Read as text, not imported: src/main.ts pulls in `virtual:icons`, which
  // only resolves under the library's own vite config.
  const main = readFileSync(join(root, 'src/main.ts'), 'utf8')

  /** Every name `@nubisco/ui` hands out, values and types alike. */
  const exported = new Set<string>()
  for (const block of main.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/gs)) {
    for (const entry of block[1].split(',')) {
      const name = entry
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim()
      if (name) exported.add(name)
    }
  }
  for (const declaration of main.matchAll(
    /export\s+(?:declare\s+)?(?:const|function|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    exported.add(declaration[1])
  }

  it('reads a real export list out of the entry', () => {
    expect(exported.has('NbToaster')).toBe(true)
    expect(exported.has('useToast')).toBe(true)
    expect(exported.size).toBeGreaterThan(50)
  })

  /**
   * The house naming conventions, which are what makes an unqualified
   * identifier in an example look like something you import from us: `Nb`
   * components, `NB_` constants, `use`/`create`/`reset` entry points, and the
   * `I`/`T` type prefixes.
   */
  const LIBRARY_SHAPE =
    /^(Nb[A-Z][A-Za-z0-9]*|NB_[A-Z0-9_]+|(?:use|create|reset)[A-Z][A-Za-z0-9]*|I[A-Z][A-Za-z0-9]*|T[A-Z][A-Za-z0-9]*)$/

  interface IUse {
    page: string
    fence: number
    name: string
  }

  /**
   * Names an example binds for itself: anything it imports from somewhere
   * that is not this package (Vue, a route file, a local demo component) and
   * anything it declares. Those are the reader's own code, not ours, so they
   * are not claims about the package. Imports from `@nubisco/ui` stay in,
   * because those are exactly the claims.
   */
  function localBindings(code: string): Set<string> {
    const local = new Set<string>()
    for (const statement of code.matchAll(
      /import\s+([^;]+?)\s+from\s+'([^']+)'/g,
    )) {
      if (statement[2] === '@nubisco/ui') continue
      for (const name of statement[1].matchAll(/[A-Za-z_$][\w$]*/g)) {
        local.add(name[0])
      }
    }
    for (const declaration of code.matchAll(
      /(?:const|let|var|function|class|interface|type)\s+([A-Za-z_$][\w$]*)/g,
    )) {
      local.add(declaration[1])
    }
    return local
  }

  const uses: IUse[] = []
  for (const page of [
    'docs/ui/components/toaster.md',
    'docs/ui/composables/use-toast.md',
  ]) {
    const text = readFileSync(join(root, page), 'utf8')
    const fences = [...text.matchAll(/```(ts|js|vue)\n([\s\S]*?)```/g)]
    fences.forEach((fence, index) => {
      const code = fence[2]
      const local = localBindings(code)
      // `type` and `from` in an import clause are keywords, not references.
      const referenced = new Set(
        [...code.matchAll(/\b[A-Za-z_$][\w$]*\b/g)].map((match) => match[0]),
      )
      for (const name of referenced) {
        if (local.has(name)) continue
        if (!LIBRARY_SHAPE.test(name)) continue
        uses.push({ page, fence: index, name })
      }
    })
  }

  it('finds identifiers to check, in both pages', () => {
    expect(uses.length).toBeGreaterThan(8)
    expect(new Set(uses.map((use) => use.page)).size).toBe(2)
    // The symbol that recurred, still named by an example on both pages.
    expect(
      uses.filter((use) => use.name === 'NB_TOAST_QUEUE_KEY'),
    ).toHaveLength(2)
  })

  /**
   * The entry is read as text, so a re-export line naming something the
   * composable does not actually export would still read as "exported". The
   * two halves are joined here against the real module: every value name
   * `src/main.ts` claims from `useToast.composable` has to be on it.
   */
  it('re-exports only value names the composable really has', async () => {
    const composable = await import('../src/composables/useToast.composable')
    const block = main.match(
      /export \{([^}]*)\} from '\.\/composables\/useToast\.composable'/,
    )
    expect(block).not.toBeNull()
    const names = block![1]
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
    expect(names).toContain('NB_TOAST_QUEUE_KEY')
    for (const name of names) {
      expect(Object.keys(composable), name).toContain(name)
    }
  })

  it.each([...new Set(uses.map((use) => use.name))].sort())(
    'the docs example naming %s can import it from @nubisco/ui',
    (name) => {
      expect(exported, `${name} is used in a docs example`).toContain(name)
    },
  )
})
