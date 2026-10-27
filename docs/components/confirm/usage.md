---
layout: nubisco
title: Confirm
intro: '`NbConfirm` asks one question, in one shape, everywhere: **is this the thing you meant to destroy?**'
source: src/components/Confirm.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

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

## What this component decides for you

Reading the twelve applications that consume this library turned up seven different confirmation mechanics and a long tail of destructive actions with no confirmation at all: deleting a CMS environment and every entry in it behind a `window.confirm`, regenerating an OAuth client secret on a single unguarded click, a `localStorage.clear()` in a command palette, deleting another user's comment. The variation was never a design choice, it was the cost of deciding again at every call site. So the decisions live here:

| Decision                               | What `NbConfirm` does                                                                                                                                                 | Why it is not a prop                                                                                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button order                           | Cancel first, confirm second                                                                                                                                          | The exit is where the reading eye arrives first and the commit is where it stops. Flipping this per app makes muscle memory a hazard.                           |
| Button emphasis                        | Ghost cancel, `danger` confirm (`primary` when `tone="neutral"`)                                                                                                      | A destructive action styled as a primary button is the one defect the old modal docs actively taught.                                                           |
| Initial focus                          | Cancel                                                                                                                                                                | The dialog appears under the hand that just clicked. A confirm button holding focus turns one stray <kbd>Space</kbd> into a deletion.                           |
| <kbd>Esc</kbd>, backdrop, close button | All resolve to cancel, and all three are refused while `busy` (the close button is `disabled` and `aria-disabled` for as long as it is refused, never live-but-inert) | Three exits that mean the same thing. None of them can ever mean confirm, and none of them can un-fire a request that has already left.                         |
| <kbd>Enter</kbd>                       | Nothing globally                                                                                                                                                      | An accept-on-Enter default fires the destructive action from a keystroke aimed at something else.                                                               |
| Focus containment                      | <kbd>Tab</kbd> cycles inside the dialog, and focus moved by anything else is pulled back                                                                              | Behind the scrim sits the list you are deleting from. `NbModal` traps focus too; `NbConfirm` adds the rules for its pending state and its type-to-confirm gate. |
| Depth                                  | One <kbd>Esc</kbd> answers one question: only the surface in front of you responds, whether that is a confirm over a modal or a confirm over a confirm                | Every open dialog listens on the document, so without a topmost test one press would answer two questions, and the oldest would win.                            |
| Naming                                 | The dialog is labelled by its title and described by its body                                                                                                         | Otherwise a screen reader announces "dialog" and nothing else.                                                                                                  |

The parts that stay yours are the words (`title`, `message`, `confirmLabel`) and the record (`subject`).

## When not to ask at all

A confirmation dialog is an interruption that buys back an undo you did not build. If the action is reversible, prefer the undo: delete the row, show an `NbToast` with an undo action, and ask nothing. Reach for `NbConfirm` when the action is irreversible, expensive, affects other people, or reaches further than the control suggests.

Do not use it to report a result (that is a toast), to collect a form (that is `NbModal`), or to stack a second question on top of a first: `confirm()` queues concurrent requests and shows them one at a time, so two scrims can never pile up.

## Why not `window.confirm`

It is the mechanism most of the fleet reached for, and it is unavailable to some of it:

- Inside a **Tauri** webview it is a documented no-op. The dialog never appears and the call returns immediately, so the guard silently evaluates as "cancelled" (or, worse in the inverted spellings, as "confirmed"). Two of our apps hit this independently.
- It cannot be **driven by a gamepad**. `NbConfirm` is ordinary DOM with real focus, so anything that produces <kbd>Tab</kbd>, <kbd>Space</kbd> and <kbd>Esc</kbd> drives it, controller mappings included.
- It **blocks the main thread**, cannot be themed, cannot name the record in monospace, cannot show a pending state, and some browsers let the user suppress it permanently after the second appearance.

## Two questions at once, and one that outlives its dialog

There is one dialog for the whole page. A second `confirm()` while one is open does not stack a second scrim: it waits, and appears once the first is answered, after the first has finished leaving so it does not read as the first one changing its mind.

The harder case is a request that outlives the dialog that started it. The user confirms a slow delete, a router guard calls `dismissConfirms()`, the next screen asks a different question, and only then does the first request land. Every request is therefore owned by the question that asked it, and by the attempt that asked it:

- A reply from a request whose dialog is gone resolves nothing and closes nothing.
- A rejection from a dead request is not printed into the dialog on screen, because it is about a record that dialog never mentioned.
- A retry after a timeout supersedes the attempt before it, so the abandoned first request cannot answer the question the second one is still working on.

None of this cancels the work itself: pass an `AbortSignal` inside `onConfirm` if the request has to stop too. What it guarantees is narrower and is the whole reason this component exists: nothing is ever confirmed that the user did not confirm.

## Tone

`tone` is `danger` by default, because the confirmations we audited are overwhelmingly destructive and an opt-in safety default is one every call site can forget. Use `tone="neutral"` for a consequential but non-destructive commit: publishing a release, transferring ownership, sending an invite. The order, the focus rules and the dismissal rules do not change; only the confirm button's emphasis and the header icon do.

<preview>
  <NbGrid dir="row" gap="sm" align="center">
    <NbButton @click="runNeutral">Publish release</NbButton>
    <span style="font-size: 13px; opacity: 0.75">Last answer: {{ neutralAnswer }}</span>
  </NbGrid>
</preview>

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

- [Modal](/components/modal/usage) for dialogs that carry a form or a task.
- [Toast](/components/toast/usage) for reporting the result, and for offering undo instead of asking.
- [Button](/components/button/usage) for the `danger` and `ghost` variants used here.

<!--@include: ./_shared.md-->
