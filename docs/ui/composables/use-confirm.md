---
layout: nubisco
title: useConfirm
tabs: ['Overview', 'API']
---

<doc-tab name="Overview">

`useConfirm()` returns an awaitable `confirm()`, so a destructive guard is one `if`:

```ts
import { useConfirm } from '@nubisco/ui'

const confirm = useConfirm()

if (await confirm({ title: 'Delete environment', subject: env.name })) {
  await api.deleteEnvironment(env.id)
}
```

It renders [NbConfirm](/ui/components/confirm), which is where the dialog itself, its decisions and its accessibility contract are documented. This page is about the function.

## Nothing to install

There is no plugin to register and no host component to remember in `App.vue`. The first call creates a host element on `document.body`, mounts its own Vue app into it and shows the dialog. "The team forgot to mount the host" is one of the silent failures this replaces, so it is not a step anybody can forget.

That host is deliberately its own app, with no plugin installed. Nothing is registered globally in it except what `useConfirm()` registers by hand, and a sibling Vue cannot resolve there would otherwise render as an unstyled unknown element with a development-only warning. On a confirmation dialog that is a silent failure on the one screen that must not fail silently, so the host promotes that warning to a `console.error` naming the file to fix. The dialog still shows: a broken dialog beats a deleted record.

In a non-browser environment (SSR, a Node script) there is nothing to mount, and both answers would be lies: `false` reads as "the user declined" and `true` runs the destructive action with nobody asked. So `confirm()` throws instead, with a message that says to call it from an event handler rather than from `setup()`.

## It is a plain function, not an injection

`useConfirm()` reads no `inject()` and needs no active component instance, so the same call works in a component, a Pinia store, a router guard, a keyboard shortcut handler and a plain module. Keep the call at the boundary where the user acted; do not thread a callback down three components to reach a dialog.

## One question at a time

The dialog, the queue and the pending state are module state, shared by every caller. Two call sites that ask at once do not stack two scrims: the second question waits until the first has been answered, then takes the screen with the first dialog's leave transition finished. Each caller still gets its own promise, resolved with its own answer.

## Where window.confirm cannot go

`window.confirm` is the mechanism most of the fleet reached for, and it is unavailable to parts of it. Inside a **Tauri** webview it is a documented no-op: the dialog never appears and the call returns immediately, so the guard silently evaluates as "cancelled". It also cannot be driven by a **gamepad**, blocks the main thread, cannot be themed, and cannot name the record it is about to destroy. `confirm()` is ordinary DOM with real focus management, so anything that produces <kbd>Tab</kbd>, <kbd>Space</kbd> and <kbd>Esc</kbd> drives it, controller mappings included.

## Owning the async half

Pass `onConfirm` and the composable owns the whole span of the work: the dialog locks so a second click cannot fire a second `DELETE`, a live region announces the wait, dismissal is refused (a fired request cannot be un-fired by closing the window that fired it), and the returned promise resolves `true` only once the work has succeeded. A rejection keeps the dialog open with the failure shown, so the user retries or cancels with the error still in front of them.

```ts
const deleted = await confirm({
  title: 'Delete environment',
  subject: 'production',
  confirmLabel: 'Delete environment',
  busyLabel: 'Deleting...',
  onConfirm: () => api.deleteEnvironment(id),
  formatError: (error) => humanise(error),
  timeout: 15000,
})
```

`timeout` is the escape hatch for the one state the lock creates: a promise that never settles would leave a dialog nothing can dismiss. When it elapses the dialog unlocks and shows `timeoutMessage` as an ordinary failure. It does not abort the work, because nothing here can cancel a request it did not make, so a retry after a timeout fires a second request beside a first that may still be running. That is the double-fire the lock exists to prevent, reopened on purpose because an undismissable dialog is worse. Set it where the call is idempotent or the API rejects duplicates, and pass an `AbortSignal` inside `onConfirm` when the request itself has to stop.

## A request that outlives its dialog

Every request is owned by the question that asked it and by the attempt that asked it. When a reply arrives for a question that is no longer on screen (`dismissConfirms()` ran, or the user retried after a timeout), it is dropped: it resolves nothing, closes nothing, and its failure is not printed into whatever dialog is showing now.

That is not a detail. Without it, the sequence this page recommends (confirm a slow delete, a route change calls `dismissConfirms()`, the next screen asks a different question, the first request lands) resolved the second question `true` and closed it, and the caller ran a destructive action nobody confirmed.

## Clearing the ground

```ts
import { dismissConfirms } from '@nubisco/ui'

router.beforeEach(() => {
  dismissConfirms()
})
```

`dismissConfirms()` resolves the question on screen and everything queued behind it to `false`, disowns any request still in flight, then tears the host down. Call it when the ground moves under a pending question: a route change, a signed-out session, a window closing. Because it destroys the dialog rather than closing it, it also hands focus back to whatever opened the dialog before unmounting, so a router guard cannot leave a keyboard user on `<body>` at the top of the next page.

</doc-tab>

<doc-tab name="API">

## Signature

```ts
function useConfirm(): (options: IConfirmOptions) => Promise<boolean>
function dismissConfirms(): void
```

`useConfirm()` returns the `confirm()` function itself rather than an object, so the call site stays a single expression.

The promise resolves `true` only if the user confirmed and, when `onConfirm` is supplied, the work succeeded. Cancel, <kbd>Esc</kbd>, the backdrop, the close button and `dismissConfirms()` all resolve `false`. It never rejects, because a rejected promise would have no honest meaning here: a failing `onConfirm` keeps the dialog open instead of ending the question.

## Options

`IConfirmOptions` is every [NbConfirm prop](/ui/components/confirm) except `open`, `busy`, `error` and `succeeded`, which the composable owns, plus:

| Option           | Type                                | Description                                                                                                                                                                           |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onConfirm`      | `() => unknown \| Promise<unknown>` | The work to run on confirm. The dialog locks while it is pending and resolves `true` only after it settles. A rejection keeps the dialog open.                                        |
| `body`           | `() => VNodeChild`                  | Body content as a render function, filling the dialog's default slot, for a consequence a sentence cannot carry. It renders in the dialog's own app: no router, no i18n, no provides. |
| `formatError`    | `(error: unknown) => string`        | Turns a rejection into the text shown in the dialog. Defaults to the error's `message`, then `String(error)`.                                                                         |
| `timeout`        | `number`                            | Milliseconds `onConfirm` is given to settle before the dialog declares a failure and unlocks. Does not abort the work. Unset by default.                                              |
| `timeoutMessage` | `string`                            | The failure text used when `timeout` elapses. Defaults to a sentence saying the work may still be running.                                                                            |
| `successLabel`   | `string`                            | Holds a finished beat on screen for a moment before the dialog closes itself. Unset means the dialog closes as soon as the work returns.                                              |

The words (`title`, `message`, `confirmLabel`), the record (`subject`, `subjectLabel`) and the gate (`typeToConfirm`) are documented on the [component page](/ui/components/confirm), which is also where the button order, focus and dismissal rules are explained.

## Types

```ts
import type { TConfirmFn, IConfirmOptions, TConfirmTone } from '@nubisco/ui'
```

## Related

- [Confirm](/ui/components/confirm) for the dialog itself, its decisions and its accessibility contract.
- [Modal](/ui/components/modal) for a dialog that carries a form or a task.
- [Toast](/ui/components/toast) for reporting a result, and for offering undo instead of asking.

</doc-tab>
