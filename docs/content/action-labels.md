---
layout: nubisco
title: Action labels
description: One label per intent and the ban list, with the decision tree, the destructive-action guard table and the register a view can be rewritten from mechanically.
---

A count of the labels shipped across twelve applications built on this library:

| Label   | Occurrences |
| ------- | ----------- |
| Cancel  | 25          |
| Done    | 6           |
| Delete  | 5           |
| Close   | 4           |
| Create  | 3           |
| Back    | 3           |
| Dismiss | 2           |
| Save    | 1           |
| Apply   | 1           |

::: info Where these counts come from
A manual audit, in September 2026, of the twelve applications that consume this
library (cms, keystone, verba, openbridge, platform, analytics, tally,
openbridge-marketplace, stagewright, planetcraft, stratos, and one
white-label client product), read at their then current default branches. The method was a grep
for literal button and menu-item strings in templates and scripts, plus a read
of every dialog footer. Repeated renders of one label count once, so these are
a floor rather than a total. They are an observation of one moment: re-run the
audit and edit the table, rather than dropping it, because the table is the
whole argument for the rulings below.
:::

Four different words are used for committing a change, and four more for leaving
a surface. Not per product: inside single products. A user who learns that `Done`
commits in one dialog and dismisses in the next has learned nothing.

This page assigns **one label per intent** and bans the rest. It is a lookup
table, not a discussion. [Writing style](./writing-style.md) governs casing,
punctuation and everything that is not a button.

## The rulings, in one screen

| Intent                                                     | Label                                        | Never                                     |
| ---------------------------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| Commit an edit to something that exists                    | `Save`                                       | `Done`, `Apply`, `Update`, `OK`, `Submit` |
| Commit and create a new record                             | `Create <noun>`                              | `Save`, `Add`, `OK`, `Submit`             |
| Attach an existing thing to this context                   | `Add <noun>`                                 | `Create`, `New`, `Insert`                 |
| Send something to someone else                             | `Send`, `Invite`, `Publish`                  | `Save`, `Submit`, `Done`                  |
| Abandon an in-progress change                              | `Cancel`                                     | `Close`, `Back`, `Dismiss`, `No`          |
| Leave a surface that changed nothing                       | `Close`                                      | `Cancel`, `Done`, `Dismiss`, `OK`         |
| Step backwards in a sequence                               | `Back`                                       | `Previous`, `Cancel`                      |
| Step forwards in a sequence                                | `Next`                                       | `Continue`, `Forward`                     |
| Finish a sequence                                          | The final verb (`Create project`, `Publish`) | `Done`, `Finish`, `Submit`                |
| Throw away edits and leave                                 | `Discard`                                    | `Cancel`, `Don't save`, `No`              |
| Destroy a record permanently                               | `Delete`                                     | `Remove`, `Erase`, `Yes`, `OK`, `Confirm` |
| Detach a record that survives elsewhere                    | `Remove`                                     | `Delete`                                  |
| Confirm a destructive action                               | The verb phrase (`Delete environment`)       | `Yes`, `OK`, `Confirm`, `Continue`        |
| Try again after a failure                                  | `Try again`                                  | `Retry`, `Reload`, `Refresh`              |
| Re-fetch data that may have changed, nothing having failed | `Refresh`                                    | `Reload`, `Sync`, `Try again`             |
| Acknowledge a message with no choice                       | `Close`                                      | `OK`, `Got it`, `Dismiss`                 |
| Undo a completed action                                    | `Undo`                                       | `Revert`, `Restore`                       |

Every banned word in the third column exists in the fleet today.

## Commit actions

### The decision, in four questions

Ask them in order and stop at the first yes.

1. **Does the record exist yet?** No: `Create <noun>`. The noun is mandatory in a
   dialog and optional on a page-level button where the context is unambiguous
   (`Create` alone inside a dialog titled `Create environment` is acceptable, but
   `Create environment` is never wrong).
2. **Am I attaching an existing thing?** Yes: `Add <noun>`. `Add member`,
   `Add file` (which is what `NbFileUploader` ships as `buttonLabel`,
   `FileUploader.vue` line 104, and note that this component is not currently
   exported from the package entry, so it is cited here as evidence of the
   library's own register rather than as something to import). Adding is not
   creating; a view that offers both must use both words.
3. **Does the commit leave this system?** Yes: use the domain verb. `Send`,
   `Invite`, `Publish`, `Deploy`, `Share`. These are not saves and calling them
   `Save` hides the consequence.
4. **Otherwise:** `Save`. Every mutation of an existing record, everywhere,
   forever.

### Save

`Save` is the only commit verb for existing records. Not `Apply`, not `Update`,
not `Done`, not `OK`.

| Variant        | Ruling                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `Save`         | Default, whenever the surface is unambiguous                                                                                   |
| `Save changes` | When the surface also contains other saves, or the button sits far from what it saves                                          |
| `Save <noun>`  | `Save draft`, `Save and publish` when there are two commit paths                                                               |
| `Apply`        | Banned. It meant `Save` in one audited product and `preview these filters` in another                                          |
| `Update`       | Banned as a button. It is a fine word in a sentence and a bad word on a control, because it also names the thing being updated |
| `Submit`       | Banned. It is form-machinery vocabulary, not a user intent. Name what submitting does                                          |
| `Done`         | Banned everywhere, in every meaning. See below                                                                                 |

### `Done` is banned

`Done` appears six times in the fleet and means three different things: commit,
close-without-committing, and finish-a-wizard. It is the single largest source of
label ambiguity measured, and there is no context in which a better word does not
exist.

| If your `Done` meant          | Use                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| Save my edits and close       | `Save`                                                                               |
| I have read this, close it    | `Close`                                                                              |
| Finish this multi-step flow   | The final verb: `Create project`, `Publish release`                                  |
| I have finished picking items | `Add 3 files`, `Select` or `Close`, depending on whether the picking already applied |

### Auto-saving surfaces have no commit button

If the surface saves as you type, do not ship a disabled `Save` for reassurance.
Use `NbInlineLoading`, whose defaults are already the right three strings
(`Saving`, `Saved`, `Could not save`), and give the surface a `Close`.

## Exit actions

The rule is about **state**, not about the shape of the surface.

| The surface holds                                                     | Exit label                                       | Placement                                   |
| --------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------- |
| Unsaved changes the user made                                         | `Cancel`                                         | Left of the commit button                   |
| Nothing the user changed (read-only, a detail view, a message)        | `Close`                                          | Left of nothing, or as the only button      |
| A step in a sequence with earlier steps                               | `Back`                                           | Far left, separated from the forward action |
| An overlay dismissed by its own affordance (toast, banner, modal `x`) | No visible label. The accessible name is `Close` | In the corner                               |

So: a settings dialog with edits gets `Cancel` and `Save`. A dialog showing a
generated API key gets one button, `Close`. A four-step wizard gets `Back`,
`Next`, and a final verb. None of them gets `Done` and none gets `Dismiss`.

### `Dismiss` and `OK` are banned as visible labels

`Dismiss` is what the interaction does, not what the user wants. It names the
mechanics of the widget, and the user's intent is to stop looking at it, which
is `Close`.

**Named contradiction in the library:** `NbBanner` defaults its close
affordance's accessible name to `Dismiss` (`Banner.vue` line 55,
`closeLabel: 'Dismiss'`, bound at line 34). It is the outlier of the three close
affordances we ship, and the three are not built the same way:

| Component  | Where the name comes from                                                                                                                                          | Overridable                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `NbModal`  | Hardcoded `aria-label="Close"` in the template (`Modal.vue` line 23)                                                                                               | No. There is no prop                                       |
| `NbToast`  | The `closeLabel` prop, bound at `Toast.vue` line 45, defaulting to `'Close'` at line 123. A whole queue can set it at once through `IToastQueueOptions.closeLabel` | Yes, and it should be, because it is a translatable string |
| `NbBanner` | The `closeLabel` prop, bound at `Banner.vue` line 34, defaulting to `'Dismiss'` at line 55                                                                         | Yes                                                        |

So the ruling is not "the other two hardcode it and Banner should too". Two of
the three are correct by default and one is not, and `NbModal` is arguably the
one to fix, because a hardcoded English name cannot be translated. Until the
default changes, **pass `close-label="Close"` on every `NbBanner`.**

`OK` is banned because it answers a question the button is not asking. A button
labelled `OK` is unreadable in a screen reader's list of actions, where labels
appear stripped of their surrounding text.

### Leaving with unsaved changes

When `Cancel` would destroy work, do not silently discard and do not silently
keep. Raise a confirmation with three exits, worded as verbs:

```vue
<script setup lang="ts">
import { useConfirm } from '@nubisco/ui'

const confirm = useConfirm()

async function attemptClose() {
  if (!dirty.value) return close()
  const ok = await confirm({
    tone: 'neutral',
    title: 'Discard changes',
    message: 'Your edits to this entry have not been saved.',
    confirmLabel: 'Discard changes',
    cancelLabel: 'Keep editing',
  })
  if (ok) close()
}
</script>
```

`Keep editing` rather than `Cancel`, because in a dialog raised by a cancel, the
word `Cancel` no longer has a referent.

Both snippets on this page import from the package root, which is where
`useConfirm` and `dismissConfirms` live, next to `NbConfirm` and the
`IConfirmProps` / `IConfirmOptions` / `TConfirmTone` types. Nothing has to be
installed or mounted first: the first `confirm()` call creates its own host.

## Destructive actions

Sixteen destructive actions in the audited fleet have no confirmation at all,
including deleting a CMS environment and everything in it, regenerating an OAuth
client secret on one unguarded click, clearing local storage from a command
palette, and deleting another user's comment. Seven different confirmation
mechanics exist across twelve applications.

### The confirm button says the verb

The confirming button is labelled with the action it performs, never with an
agreement word.

```
Delete environment      not   Yes
Regenerate secret       not   OK
Remove member           not   Confirm
Sign out everywhere     not   Continue
```

The reason is mechanical, not stylistic. Screen reader users navigate by pulling
a list of the page's actions, where each label appears without the sentence
around it. A list reading `Yes`, `No`, `Cancel` conveys nothing. A list reading
`Delete environment`, `Cancel` conveys the whole dialog.

The same reason bans `Yes` / `No` pairs entirely. The pair also forces the user
back up to re-read the title to find out what they are agreeing to, which is the
exact moment a mis-click happens.

`NbConfirm` defaults `confirmLabel` to `Confirm`. That default exists so the
component never renders an empty button; **always pass the verb phrase.**

### The verb, precisely

| Verb            | Means                                                                                  | Recoverable                   |
| --------------- | -------------------------------------------------------------------------------------- | ----------------------------- |
| `Delete`        | The record is destroyed                                                                | No                            |
| `Remove`        | Detached from this context, still exists elsewhere                                     | Usually                       |
| `Clear`         | Empties a container that survives (a filter, a log, local storage)                     | No, but the container remains |
| `Discard`       | Throws away work that was never committed                                              | No                            |
| `Revoke`        | Withdraws access already granted (a key, an invitation, a session)                     | No                            |
| `Regenerate`    | Replaces a secret, invalidating the old one                                            | No                            |
| `Disconnect`    | Ends an integration, leaves both sides intact                                          | Yes                           |
| `Reset`         | Returns to defaults                                                                    | No                            |
| `Archive`       | Hides from the working set, keeps everything                                           | Yes                           |
| `Cancel <noun>` | Stops a subscription or a running job. Only with an explicit noun, never bare `Cancel` | Depends                       |

Removing a member from a project is `Remove`. Deleting their account is `Delete`.
Using one word for both, which the fleet does, means the user cannot tell which
one they are about to do.

### How much guard, by blast radius

| Blast radius                                                          | Guard                                         | How                                                                          |
| --------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| Reversible within the session (removing a row from an unsaved list)   | None, plus `Undo`                             | A `NbToast` with a `cta` labelled `Undo`                                     |
| One record the user owns, recoverable from elsewhere                  | None, plus `Undo`                             | Same                                                                         |
| One record, unrecoverable                                             | `NbConfirm` `tone="danger"` with `subject`    | The record's name is rendered verbatim in the subject strip                  |
| Access or credentials (`Revoke`, `Regenerate`, `Sign out everywhere`) | `NbConfirm` `tone="danger"`                   | State what breaks: `Any client using this secret stops working immediately.` |
| A container and its contents (an environment, a project, a tenant)    | `NbConfirm` with `type-to-confirm`            | The user types the record's name before the button enables                   |
| Someone else's data (deleting another user's comment)                 | `NbConfirm` `tone="danger"`, naming the owner | `Delete Ana's comment`                                                       |

The full-guard case, with every string doing work:

```vue
<script setup lang="ts">
import { useConfirm } from '@nubisco/ui'

const confirm = useConfirm()

async function deleteEnvironment(env: { name: string }) {
  await confirm({
    title: 'Delete environment',
    message:
      'Every entry, release and API key in it is deleted. This cannot be undone.',
    subjectLabel: 'Environment',
    subject: env.name,
    typeToConfirm: env.name,
    confirmLabel: 'Delete environment',
    busyLabel: 'Deleting...',
    onConfirm: () => api.deleteEnvironment(env.name),
  })
}
</script>
```

`title` is the action, not a question. `message` is the consequence, not the
mechanics. `subject` is the record, verbatim. `confirmLabel` repeats the verb so
the button stands alone. `busyLabel` uses the same verb in the present.

### The confirm button is `variant="danger"`

`docs/ui/components/modal.md` lines 43 to 72 currently demonstrate a destructive
confirmation, and it breaks five rulings at once. One audited application's
markup is a near-copy of it, primary-styled destructive button included, so this
is not a hypothetical. Do not follow that example.

| What the example ships                                       | Ruling it breaks                                                                                                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<NbButton variant="primary">Confirm</NbButton>` on a delete | Two failures in one control: a destructive confirm is `variant="danger"`, and `Confirm` is on this page's [ban list](#ban-list). It should be the verb phrase, in danger       |
| `<template #header>Confirm Action</template>`                | Title case, banned by [Writing style](./writing-style.md#sentence-case-everywhere). And the title should be the action (`Delete environment`), not a description of the dialog |
| `Are you sure you want to continue? This cannot be undone.`  | The message is the consequence, not a question. `Are you sure?` is the string [Writing style](./writing-style.md#voice) names as the canonical thing not to write              |
| An `NbPanel` with `style="padding: 12px"` inside `#footer`   | Layout drift: `NbModal` already wraps `#footer` in an `NbGrid justify="end"` (`Modal.vue`), so the panel adds a second grid and a hardcoded pixel padding over the top of it   |
| A hand-assembled dialog at all                               | A destructive confirmation is `useConfirm()`. Assembling one from `NbModal` loses the focus placement, the `type-to-confirm`, the busy state and the `role="alertdialog"`      |

The corrected version of that footer is not a corrected footer. It is the
`useConfirm()` call under [How much guard, by blast radius](#how-much-guard-by-blast-radius).

`NbConfirm` gets this right and is the reason to use it rather than assembling a
dialog: the cancel is a ghost button that holds initial focus, and the confirm
carries the danger variant and sits where the hand rests but nothing lands.

::: warning Never `window.confirm`
It is a documented no-op inside a Tauri webview and cannot be driven by a
gamepad. Two applications in the fleet hit that wall independently. `useConfirm()`
needs nothing installed and nothing mounted: the first call creates its host.
:::

## Toggles

A toggle labels **the thing it controls**, in its current-agnostic form. It never
labels the action, and it never changes its label when it flips.

```vue
<NbSwitch v-model="notifyByEmail" label="Email notifications" />
```

Not `Enable email notifications`, which reads as a lie when the switch is on, and
not a label that becomes `Disable email notifications` once toggled, which makes
the on state indistinguishable from the off state at a glance.

| Control                                             | Label                                                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `NbSwitch`, `NbCheckbox`                            | The noun: `Email notifications`, `Public access`                                                   |
| A button that toggles a view (the state is visible) | The action it will perform: `Hide details`, `Show details`                                         |
| An icon-only toggle                                 | `aria-pressed` plus a stable name: `aria-label="Pin entry"` with `aria-pressed="true"` when pinned |
| A `selectable` `NbMenuItem`                         | The noun, with the check mark carrying the state                                                   |

The split is deliberate. A switch shows its state visually, so its label must
stay still. A plain button shows nothing, so its label must move.

## Empty-state calls to action

`NbEmptyState` types the four situations, and each one takes exactly one primary
action. The component's own comment is the rule: an empty state covering several
options stops being guidance and becomes a menu.

| `kind`       | Title                                                               | Action                                                              |
| ------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `empty`      | Forward-looking, not a negation: `Start by creating an environment` | `Create environment`                                                |
| `no-results` | `No entries match your filters`                                     | `Clear filters`. Never an action that creates something             |
| `error`      | `Could not load entries`                                            | `Try again`                                                         |
| `forbidden`  | `You do not have access to this project`                            | Usually none. `Request access` only if that request actually exists |

```vue
<NbEmptyState
  kind="no-results"
  title="No entries match your filters"
  description="Try a broader search, or clear the filters to see everything."
>
  <template #actions>
    <NbButton variant="secondary" @click="clearFilters">Clear filters</NbButton>
  </template>
</NbEmptyState>
```

Offering `Create entry` on a `no-results` state is the most common error here:
the data exists, the filter is hiding it, and the user is one click from adding a
duplicate.

## Icon-only controls and menu items

| Control                              | Rule                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Icon-only button                     | Must carry an `aria-label` that is the same verb phrase a visible label would use: `aria-label="Delete entry"`, not `"Delete"` or `"Trash"` |
| Menu item (`NbMenuItem` `label`)     | Verb phrase, sentence case, no ellipsis unless it opens a further step. Destructive items take `danger`                                     |
| Overflow menu trigger                | `aria-label="More actions"`                                                                                                                 |
| Close affordance                     | `aria-label="Close"`, matching `NbModal` and `NbToast`                                                                                      |
| Sort, filter and pagination controls | Name the direction and the target: `Previous page`, `Next page`, which is what `NbPagination` already ships                                 |

An `aria-label` is a label. Everything on this page applies to it.

## Accessibility

A label is an accessible name. Everything on this page is therefore an
accessibility rule as well as a content rule, and these are the specifics.

### The action list is why the verb phrase wins

Screen reader users do not read a dialog top to bottom to find its buttons.
They pull a list of the page's actions, in which every label appears stripped
of the sentence around it. The whole ruling on destructive confirmations
follows from that one fact:

```
Delete environment, Cancel        the dialog, understood from the list alone
Yes, No                           two words, no object, no consequence
OK, Cancel                        which one is the deletion?
```

The same list is what makes `Done` unusable. Six occurrences in the fleet
carrying three meanings become six identical rows in a list with nothing to
tell them apart.

### Label in name: an `aria-label` may extend the visible text, never replace it

The rule above (an icon-only control carries the full verb phrase in its
`aria-label`) has a hard limit the moment the control also shows text. If a
control has visible text, its accessible name must contain that text, in the
same order (WCAG 2.5.3).

| Control                                   | `aria-label`                           | Verdict                                                                                                        |
| ----------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Icon only, a trash glyph                  | `Delete entry`                         | Correct. The label is the whole name                                                                           |
| Icon only, an overflow glyph              | `More actions`                         | Correct                                                                                                        |
| Visible `Delete`, in a row for Production | `Delete Production`                    | Correct. It extends the visible word                                                                           |
| Visible `Delete`                          | `Remove environment`                   | **Wrong.** The visible word is gone from the name                                                              |
| Visible `Save`                            | `Save the current draft to the server` | Wrong in practice. It contains `Save`, so it passes 2.5.3, but it buries the name it was meant to disambiguate |

The failing row is not theoretical. A voice control user says the word they can
see, and `click Delete` matches nothing when the accessible name is `Remove
environment`. The control looks perfectly labelled and cannot be operated.

The consequence for this page: **the visible label is the source of truth, and
the `aria-label` is derived from it**, never the other way round.

### Two controls in one view must not share a name

`Delete` on eight table rows is eight identically named actions in the action
list. Disambiguate with the row's subject (`Delete Production`), which is the
same string the confirmation's `subject` prop will show. If the subject is too
long to be a name, use its position (`Delete row 4`) rather than nothing.

### Toggles announce state, so the label must not

An icon-only toggle carries a stable `aria-label` naming the thing, plus
`aria-pressed` carrying the state:

```vue
<NbButton
  icon="push-pin"
  :aria-pressed="pinned"
  aria-label="Pin entry"
  @click="pinned = !pinned"
/>
```

Not `aria-label="Unpin entry"` when pinned. A name that changes underneath a
user is a different control as far as the action list is concerned, and
`aria-pressed` already says `pressed`. `NbSwitch` and `NbCheckbox` handle this
for you, which is the reason the switch table above rules the way it does: the
switch shows its state, so its label stays still.

A plain button that toggles a visible region is the opposite case. Nothing
carries its state, so the label carries the next action (`Show details` /
`Hide details`) and `aria-expanded` carries the current one.

### `danger` is a colour, and colour is not a label

`NbMenuItem`'s `danger` prop paints the row. It announces nothing. The word in
the label is the only thing a screen reader user gets, which is another reason
the register bans `Clear` and `Reset` standing alone in a menu: `Clear
filters`, `Reset layout`, `Delete entry`.

### Focus order in a confirmation

`NbConfirm` puts initial focus on **Cancel**, never on the confirming button.
The reading order is title, message, then the cancel label, which is why
`cancelLabel` has to answer the title (`Keep editing` answers `Discard
changes`) and why `No` fails: it is the last thing heard before the user
decides, and on its own it means nothing.

Escape cancels, and while `busy` is true it stops cancelling, because an action
already fired cannot be un-fired by closing the dialog. Do not add your own
Escape handler on top.

### A disabled control explains itself somewhere else

A disabled button is not feedback. It is the absence of feedback, and it is
skipped by some screen reader navigation entirely. If a commit is disabled,
something visible and readable has to say why: a field-level `error`, a
`NbMessage` under the form, or a hint. Never a disabled `Save` as the only
signal that a form is incomplete.

## The ellipsis rule

An ellipsis means one thing: **this control needs more from you before it can
act.** Not "this opens something". Not "this takes a while".

Takes an ellipsis:

```
Export...            opens a dialog that asks which format. Ellipsis.
Rename...            opens a dialog with an input to fill in. Ellipsis.
Move...              opens a picker to choose a destination. Ellipsis.
Invite member...     opens a form that collects an address. Ellipsis.
```

Takes none:

```
Export as CSV        writes the file immediately. Nothing to collect.
Rename               starts an inline edit in place. The control acted.
Save                 nothing further is collected, ever.
Delete               raises a confirmation, which is a guard, not a question
                     about what to delete. Nothing is collected.
```

Banned:

```
Delete...            treats a confirmation as an input step. Write Delete.
Save...              nothing is collected. Write Save.
Loading...           not a control at all. A progress string belongs on the
                     component's own loading state, never on a button label.
Rename…              the single U+2026 character. Write three ASCII periods.
```

The confirmation case is the one people get wrong, so it is worth stating twice:
raising a confirmation is guarding, not collecting. A `Delete` that opens
`NbConfirm` takes no ellipsis, and neither does a `Sign out` that asks whether
you meant it.

The other allowed use is a progress string, where the ellipsis marks work in
flight rather than input pending: `Deleting...`, and `Working...`, which is
`NbConfirm`'s `busyLabel` default.

## Ban list

Every one of these appears in the fleet today. Replace on sight.

| Banned                                                | Use                                                                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `OK`                                                  | The verb, or `Close`                                                                                                              |
| `Yes` / `No`                                          | The verb, and `Cancel`                                                                                                            |
| `Done`                                                | `Save`, `Close`, or the final verb                                                                                                |
| `Apply`                                               | `Save`                                                                                                                            |
| `Update` (as a button)                                | `Save`                                                                                                                            |
| `Submit`                                              | The domain verb: `Send`, `Create <noun>`, `Publish`                                                                               |
| `Dismiss` (visible)                                   | `Close`                                                                                                                           |
| `Got it`                                              | `Close`                                                                                                                           |
| `Confirm` (as the confirm button)                     | The verb phrase                                                                                                                   |
| `Continue` (as a destructive confirm)                 | The verb phrase                                                                                                                   |
| `Retry`                                               | `Try again`                                                                                                                       |
| `Previous` (in a sequence)                            | `Back`                                                                                                                            |
| `New` (as a button)                                   | `Create <noun>` or `Add <noun>`                                                                                                   |
| `Edit` on a control that also saves                   | `Save` on the commit, `Edit` only on the control that enters edit mode                                                            |
| `Erase`, `Destroy`, `Kill`, `Nuke`                    | `Delete`                                                                                                                          |
| `Login` / `Log out`                                   | `Sign in` / `Sign out`                                                                                                            |
| `Sign up` / `Register` / `Join`                       | `Create account`                                                                                                                  |
| `Reload`                                              | `Refresh` for data, and nothing at all for the page: the browser already has that control                                         |
| `Learn more` (as link text)                           | The destination, named: `Read the release checklist`                                                                              |
| `Click here`, `here`                                  | The destination, named                                                                                                            |
| `Sync`                                                | `Refresh`, unless the product's domain really is synchronisation                                                                  |
| `Manage`                                              | The verb the screen behind it actually offers, or `Edit`                                                                          |
| `Options`, `Preferences`, `Config`                    | `Settings`                                                                                                                        |
| `Whitelist` / `Blacklist` (as a verb or a button)     | `Allow` / `Block`, and `Allowlist` / `Blocklist` for the noun                                                                     |
| `Master` (of a branch, a copy, a record)              | `Main`, `Source`, `Primary`                                                                                                       |
| `Sanity check`, `Blind spot`, `Kill`, `Nuke`, `Abort` | The plain verb: `Check`, `Gap`, `Stop`, `Delete`, `Cancel`. See [bias-free terminology](./writing-style.md#bias-free-terminology) |
| Any label ending in `!`                               | The same label without it                                                                                                         |

## Full register

The canonical label for each intent. It is not a dictionary of every word a
product might need, and it is not finished: it is the set of intents the audited
fleet actually hits, which is why the same fifty rows keep appearing across
twelve applications.

If your view needs an intent that is not here, the rule is not "invent one
locally". It is: pick the closest existing row and use it, or add a row to this
table in the same pull request that ships the label. The register is the
contract. It has grown twice already and it will grow again.

The register is a register of **intents**, not of English words. A localised
product translates the right-hand meaning, not the left-hand string, and the
one-label-per-intent rule is what makes that possible: twelve intents map to
twelve keys, where four synonyms for "commit" would map to four keys a
translator has no way to tell apart. Every label the library itself renders is a
prop with an English default (`NbConfirm`'s `confirmLabel` / `cancelLabel` /
`busyLabel`, `NbPagination`'s `pageSizeLabel` / `itemLabel`, `NbToast`'s
`closeLabel`, `NbNotificationCenter`'s `markAllLabel`), so passing translated
strings needs nothing from us. The one exception is `NbModal`'s hardcoded
`aria-label="Close"`, noted above. Never build a label by concatenation
(`t('delete') + ' ' + noun`): `Delete environment` is one string with one
placeholder, because word order is not universal. The rest of the translation
rules are in [Writing style](./writing-style.md#writing-for-translation).

| Label                         | Use it for                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `Add <noun>`                  | Attaching an existing thing to this context                                                                                 |
| `Approve` / `Reject`          | Deciding on something submitted for review. Pair them; never `Approve` against `Decline`                                    |
| `Archive`                     | Hiding a record from the working set while keeping it                                                                       |
| `Back`                        | Moving to the previous step in a sequence                                                                                   |
| `Cancel`                      | Abandoning an in-progress change                                                                                            |
| `Cancel <noun>`               | Stopping a subscription or a running job                                                                                    |
| `Clear` / `Clear filters`     | Emptying a container that itself survives                                                                                   |
| `Close`                       | Leaving a surface that changed nothing                                                                                      |
| `Clear selection`             | Deselecting everything, without acting on it                                                                                |
| `Copy`                        | Copying to the clipboard. Pair with a `success` toast: `Copied`                                                             |
| `Create <noun>`               | Bringing a new record into existence                                                                                        |
| `Create account`              | Registration. Never `Sign up`                                                                                               |
| `Delete` / `Delete <noun>`    | Destroying a record permanently                                                                                             |
| `Disconnect`                  | Ending an integration                                                                                                       |
| `Discard` / `Discard changes` | Throwing away uncommitted work                                                                                              |
| `Download`                    | Transferring a file to the user's machine                                                                                   |
| `Duplicate`                   | Creating a copy of an existing record                                                                                       |
| `Edit`                        | Entering edit mode. Never the commit                                                                                        |
| `Export`                      | Producing a file in another format                                                                                          |
| `Filter`                      | Narrowing a visible set                                                                                                     |
| `Import`                      | Reading records in from another format                                                                                      |
| `Hide <noun>`                 | Collapsing something currently shown. Pairs with `Show <noun>` on the same control                                          |
| `Invite`                      | Sending an invitation to a person                                                                                           |
| `Keep editing`                | Staying, in a discard confirmation                                                                                          |
| `Mark all as read`            | Clearing the unread state of a notification list, which is what `NbNotificationCenter` ships as `markAllLabel`              |
| `Move <noun>` / `Move...`     | Relocating a record. The ellipsis form when a destination has to be picked                                                  |
| `Next`                        | Moving to the next step in a sequence                                                                                       |
| `Preview`                     | Showing what a change will look like without committing it                                                                  |
| `Print`                       | Sending the current view to the printer                                                                                     |
| `Publish`                     | Making content live                                                                                                         |
| `Redo`                        | Reapplying an action that was undone. Only ever next to `Undo`                                                              |
| `Refresh`                     | Re-fetching data that may have changed. Never after a failure, which is `Try again`                                         |
| `Regenerate`                  | Replacing a secret                                                                                                          |
| `Remove`                      | Detaching a record that survives elsewhere                                                                                  |
| `Rename`                      | Changing a name                                                                                                             |
| `Reset`                       | Returning to defaults                                                                                                       |
| `Restore`                     | Returning an archived or deleted-to-trash record to the working set. Not a synonym for `Undo`                               |
| `Revoke`                      | Withdrawing access already granted                                                                                          |
| `Save` / `Save changes`       | Committing edits to something that exists                                                                                   |
| `Search`                      | Matching text                                                                                                               |
| `Select`                      | Choosing the highlighted thing in a picker, when the choice is not applied until you press it                               |
| `Select all`                  | Selecting every row in the current view, which is the current view and not the whole table. Say which if it could be either |
| `Show <noun>`                 | Revealing something currently hidden. The label states what pressing it will do, because the state is not otherwise visible |
| `Send`                        | Delivering something to someone                                                                                             |
| `Share`                       | Granting others access                                                                                                      |
| `Sign in` / `Sign out`        | Session                                                                                                                     |
| `Sort by <field>`             | Ordering a list. The bare word `Sort` only on a control that opens a chooser, where it takes an ellipsis                    |
| `Try again`                   | Repeating a failed action                                                                                                   |
| `Undo`                        | Reversing a completed action                                                                                                |
| `Upload`                      | Transferring a file to the product                                                                                          |

## The mechanical rewrite

1. List every control in the view: buttons, menu items, icon buttons, empty-state
   actions, dialog footers.
2. For each, write down the intent in one sentence, then take the label from the
   register. Do not keep the existing label because it is close.
3. Replace every `Done`, `OK`, `Yes`, `No`, `Apply`, `Submit`, `Dismiss`,
   `Continue`, `Retry` and `New` using the ban list.
4. Check every exit label against the state rule: unsaved changes take `Cancel`,
   nothing changed takes `Close`, a sequence takes `Back`.
5. Find every destructive path. Anything that deletes, revokes, regenerates,
   clears or resets goes through `useConfirm()`, with the guard level from the
   blast-radius table and the verb phrase in `confirmLabel`.
6. Delete every `window.confirm`, `alert` and unguarded destructive click
   handler.
7. Check every icon-only control has an `aria-label` that is the same verb phrase
   as a visible label would be, and that no `aria-label` on a control with
   visible text replaces that text.
8. Check every toggle labels a noun and does not change its label when it flips,
   and that an icon-only toggle carries `aria-pressed`.
9. Check that no two controls in the view share an accessible name.
10. Check ellipses: only where the control will collect more input, only three
    ASCII periods, and never on a control that raises a confirmation.
11. Run [Writing style](./writing-style.md) over the result for casing,
    punctuation and everything that is not a verb.

## Checklist

- [ ] One label per intent, every one of them taken from the register.
- [ ] No `Done`, `OK`, `Yes`, `No`, `Apply`, `Submit`, `Dismiss`, `Got it`,
      `Retry`, `New`, `Sign up` or `Learn more` anywhere in the view.
- [ ] Exit labels match the state rule: `Cancel` with unsaved changes, `Close`
      with none, `Back` in a sequence.
- [ ] Every destructive path goes through `useConfirm()` at the guard level its
      blast radius calls for, and no `window.confirm` survives.
- [ ] Every confirming button is the verb phrase, and carries `variant="danger"`
      when the action is destructive.
- [ ] Every icon-only control has a verb-phrase `aria-label`; no `aria-label`
      contradicts visible text.
- [ ] No two controls in the view share an accessible name.
- [ ] Ellipses only where more input is collected.
- [ ] Every empty state offers exactly one action, and `no-results` does not
      offer to create anything.
