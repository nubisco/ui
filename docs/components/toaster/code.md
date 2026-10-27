---
layout: nubisco
title: Toaster
intro: '`NbToaster` is the host: one region, mounted once, that renders the shared toast queue. `useToast()` is how everything else talks to it. Between them they own the parts of a notification that are not about how one message looks: where the stack sits, how many are on screen, when each one leaves, what pauses the clock, what is announced and what happens to focus when a message the user was reading disappears.'
source: src/components/Toaster.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Anatomy

```
  region  role="region", named, fixed to one viewport edge, click-through
  └── stack        newest nearest the anchored edge, capped at max
      └── item     one queue record
          ├── icon           variant
          ├── severity word  visually hidden, read first
          ├── title          optional
          ├── message        required
          ├── action         optional, at most one
          ├── close          always present, labelled
          └── countdown      hairline, only when the toast expires
  announcer  two live regions, mounted empty for the life of the host
```

The announcer is not part of the stack and never moves. It exists so that the region a screen reader is watching is older than the message written into it.

## Mounting it

One `NbToaster` per application, at the root, outside the router view so it survives navigation. It teleports to `<body>`, so it does not matter where in the tree you put it.

```vue
<!-- App.vue -->
<script setup lang="ts">
import { NbToaster } from '@nubisco/ui'
</script>

<template>
  <RouterView />
  <NbToaster />
</template>
```

`NbToaster` is also registered globally by the `NubiscoUI` plugin, so `<NbToaster />` works with no import if you install the plugin.

One host, not two. Two `NbToaster`s bound to the same queue render every record twice and announce it twice through two announcers, and both write their `max` prop into the shared queue. The host warns about this in development. A second host is fine as long as it has its own queue from `createToastQueue()`, which is what the demo further down this page does.

Then raise toasts from anywhere: a component, a store, a route guard, an interceptor. `useToast()` returns the same queue every time it is called, so nothing has to be passed down.

```ts
import { useToast } from '@nubisco/ui'

const toast = useToast()

toast.success('Draft saved')
toast.error('Could not reach the server')
toast.info('A new version is available', {
  cta: { label: 'Reload', action: () => window.location.reload() },
})
```

## How long a toast stays

Duration follows the variant unless you say otherwise. The scale is reading time, not importance.

| Variant   | Default   | Why                                                                    |
| --------- | --------- | ---------------------------------------------------------------------- |
| `success` | `4000` ms | Three words the user was expecting.                                    |
| `info`    | `6000` ms | Something they did not ask about.                                      |
| `warning` | `8000` ms | A sentence they were not expecting and have to finish.                 |
| `error`   | `0`       | Never auto-dismisses. "It failed" is the start of a task, not the end. |

Two rules sit on top of the table:

- `duration: 0` means "until dismissed" on any variant, and any explicit number wins over the default.
- **A toast that carries an action does not auto-dismiss** unless you give it a duration. The only route to that action for a keyboard user is to reach it, and an info toast's six seconds are gone before the tab ring arrives.

```ts
toast.warning('You are in read-only mode', { duration: 0 })
toast.success('Copied', { duration: 1500 })
toast.info('Comment deleted', { cta: undoAction }) // persistent, automatically
toast.info('Comment deleted', { cta: undoAction, duration: 8000 }) // unless you say so
```

## The cap and what overflows

Three visible at once by default (the queue's `max`). Beyond that, extras wait in the queue and slide in as slots free up, in the order they were raised. Nothing is dropped on the floor.

The one exception is a screen where nothing can expire, which in practice means every visible slot is held by a persistent toast. Waiting for a free slot would silence every later message for the rest of the session, so in that case, and only that case, the oldest visible toast gives up its slot to the newest, and its `onDismiss` is called with `'replaced'`.

Both branches, in order:

```ts
const toast = useToast()

// One slot is held by something that will expire, so the fourth waits.
toast.error('Upload 1 failed') // persistent
toast.error('Upload 2 failed') // persistent
toast.success('Upload 3 finished') // expires in 4s
toast.success('Upload 4 finished') // pending, until slot 3 frees itself
```

```ts
// Nothing on screen can expire, so the newest message would never arrive.
toast.error('Upload 1 failed') // persistent
toast.error('Upload 2 failed') // persistent
toast.error('Upload 3 failed') // persistent
toast.success('Upload 4 finished') // shown at once; 'Upload 1 failed'
//                                     ends with reason 'replaced'
```

That second case is a deliberate trade and it is the only place the queue takes something off screen that the user has not read. If a message must not be displaced, that is what `retain: true` is not for: `retain` survives navigation, not overflow. Raise fewer persistent errors instead, or collapse the batch into one toast with a `cta` that opens the full list.

## Progress that becomes a result

`push()` and the four shorthands return a handle, so the code that raised a toast can keep talking about it. This is the save-in-progress case, and it is why applications end up with two toasts for one action when the host has no handles.

```ts
const saving = toast.info('Saving changes...', { duration: 0 })

try {
  await save()
  saving.update({ variant: 'success', message: 'Changes saved' })
} catch {
  saving.update({
    variant: 'error',
    title: 'Save failed',
    message: 'Your changes are still here. Try again.',
  })
}
```

The toast keeps its slot and its position, so the stack does not jump under the cursor. The countdown restarts, because the words changed and nobody has read the new ones yet. A `variant` passed without a `duration` adopts that variant's default, which is exactly what turns the persistent progress toast into a success that clears itself and an error that does not.

## Undo, and knowing when a toast is over

`onDismiss` is called once per pushed message, with the reason it ended: `user`, `timeout`, `action`, `replaced`, `navigated` or `cleared`. It is what makes the canonical "Deleted. [Undo]" pattern writable, because the pattern needs a moment to commit the delete and a way to know the reader took it back instead.

```ts
function deleteComment(comment: { id: string }) {
  let undone = false
  hide(comment) // optimistic

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
      if (!undone) void api.deleteComment(comment.id)
    },
  })
}
```

An `update()` is not an end of life, so a progress toast that becomes a result calls `onDismiss` once, at the end, with the result's reason. For the same reason `update()` cannot change the callback: `TToastPatch` omits it, and passing it anyway is ignored with a warning outside production. The callback belongs to the message that was pushed, and swapping it halfway would either drop a commit or run one twice. When the message really is a new one, push it again (see below).

A callback that throws is logged and swallowed: the other toasts on screen still have to expire.

## Repeats, and one slot handed from message to message

Give a toast a `key` and pushing it again takes over the toast already on screen instead of adding a second one. A double-clicked Save produces one "Saved".

```ts
toast.push({ key: 'save', variant: 'success', message: 'Draft saved' })
```

Use it for anything that can fire in a burst: autosave, a websocket reconnect, per-row bulk actions.

Two rules make that safe to combine with the `onDismiss` pattern above, and both are worth knowing before you reach for a key.

**The second push replaces the message, it does not merge into it.** Only the id, the slot and the position survive; every field the new call leaves out goes back to its default. So this is a plain info toast, not the earlier error wearing a new sentence:

```ts
toast.push({
  key: 'row',
  variant: 'error',
  title: 'Delete failed',
  message: 'Row 1 is still there',
})
toast.push({ key: 'row', message: 'Row 2 deleted' }) // info, no title
```

**The message being displaced ends first, with reason `replaced`.** It may be holding an optimistic delete that nothing else will ever commit, so the queue runs its `onDismiss` before the new message takes the slot. Deleting two rows quickly commits row 1 and then row 2, in that order:

```ts
function deleteRow(row: { id: string; name: string }) {
  let undone = false
  hide(row)

  toast.push({
    key: 'delete-row', // one "deleted" toast, however fast they click
    message: `${row.name} deleted`,
    cta: {
      label: 'Undo',
      action: () => {
        undone = true
        restore(row)
      },
    },
    onDismiss: () => {
      if (!undone) void api.deleteRow(row.id)
    },
  })
}
```

Pushing the same callback under the same key twice is not a displacement, so an autosave that fires twice does not commit twice.

## A toast and the route it came from

A toast is scoped to a moment, and the moment usually ends with the route. "Draft saved" still on screen two pages later is news about a screen the user has left, and its `Undo` acts on a record they can no longer see. Nothing in the library can tell when that has happened: it has no router dependency and cannot know whether your tab switch is a navigation. So the queue provides the operation and the application says when.

```ts
// router.ts
router.afterEach(() => toast.dismissTransient())
```

`dismissTransient()` clears everything that has not asked to survive, with reason `'navigated'`, and lets pending toasts through as usual.

**Read this before you paste that line.** `afterEach` runs after the navigation it belongs to, so it also clears anything raised _during_ that navigation, before it was ever painted. The common case is a guard:

```ts
router.beforeEach((to) => {
  if (!session.valid) {
    toast.error('Your session expired. Please sign in again.')
    return { name: 'sign-in' } // afterEach then fires, and eats the toast
  }
})
```

The toast ends with reason `'navigated'` without being seen. Guard toasts, and anything else raised on the way to a new route, have to say so:

```ts
toast.error('Your session expired. Please sign in again.', { retain: true })
```

Mark the other exceptions the same way, the news that is still true wherever the user ends up:

```ts
toast.info('Export ready', {
  retain: true,
  cta: { label: 'Download', action: download },
})
```

`dismissAll()` is the harder version: it clears retained toasts too. Use it when nothing queued is true any more, which is sign-out, a tenant switch, or a session that has expired.

If you would rather keep toasts across navigation, do nothing: that is the default, and it is a defensible choice for a product whose routes are panels of one workspace. What is not defensible is never deciding, which is what the audited applications did.

## Placement and size

`bottom-end` by default: the bottom inline end of the viewport, clear of the shell top bar where the actions that raise most toasts live.

The newest toast lands nearest the anchored edge under every placement, so the arriving message appears in the same place every time and the older ones are pushed away from it. That takes two halves, and an earlier revision of this component only had one of them: the records are rendered newest first (so browse mode and <kbd>Tab</kbd> reach the message that was just announced first), and the flow is reversed for the bottom anchors only (so the first item is laid out from the bottom edge rather than the top). Both are asserted, per placement.

```vue
<template>
  <NbToaster placement="top-end" :max="2" />
</template>
```

Placements are logical: `-start` and `-end` follow the document direction rather than left and right.

On a viewport at or above the `md` breakpoint (672px, the library's real scale) a toast is between 280 and 380 pixels wide, and never wider than the space it has. Below that breakpoint the range does not apply: the toast drops its minimum to zero and its maximum to the full width, the inset halves, and the stack spans the viewport, because 24 pixels of padding on each side of a 280 pixel toast does not fit a 320 pixel phone. On a 320 pixel phone a toast is therefore about 296 pixels wide, which is narrower than the stated minimum on purpose. Long unbroken content (an id, a URL, a file name with no spaces) wraps rather than being clipped.

Keep the message to one or two lines. If it needs more, it is not a toast: put it on the page, or open a [confirm](/components/confirm/usage).

## Rendering something else

`#toast` is a scoped slot over one queue record. Use it when a product needs a body the props cannot express (a thumbnail, two actions, a live percentage) and still wants the queue, the clock, the cap, the announcement and the focus handling.

```vue
<template>
  <NbToaster>
    <template #toast="{ toast, dismiss, paused }">
      <MyBrandedToast
        :record="toast"
        :paused="paused"
        @close="dismiss()"
        @undo="dismiss('action')"
      />
    </template>
  </NbToaster>
</template>
```

| Slot prop | Type                                     | Description                                                                                                                          |
| --------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `toast`   | `IToastRecord`                           | The record: id, variant, title, message, cta, duration, cycle.                                                                       |
| `paused`  | `boolean`                                | Whether the shared clock is currently held.                                                                                          |
| `dismiss` | `(reason?: TToastDismissReason) => void` | Remove this toast, with focus handled as usual. Pass `'action'` when your own button did the thing; left unsaid it reports `'user'`. |
| `action`  | `() => void`                             | Mark this toast as actioned without removing it. The dismissal that follows then reports `'action'` on its own.                      |

`reason` is not decoration. It is the whole of the undo contract: `onDismiss` fires once, and `'action'` means the user pressed Undo while `'user'` means they closed the toast and the delete should commit. A slotted body that renders its own action button and calls a bare `dismiss()` reports `'user'` for both, which silently commits every undo. Either name the reason, or call `action()` first.

```vue
<template #toast="{ toast, dismiss }">
  <div class="my-toast">
    {{ toast.message }}
    <button @click="dismiss('action')">Undo</button>
    <button @click="dismiss()">Close</button>
  </div>
</template>
```

What the host still does for a slotted body: the queue, the shared clock, the cap, pause on hover and focus, the announcement, Escape, the hotkey and the roving focus on dismissal. It finds the controls to focus by looking for focusable elements inside its own item wrapper, so the one thing your body has to keep is that it contains something focusable, usually a close button. A body with no focusable element at all renders and announces correctly, but there is nothing for <kbd>Alt</kbd> + <kbd>T</kbd> to land on, so the key is left to the page rather than swallowed.

What becomes yours: the visually hidden severity word, the accessible name of the close control, and the countdown bar. Read the Accessibility tab before you do this.

## Not in English

Two strings are generated by the library rather than by your call: the visually hidden severity word and the close button's name. State them once per queue.

```ts
import { createToastQueue } from '@nubisco/ui'

export const toast = createToastQueue({
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
  <NbToaster
    :queue="toast"
    label="Notificaciones"
    hotkey-hint="Pulse Alt mas T para abrirlo."
  />
</template>
```

## Props

| Prop         | Type                | Default                           | Description                                                                                        |
| ------------ | ------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `queue`      | `IToastQueue`       | `useToast()`                      | Queue to render. Pass one from `createToastQueue()` to isolate a test or a demo.                   |
| `placement`  | `TToasterPlacement` | `'bottom-end'`                    | `top-start`, `top`, `top-end`, `bottom-start`, `bottom`, `bottom-end`.                             |
| `max`        | `number`            | none (the queue's cap)            | Visible slots. Extras wait in the queue. Written through to `queue.max` **only when you pass it**. |
| `label`      | `string`            | `'Notifications'`                 | Accessible name of the region landmark.                                                            |
| `to`         | `string \| false`   | `'body'`                          | Teleport target. `false` renders in place, which is the SSR escape hatch.                          |
| `hotkey`     | `string \| null`    | `'alt+t'`                         | Key that moves focus into the stack and back out. `null` removes it.                               |
| `hotkeyHint` | `string`            | `'Press Alt plus T to reach it.'` | Spoken form of the hotkey, appended to the announcement of a toast with an action.                 |

Two constraints worth stating plainly:

- **`max` belongs to the queue.** The cap decides which records are admitted and admission happens in `push()`, before any host renders, so the prop is written through to `queue.max`. It has no default: an absent prop writes nothing, so `createToastQueue({ max: 2 })` rendered by a bare `<NbToaster :queue="toast" />` shows two rather than the host's idea of three. Pass the prop only when the host knows better than the queue, and it restores the previous value on unmount, so a demo with `:max="1"` does not leave the application capped at one.
- **One host per queue.** Two hosts on one queue render and announce every record twice, and both write `queue.max`. The host warns about it in development.
- **`hotkey` is a physical key.** `'alt+t'` means the key in the T position with Alt held, matched on `event.code`. Change `hotkeyHint` whenever you change `hotkey`: the hint is spoken to somebody who cannot see the stack, so it has to name a key that works.

## Slots

| Slot    | Props                                                                                                           | Description                     |
| ------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `toast` | `{ toast: IToastRecord, paused: boolean, dismiss: (reason?: TToastDismissReason) => void, action: () => void }` | Replaces the body of one toast. |

`NbToaster` emits nothing. A toast's end of life is observed through `onDismiss` on the toast itself, not through a host event, because the code that cares is the code that raised it.

## `useToast()`

Called from a component, an app-scoped queue provided under `NB_TOAST_QUEUE_KEY` wins. Otherwise this is the shared queue, created on first call, which is what a service module or a router guard gets since there is no component instance to inject into.

`createToastQueue(options)` builds an isolated queue for tests, stories and per-locale stacks. `resetToastQueue()` clears and drops the shared one; it is for tests and for a single-render script, and it is deliberately **not** described as request isolation. A module-level singleton is shared by every request a Node process is serving at once, so resetting it globally between awaits would empty a queue another request is still filling. Server rendering with concurrent requests wants a queue per application instance:

```ts
// entry-server.ts
import { createSSRApp } from 'vue'
import { createToastQueue, NB_TOAST_QUEUE_KEY } from '@nubisco/ui'
import App from '../ui/components/App.vue'

export function render() {
  const app = createSSRApp(App)
  app.provide(NB_TOAST_QUEUE_KEY, createToastQueue())
  return app
}
```

`<NbToaster />` then renders that queue with no `:queue` prop, and it dies with the app that `createSSRApp()` returned.

The queue is only half of server rendering. The other half is the teleport, and it is the half that produces a hydration mismatch. `<Teleport to="body">` does not render into `body` on the server: `renderToString` collects teleported markup into `ctx.teleports` keyed by target, and if your HTML template never writes that buffer out, the client hydrates a region the server did not send. Two ways out, and you have to pick one:

```ts
// 1. Write the buffer into the target, keeping the teleport.
const ctx: Record<string, any> = {}
const html = await renderToString(app, ctx)
const body = ctx.teleports?.body ?? ''
// ...then inject `body` immediately after <body> in your HTML template.
```

```vue
<!-- 2. Or turn the teleport off and mount the host at the app root. -->
<NbToaster :to="false" />
```

Option 2 is the one to reach for unless you already handle teleports for something else. The cost is that the stack no longer escapes a transformed ancestor, which is why the host has to be at the root: `position: fixed` resolves against the nearest ancestor carrying a `transform`, `filter` or `perspective`, not against the viewport. In practice a server-rendered app raises no toasts during the render anyway, so the region is empty in both trees and the only thing being matched is the announcer.

| Member                    | Type                                    | Description                                                                       |
| ------------------------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| `push(options)`           | `IToastOptions => IToastHandle`         | Queue a toast.                                                                    |
| `info(message, options?)` | `=> IToastHandle`                       | Shorthand for `push({ ...options, message, variant: 'info' })`.                   |
| `success(message, opts?)` | `=> IToastHandle`                       | Shorthand for `variant: 'success'`.                                               |
| `warning(message, opts?)` | `=> IToastHandle`                       | Shorthand for `variant: 'warning'`.                                               |
| `error(message, opts?)`   | `=> IToastHandle`                       | Shorthand for `variant: 'error'`. Persistent by default.                          |
| `update(id, patch)`       | `(string, TToastPatch) => void`         | Rewrite a live toast. No-op once it has gone.                                     |
| `dismiss(id, reason?)`    | `(string, TToastDismissReason) => void` | Remove one and admit the next pending toast. Defaults to `'user'`.                |
| `dismissAll(reason?)`     | `(TToastDismissReason) => void`         | Clear everything, retained toasts included. Defaults to `'cleared'`.              |
| `dismissTransient()`      | `(TToastDismissReason) => void`         | Clear everything without `retain`. Defaults to `'navigated'`. For a router guard. |
| `pause()` / `resume()`    | `() => void`                            | Hold and release every countdown. The host calls these for you.                   |
| `remaining(id)`           | `(string) => number`                    | Milliseconds left, for instrumentation and tests.                                 |
| `visible` / `pending`     | `ComputedRef<IToastRecord[]>`           | What is on screen, and what is waiting.                                           |
| `items`                   | `ComputedRef<IToastRecord[]>`           | Both, in queue order.                                                             |
| `paused`                  | `Ref<boolean>`                          | Whether the clock is currently held.                                              |
| `max`                     | `Ref<number>`                           | Visible-slot cap. The host writes its `max` prop here.                            |
| `labels`                  | `IToastLabels`                          | The severity words and close label this queue was built with.                     |

### `IToastQueueOptions`

| Field          | Type                                     | Default                  | Description                                         |
| -------------- | ---------------------------------------- | ------------------------ | --------------------------------------------------- |
| `max`          | `number`                                 | `3`                      | Visible slots.                                      |
| `durations`    | `Partial<Record<TToastVariant, number>>` | `NB_TOAST_DURATIONS`     | Per-variant duration overrides.                     |
| `statusLabels` | `Partial<Record<TToastVariant, string>>` | `NB_TOAST_STATUS_LABELS` | The visually hidden severity words.                 |
| `closeLabel`   | `string`                                 | `'Close'`                | Accessible name of every close button in the queue. |

### `IToastOptions`

| Field       | Type                                          | Default    | Description                                                                                                                            |
| ----------- | --------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `message`   | `string`                                      | none       | **Required.** The news, in one sentence.                                                                                               |
| `variant`   | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'`   | Tone, icon, politeness and default duration.                                                                                           |
| `title`     | `string`                                      | none       | Optional heading above the message.                                                                                                    |
| `duration`  | `number`                                      | by variant | Milliseconds. `0` never auto-dismisses.                                                                                                |
| `cta`       | `{ label: string; action: () => void }`       | none       | One action. Taking it dismisses the toast, reason `'action'`. Implies `duration: 0`.                                                   |
| `key`       | `string`                                      | none       | Repeats sharing a key take over the live toast's slot instead of stacking. The displaced message ends first, with reason `'replaced'`. |
| `retain`    | `boolean`                                     | `false`    | Survives `dismissTransient()`, so a route change does not clear it.                                                                    |
| `onDismiss` | `(reason: TToastDismissReason) => void`       | none       | Called once, when the toast leaves the queue. Set at `push()` only: it is the one field `update()` cannot patch.                       |

### `TToastDismissReason`

| Reason        | Means                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `'user'`      | The close button, or Escape while the toast held focus.                                                    |
| `'timeout'`   | The countdown ran out.                                                                                     |
| `'action'`    | The reader took the toast's own action.                                                                    |
| `'replaced'`  | A newer message took its place: a push sharing its `key`, or a full stack of toasts that can never expire. |
| `'navigated'` | `dismissTransient()`, usually from a router guard.                                                         |
| `'cleared'`   | `dismissAll()`.                                                                                            |

### `IToastHandle`

| Member             | Description                                                                                                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | The record id.                                                                                                                                                                                                                                                      |
| `update(patch)`    | Rewrite in place, keeping the slot. Restarts the countdown. A new `variant` adopts its default duration unless `duration` is given. Fields left out are left alone, and `onDismiss` is not patchable: `TToastPatch` is `Omit<Partial<IToastOptions>, 'onDismiss'>`. |
| `dismiss(reason?)` | Remove it now, defaulting to `'user'`. Safe to call twice: `onDismiss` still fires exactly once.                                                                                                                                                                    |
| `isActive()`       | `false` once it has been dismissed or has expired.                                                                                                                                                                                                                  |

### `NB_TOAST_DURATIONS` and `NB_TOAST_STATUS_LABELS`

The defaults, exported so an application can state its own scale once:

```ts
import {
  createToastQueue,
  NB_TOAST_DURATIONS,
  NB_TOAST_STATUS_LABELS,
} from '@nubisco/ui'

const queue = createToastQueue({
  max: 2,
  durations: { ...NB_TOAST_DURATIONS, success: 2500 },
  statusLabels: { ...NB_TOAST_STATUS_LABELS, info: 'Note' },
})
```

## Tokens and override knobs

Two different things live here, and the previous revision of this page confused them.

**Tokens the host reads.** These are library-wide values, defined by the [z-index](/principles/z-index) and [spacing](/principles/spacing) scales. Do not override them to move the stack: they are shared with the rest of the product, and moving them moves everything.

| Token                 | Used for                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--nb-zindex-toast`   | The stacking context, `modal + 50` so toasts clear open dialogs. It is a computed step on the [z-index scale](/principles/z-index), not a number: the name is `zindex`, not `z`, and one application spent a release painting its toasts under a dialog because it guessed the short form and `var()` fell back silently. |
| `--nb-spacing-24`     | Default distance from the viewport edges.                                                                                                                                                                                                                                                                                 |
| `--nb-spacing-12`     | Default gap between stacked toasts, and the default inset below `md`.                                                                                                                                                                                                                                                     |
| `--nb-animation-fast` | Enter, exit and reflow duration.                                                                                                                                                                                                                                                                                          |

**Knobs you set.** These are the host's own custom properties, and they are the supported way to move or resize the stack for one product. Set them anywhere that inherits down to the toaster (`:root`, `body`, a theme class): the host reads them with the token defaults above as fallbacks and never declares them, precisely so that setting them further up the tree works without `:deep()`.

| Knob                     | Default                | Changes                                                                                                                          |
| ------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--nb-toaster-inset`     | `var(--nb-spacing-24)` | Distance from the viewport edges. For `-start` and `-end` placements it is also how far a toast travels as it enters and leaves. |
| `--nb-toaster-inset-sm`  | `var(--nb-spacing-12)` | The same, below the `md` breakpoint.                                                                                             |
| `--nb-toaster-gap`       | `var(--nb-spacing-12)` | Space between stacked toasts. For `top`, `bottom` and the two centred placements it is also the travel of the motion.            |
| `--nb-toaster-max-width` | `23.75rem`             | Widest a toast may be. It is still capped at the viewport.                                                                       |

Two of these knobs do double duty, and which one moves the animation depends on the placement, because a toast enters from the edge it is anchored to. `--nb-toaster-shift` is the internal custom property that carries it: the `-start` and `-end` placements set it from the inset, so the toast slides in sideways from the edge it will rest against, while `top`, `bottom` and the centred placements set it from the gap, so the toast rises or falls by exactly one row. Widen the inset and the side placements travel further; widen the gap and the top and bottom ones do.

```css
/* A product with a persistent 64px action bar along the bottom. */
:root {
  --nb-toaster-inset: 4.5rem;
  --nb-toaster-max-width: 28rem;
}
```

Nothing else about the stack is a public surface. `--nb-toaster-shift` is internal: it is derived from the inset and the gap by the placement rules.

The toast itself is tokenised in [`NbToast`](/components/toast/code#tokens). A test reads the style block of both files and fails on any hex value, any `rgba()` and any `var(--nb-*, fallback)`.

<!--@include: ./_shared.md-->
