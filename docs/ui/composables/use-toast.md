---
layout: nubisco
title: useToast
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`useToast()` is how any code in the application raises a toast: a component, a store, a route guard, an HTTP interceptor. It returns the shared queue, created on first call, so nothing has to be passed down and no plugin has to be installed.

The queue is only half of it. [`NbToaster`](/ui/components/toaster) renders it, once, at the root of the application. Without a host mounted, `useToast()` still queues records and nothing is ever shown.

```ts
import { useToast } from '@nubisco/ui'

const toast = useToast()

toast.success('Draft saved')
toast.error('Could not reach the server', { title: 'Save failed' })
```

## Why the queue is a separate thing from the toast

`NbToast` knows how one message looks. `NbToaster` knows where the stack sits and how it moves. This file knows _when_ a message leaves, and that has to be one shared decision rather than a timer per item: while the pointer rests on the top toast, the two below it must stop counting down as well, and an item that owns its own timer cannot know that.

Three applications in the 12-app audit hand-rolled this, and each lost a different part of it. One had no auto-dismiss at all, so successes accumulated for the life of the route.

## A handle, not just a push

`push()` and its shorthands return a handle, so the caller can keep talking about the toast it created. This is what turns two toasts for one operation ("Saving...", then "Saved") into one toast that becomes its own result.

```ts
const saving = toast.info('Saving changes...', { duration: 0 })

try {
  await save()
  saving.update({ variant: 'success', message: 'Changes saved' })
} catch (error) {
  saving.update({ variant: 'error', message: 'Could not save changes' })
}
```

The toast keeps its slot and its place in the stack, so nothing jumps. The countdown restarts, because the words changed and the reader has not seen the new ones yet. Passing a `variant` with no `duration` adopts that variant's default, which is what makes the success clear itself while the error stays.

## Knowing when a toast is over

`onDismiss` fires exactly once per pushed message, with the reason it ended. The reason is the whole mechanism behind an undoable action: one value commits the delete, another cancels it.

```ts
let undone = false

toast.push({
  message: 'Comment deleted',
  cta: {
    label: 'Undo',
    action: () => {
      undone = true
      restore(comment)
    },
  },
  onDismiss: () => {
    if (!undone) commitDelete(comment)
  },
})
```

A toast with an action never auto-dismisses unless you give it a duration: an action that removes itself while it is being reached for is not an action, and the only route to it for a keyboard user is to travel there.

The callback is fixed at `push()`. `TToastPatch` is `Omit<Partial<IToastOptions>, 'onDismiss'>`, so `update()` rewrites the words of the message it was given and never the commit point: swapping it halfway is how a queue ends up dropping one commit or running another twice.

## Bursts, and the same news twice

Give a toast a `key` and pushing it again takes over the toast on screen instead of adding a second. A double-clicked Save produces one "Saved", not two.

```ts
toast.push({ key: 'autosave', variant: 'success', message: 'Draft saved' })
```

The second push replaces the message rather than merging into it: only the id, the slot and the position survive, so a field the new call leaves out goes back to its default instead of lingering from the previous one. And because the displaced message may be holding an optimistic delete, its `onDismiss` runs first, with reason `'replaced'`. Deleting two rows quickly under one key therefore commits row 1 and then row 2, in that order. Pushing the same callback under the same key twice displaces nothing, so an autosave firing twice does not commit twice.

## Route changes

The queue outlives the route, which is usually wrong: "Draft saved" two pages later is news about a screen the user has left, and its `Undo` acts on a record they can no longer see. Nothing here knows about a router, and it must not, so the queue provides the operation and your application says when.

```ts
router.afterEach(() => toast.dismissTransient())
```

Mark the exceptions with `retain: true`: news that is true wherever the user ends up ("Export ready", "Connection restored"). `dismissAll()` clears those too, and is what sign-out wants.

That includes anything raised _during_ the navigation. `afterEach` fires after the guard that redirected, so a `toast.error('Your session expired')` pushed in `beforeEach` is cleared with reason `'navigated'` before it is ever painted. Guard toasts need `retain: true`. This is the single most common way the recipe above goes wrong, and it is written up at length on the [NbToaster page](/ui/components/toaster#a-toast-and-the-route-it-came-from).

## Your own queue

`createToastQueue(options)` builds an isolated queue with its own cap, durations and labels. Use it for anything that is not the application's own stack.

```ts
import { createToastQueue } from '@nubisco/ui'

// A Spanish-market product states its strings once, not per call.
export const toast = createToastQueue({
  max: 2,
  statusLabels: {
    success: 'Correcto',
    error: 'Error',
    warning: 'Aviso',
    info: 'Informacion',
  },
  closeLabel: 'Cerrar',
})
```

```vue
<template>
  <NbToaster :queue="toast" label="Notificaciones" />
</template>
```

The host has no `max` prop here on purpose, and that is what makes the cap of two hold: `max` on `NbToaster` has no default, so an absent prop writes nothing to the queue. Pass `:max` only when the host, not the queue, is the thing that knows the right number.

Two hosts rendering the _same_ queue is the mistake to avoid: every record renders and is announced twice. A demo, a dialog or a test that needs its own host gives it its own queue.

## Testing

A queue is plain reactive state, so it can be asserted without mounting anything.

```ts
import { createToastQueue } from '@nubisco/ui'

it('tells the user the save failed', async () => {
  const toast = createToastQueue()
  await save({ toast }, brokenPayload)

  expect(toast.visible.value).toHaveLength(1)
  expect(toast.visible.value[0].variant).toBe('error')
  // Errors are persistent by default, so there is nothing to advance.
  expect(toast.remaining(toast.visible.value[0].id)).toBe(0)
})
```

If your code reaches for the shared `useToast()` rather than an injected queue, call `resetToastQueue()` in `afterEach`. The shared queue is a module singleton, so one test's toast is otherwise still there in the next.

Server rendering needs the same call for the same reason: a singleton filled during one request would otherwise be handed to the next.

</doc-tab>

<doc-tab name="Api">

## `useToast(): IToastQueue`

Called from a component, returns an app-scoped queue provided under `NB_TOAST_QUEUE_KEY` if there is one. Otherwise returns the shared queue, creating it on first call, which is also what a store action or a router guard gets: there is no component instance to inject into there, which is why the singleton stays the default.

## `NB_TOAST_QUEUE_KEY`

An `InjectionKey<IToastQueue>` for scoping a queue to one application instance.

```ts
// entry-server.ts
import { createSSRApp } from 'vue'
import { createToastQueue, NB_TOAST_QUEUE_KEY } from '@nubisco/ui'
import App from './App.vue'

export function render() {
  const app = createSSRApp(App)
  app.provide(NB_TOAST_QUEUE_KEY, createToastQueue())
  return app
}
```

`<NbToaster />` renders it with no `:queue` prop. Two reasons to reach for it: server rendering, where one Node process serves several requests at once and a module-level singleton is shared by all of them, and a page that mounts several Vue apps and does not want one app's toasts announced by another's toaster.

A queue per request is not the whole SSR story, and the missing half bites at hydration rather than at render: the host teleports to `body`, and `<Teleport>` buffers into `ctx.teleports` on the server instead of rendering into its target. Either write `ctx.teleports.body` into your HTML template, or pass `:to="false"` and put the host at the app root. The [NbToaster page](/ui/components/toaster) has both, with the positioning caveat that comes with the second.

## `createToastQueue(options?): IToastQueue`

Builds an isolated queue.

| Option         | Type                                     | Default                  | Description                                         |
| -------------- | ---------------------------------------- | ------------------------ | --------------------------------------------------- |
| `max`          | `number`                                 | `3`                      | Visible slots. Extras wait their turn.              |
| `durations`    | `Partial<Record<TToastVariant, number>>` | `NB_TOAST_DURATIONS`     | Per-variant duration overrides.                     |
| `statusLabels` | `Partial<Record<TToastVariant, string>>` | `NB_TOAST_STATUS_LABELS` | The visually hidden severity words.                 |
| `closeLabel`   | `string`                                 | `'Close'`                | Accessible name of every close button in the queue. |

## `resetToastQueue(): void`

Clears and drops the shared queue. For tests, so one spec cannot leave a toast behind for the next, and for a single-render script that wants the module back in its initial state.

It is not request isolation, and this page will not sell it as such: a global reset between awaits would empty a queue a concurrent request is still filling. Use `NB_TOAST_QUEUE_KEY` for that.

## `IToastQueue`

| Member                    | Type                                    | Description                                                                              |
| ------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `push(options)`           | `IToastOptions => IToastHandle`         | Queue a toast.                                                                           |
| `info(message, options?)` | `=> IToastHandle`                       | Shorthand for `push({ ...options, message, variant: 'info' })`.                          |
| `success(message, opts?)` | `=> IToastHandle`                       | Shorthand for `variant: 'success'`.                                                      |
| `warning(message, opts?)` | `=> IToastHandle`                       | Shorthand for `variant: 'warning'`.                                                      |
| `error(message, opts?)`   | `=> IToastHandle`                       | Shorthand for `variant: 'error'`. Persistent by default.                                 |
| `update(id, patch)`       | `(string, TToastPatch) => void`         | Rewrite a live toast, field by field. No-op once it has gone. Cannot change `onDismiss`. |
| `dismiss(id, reason?)`    | `(string, TToastDismissReason) => void` | Remove one and admit the next pending toast. Defaults to `'user'`.                       |
| `dismissTransient(r?)`    | `(TToastDismissReason) => void`         | Clear everything without `retain`. Defaults to `'navigated'`. For a router guard.        |
| `dismissAll(reason?)`     | `(TToastDismissReason) => void`         | Clear everything, retained toasts included. Defaults to `'cleared'`.                     |
| `pause()` / `resume()`    | `() => void`                            | Hold and release every countdown. `NbToaster` calls these for you.                       |
| `remaining(id)`           | `(string) => number`                    | Milliseconds left. `0` for a persistent toast.                                           |
| `visible` / `pending`     | `ComputedRef<IToastRecord[]>`           | What is on screen, and what is waiting for a slot.                                       |
| `items`                   | `ComputedRef<IToastRecord[]>`           | Both, in queue order.                                                                    |
| `paused`                  | `Ref<boolean>`                          | Whether the clock is currently held.                                                     |
| `max`                     | `Ref<number>`                           | Visible-slot cap. `NbToaster` writes its `max` prop here and restores it on unmount.     |
| `labels`                  | `IToastLabels`                          | The severity words and close label this queue was built with.                            |

## `IToastOptions`

| Field       | Type                                          | Default    | Description                                                                                                                            |
| ----------- | --------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `message`   | `string`                                      | none       | **Required.** The news, in one sentence, in the past tense.                                                                            |
| `variant`   | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'`   | Tone, icon, politeness and default duration.                                                                                           |
| `title`     | `string`                                      | none       | Optional heading above the message.                                                                                                    |
| `duration`  | `number`                                      | by variant | Milliseconds. `0` never auto-dismisses.                                                                                                |
| `cta`       | `{ label: string; action: () => void }`       | none       | One action. Taking it dismisses the toast, reason `'action'`. Implies `duration: 0`.                                                   |
| `key`       | `string`                                      | none       | Repeats sharing a key take over the live toast's slot instead of stacking. The displaced message ends first, with reason `'replaced'`. |
| `retain`    | `boolean`                                     | `false`    | Survives `dismissTransient()`, so a route change does not clear it.                                                                    |
| `onDismiss` | `(reason: TToastDismissReason) => void`       | none       | Called once, when the toast leaves the queue. Set at `push()`: the one field `update()` cannot patch.                                  |

## `IToastHandle`

| Member             | Description                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`               | The record id.                                                                                                                                                           |
| `update(patch)`    | Rewrite in place, keeping the slot. Restarts the countdown. A new `variant` adopts its default duration unless `duration` is given. `onDismiss` is not in `TToastPatch`. |
| `dismiss(reason?)` | Remove it now, defaulting to `'user'`. Safe to call twice: `onDismiss` still fires exactly once.                                                                         |
| `isActive()`       | `false` once it has been dismissed or has expired.                                                                                                                       |

## `TToastDismissReason`

| Reason        | Means                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| `'user'`      | The close button, or Escape while the toast held focus.                                |
| `'timeout'`   | The countdown ran out.                                                                 |
| `'action'`    | The reader took the toast's own action, or a `#toast` slot called `dismiss('action')`. |
| `'replaced'`  | The queue retired it to admit a newer message.                                         |
| `'navigated'` | `dismissTransient()`, usually from a router guard.                                     |
| `'cleared'`   | `dismissAll()`.                                                                        |

## `NB_TOAST_DURATIONS`

`{ success: 4000, info: 6000, warning: 8000, error: 0 }`. Reading time, not importance. An error stays until it is dismissed, because "it failed" is the start of a task.

## `NB_TOAST_STATUS_LABELS`

`{ success: 'Success', error: 'Error', warning: 'Warning', info: 'Information' }`. The visually hidden word a screen reader hears before the message. Override them per queue rather than per toast.

Placement, the cap, the hotkey, the announcer and the override knobs belong to the host: see [`NbToaster`](/ui/components/toaster).

</doc-tab>
