---
layout: nubisco
title: Toaster
tabs: ['Usage', 'Api', 'Accessibility']
---

<doc-tab name="Usage">

`NbToaster` is the host: one region, mounted once, that renders the shared toast queue. `useToast()` is how everything else talks to it. Between them they own the parts of a notification that are not about how one message looks: where the stack sits, how many are on screen, when each one leaves, what pauses the clock, what is announced and what happens to focus when a message the user was reading disappears.

[`NbToast`](/ui/components/toast) renders a single message and stays exactly what it was. `NbToaster` decides when it appears and when it goes.

## Why this is library code now

The 12-application audit found three products with a hand-built host over `NbToast`, because the toast page used to state as policy that the library shipped no container. Each one lost something different:

- one had no auto-dismiss at all, so successes accumulated for the life of the route,
- one wrote `var(--nb-z-toast)`, a name that does not exist, and silently ran on the fallback rather than `--nb-zindex-toast`,
- one dropped `role="alert"`, the variant icon, the action and pause-on-hover.

None of those are careless. They are what a container costs to get right. The page that caused them now points here.

## When to toast

A toast is news that expires. If the message would still be true and still be worth reading five minutes from now, it is not a toast.

| Use                                                       | When                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------ |
| `NbToaster`                                               | Something just finished, anywhere on the page, and the news self-clears. |
| [`NbBanner`](/ui/components/banner)                       | Something is true about this page or task and stays on screen.           |
| [`NbMessage`](/ui/components/message)                     | One field has something to say about its own value.                      |
| [`NbConfirm`](/ui/components/confirm)                     | Nothing else may proceed until the user answers.                         |
| [Notification centre](/ui/components/notification-center) | The news outlives the moment and has to be findable later.               |

Do not toast a validation error: it belongs next to the field that caused it. Do not toast something the user can already see happening. Do not toast twice for one action.

The row above is the surface. Which _words_ a state is allowed to be called, and which component owns "what is true about this thing right now", are settled once in [Status indicators](/patterns/status-indicators) rather than restated here. A toast is the only entry in that vocabulary that is a _change_ rather than a state, which is exactly why it may expire and the others may not.

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

## Live demo

The stack below is the real component. It is teleported into the framed area rather than to `<body>`, so it stays inside the page: the toaster is `position: fixed`, and a `transform` on an ancestor is what makes fixed positioning resolve against that ancestor instead of the viewport. In an application you leave `to` alone and the stack anchors to the viewport corner.

<preview dir="col">
  <NbGrid dir="row" gap="sm" wrap="wrap">
    <NbButton size="sm" @click="demoQueue.success('Draft saved')">Success</NbButton>
    <NbButton size="sm" @click="demoQueue.info('Comment deleted', { cta: { label: 'Undo', action: () => {} } })">Info with an action</NbButton>
    <NbButton size="sm" @click="demoQueue.warning('Two people are editing this page')">Warning</NbButton>
    <NbButton size="sm" @click="demoQueue.error('Could not reach the server', { title: 'Save failed' })">Error (persistent)</NbButton>
    <NbButton size="sm" variant="secondary" outlined @click="demoSave">Save (progress to result)</NbButton>
    <NbButton size="sm" variant="secondary" outlined @click="demoQueue.info('Export ready', { retain: true, cta: { label: 'Download', action: () => {} } })">Retained</NbButton>
    <NbButton size="sm" variant="secondary" outlined @click="demoQueue.dismissTransient()">Route change</NbButton>
    <NbButton size="sm" variant="secondary" outlined @click="demoQueue.dismissAll()">Clear</NbButton>
  </NbGrid>
  <div id="nb-toaster-demo" class="toaster-demo-frame"></div>
  <ClientOnly>
    <NbToasterDemo :queue="demoQueue" to="#nb-toaster-demo" :max="3" />
  </ClientOnly>
</preview>

Hover it, tab into it, press <kbd>Alt</kbd> + <kbd>T</kbd>, and watch the countdown bars stop. "Route change" runs what a router guard would run: everything goes except the retained toast.

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

## The clock is shared

The whole region pauses, not the toast under the pointer. Pausing only the hovered one lets the two below it expire while they are being read, which is the bug that makes people distrust toasts.

The clock is held while:

- the pointer is over the stack,
- focus is anywhere inside it,
- the browser tab is hidden.

It resumes from the time that was left, never from the beginning. That is why every expiring toast carries a hairline countdown at its bottom edge: it is the only visible statement of how long is left, and it stops where the clock stops.

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

Keep the message to one or two lines. If it needs more, it is not a toast: put it on the page, or open a [confirm](/ui/components/confirm).

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

## Writing the message

Say what happened, in the past tense, without a full stop. Put anything the user has to do in a `title` and keep the message to the recovery.

| Do                                                                    | Don't                                                    |
| --------------------------------------------------------------------- | -------------------------------------------------------- |
| `toast.success('Draft saved')`                                        | `toast.success('Success!')`                              |
| `toast.error('Could not reach the server', { title: 'Save failed' })` | `toast.error('Something went wrong. Please try again.')` |
| `cta: { label: 'Retry', ... }`                                        | `cta: { label: 'OK', ... }`                              |
| One toast per action                                                  | One toast for the request and another for the response   |

Tense, capitalisation and the sentence shapes are the fleet's, not this component's: [Writing style](/content/writing-style) is the source, and this section only adds what is peculiar to a message that removes itself.

Label the action with its verb, from the shared list in [Action labels](/content/action-labels): `Retry`, `Reload`, `Undo`. The audit found `Cancel`, `Done`, `Close` and `Dismiss` used interchangeably across 12 products, so a toast's action should never be one of them: the close button is the exit, and a second control that also means "go away" is a coin toss for anyone reading the stack through a screen reader.

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

## Replacing a hand-built host

If your application has its own toaster over `NbToast`, the move is mechanical:

1. Delete the local `Toaster.vue` and the local `useToast`. Mount `<NbToaster />` in its place.
2. Rename the push call: `push({ variant: 'success', message })` becomes `toast.success(message)`. `push` still exists with the same option names.
3. Delete any local `z-index` rule. The host sets `--nb-zindex-toast`, which resolves above modals. If you had `--nb-z-toast`, that name never existed.
4. Anywhere you raised two toasts for one operation (a "saving" and then a "saved"), keep the handle from the first and `update()` it.

### What changed in `NbToast`

The API is backwards compatible: a bare `<NbToast>` still times itself, still pauses under the pointer, and still defaults to `role="alert"`. `role` and `closeLabel` became real props with their old values as defaults, and `managed`, `paused` and `cycle` are additive.

One change is visible to consuming code, and it is the reason this section exists. Every `NbToast` now renders a visually hidden severity word before the title, so a screen reader hears "Error. Could not reach the server" rather than a sentence whose severity was only ever a colour and an `aria-hidden` icon. That changes the accessible text of every existing standalone toast, and with it `wrapper.text()` in your tests and any snapshot that covers one.

- If the word is wanted, which it usually is, update the assertion.
- If your title already carries it ("Save failed"), pass `status-label=""` to suppress it and avoid "Error. Save failed. Could not reach the server".
- Under `NbToaster` you do not need to do anything: the host passes the queue's `statusLabels`, and translates them with the rest of the interface.

The info variant's icon and left rule also move from the brand purple (`--nb-c-primary`) to `--nb-c-info`, the same token `NbBanner` uses, and the corner radius moves from a hardcoded 10px to `--nb-radius-md`.

</doc-tab>

<doc-tab name="Api">

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
import App from './App.vue'

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

The toast itself is tokenised in [`NbToast`](/ui/components/toast#tokens). A test reads the style block of both files and fails on any hex value, any `rgba()` and any `var(--nb-*, fallback)`.

</doc-tab>

<doc-tab name="Accessibility">

Auto-dismissal is a time limit and an interruption at once, so this component is answering [WCAG 2.2.1 Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html), [2.2.4 Interruptions](https://www.w3.org/WAI/WCAG22/Understanding/interruptions.html), [1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) and [4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) at the same time.

## What is announced, and how

Two live regions are mounted, empty, for the life of the host: one polite, one assertive. Messages are written into the matching one when a toast becomes visible.

This ordering is the whole point. A live region and its first message inserted into the DOM in the same tick is routinely missed by NVDA and by JAWS, because the region was not being observed when the text arrived, and that is precisely what happens when the container is rendered with `v-if="toasts.length"`. Mounting the region first is the only reliable order.

Severity decides which region speaks. `error` and `warning` are assertive and interrupt, because they change what the user should do next. `success` and `info` are polite and wait their turn: telling somebody their save worked is not worth cutting off the sentence they were listening to.

The announcement reads the severity word, then the title, then the message, and then, if there is an action, its label and the key that reaches it.

**A toast that is still waiting for a slot is not announced yet.** The announcer follows the visible records, so with the cap full the fourth message is spoken at the moment it is admitted, not at the moment it was raised. It is late, never lost, and it is the right way round: announcing something a sighted user cannot see, with a `Retry` that is not on screen, is worse than announcing it a few seconds later along with everyone else. If a message cannot afford to wait for a slot, it is not a toast: see [When to toast](#when-to-toast).

Only one thing speaks. The visible toasts are rendered with `aria-live="off"`, which switches off the live region that `NbToast`'s standalone `role="alert"` would otherwise create, so the announcer is the only voice. Each toast still carries the severity word visually hidden, so browse mode reads "Error. Could not reach the server" rather than a sentence whose severity was only ever a colour and an `aria-hidden` icon.

**One voice means the voice has to be a queue, not a variable.** This is the failure mode a single announcer buys, and it is worth naming because the naive design does not have it. A live region is read by observing a mutation, so a sentence has to sit in the DOM long enough to be observed. Two successes raised in the same tick, or the four-in-a-row burst in [The cap and what overflows](#the-cap-and-what-overflows), would write two sentences into one region in one frame, and only the second would ever be seen: a screen reader user would hear one of four messages a sighted user can count on screen. A live region per toast is cruder and does not lose them, so buffering is not optional here, it is the price of the single announcer.

Each politeness therefore has its own FIFO buffer, drained one sentence at a time on a 500ms interval: long enough for the assistive technology to take its copy (a screen reader queues polite speech itself, so this is not the speaking time), short enough that a burst of four is fully announced in about two seconds. The two buffers drain independently, so an error is spoken immediately rather than waiting behind a queue of confirmations it is more urgent than. The consequence to know about: with a long burst, the last sentence is heard a second or two after its toast appeared, and if the toast was short-lived it may have gone by then. That is the trade for hearing it at all.

The markup also carries `role="none"`, and it is worth being precise about what that does, because an earlier revision of this page was not: presentational-role conflict resolution discards `role="none"` on any element that carries a global ARIA attribute, and `aria-live` is one. What a screen reader sees is therefore an ordinary generic element with its live region off. That is the intended result, and the attribute is kept only because `NbToast` defaults `role` to `alert` for standalone use and something has to override it.

## Keyboard

| Key                                 | Does                                                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| <kbd>Alt</kbd> + <kbd>T</kbd>       | Moves focus to the first control in the newest toast: its action if it has one, otherwise Close. Press it again to go back exactly where you were. |
| <kbd>Tab</kbd>                      | Moves through the actions and close buttons in the stack. Nothing is trapped.                                                                      |
| <kbd>Escape</kbd>                   | Dismisses the toast that contains focus, not the whole stack. Other people's messages are not the current one's to clear.                          |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Takes the focused action.                                                                                                                          |

The hotkey exists because a toast at the end of the document is a long way from wherever the user was, and the countdown is running while they travel. It is a round trip: in and back out, two keystrokes, no lost place. Entering the stack also holds the clock, so nothing expires while it is being read.

### Under an open dialog

The stack is teleported to `body` and painted above modals (`--nb-zindex-toast` is modal + 50), so a toast raised by a dialog's own Save is visible over it. The hotkey is the collision that matters, and the host answers it explicitly: while any `[aria-modal="true"]` element is on screen and does not contain the stack, <kbd>Alt</kbd> + <kbd>T</kbd> does nothing and the keystroke is left to the page.

Moving focus out of a modal surface is the wrong thing to do from both ends. A dialog with a focus trap takes focus straight back, leaving the reader nowhere; a dialog without one has told assistive technology that everything outside it is inert, and there is nothing to hand focus back with. The message is not lost: the live region announces it from inside the dialog, because a live region is not part of the modal's node tree, and the same two keystrokes reach the stack once the dialog closes. What follows for you is a content rule, not a code one: anything the reader must be able to act on while a dialog is open belongs in the dialog, not in a toast behind it.

### The hotkey is a physical key, and the hint is a promise

<kbd>Alt</kbd> + <kbd>T</kbd> is matched on `event.code === 'KeyT'`, the key's position, not on the character it produces.

This is not pedantry. On macOS, Option is a character modifier: Option+T types a dagger in Chrome, Safari and Firefox alike, and never a `t`. A hotkey matched on `event.key` is therefore dead on macOS, and layout-dependent everywhere else, since the letter engraved on a key is not the same on QWERTY, AZERTY and Dvorak. An earlier revision of this component got that wrong while its announcer told screen reader users to press the key, which is worse than offering no hotkey at all. It is now asserted with the event a Mac really emits.

Two things follow for you:

- `hotkeyHint` is spoken to somebody who cannot see the stack. If you change `hotkey`, change the hint, and say the letter your users have on their keyboard. Set `hotkey` to `null` and the hint is not spoken at all.
- Under the `#toast` slot the host looks for focusable elements inside its own item wrapper, so a slotted body keeps the hotkey as long as it contains one. If it contains none, there is nowhere to land and the keystroke is left to the page rather than swallowed, but then the hint is a promise you are not keeping: pass `hotkey-hint=""`, or put a close button in your body.

A toast that carries an action never auto-dismisses by default, so reaching it is never a race.

## Focus

Nothing steals focus. A toast that grabbed focus would throw a keyboard user out of the field they were typing in, and toasts arrive without being asked for.

When a toast holding focus leaves, focus moves to the first control of the nearest surviving toast, and when there is none left, back to the control the user came from. Focus does not fall to `<body>`, and that holds for every way a toast can leave, not just the two the user drove: the close button, <kbd>Escape</kbd>, a clock that ran out while they were reading, `dismissAll()` on sign-out, the `router.afterEach(() => toast.dismissTransient())` guard, and a keyed message superseded by its successor.

That breadth is why the restore is a watcher on the queue rather than a step inside the dismiss handler. Only the close button and <kbd>Escape</kbd> reach that handler; every other removal above bypasses it, and an earlier revision of this component put the restore there and dropped focus to `<body>` on all of them, including the two recipes this page teaches. The watcher runs before the DOM is patched, which is the only moment where the focused element is still attached and the return target has not yet been cleared by the `focusout` that removing it will fire.

The surviving neighbour is found by querying focusable elements inside the host's own item wrapper, so this works under the `#toast` slot too, and `dismissAll()` is handled by skipping any neighbour that is leaving in the same batch rather than focusing a dying node.

## Time limits

The clock is held while the pointer is over the stack, while focus is anywhere inside it, and while the browser tab is hidden, including when the host mounts into a tab that is already in the background. It resumes from the time that was left, never from the beginning. Errors never expire at all, and any duration, including `0`, can be set per toast or per queue.

`queue.pause()` is yours as well, for the cases the host cannot see (an import running, a video playing). The host only ever undoes a pause it took itself: if you paused the queue, hovering the stack and unmounting the toaster both leave it paused, the same way the host gives `queue.max` back when it lets go of a queue.

## Motion

`prefers-reduced-motion: reduce` removes the travel and the reflow: toasts cross-fade in place. The countdown bar keeps running, in discrete steps rather than a sweep. It is not decoration, it is the statement of how long is left, and hiding it would take information away from the users least able to hurry.

## Forced colours

Windows High Contrast (`forced-colors: active`) discards box shadows and overrides every author colour. A toast is made of almost nothing else: a surface, a drop shadow that lifts it off the page, and a 3px accent rule that is its only non-text severity cue. Left unanswered, three toasts read as one undivided block painted over content, with no severity signal at all.

So the surface is repainted from the system palette: `Canvas` background, `CanvasText` border, the accent kept at 3px on the inline start, and the countdown bar given `Highlight` at full opacity so it is still visible as a countdown. What cannot come back is the severity hue: forced colours has no four-way severity palette to spend, and minting one with `forced-color-adjust: none` would opt the close button out of the contrast settings the user chose, which is the opposite of the point. Severity falls to the two channels that survive, and both are already there: the per-variant icon, which differs in shape and not only in colour, and the visually hidden severity word, which is exactly why that word is not decoration ([Colour and contrast](/accessibility/color-contrast)).

The host adds one rule the toast body cannot: an item whose body came from the `#toast` slot gets its own `CanvasText` outline, because nothing guarantees a replacement body draws a boundary. An item using the default body does not, so a normal toast is not ringed twice.

## Right to left

The stack anchors with `inset-inline-start` and `inset-inline-end`, so `bottom-end` is the bottom right of an English build and the bottom left of an Arabic one, and the enter and exit motion follows it. The variant accent uses `border-inline-start` for the same reason: a physical `border-left` would leave the rule on the far side of the toast from the edge the stack is pinned to, which is the RTL bug the logical placement exists to prevent. The countdown bar drains towards the end of the line in both directions.

## Naming

The conventions below are the fleet's ([Accessibility overview](/accessibility/overview), [Keyboard](/accessibility/keyboard)); what follows is what this component does with them.

The region is a `region` landmark named by `label`, so it can be found deliberately rather than stumbled into. The close button is named by `closeLabel`, and the severity words by `statusLabels`, both stated once per queue: the fleet includes a Spanish-market product, and a hardcoded "Close" is a defect there.

## What is still on you

- Do not put a toast in place of a form error. A field's error belongs to the field ([`NbMessage`](/ui/components/message)).
- Do not put the only route to something in a toast. It is the shortest-lived surface in the product.
- If you replace the body through the `#toast` slot, the severity word and the labelled close button become yours to render. Keep something focusable in it, or the hotkey has nowhere to land.
- Decide what a route change does to a toast raised by the page the user just left. `dismissTransient()` in a router guard is the answer for most products; doing nothing is a decision too, but make it deliberately.

</doc-tab>

<script setup lang="ts">
import NbToasterDemo from '../../../src/components/Toaster.vue'
import { createToastQueue } from '../../../src/composables/useToast.composable'

const demoQueue = createToastQueue({ max: 3 })

async function demoSave() {
  const saving = demoQueue.push({
    key: 'docs-save',
    message: 'Saving changes...',
    duration: 0,
  })
  await new Promise((resolve) => setTimeout(resolve, 1200))
  saving.update({ variant: 'success', message: 'Changes saved' })
}
</script>

<style scoped>
/* A transformed, relatively positioned frame: the toaster is position: fixed,
   and a transform on an ancestor is what makes fixed positioning resolve
   against that ancestor rather than the viewport. Demos and visual tests are
   the reason the `to` prop exists. */
.toaster-demo-frame {
  position: relative;
  transform: translateZ(0);
  min-height: 220px;
  border: 1px dashed var(--nb-c-border);
  border-radius: var(--nb-radius-md);
}
</style>
