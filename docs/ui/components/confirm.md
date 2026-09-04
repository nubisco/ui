---
layout: nubisco
title: Confirm
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbConfirm` asks one question, in one shape, everywhere: **is this the thing you meant to destroy?**

You almost never mount it yourself. `useConfirm()` returns an awaitable function, so the guard reads as a single `if`:

```ts
import { useConfirm } from '@nubisco/ui'

const confirm = useConfirm()

async function remove(environment) {
  if (
    await confirm({
      title: 'Delete environment',
      subjectLabel: 'Environment',
      subject: environment.name,
      message: 'Every entry, release and API key in it is deleted.',
      confirmLabel: 'Delete environment',
    })
  ) {
    await api.deleteEnvironment(environment.id)
  }
}
```

## Live demo

<preview>
  <NbGrid dir="row" gap="sm" align="center">
    <NbButton variant="danger" @click="runBasic">Delete environment</NbButton>
    <span style="font-size: 13px; opacity: 0.75">Last answer: {{ basicAnswer }}</span>
  </NbGrid>
</preview>

```ts
const confirm = useConfirm()

const answered = await confirm({
  title: 'Delete environment',
  subjectLabel: 'Environment',
  subject: 'staging-eu',
  message: 'Every entry, release and API key in it is deleted.',
  confirmLabel: 'Delete environment',
})
```

## What this component decides for you

Reading the twelve applications that consume this library turned up seven different confirmation mechanics and a long tail of destructive actions with no confirmation at all: deleting a CMS environment and every entry in it behind a `window.confirm`, regenerating an OAuth client secret on a single unguarded click, a `localStorage.clear()` in a command palette, deleting another user's comment. The variation was never a design choice, it was the cost of deciding again at every call site. So the decisions live here:

| Decision                               | What `NbConfirm` does                                                                                                                                                 | Why it is not a prop                                                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Button order                           | Cancel first, confirm second                                                                                                                                          | The exit is where the reading eye arrives first and the commit is where it stops. Flipping this per app makes muscle memory a hazard.   |
| Button emphasis                        | Ghost cancel, `danger` confirm (`primary` when `tone="neutral"`)                                                                                                      | A destructive action styled as a primary button is the one defect the old modal docs actively taught.                                   |
| Initial focus                          | Cancel                                                                                                                                                                | The dialog appears under the hand that just clicked. A confirm button holding focus turns one stray <kbd>Space</kbd> into a deletion.   |
| <kbd>Esc</kbd>, backdrop, close button | All resolve to cancel, and all three are refused while `busy` (the close button is `disabled` and `aria-disabled` for as long as it is refused, never live-but-inert) | Three exits that mean the same thing. None of them can ever mean confirm, and none of them can un-fire a request that has already left. |
| <kbd>Enter</kbd>                       | Nothing globally                                                                                                                                                      | An accept-on-Enter default fires the destructive action from a keystroke aimed at something else.                                       |
| Focus containment                      | <kbd>Tab</kbd> cycles inside the dialog, and focus moved by anything else is pulled back                                                                              | Behind the scrim sits the list you are deleting from. `NbModal` alone does not trap focus.                                              |
| Depth                                  | One <kbd>Esc</kbd> answers one question: only the surface in front of you responds, whether that is a confirm over a modal or a confirm over a confirm                | Every open dialog listens on the document, so without a topmost test one press would answer two questions, and the oldest would win.    |
| Naming                                 | The dialog is labelled by its title and described by its body                                                                                                         | Otherwise a screen reader announces "dialog" and nothing else.                                                                          |

The parts that stay yours are the words (`title`, `message`, `confirmLabel`) and the record (`subject`).

## Name the record, not the category

"Are you sure?" is not a question, it is a speed bump. The user already knows they clicked delete. What they do not know is **which** row they clicked.

`subject` renders the record verbatim, in monospace, in its own strip, so an identifier that differs by one character is readable rather than skimmable. `subjectLabel` says what kind of thing it is.

<preview>
  <NbGrid dir="row" gap="sm" align="center">
    <NbButton variant="danger" @click="runSubject">Revoke key</NbButton>
    <span style="font-size: 13px; opacity: 0.75">Last answer: {{ subjectAnswer }}</span>
  </NbGrid>
</preview>

```ts
await confirm({
  title: 'Revoke API key',
  subjectLabel: 'Key',
  subject: 'nb_live_7f3a91c0',
  message: 'Any integration still using this key stops working immediately.',
  confirmLabel: 'Revoke key',
})
```

For a consequence that a sentence cannot carry (a count, a list, the names of the things that go with it), pass `body`, a render function that fills the dialog's default slot:

```ts
import { h } from 'vue'

await confirm({
  title: 'Delete environment',
  subjectLabel: 'Environment',
  subject: 'production',
  body: () =>
    h('ul', [
      h('li', '4 releases'),
      h('li', '2 API keys'),
      h('li', '1,204 entries'),
    ]),
  confirmLabel: 'Delete environment',
})
```

It renders inside the dialog's own Vue app, which is not your application's: no router, no i18n, no provides. Resolve anything you need from those before calling `confirm()` and close over the result. Plain text belongs in `message`. If you are using the component directly rather than the composable, use the default slot instead; `body` is how that slot is reached from an options object. The footer stays owned by the component either way.

## Work that takes time

A confirm that fires a network call has a second failure mode: the user clicks confirm, nothing visibly happens, and they click again. Two `DELETE` requests, one of which is about to 404 loudly.

Hand `onConfirm` to the composable and the dialog owns the whole span. While the promise is pending both buttons lock, the confirm button spins, a live region announces the wait, and <kbd>Esc</kbd>, the backdrop and the close button stop dismissing (the action has already been fired, and closing the dialog cannot un-fire it). The promise `confirm()` returned resolves `true` only once the work has succeeded.

If `onConfirm` rejects, nothing resolves yet: the dialog stays open with the failure shown, so the user can retry or cancel with the error still in front of them.

<preview>
  <NbGrid dir="row" gap="sm" align="center">
    <NbButton variant="danger" @click="runAsync">Delete (succeeds slowly)</NbButton>
    <NbButton variant="danger" outlined @click="runFailing">Delete (fails)</NbButton>
    <span style="font-size: 13px; opacity: 0.75">Last answer: {{ asyncAnswer }}</span>
  </NbGrid>
</preview>

```ts
const deleted = await confirm({
  title: 'Delete environment',
  subject: 'production',
  confirmLabel: 'Delete environment',
  busyLabel: 'Deleting...',
  onConfirm: () => api.deleteEnvironment(id),
  formatError: (error) => humanise(error),
})

// `deleted` is true only if the request came back OK.
```

### A promise that never settles

The lock is the point: while the work is in flight nothing dismisses the dialog, because a fired request cannot be un-fired by closing the window that fired it. That makes a hung promise the one state a user cannot get out of, so `timeout` converts it into one they can:

```ts
await confirm({
  title: 'Delete environment',
  confirmLabel: 'Delete environment',
  onConfirm: () => api.deleteEnvironment(id),
  timeout: 15000,
  timeoutMessage: 'The API did not answer. It may still be running.',
})
```

After `timeout` milliseconds the dialog leaves the pending state and shows `timeoutMessage` as an ordinary failure: the buttons come back, and the user can retry or cancel. It does not abort the work, because nothing here can cancel a request it did not make; if the call itself has to stop, pass your own `AbortSignal` inside `onConfirm`. There is no default, because a library guess at how long "too long" is would be wrong for a batch job and right for nothing.

**Read this before setting one.** The timeout hands the buttons back while the first request may still be running, so a retry fires a _second_ request alongside the first: the exact double-fire the lock exists to prevent, reopened deliberately because a dialog nobody can close is worse. The composable protects the answer but not the side effect. When the first request eventually lands it is disowned, so it cannot resolve your promise, close the dialog or print its error over a different question, but nothing here can un-send it. Set `timeout` only where the call is idempotent or the API rejects a duplicate, phrase `timeoutMessage` so the user knows the work may still be running (the default does), and pass an `AbortSignal` inside `onConfirm` when the request itself must stop.

<preview>
  <NbGrid dir="row" gap="sm" align="center">
    <NbButton variant="danger" outlined @click="runHung">Delete (never answers)</NbButton>
    <span style="font-size: 13px; opacity: 0.75">Last answer: {{ hungAnswer }}</span>
  </NbGrid>
</preview>

### The finished beat

By default the dialog closes the moment the work returns, which is right for anything quick. For a call slow enough that its disappearance reads as a glitch, `successLabel` holds the result on screen for a beat first:

```ts
await confirm({
  title: 'Delete environment',
  confirmLabel: 'Delete environment',
  busyLabel: 'Deleting...',
  successLabel: 'Environment deleted',
  onConfirm: () => api.deleteEnvironment(id),
})
```

During that beat the dialog stays locked: the question has been answered, so nothing may answer it again. The promise resolves `true` as the dialog closes. It is opt-in, because a confirmation that lingers after a successful delete costs time on the common path.

## Type-to-confirm

Some actions are bigger than the button that starts them: an environment and all of its content, a production secret, a tenant. For those, `typeToConfirm` disables the confirm button until the user reproduces the exact string.

<preview>
  <NbGrid dir="row" gap="sm" align="center">
    <NbButton variant="danger" @click="runTyped">Delete production</NbButton>
    <span style="font-size: 13px; opacity: 0.75">Last answer: {{ typedAnswer }}</span>
  </NbGrid>
</preview>

```ts
await confirm({
  title: 'Delete environment',
  subjectLabel: 'Environment',
  subject: 'production',
  message: 'This deletes 1,204 entries, 38 releases and 4 API keys.',
  confirmLabel: 'Delete environment',
  typeToConfirm: 'production',
  typeToConfirmHelper: 'Case sensitive.',
})
```

The match ignores surrounding whitespace (a name pasted with a trailing space is the same intent) and is case sensitive (the friction is the point). The field is cleared every time the dialog opens, so a phrase typed for one record can never carry over to the next one.

Use it sparingly. A gate on a routine delete trains people to type the phrase without reading it, which costs the same attention it was meant to buy, and it is the one part of this dialog a game controller cannot drive without an on-screen keyboard.

## When not to ask at all

A confirmation dialog is an interruption that buys back an undo you did not build. If the action is reversible, prefer the undo: delete the row, show an `NbToast` with an undo action, and ask nothing. Reach for `NbConfirm` when the action is irreversible, expensive, affects other people, or reaches further than the control suggests.

Do not use it to report a result (that is a toast), to collect a form (that is `NbModal`), or to stack a second question on top of a first: `confirm()` queues concurrent requests and shows them one at a time, so two scrims can never pile up.

## Why not `window.confirm`

It is the mechanism most of the fleet reached for, and it is unavailable to some of it:

- Inside a **Tauri** webview it is a documented no-op. The dialog never appears and the call returns immediately, so the guard silently evaluates as "cancelled" (or, worse in the inverted spellings, as "confirmed"). Two of our apps hit this independently.
- It cannot be **driven by a gamepad**. `NbConfirm` is ordinary DOM with real focus, so anything that produces <kbd>Tab</kbd>, <kbd>Space</kbd> and <kbd>Esc</kbd> drives it, controller mappings included.
- It **blocks the main thread**, cannot be themed, cannot name the record in monospace, cannot show a pending state, and some browsers let the user suppress it permanently after the second appearance.

## Migrating

```ts
// Before
if (window.confirm('Delete this environment?')) {
  await api.deleteEnvironment(env.id)
}

// After
if (
  await confirm({
    title: 'Delete environment',
    subjectLabel: 'Environment',
    subject: env.name,
    message: 'Every entry, release and API key in it is deleted.',
    confirmLabel: 'Delete environment',
  })
) {
  await api.deleteEnvironment(env.id)
}
```

The shape of the call site does not change, which is deliberate: `if (await confirm(...))` is a drop-in for `if (window.confirm(...))`, so migrating is renaming plus filling in the words that the native dialog never had room for.

## Nothing to install

The first `confirm()` call creates its own host and mounts it on `document.body`. There is no plugin to register and no component to remember in `App.vue`, because "the team forgot to mount the host" is exactly the silent failure this replaces.

In a non-browser environment (SSR, a Node script) there is nothing to mount, and both possible answers would be lies, so `confirm()` throws with a message that says so rather than resolving. Call it from an event handler, not from `setup()`.

That host is its own Vue app with no plugin installed, so nothing is registered globally in it except what `useConfirm()` registers by hand. A sibling that Vue cannot resolve there would render as an unstyled unknown element, and Vue only warns about it in development, so the host promotes that particular warning to a `console.error` naming the file to fix. The dialog is still shown: a broken dialog is better than a deleted record.

When the ground moves under a pending question (a route change, a signed-out session, a window closing), `dismissConfirms()` resolves every outstanding call to `false` and tears the host down. Because it destroys the dialog rather than closing it, it also hands focus back to whatever opened it before unmounting: a router guard must not leave a keyboard user on `<body>` at the top of the next page.

```ts
import { dismissConfirms } from '@nubisco/ui'

router.beforeEach(() => {
  dismissConfirms()
})
```

## Two questions at once, and one that outlives its dialog

There is one dialog for the whole page. A second `confirm()` while one is open does not stack a second scrim: it waits, and appears once the first is answered, after the first has finished leaving so it does not read as the first one changing its mind.

The harder case is a request that outlives the dialog that started it. The user confirms a slow delete, a router guard calls `dismissConfirms()`, the next screen asks a different question, and only then does the first request land. Every request is therefore owned by the question that asked it, and by the attempt that asked it:

- A reply from a request whose dialog is gone resolves nothing and closes nothing.
- A rejection from a dead request is not printed into the dialog on screen, because it is about a record that dialog never mentioned.
- A retry after a timeout supersedes the attempt before it, so the abandoned first request cannot answer the question the second one is still working on.

None of this cancels the work itself: pass an `AbortSignal` inside `onConfirm` if the request has to stop too. What it guarantees is narrower and is the whole reason this component exists: nothing is ever confirmed that the user did not confirm.

## Using the component directly

Reach for the component when the dialog's open state already belongs to something else: a route, a store, a wizard step that has to survive a reload.

```vue
<template>
  <NbConfirm
    :open="pending !== null"
    title="Delete comment"
    subject-label="Author"
    :subject="pending?.author"
    confirm-label="Delete comment"
    :busy="deleting"
    :error="failure"
    @cancel="pending = null"
    @confirm="remove"
  >
    <p>{{ pending?.body }}</p>
  </NbConfirm>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const pending = ref(null)
const deleting = ref(false)
const failure = ref('')

async function remove() {
  deleting.value = true
  failure.value = ''
  try {
    await api.deleteComment(pending.value.id)
    pending.value = null
  } catch (error) {
    failure.value = error.message
  } finally {
    deleting.value = false
  }
}
</script>
```

You then own the `busy` and `error` props, which is the whole difference: `useConfirm()` exists so that most call sites do not have to.

## Tone

`tone` is `danger` by default, because the confirmations we audited are overwhelmingly destructive and an opt-in safety default is one every call site can forget. Use `tone="neutral"` for a consequential but non-destructive commit: publishing a release, transferring ownership, sending an invite. The order, the focus rules and the dismissal rules do not change; only the confirm button's emphasis and the header icon do.

<preview>
  <NbGrid dir="row" gap="sm" align="center">
    <NbButton @click="runNeutral">Publish release</NbButton>
    <span style="font-size: 13px; opacity: 0.75">Last answer: {{ neutralAnswer }}</span>
  </NbGrid>
</preview>

## Accessibility

- The dialog is `aria-modal="true"` (from `NbModal`). `NbConfirm` sets `role="alertdialog"` for the `danger` tone and leaves `role="dialog"` for `neutral`: a destructive confirm interrupts rather than being navigated to, and `alertdialog` is what makes a screen reader read the description on entry instead of waiting to be asked.
- `aria-labelledby` points at the title and `aria-describedby` at the description (the message, the slot content and the subject strip), so entering announces the action and the record rather than the word "dialog". A title-only confirm sets no `aria-describedby` at all rather than naming an empty element.
- Initial focus is the cancel button, never the confirm button and never the type-to-confirm field.
- <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd> cycle within the dialog. Focus that leaves it any other way (a click on the page behind the scrim, a `focus()` call from application code, a control being disabled under the caret) is recovered on `focusout`, not only on a keystroke.
- **While `busy` the dialog has no focusable control at all**, because cancel, confirm, the gate field and the close button are disabled together. A browser does not hold focus on a control it has just disabled: it drops it on `<body>`, outside the dialog, where <kbd>Esc</kbd> does nothing and a screen reader is reading the page behind the scrim. `NbModal` carries `tabindex="-1"` on the dialog box for exactly this, and `NbConfirm` moves focus there as the pending state begins, and again if anything knocks it out. When the work comes back with a failure, focus moves to the failure itself, which is the sentence the user has to read before deciding whether to retry.
- A popup that one of the dialog's own controls teleports to `<body>` (`NbSelect`'s list, `NbMenu`, `NbDatePicker`'s calendar, `NbUserMenu`'s panel) is treated as part of the dialog, so opening one inside the body slot does not get focus yanked back out of it. Anything else opts in three ways: a `data-nb-confirm-floating` attribute on the teleported root, the `floatingSelectors` prop for one dialog, or `registerConfirmFloatingSelector('.their-dropdown')` once at application start for a third-party popup whose markup you do not own.
- The tab cycle knows about more than buttons and inputs, because the body slot takes arbitrary content: `iframe`, `[contenteditable]`, `audio[controls]`, `video[controls]`, `area[href]`, `summary` and anything with a positive `tabindex` are all stops, while `[tabindex="-1"]`, `[hidden]` and `[aria-hidden="true"]` are not. A preview of the record being deleted is often one of those, and a cycle that does not know about it breaks at the dialog edge.
- A drag that starts inside the dialog (selecting the record's name to copy it) and releases over the scrim does not cancel. By the DOM's reckoning that is a click on the overlay; by the user's it is not a click outside anything.
- <kbd>Esc</kbd> is answered here and stopped here, in the capture phase, but only when this dialog is the last `aria-modal` surface in the document, which for teleported overlays is the one painted on top. An application `NbModal` underneath does not also close, and neither does an older `NbConfirm` when two are open at once. While `busy`, nothing closes at all.
- <kbd>Esc</kbd> pressed inside one of those teleported popups closes the popup, not the dialog: the floating-menu test runs before the <kbd>Esc</kbd> branch, not after it.
- Focus returns to the element that was focused before the dialog opened, so a delete launched from a row menu returns you to that row. It returns on `dismissConfirms()` too, which destroys the dialog rather than closing it.
- The pending state sets `aria-busy="true"` on the dialog and renders `busyLabel` in a `role="status"` region, because a button that has quietly become disabled announces nothing. That region, the finished beat and the failure all sit **outside** the element `aria-describedby` points at. An `alertdialog` announces its description on entry, and text inserted into that same subtree a moment later is at the mercy of how a given screen reader merges the two; kept separate, each of these is an ordinary polite update to a region that was empty, which is the case assistive technology handles the same way everywhere. Which of them is spoken, and how promptly, is still the user's screen reader's decision and not something this library can assert.
- Failures render in `NbMessage` with `variant="error"`, and focus moves to the failure, so it is read even if the live region is not.
- The confirm button is disabled, not hidden, until a `typeToConfirm` phrase matches, and the field's label states the phrase verbatim.
- A body long enough to scroll (slot content at the default `sm` size) becomes `role="region"` with `tabindex="0"`, labelled by the title, so it can be scrolled from the keyboard. `NbModal` drives that decision from a `ResizeObserver` on the content box plus a `MutationObserver` over its contents, so a body that starts out fitting and stops (the window is resized, slot content arrives from a fetch, a translated string wraps onto another line) is caught too. It is marked only while it actually overflows, so a two-line confirm does not grow a stop in its tab order.
- Under `prefers-reduced-motion: reduce` the enter and leave transitions run for zero milliseconds. It is written as a duration rather than `transition: none` for two reasons: the preference can be turned back off while the dialog is open and a `none` left on a recycled node cannot be undone, and the same number is what the queue waits before showing the next question, so a user who asked for less motion is not made to wait out an animation that never ran. Nothing else here moves.

## What this fixed in NbModal

`NbConfirm` renders a real `NbModal`. Four of that component's behaviours were wrong for a confirmation, and wrong for every other nested dialog in the fleet too, so they were fixed in `NbModal` itself rather than patched from outside it. `NbConfirm` configures them with props and does not reach into `NbModal`'s DOM.

| Was                                                       | Now                                                                                                             | What `NbConfirm` passes                       |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Every open instance answered <kbd>Esc</kbd> on `document` | Only the last `aria-modal` surface in the document answers, and `closeOnEscape` switches it off per instance    | `:close-on-escape="false"`, it answers itself |
| `body { overflow }` was cleared on every close            | The page-scroll lock is counted across instances and restores the value the page had, rather than blanking it   | nothing, it is automatic                      |
| The close control was always enabled                      | `closeDisabled` makes it `disabled` and `aria-disabled`                                                         | `:close-disabled="busy"`                      |
| The content box scrolled with no keyboard way in          | A `ResizeObserver` and a `MutationObserver` mark it `tabindex="0" role="region"` whenever it actually overflows | nothing, it is automatic                      |
| The dialog box could not be named or described            | `role`, `labelledBy`, `describedBy` and `busy` props, plus `tabindex="-1"` so focus always has a holder         | all four                                      |

Every part of it is additive. An `NbModal` that passes none of the new props behaves as it did, except that it now answers <kbd>Esc</kbd> only when it is on top and no longer takes the scroll lock away from a dialog underneath it.

## Related

- [Modal](/ui/components/modal) for dialogs that carry a form or a task.
- [Toast](/ui/components/toast) for reporting the result, and for offering undo instead of asking.
- [Button](/ui/components/button/button) for the `danger` and `ghost` variants used here.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop                  | Type                    | Default                    | Description                                                                                                                         |
| --------------------- | ----------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | `string`                | required                   | The action, phrased as the action. "Delete environment", not "Are you sure?".                                                       |
| `open`                | `boolean`               | `false`                    | Whether the dialog is on screen. `useConfirm()` drives this for you.                                                                |
| `message`             | `string`                | none                       | One sentence naming the consequence and its reach. Ignored if you pass default slot content.                                        |
| `subject`             | `string`                | none                       | The record being acted on, rendered verbatim in monospace in its own strip.                                                         |
| `subjectLabel`        | `string`                | none                       | What kind of thing `subject` is: "Environment", "Key", "Comment".                                                                   |
| `confirmLabel`        | `string`                | `'Confirm'`                | The confirm verb. Name the action; never "OK" or "Yes".                                                                             |
| `cancelLabel`         | `string`                | `'Cancel'`                 | The exit label. Change it for localisation, not for variety.                                                                        |
| `tone`                | `'danger' \| 'neutral'` | `'danger'`                 | `danger` gives a red confirm and a warning icon; `neutral` gives a primary confirm.                                                 |
| `typeToConfirm`       | `string`                | none                       | Arms the type-to-confirm gate with this exact phrase.                                                                               |
| `typeToConfirmLabel`  | `string`                | `Type <phrase> to confirm` | Overrides the gate field's label, for localisation.                                                                                 |
| `typeToConfirmHelper` | `string`                | none                       | Helper text under the gate field.                                                                                                   |
| `busy`                | `boolean`               | `false`                    | Pending state: buttons and gate lock, confirm spins, dismissal is refused.                                                          |
| `busyLabel`           | `string`                | `'Working...'`             | Live-region text announced while `busy`.                                                                                            |
| `succeeded`           | `boolean`               | `false`                    | The finished beat: work is done, everything stays locked, the dialog is about to close.                                             |
| `successLabel`        | `string`                | none                       | The line shown while `succeeded`. Unset means no beat: the dialog closes straight away.                                             |
| `error`               | `string`                | none                       | Failure text from the last attempt, shown in the body without closing the dialog.                                                   |
| `size`                | `TModalSize`            | `'sm'`                     | Forwarded to `NbModal`. Raise it only if slot content needs the room.                                                               |
| `floatingSelectors`   | `string[]`              | `[]`                       | Extra selectors for popups teleported out of the dialog that the focus trap and <kbd>Esc</kbd> must treat as inside it.             |
| `contentClass`        | `string`                | none                       | A class on the content region, for branded overrides. The root is a teleported `NbModal`, so attribute fallthrough reaches nothing. |

## Events

| Event     | Payload | Fired when                                                                                                                                                                                                           |
| --------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `confirm` | none    | The confirm button is pressed. Guarded in this component, not only in `NbButton`: it does not fire while `busy`, during the finished beat, or while a `typeToConfirm` phrase is unmet, whoever dispatches the click. |
| `cancel`  | none    | Cancel, <kbd>Esc</kbd>, the backdrop or the close button. Never fires while `busy`.                                                                                                                                  |

## Slots

| Slot      | Description                                                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default` | Body content, replacing `message`. The subject strip, gate, status and error still render below it. From `useConfirm()`, reach it with the `body` option. |

There is deliberately no footer slot. The button row is the decision this component exists to own.

## Exposed

| Method         | Description                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `focusCancel`  | Moves focus to the cancel button. Called internally on open; exposed for recovery.                                                  |
| `restoreFocus` | Moves focus back to the element that was focused when the dialog opened. Called internally on close and on unmount.                 |
| `isTopmost`    | Whether this dialog is the last `aria-modal` surface in the document, which is the test it applies before answering <kbd>Esc</kbd>. |

## `useConfirm()`

```ts
const confirm: (options: IConfirmOptions) => Promise<boolean> = useConfirm()
```

Returns the `confirm()` function itself, not an object, so the call site reads as one expression. It is a plain function over module state rather than an injection, so it works in a component, a Pinia store, a router guard or a plain module, and it never needs a host mounted by hand.

The promise resolves `true` only if the user confirmed and (when `onConfirm` is given) the work succeeded. Cancel, <kbd>Esc</kbd>, the backdrop, the close button and `dismissConfirms()` all resolve `false`. It never rejects.

### Options

`IConfirmOptions` is every prop above except `open`, `busy`, `succeeded` and `error` (the composable owns those four), plus:

| Option           | Type                                | Description                                                                                                                                                                  |
| ---------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onConfirm`      | `() => unknown \| Promise<unknown>` | The work to run on confirm. The dialog locks while it is pending, and resolves `true` only after it settles. On rejection the dialog stays open with the failure shown.      |
| `body`           | `() => VNodeChild`                  | Body content as a render function, filling the default slot, for a consequence a sentence cannot carry. It renders in the dialog's own app: no router, no i18n, no provides. |
| `formatError`    | `(error: unknown) => string`        | Turns a rejection into the text shown in the dialog. Defaults to the error's `message`, then `String(error)`.                                                                |
| `timeout`        | `number`                            | Milliseconds `onConfirm` is given to settle before the dialog declares a failure and unlocks. It does not abort the work. Unset by default.                                  |
| `timeoutMessage` | `string`                            | The failure text used when `timeout` elapses. Defaults to a sentence saying the work may still be running.                                                                   |
| `successLabel`   | `string`                            | Shows a finished beat for a moment before the dialog closes itself.                                                                                                          |

### `dismissConfirms()`

```ts
import { dismissConfirms } from '@nubisco/ui'
```

Resolves the dialog on screen and everything queued behind it to `false`, restores focus to the element that opened the dialog, then unmounts the host. Safe to call when nothing is pending.

Work already in flight is not cancelled, because nothing here can cancel a request it did not make. It is **disowned**: every outstanding request is marked answered, so when a slow `onConfirm` finally lands it resolves nothing, closes nothing and shows its failure to nobody. Without that, the sequence this section recommends (user confirms a slow delete, a route change tears the dialog down, the next screen asks a different question) ended with the first request answering the second question `true` and running a destructive action nobody agreed to.

### `registerConfirmFloatingSelector()`

```ts
import { registerConfirmFloatingSelector } from '@nubisco/ui'

registerConfirmFloatingSelector('.tomselect-dropdown')
```

Teaches every `NbConfirm` about a popup that teleports out of the dialog and cannot carry `data-nb-confirm-floating` itself, so the focus trap and <kbd>Esc</kbd> treat it as inside. Additive, idempotent, and it returns a function that removes the selector again. Use the `floatingSelectors` prop instead when only one dialog needs it.

## Types

```ts
import type { IConfirmProps, IConfirmOptions, TConfirmTone } from '@nubisco/ui'
import type { TConfirmFn } from '@nubisco/ui'
```

## Tokens

`NbConfirm` adds no colours of its own. It reads:

| Token                                      | Used for                                        |
| ------------------------------------------ | ----------------------------------------------- |
| `--nb-c-danger`                            | The heading text and icon in the `danger` tone. |
| `--nb-c-danger-surface`                    | The subject strip's background in `danger`.     |
| `--nb-c-danger-surface-border`             | The subject strip's leading rule in `danger`.   |
| `--nb-c-on-danger-surface`                 | Text inside the subject strip in `danger`.      |
| `--nb-c-bg-soft`, `--nb-c-border`          | The subject strip in the `neutral` tone.        |
| `--nb-c-text`, `--nb-c-text-muted`         | Body, subject name and status text.             |
| `--nb-c-success`                           | The finished-beat line.                         |
| `--nb-c-focus-ring`                        | The ring on the failure when it takes focus.    |
| `--nb-font-family-mono`                    | The subject name.                               |
| `--nb-font-size-11` to `--nb-font-size-14` | Type sizes in the body.                         |
| `--nb-spacing-2` to `--nb-spacing-12`      | Gaps and strip padding.                         |
| `--nb-letter-spacing-wide`                 | The subject strip's kind label.                 |

Every one of them is theme-aware, so the dialog is correct under `.dark` without a second rule. The confirm and cancel buttons take their colour from `NbButton`'s `danger`, `primary` and `ghost` variants.

## Branded overrides

A white-label product that has to restyle the parts of this dialog carrying its identity should not have to fork it or fight its specificity. Three hooks, in the order you should reach for them:

| Custom property                   | Overrides                                                  |
| --------------------------------- | ---------------------------------------------------------- |
| `--nb-confirm-heading-color`      | The heading text and icon in the `danger` tone.            |
| `--nb-confirm-subject-bg`         | The subject strip's background, both tones.                |
| `--nb-confirm-subject-border`     | The subject strip's leading rule, both tones.              |
| `--nb-confirm-subject-color`      | The subject name, and the kind label in the `danger` tone. |
| `--nb-confirm-subject-kind-color` | The kind label in the `neutral` tone.                      |
| `--nb-confirm-subject-font`       | The subject name's family. It is monospace for a reason.   |
| `--nb-confirm-status-color`       | The pending line.                                          |
| `--nb-confirm-success-color`      | The finished beat.                                         |
| `--nb-confirm-gap`                | The vertical rhythm of the body stack.                     |

Each falls back to the global token in the table above, so setting none of them changes nothing.

**Where to set them.** The dialog is teleported to `<body>`, so it inherits from `<body>` and not from the component that called `confirm()`. For a whole application, set them on `:root` (and on `.dark:root` if the brand differs by theme). For one dialog, pass `contentClass` and scope them to that class.

```css
:root {
  --nb-confirm-subject-bg: var(--acme-surface-warning);
  --nb-confirm-subject-border: var(--acme-warning);
}
```

**The button row** is outside `contentClass`, because `NbModal` owns the footer's layout. It is reachable through the two class names `.nb-confirm__action--cancel` and `.nb-confirm__action--confirm`, and through the `[data-nb-confirm="cancel"]` and `[data-nb-confirm="confirm"]` attributes. Both are public surface and are not renamed outside a major version. Restyle them; do not reorder or remove them, because the order and the emphasis are the decision this component exists to own. There is still no footer slot, for the same reason.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
import { useConfirm } from '../../../src'

const confirm = useConfirm()

const basicAnswer = ref('not asked yet')
const subjectAnswer = ref('not asked yet')
const asyncAnswer = ref('not asked yet')
const typedAnswer = ref('not asked yet')
const hungAnswer = ref('not asked yet')
const neutralAnswer = ref('not asked yet')

const say = (value: boolean) => (value ? 'confirmed' : 'cancelled')

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function runBasic() {
  basicAnswer.value = say(
    await confirm({
      title: 'Delete environment',
      subjectLabel: 'Environment',
      subject: 'staging-eu',
      message: 'Every entry, release and API key in it is deleted.',
      confirmLabel: 'Delete environment',
    }),
  )
}

async function runSubject() {
  subjectAnswer.value = say(
    await confirm({
      title: 'Revoke API key',
      subjectLabel: 'Key',
      subject: 'nb_live_7f3a91c0',
      message: 'Any integration still using this key stops working immediately.',
      confirmLabel: 'Revoke key',
    }),
  )
}

async function runAsync() {
  asyncAnswer.value = say(
    await confirm({
      title: 'Delete environment',
      subjectLabel: 'Environment',
      subject: 'staging-eu',
      message: 'Try clicking Delete twice while it runs.',
      confirmLabel: 'Delete environment',
      busyLabel: 'Deleting...',
      onConfirm: () => wait(2000),
    }),
  )
}

async function runFailing() {
  asyncAnswer.value = say(
    await confirm({
      title: 'Delete environment',
      subjectLabel: 'Environment',
      subject: 'production',
      confirmLabel: 'Delete environment',
      busyLabel: 'Deleting...',
      onConfirm: async () => {
        await wait(900)
        throw new Error('Environment is locked by an active release.')
      },
    }),
  )
}

async function runHung() {
  hungAnswer.value = say(
    await confirm({
      title: 'Delete environment',
      subjectLabel: 'Environment',
      subject: 'staging-eu',
      message: 'This request never comes back. The dialog gives up after 4s.',
      confirmLabel: 'Delete environment',
      busyLabel: 'Deleting...',
      onConfirm: () => new Promise(() => {}),
      timeout: 4000,
      timeoutMessage: 'The API did not answer. It may still be running.',
    }),
  )
}

async function runTyped() {
  typedAnswer.value = say(
    await confirm({
      title: 'Delete environment',
      subjectLabel: 'Environment',
      subject: 'production',
      message: 'This deletes 1,204 entries, 38 releases and 4 API keys.',
      confirmLabel: 'Delete environment',
      typeToConfirm: 'production',
      typeToConfirmHelper: 'Case sensitive.',
    }),
  )
}

async function runNeutral() {
  neutralAnswer.value = say(
    await confirm({
      title: 'Publish release',
      tone: 'neutral',
      subjectLabel: 'Release',
      subject: '2026.9.0',
      message: 'The release becomes visible to every reader immediately.',
      confirmLabel: 'Publish release',
    }),
  )
}
</script>
