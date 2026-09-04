---
title: Dialogs and destructive confirmation
description: When a dialog is the right surface and when it is not, the button contract every confirmation obeys, when to demand type-to-confirm, when confirming is the wrong answer entirely, and a mechanical checklist for finding unguarded destructive actions in an existing view.
---

# Dialogs and destructive confirmation

A dialog stops the user. That is not a side effect of the pattern, it **is** the
pattern: everything else on the screen becomes unreachable until the person in
front of it answers a question they did not ask. So a dialog is only ever worth
what it buys, and there is exactly one thing worth that price:

> **A decision that cannot be taken back, taken by someone who might not have
> meant to take it.**

Everything below follows from that sentence. If the action can be taken back, a
dialog is the wrong surface no matter how frightening the verb sounds. If it
cannot be taken back and the user is one click away from it, no amount of
tasteful restraint excuses the missing guard.

---

## What the fleet actually does

Twelve applications built on this library were read end to end. Destructive
confirmation was the worst result in the whole audit, and it failed in two
directions at once:

- **Seven distinct confirmation mechanics across twelve applications.** A
  `window.confirm`, a hand-built `NbModal` with a primary-styled Delete, a
  second modal wrapping an `NbPanel` in its footer, an inline "click again to
  confirm" toggle, a checkbox the user had to tick, a toast that claimed to
  confirm something, and one view that just did it.
- **Sixteen-plus destructive actions with no confirmation at all.** Deleting a
  CMS environment and every entry, release and key inside it, behind a
  `window.confirm`. Regenerating an OAuth client secret on one unguarded click.
  A `localStorage.clear()` sitting in a command palette next to "Toggle theme".
  Deleting another user's comment.
- **And the inversion.** One application confirms a delete that has a working
  undo, and ships the delete that has no undo with no confirmation at all.

That last one is the most useful finding in the estate, because it shows the
failure is not laziness. Somebody thought about it. They just had no rule, so
they guarded the action that felt scary rather than the action that was
irreversible. Feeling scary and being irreversible are different properties, and
only one of them is a reason to interrupt someone.

::: danger The rule that inversion breaks
**The guard belongs to the action that cannot be undone, not to the action that
sounds severe.** If you have built an undo, do not also confirm. If you have not
built an undo, confirming is not optional.
:::

---

## Rule 1: choose the surface before you choose the dialog

A dialog is the fifth thing to reach for, not the first. Find the row that
matches what you actually need, and take the surface in it.

| What you need                                               | Surface                                             | Not a dialog because                                                                      |
| ----------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Tell the user something happened                            | `useToast()`                                        | A result is news, not a question. Nobody has to answer it                                 |
| Tell the user something is true for as long as this page is | `NbBanner variant="callout"`                        | It is a standing fact. Interrupting once and vanishing loses it                           |
| Report a failure that belongs to the page or the form       | `NbBanner variant="inline"`, in place               | The user has to see the failure _and_ the thing that failed, together                     |
| Let the user reverse what they just did                     | `useToast()` with a `cta` labelled Undo             | An undo costs one optional click. A confirm costs one mandatory click, every time         |
| Edit properties of a selected object, repeatedly            | `NbShellPanel` ([Inspectors](/patterns/inspectors)) | The user needs the object and the editor on screen at the same time                       |
| Collect more than four inputs                               | A route                                             | A form that scrolls inside a scrim is a page wearing a costume ([Forms](/patterns/forms)) |
| Collect up to four inputs, tied to what is behind it        | `NbModal`                                           | This one _is_ a dialog                                                                    |
| Get a yes or no about something irreversible                | `useConfirm()`                                      | This one is a dialog too, and it is the only shape it may take                            |

Two of those rows are dialogs. The other six are the reason most of the dialogs
in the fleet should not exist.

### The two dialogs we ship, and nothing else

| Component                                                | Answers                                   | Owns                                                                    |
| -------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| [`NbModal`](/ui/components/modal)                        | "Do this small task"                      | A title, a body you fill, a footer it right-aligns for you              |
| [`NbConfirm`](/ui/components/confirm) via `useConfirm()` | "Is this the thing you meant to destroy?" | The whole dialog: buttons, order, focus, dismissal, pending state, role |

There is no third one, and in particular **a confirmation is never assembled out
of `NbModal`.** Every hand-assembled confirmation in the fleet lost the same
five things: initial focus on cancel, the pending lock, `role="alertdialog"`,
the danger variant on the confirm button, and the record's own name in the body.
Those are not decorations, they are the entire content of the guard.

::: warning The docs themselves taught this wrong
Until this release, [`docs/ui/components/modal.md`](/ui/components/modal)
demonstrated a destructive confirmation with `variant="primary"` on the Confirm
button, a title-case "Confirm Action" heading, the body text "Are you sure you
want to continue?", and an `NbPanel` with inline padding inside `#footer`
fighting the right-aligned `NbGrid` that `Modal.vue` already puts there. One
audited application's markup is a near-copy of it, primary-styled destructive
button included. **The docs caused that defect.** That page has since been
corrected and now points here, but the lesson is why this page exists: a wrong
example is copied faster than a written rule is read.
:::

---

## Rule 2: when not to confirm

Confirming everything is not caution, it is noise, and noise has a measurable
cost: people learn the shape of the dialog and click through it without reading.
A confirmation that is always answered the same way has stopped being a guard
and become a receipt.

Ask these three questions in order. The first "yes" is your answer.

1. **Can the action be undone by the user, in place, within the next few
   seconds?** Then do not confirm. Do it, and offer undo.
2. **Can the action be undone by anyone, ever (an archive, a trash, a version
   history, a support ticket)?** Then do not confirm, and say where it went:
   "Moved to trash. Deleted permanently after 30 days."
3. **Does the action reach further than the control implies, cost money, affect
   another person, or destroy something no copy of exists?** Then confirm, and
   size the guard by the blast radius (see
   [Action labels](/content/action-labels#how-much-guard-by-blast-radius)).

Anything that survives all three questions with a "no" needs no dialog at all.
Just do it.

### Actions that must not be confirmed

- **Anything with an undo.** Two guards on one action is not twice as safe, it
  teaches the user that the first one is ceremony.
- **Anything reversible by repeating it.** Unpublishing, unarchiving, toggling a
  flag, removing a filter, collapsing a panel.
- **A navigation.** Leaving a page is not destructive; leaving a page with
  unsaved work is, and the thing being guarded there is the work, not the
  navigation ([Forms, rule 17](/patterns/forms#rule-17-a-dirty-form-is-never-lost-silently)).
- **A save.** If a save needs a confirmation, the save is doing something it did
  not say it would do, and the label is the bug.
- **A bulk action whose scope is already visible.** Ten selected rows, a button
  that says "Delete 10 conversations", and an undo is a better design than a
  dialog that repeats the number back.

### Actions that must be confirmed, in our own products

Straight from the audit, so nobody has to re-derive the list:

| Action                                        | Why it cannot be an undo                                                    |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| Delete an environment and its content         | The entries, releases and keys go with it. There is nothing to restore from |
| Regenerate an OAuth client secret             | Every client using the old secret breaks the moment the new one exists      |
| Revoke an API key                             | Integrations fail immediately, and the old value is not recoverable         |
| `localStorage.clear()` from a command palette | Signs the user out, drops local drafts, and is one fuzzy-search match away  |
| Delete another user's comment                 | The data is not yours, and the owner is not present to undo it              |
| Sign out everywhere                           | It terminates sessions on devices that are not in front of the user         |

### Undo, correctly

Undo is a real engineering commitment, not a nicer word for "no confirmation".
It only works if the delete is genuinely reversible, or if the commit can be
deferred until the toast goes. `useToast()` supports both, because the reason a
toast ended is reported, and `action` is a different reason from every other
one:

```ts
import { useToast } from '@nubisco/ui'

const toast = useToast()

function deleteComment(comment: IComment, index: number) {
  // The row leaves the list immediately. An undo the user has to wait for is
  // not an undo, it is a slow confirmation.
  comments.value.splice(index, 1)

  toast.push({
    message: 'Comment deleted',
    variant: 'success',
    // A toast with a `cta` never expires on its own, so a deferred commit
    // needs an explicit window. This is how long the undo is open for.
    duration: 8000,
    cta: {
      label: 'Undo',
      // Put it back where it was. An undo that appends to the end of the list
      // is a second edit, not a reversal.
      action: () => comments.value.splice(index, 0, comment),
    },
    onDismiss: (reason) => {
      // Every reason except `action` means the user let it go: the countdown
      // ran out, they closed it, they navigated away, they signed out.
      if (reason !== 'action') void api.deleteComment(comment.id)
    },
  })
}
```

Four things that make this correct rather than merely present:

- **`onDismiss` fires exactly once per pushed message**, with the true reason,
  so the commit cannot run twice or be skipped.
- **The window is explicit.** Without `duration`, a toast carrying a `cta` waits
  forever, and a deferred delete would never commit.
- **Navigation still commits.** `dismissTransient()` from a router guard reports
  `navigated`, which is not `action`, so leaving the page confirms the delete
  rather than silently dropping it.
- **The undo restores the row where it was**, at `index`, not at the end of the
  list. An undo that reorders the list is a second edit.

If any of that is not true of your action, you do not have an undo. You have a
missing confirmation.

::: danger Never offer an undo you cannot honour
An `Undo` button that fires a second request which can itself fail, with no
handling for that failure, is worse than no undo: the user has been told the
mistake is fixed. If the restore can fail, confirm up front instead.
:::

---

## Rule 3: modal or non-modal

Both dialogs we ship are modal: `NbModal` renders `aria-modal="true"` over a
scrim, and `NbConfirm` is an `NbModal`. That is deliberate, and it is also why
the bar for opening one is high.

**Modal is justified when:**

- The answer is required before anything else can proceed (a destructive
  confirmation, a session about to expire with unsaved work).
- The task is short, complete, and about one object the user already selected.
- Leaving the task half-done would leave data in a state the user cannot see.

**Modal is not justified when:**

- The user needs to read the page to answer. Blocking the page and then asking a
  question that the page answers is a trap, and the only way out of it is to
  cancel and start again.
- The task is repeated. Ten renames means ten scrims. Use inline editing or a
  panel.
- The content is reference material. That is an [inspector](/patterns/inspectors)
  or a [banner](/ui/components/banner).

**The non-modal alternatives we actually ship**, in order of how often they are
the better answer: inline editing in the row or the field; an
[`NbShellPanel`](/ui/components/shell-panel) docked beside the content;
`NbBanner` with its `#action` slot for something the user may act on when ready;
`NbMenu` for a short list of choices attached to the control that opened it.

### Stacking

One rule, and it is short: **a confirmation over a dialog is the only legal
stack.** A modal that opens a modal to open a third is a workflow that lost its
route.

That one legal stack works because both components test for topmost. Every open
dialog listens on `document`, so without that test one <kbd>Esc</kbd> would
answer two questions and the older one would win. `NbModal` answers
<kbd>Esc</kbd> only when it is the last `aria-modal` element in the document,
and `NbConfirm` switches `NbModal`'s handler off entirely
(`:close-on-escape="false"`) and runs its own with the same test in the capture
phase. So a confirm opened from inside a modal closes the confirm, not the modal
underneath it.

Two `confirm()` calls never stack at all: there is one dialog for the whole
page, and a second question queues behind the first.

---

## Rule 4: the button contract

Every dialog in every Nubisco product has the same footer. This is not a style
preference, it is the reason a user can act on muscle memory without hurting
themselves.

```
[ Cancel ]                                    [ Delete environment ]
  ghost                                              danger
  holds initial focus                         where the hand rests
```

| The contract                                                          | Why                                                                                                                                       |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Exactly two buttons**                                               | A third choice in a confirmation is a task, and a task belongs on a route. "Save and delete" is two decisions wearing one button          |
| **Cancel on the left, commit on the right**                           | The exit is where the reading eye arrives, the commit is where it stops. An app that flips this makes every other app in the fleet a trap |
| **Cancel is `variant="ghost"`**                                       | It is the safe option, so it needs no emphasis. Emphasis is a claim on attention, and the exit does not need one                          |
| **The commit is `variant="danger"`** (`primary` for `tone="neutral"`) | A destructive action styled as a primary button is the exact defect the modal docs taught                                                 |
| **The commit says the verb**                                          | "Delete environment", never "Yes", "OK", "Confirm" or "Continue"                                                                          |
| **Initial focus is Cancel**                                           | The dialog appears under the hand that just clicked. Focus on the commit turns one stray <kbd>Space</kbd> into a deletion                 |
| **The header's close control is a third Cancel**                      | Three exits, one meaning. None of them may ever mean confirm                                                                              |

`NbConfirm` renders that footer itself; you supply `confirmLabel` and nothing
else. For an `NbModal` you assemble it, and the two mistakes to avoid are both
in the fleet:

```vue
<!-- Wrong: a padding wrapper inside a footer that is already a grid, a
     primary-styled destructive commit, and an agreement word for a label. -->
<template #footer>
  <NbPanel style="padding: 12px;">
    <NbGrid dir="row" gap="sm" justify="end">
      <NbButton variant="ghost" @click="open = false">Cancel</NbButton>
      <NbButton variant="primary" @click="remove">Confirm</NbButton>
    </NbGrid>
  </NbPanel>
</template>
```

```vue
<!-- Right: NbModal already wraps #footer in an NbGrid with justify="end". -->
<template #footer>
  <NbButton variant="ghost" type="button" @click="open = false"
    >Cancel</NbButton
  >
  <NbButton variant="primary" type="submit" form="rename-env" :loading="saving">
    Rename environment
  </NbButton>
</template>
```

### Why the commit label is the verb

The reason is mechanical rather than aesthetic. A screen reader user can pull a
list of the page's actions, where each label appears with no sentence around it.
`Yes`, `No`, `Cancel` conveys nothing at all. `Delete environment`, `Cancel`
conveys the entire dialog. The full register of verbs and what each one promises
lives in [Action labels](/content/action-labels#the-verb-precisely); use it,
because "Remove" and "Delete" mean different things and the fleet uses them
interchangeably.

`NbConfirm` defaults `confirmLabel` to `'Confirm'` so the component can never
render an empty button. **That default is not a licence.** Always pass the verb.

---

## Rule 5: the body names the record, not the category

"Are you sure?" is not a question. The user already knows they clicked delete.
What they do not know is **which row they clicked**, and that is the only fact a
confirmation can add.

```ts
await confirm({
  title: 'Delete environment', // the action, not a question
  subjectLabel: 'Environment', // what kind of thing
  subject: env.name, // the record, verbatim, in monospace
  message: 'Every entry, release and API key in it is deleted.',
  confirmLabel: 'Delete environment',
})
```

- **`title` is the action.** Sentence case, no question mark. "Delete
  environment", not "Confirm Action" and not "Are you sure?".
- **`message` is the consequence and its reach**, in one sentence, in the
  present tense. What breaks, and for whom. Not the mechanics of the request.
- **`subject` is the record.** It renders verbatim in its own strip, in
  monospace, because half of these identifiers are strings where `l`/`1` and
  `O`/`0` decide whether the right thing is destroyed.
- **When the reach is a list rather than a sentence**, pass `body`, a render
  function ("4 releases, 2 API keys, 1,204 entries"). It renders in the dialog's
  own Vue app, which has no router, no i18n and no provides, so resolve strings
  before you call.

When the action touches someone else's data, say whose: `Delete Ana's comment`,
not `Delete comment`. The audit found a comment delete that named nothing at
all, in a product where moderators delete other people's writing.

---

## Rule 6: type-to-confirm is for blast radius, not for severity

`typeToConfirm` disables the commit button until the user reproduces an exact
string, usually the record's own name.

Demand it when **the action reaches further than the control the user clicked**:

- A container and everything in it: an environment, a project, a tenant, a
  workspace.
- A production credential whose replacement breaks live integrations.
- Anything that affects other people's access or other people's data at scale.

Do not demand it for a single record the user owns, however dramatic the verb
is. A gate on a routine delete trains people to type the phrase without reading
it, which spends exactly the attention it was meant to buy. It is also the one
part of this dialog a game controller cannot drive without an on-screen
keyboard, which matters in two of our products.

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

The match ignores surrounding whitespace (a name pasted with a trailing space is
the same intent) and is case sensitive (the friction is the point). The field
clears on every open, so a phrase typed for one record cannot carry over to the
next one.

---

## Rule 7: a fired action cannot be un-fired, so the dialog locks

The second failure mode of every hand-rolled confirmation in the fleet: the user
clicks the commit, nothing visibly changes, and they click again. Two `DELETE`
requests, one of which is about to fail loudly on a record that no longer
exists.

Put the request **inside** `onConfirm`, not after the `await`:

```ts
const deleted = await confirm({
  title: 'Delete environment',
  subject: env.name,
  confirmLabel: 'Delete environment',
  busyLabel: 'Deleting...',
  onConfirm: () => api.deleteEnvironment(env.id),
  formatError: (error) => humanise(error),
})
// `deleted` is true only if the request came back OK.
```

While that promise is pending the dialog owns the whole span: both buttons and
the gate field lock, the commit button spins, a `role="status"` region announces
the wait, and <kbd>Esc</kbd>, the backdrop and the close control stop dismissing.
They stop because the request has already left, and closing the window that sent
it does not recall it. A dialog that let you "cancel" at that point would be
lying.

If `onConfirm` rejects, nothing resolves: the dialog stays open with the failure
in it, focus moves to the failure, and the user retries or cancels with the
error still in front of them.

::: warning The one state that lock creates
A promise that never settles leaves a dialog nothing can close. Set `timeout`
(and a `timeoutMessage`) wherever the call has a service-level expectation, and
read the caveat on the [Confirm page](/ui/components/confirm): the timeout hands
the buttons back while the first request may still be running, so it re-opens
the double-fire deliberately. Set it only where the call is idempotent or the
API rejects duplicates.
:::

For an `NbModal` you are driving yourself, the same rule applies with your own
state: `:loading` on the commit button, `:close-disabled` on the modal, and
`:close-on-overlay="false"` while the request is in flight.

---

## Rule 8: dismissal has one meaning

<kbd>Esc</kbd>, a click on the backdrop and the header's close control all mean
**cancel**. Never confirm, never "remind me later", never a fourth thing.

| Situation                                | What dismissal does                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| A confirmation, idle                     | Cancels. `confirm()` resolves `false`                                                                                        |
| A confirmation, work in flight           | Nothing. All three exits are refused, and the close button is genuinely `disabled` and `aria-disabled`, never live-but-inert |
| A modal holding an unedited form         | Closes                                                                                                                       |
| A modal holding a dirty form             | `:close-on-overlay="false"`, and the close control routes through `useConfirm()`                                             |
| <kbd>Esc</kbd> inside a teleported popup | Closes the popup (the select list, the menu, the date picker), not the dialog                                                |

Two behaviours you get for free and should not re-implement: a drag that starts
inside the dialog (selecting the record's name to copy it) and releases over the
scrim does **not** cancel, because by the user's reckoning that was never a
click outside anything; and <kbd>Enter</kbd> does not confirm globally, because
an accept-on-Enter default fires a destructive action from a keystroke aimed at
something else.

When the ground moves under a pending question (a route change, a signed-out
session, a window closing), call `dismissConfirms()`. It resolves every
outstanding `confirm()` to `false` and hands focus back to whatever opened the
dialog:

```ts
import { dismissConfirms } from '@nubisco/ui'

router.beforeEach(() => {
  dismissConfirms()
})
```

---

## Rule 9: focus is the whole accessibility story

A dialog is a focus contract. Get these five right and the rest is detail.

1. **On open, focus enters the dialog.** A confirmation focuses Cancel. A modal
   holding a form focuses its first editable control. A modal holding text
   focuses the dialog box itself, which carries `tabindex="-1"` for exactly
   this.
2. **Focus never leaves while it is open.** <kbd>Tab</kbd> cycles inside, and
   focus moved by anything that is not a keystroke (a click on the page behind
   the scrim, a `focus()` from application code, a control disabled under the
   caret) is recovered. Behind the scrim sits the list the user is deleting
   from, and it is inert to the eye but not to <kbd>Tab</kbd>.
3. **On close, focus returns to what opened it.** A delete launched from a row
   menu returns you to that row, not to the top of the document.
4. **The dialog is named and described.** `aria-labelledby` on the title,
   `aria-describedby` on the body. A dialog with neither announces the word
   "dialog" and stops.
5. **Destructive confirmations are `role="alertdialog"`.** `NbConfirm` sets it
   from `tone="danger"`, which is the default. It is what makes a screen reader
   read the consequence on entry instead of waiting to be asked for it.

`NbConfirm` does all five. `NbModal` gives you 3, 4 and the `tabindex="-1"`
holder, and leaves 1 and 2 to you, which is the strongest single argument for
not hand-rolling a confirmation out of it. The detail of how each is implemented
is on the [Confirm page](/ui/components/confirm#accessibility); the general keys
and focus-return rules are in
[Keyboard interaction](/accessibility/keyboard#after-a-dialog-closes).

One case worth naming here because it is invisible in a browser and invisible in
tests: **while the commit is pending, a confirmation has no focusable control at
all**, since both buttons, the gate field and the close control are disabled
together. A browser does not hold focus on a control it has just disabled, it
drops it on `<body>`, outside the dialog, where <kbd>Esc</kbd> does nothing and
a screen reader is reading the page behind the scrim. If you build a pending
state on a bare `NbModal`, move focus to the dialog box yourself.

---

## Rule 10: never `window.confirm`, and never `alert`

It is the mechanism most of the fleet reached for, and it is not available to
all of the fleet.

- **Inside a Tauri webview it is a documented no-op.** The dialog never appears
  and the call returns immediately, so the guard evaluates as "cancelled" (or,
  in the inverted spellings, as "confirmed") with nobody asked. Two of our
  applications discovered this independently.
- **It cannot be driven by a gamepad.** `NbConfirm` is ordinary DOM with real
  focus, so anything that produces <kbd>Tab</kbd>, <kbd>Space</kbd> and
  <kbd>Esc</kbd> drives it, controller mappings included.
- **It blocks the main thread**, cannot be themed, cannot render the record in
  monospace, cannot show a pending state, and some browsers let the user
  suppress it permanently after the second appearance. A user who ticks that box
  has disabled every guard in the product.

The same applies to `alert()` for errors: one audited application throws 21 of
them. An exception the user can act on is an [inline banner](/patterns/status-indicators);
one they cannot is a log line.

Migration is mechanical, because the call shape is identical:

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

There is nothing to install and nothing to mount: the first `confirm()` call
creates its own host on `document.body`. "The team forgot to mount the host" is
one of the silent failures this replaces.

---

## Rule 11: dialogs are user-initiated

A dialog appears because the user pressed something. Never on page load, never
on a timer, never because a websocket delivered news.

| Event                                            | Surface                                                                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Onboarding, a tour, an announcement              | Not a dialog. A callout banner, or a page                                                                                          |
| A background job finished                        | `useToast()` with `retain: true`, so it survives the route change                                                                  |
| A record you are editing changed elsewhere       | `NbBanner variant="inline"` above the form, with a reload action                                                                   |
| Connection lost                                  | Banner or toast. It is a fact, not a question                                                                                      |
| The session is about to expire with unsaved work | `useConfirm()` with `tone="neutral"`. This is the exception: a decision is genuinely required, and losing it costs the user's work |

The test is the same as everywhere else on this page: does the system need an
answer before it can continue, and is the cost of not asking borne by the user?
Almost nothing that arrives on its own passes it.

---

## Sizing, scrolling and what goes inside

- **A confirmation is `size="sm"`.** Raise it only when slot content genuinely
  needs room. If it needs `lg`, it is a task, not a question.
- **A modal task is `sm` or `md`.** `lg`, `xl` and `immersive` exist for
  content viewers (a media preview, a diff), not for forms.
- **Four inputs is the ceiling for a modal form.** Beyond that, use a route
  ([Forms, rule 1](/patterns/forms#rule-1-choose-the-surface-before-you-choose-anything-else)).
- **One scrolling region, and the modal owns it.** `NbModal` marks its body
  `role="region"` with `tabindex="0"` whenever it actually overflows, driven by
  a `ResizeObserver` plus a `MutationObserver`, so it is reachable from the
  keyboard and does not add a tab stop when it fits. A second scroll container
  nested inside that one cannot be reached by a keyboard user at all.
- **Do not put a data table inside a dialog.** Sorting, paging and row selection
  are a page's worth of interaction, and any row action inside them would need a
  second dialog.
- **Do not put a link out of the dialog inside it.** A control that navigates
  abandons the task without answering the question, and the user's work goes
  with it.
- **Do not hide information in a dialog behind an accordion or a tab.** The
  dialog is already the smallest surface in the product; content that has to be
  collapsed inside it does not belong in it.

---

## Things we have shipped and should not ship again

- Deleting a CMS environment and every entry in it behind a `window.confirm`,
  in a product that also ships in a webview where `window.confirm` does nothing.
- Regenerating an OAuth client secret on one unguarded click, next to nothing
  that says what breaks.
- `localStorage.clear()` in a command palette, reachable by fuzzy-matching
  "clear".
- Deleting another user's comment with no confirmation and no owner named.
- Confirming a delete that has a working undo while shipping the delete with no
  undo unguarded.
- A destructive commit styled `variant="primary"`, copied out of our own modal
  documentation.
- An `NbPanel` with `style="padding: 12px"` inside `#footer`, fighting the grid
  `NbModal` already puts there.
- A confirmation whose body said "Are you sure you want to continue?" and named
  neither the action nor the record.
- A confirm button labelled `Yes`, in a dialog whose title was `Confirm Action`.
- A hand-rolled confirmation with no pending state, which sent two `DELETE`s
  when the network was slow.

---

## Checklist: finding and fixing unguarded destructive actions in a view

Apply this to one view at a time. Every step is mechanical and every answer is
in the file you are reading.

### Step 1: find every destructive action

Run these in the application repository, not in the library.

```bash
# Native dialogs. Every hit is a defect.
grep -rnE "window\.(confirm|alert|prompt)|(^|[^.[:alnum:]_])(confirm|alert)\(" src

# Destructive verbs on handlers and API calls.
grep -rnE "\b(delete|destroy|remove|revoke|regenerate|reset|purge|wipe|clear|discard|drop|truncate|unpublish|cancelSubscription)[A-Z(]" src

# Storage and session wipes, which are usually nowhere near a confirmation.
grep -rn "localStorage\.clear\|sessionStorage\.clear\|indexedDB\.deleteDatabase" src

# Destructive HTTP.
grep -rnE "\.(delete|del)\(|method: *['\"]DELETE" src

# Command palettes and menus, where destructive items sit beside harmless ones.
grep -rn "NbCommandPalette\|NbMenu" src
```

The first pattern also matches the `await confirm({ ... })` calls that come from
`useConfirm()`, which are the ones you are trying to end up with: a hit whose
argument is an object literal is fine, a hit whose argument is a string is not.

Write the results down as a list of actions, not of files. One action can have
three call sites (a row menu, a detail page, a keyboard shortcut) and they must
all end up on the same guard.

### Step 2: classify each one

For each action, answer in order and stop at the first yes:

- [ ] Reversible by the user in place within seconds → **no dialog**, add an
      undo toast with `cta`, an explicit `duration`, and a commit in
      `onDismiss`.
- [ ] Recoverable later from somewhere (trash, archive, version history) → **no
      dialog**, and the success toast says where it went.
- [ ] Irreversible, one record, owned by the user → `useConfirm()` with `title`,
      `message`, `subjectLabel`, `subject`, `confirmLabel`.
- [ ] Irreversible and it takes a container's contents, a live credential, or
      another person's data with it → the same, plus `typeToConfirm`.

If an action already has both a confirmation and an undo, delete the
confirmation. That inversion is in the fleet today.

### Step 3: fix the mechanism

- [ ] No `window.confirm`, no `alert`, no `confirm()` from the global scope
      anywhere in the view.
- [ ] No confirmation assembled out of `NbModal`. If you find one, replace the
      whole thing with `useConfirm()`; do not repair its footer.
- [ ] The destructive request lives inside `onConfirm`, not after the `await`.
- [ ] `busyLabel` is set on anything that hits the network.
- [ ] `timeout` and `timeoutMessage` are set where the call has a service-level
      expectation and is idempotent, and are absent where it is not.
- [ ] `formatError` turns the API's failure into a sentence, and no raw
      exception text can reach the dialog.

### Step 4: check the words

- [ ] `title` is the action in sentence case, with no question mark, and no
      "Are you sure".
- [ ] `message` names the consequence and its reach in one sentence.
- [ ] `subject` is the exact record, and `subjectLabel` says what kind of thing
      it is. Someone else's data names the owner.
- [ ] `confirmLabel` is the verb phrase. It is not `Confirm`, `Yes`, `OK`,
      `Continue` or `Done`, and the verb is the right one from the
      [register](/content/action-labels#the-verb-precisely) (`Remove` and
      `Delete` are not synonyms).
- [ ] `tone` is `danger` for anything destructive, `neutral` only for a
      consequential but non-destructive commit.

### Step 5: check the mechanics that are yours

Only relevant where the view drives an `NbModal` itself.

- [ ] The footer has no `NbPanel` and no inline padding: `NbModal` right-aligns
      it already.
- [ ] Cancel is `variant="ghost"`, left; the commit is `danger` (or `primary`),
      right; there are exactly two of them.
- [ ] Something inside the dialog holds focus on open, and focus returns to the
      trigger on close.
- [ ] The overlay does not dismiss a dirty form, and every close route lands on
      one handler.
- [ ] The commit button is `:loading` while the request is in flight, and the
      close control is `:close-disabled`.

### Step 6: check every route to the action

- [ ] Every call site of the action goes through the same guard: the row menu,
      the detail page toolbar, the keyboard shortcut, the command palette, the
      bulk-selection bar.
- [ ] A router guard calls `dismissConfirms()`, so no question outlives the
      screen that asked it.
- [ ] The view was checked with the `.dark` class applied, and with the pointer
      unplugged: <kbd>Tab</kbd> to the trigger, <kbd>Space</kbd>,
      <kbd>Esc</kbd>, and you are back on the trigger.

---

## Related

- [Confirm](/ui/components/confirm) for the full `NbConfirm` API, including the
  queue, the pending and failure states and the floating-popup exemptions.
- [useConfirm](/ui/composables/use-confirm) for the signature, the options and
  `dismissConfirms()`.
- [useToast](/ui/composables/use-toast) for the queue behind the undo pattern.
- [Modal](/ui/components/modal) for dialogs that carry a task.
- [Toast](/ui/components/toast) and [Toaster](/ui/components/toaster) for undo
  and for reporting results.
- [Action labels](/content/action-labels) for the verb register and the ban
  list.
- [Building a form](/patterns/forms) for forms inside modals and for unsaved
  work.
- [Status indicators](/patterns/status-indicators) for where a message belongs
  when it is not a question.
- [Keyboard interaction](/accessibility/keyboard) for focus return and key
  meanings.
