---
layout: nubisco
title: Confirm
intro: '`NbConfirm` asks one question, in one shape, everywhere: **is this the thing you meant to destroy?**'
source: src/components/Confirm.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

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

<!--@include: ./_shared.md-->
