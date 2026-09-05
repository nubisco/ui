---
layout: nubisco
title: Notifications, and choosing a surface
description: The seven surfaces that can carry a message, the six questions that pick exactly one of them, what each surface must contain, and a checklist for finding messages on the wrong surface in an existing view.
---

This library ships **five surfaces that carry a message** and **two that
interrupt**. Nothing in it ever said which one to reach for, so twelve
applications answered the question twelve times, and every one of them answered
it differently. This page is the answer.

The rule everything below follows:

> **A message goes on the surface that matches its lifetime and its scope, never
> on the surface that matches how it feels.**

"Feels important" is not a scope. An error about one field and an error about
the whole account are both errors, they are both red, and they belong on
different surfaces because the user does different things with them. Severity
picks the `status` or the `variant`. It never picks the component.

::: info Where the evidence on this page comes from
Claims about "the audit" refer to a review of the twelve applications that
consume this library (cms, keystone, verba, openbridge, platform, analytics,
tally, openbridge-marketplace, stagewright, planetcraft, stratos, and one
white-label client product). That review is a report about **those** repositories and is not
checked into this one, so do not go looking for it here. Everything it found in
_this_ repository is checkable here, and is linked where it is used.
:::

---

## What the fleet does today

Notifications were the widest defect in the audit, because every product has
them and no product had a rule.

- **Three applications hand-built a toast host and queue**, because
  [`docs/ui/components/toast.md`](/ui/components/toast) used to state as policy
  that the library shipped no container. Each lost something different: one had
  no auto-dismiss at all, so success toasts accumulated for the life of the
  route; one dropped `role="alert"`, the variant icon, the action and
  pause-on-hover, and hardcoded a border radius; one wrote `var(--nb-z-toast)`,
  a token that has never existed, and silently ran on the CSS fallback instead
  of `--nb-zindex-toast`.
- **Three applications hand-built a notification bell**, at 312, 343 and 308
  lines. One of those files carries a layout comment saying it put the bell
  beside the user menu "where Verba puts it, so the two consoles do not disagree
  about where the bell is". Convergence maintained by prose is not convergence.
- **The fleet disagrees about where an error goes.** cms leans on `NbBanner`,
  openbridge-marketplace leans on `NbMessage`. One product renders 30
  page-level errors through `NbMessage`, which is a 12px inline-flex helper
  built to sit under a form control. A live example: cms reports a failed media
  upload as an inline `NbMessage` (`src/components/MediaLibrary.vue:57`) in an
  application that already renders `NbBanner` in the shell notification region
  in eighteen other places.
- **One product throws 21 `alert()` calls** for exceptions. Another has a global
  error handler that only calls `console.error`, so a failed request is
  invisible to the person it failed for.
- **Success feedback is absent or bespoke in nine applications.** platform,
  tally, planetcraft, stagewright and the white-label product confirm a successful save with
  nothing at all.
- **Loading was in the same state**: two different spinners in one product (one
  of them ignoring `prefers-reduced-motion`), the literal string `Loading` under
  eight different class names in another, `Loading…` and `Loading...` in two
  files of a third, and one application where import and update are entirely
  silent. Three applications hand-built skeletons in five shapes, and in one of
  them a single `.empty-text` renders both the loading state and the empty
  state, so a failed fetch reads as "no contacts yet".

None of that was careless. It is what these surfaces cost when the decision is
left to each call site.

---

## The seven surfaces

| Surface                                                      | What it is                                                    | Lifetime                                   | Scope                              | Blocks  | Re-readable                       |
| ------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------ | ---------------------------------- | ------- | --------------------------------- |
| [`NbMessage`](/ui/components/message)                        | 12px text with a 14px icon, positioned by a control           | As long as the value is wrong              | **One field**                      | No      | Yes, while the field is on screen |
| [`NbBanner`](/ui/components/banner) `variant="inline"`       | A filled block above the content it concerns                  | Until dismissed, or until the page changes | **One page, form or region**       | No      | Yes                               |
| [`NbBanner`](/ui/components/banner) `variant="callout"`      | The same block, not dismissible                               | As long as the fact is true                | **One page or one region**         | No      | Yes                               |
| The shell `notification` region                              | A `flush` banner in [`NbShell`](/ui/components/shell)'s strip | As long as the fact is true                | **The account or the whole app**   | No      | Yes                               |
| [`useToast()`](/ui/composables/use-toast) + `NbToaster`      | A stack in one viewport corner                                | Seconds, by variant                        | **One action, just taken**         | No      | **No**                            |
| [`NbNotificationCenter`](/ui/components/notification-center) | The bell, and the panel of what happened                      | Until the host drops the row               | **Things that happened offscreen** | No      | Yes, on demand                    |
| [`useConfirm()`](/ui/composables/use-confirm) / `NbModal`    | A dialog over an inert page                                   | Until answered                             | **One decision**                   | **Yes** | Only while open                   |

Two of those seven are not really "notifications" and are on the list because
products keep using them as one: a dialog is a **question**, and the notification
centre is a **log**. Both are covered below, because putting a message on either
by mistake is one of the two most common failures in the fleet (the other is
putting it on a toast).

The three that render in place, at their real sizes, in one frame. Everything
below is the live component, not a picture of one:

<preview dir="col">
  <div class="nfx-stack">
    <NbMessage variant="error">Enter a value between 1 and 99</NbMessage>
    <NbBanner status="error" variant="inline" title="Could not publish the release">The environment has unresolved links. Resolve them and publish again.</NbBanner>
    <NbBanner status="info" variant="callout" title="This draft is waiting for approval">Visitors still see the published version.</NbBanner>
  </div>
</preview>

The size difference is the whole argument of this page. The first is 12px of
text under a control, and the two below it are blocks that own the width of the
page. A sentence about the release does not fit in the first one, and the state
of one field does not deserve either of the others. The remaining four surfaces
are demonstrated in their own sections below, because a toast, a bell, a shell
strip and a dialog only exist once something has happened.

---

## The decision procedure

Take the sentence you are about to show a user and answer these six questions in
order. The first one that answers "yes" ends the procedure.

### 1. Must everything stop until the user answers it?

Only one thing qualifies: **a decision that cannot be taken back, taken by
someone who might not have meant to take it.** That is
[`useConfirm()`](/ui/composables/use-confirm), and the whole contract for it is
[Dialogs and destructive confirmation](/patterns/dialogs).

If the answer is "no, but it is very important", it still does not block. There
is no severity that promotes a message to a dialog. Notice also that a dialog is
not a way of _telling_ the user something: a dialog asks, and a dialog you can
only acknowledge is an `alert()` wearing our tokens.

### 2. Must the user do something about it, later?

If the message contains a task ("three rows were rejected, fix them and import
again", "your payment method expires on Friday"), it cannot live on a surface
that removes itself. That rules out the toast, permanently, and leaves you with
a banner, the shell region, or a row in the notification centre.

### 3. Must the user be able to re-read it?

An error code, a request id, a list of what failed, a filename, anything the
user might paste into a support ticket: a toast is gone and unrecoverable four
seconds later, and there is no history to scroll back to. That is a banner, or a
row in the notification centre, or both.

### 4. Did this user cause it, and are they still standing in front of it?

- **They caused it, and the thing it is about is on screen**: report it in place.
  A field error at the field, a form failure at the top of the form, a page
  failure at the top of the page.
- **They caused it, and the thing it is about is not on screen** (a request
  fired from a menu they closed, a background export, a bulk action they have
  navigated away from): a toast.
- **They did not cause it**: it is either a standing fact about the account (the
  shell region) or something that happened while they were elsewhere (the
  notification centre). It is never a toast, unless it changes what they can do
  _right now_ ("Connection restored").

### 5. What is its scope?

This is the question the fleet gets wrong most often. Find the smallest thing
the message is true about, and the surface follows from it. See the table below.

### 6. Is it still true after the message disappears?

If yes, it is not an event, it is a **condition**, and a condition on a surface
with a lifetime has been told to the user exactly once, at random. Conditions
are `variant="callout"` banners, which cannot be dismissed because dismissing
one would not make it untrue.

That single question resolves most of the mis-shelved `warning` toasts in the
fleet. "Your trial ends in three days" is true for as long as the page is.
"Three of ten rows were skipped" is finished and imperfect, and is a toast (or a
banner, if the user has to go and fix those three rows, because then question 2
already answered).

---

## The decision table

Scope down the left, and what the user has to do across the top. Find your row
and take the cell.

| The message is about                               | Nothing to do, it is news                    | The user must act on it                                             | Where it goes                                                                               |
| -------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **One field's value**                              | `NbMessage variant="helper"`                 | `NbMessage variant="error"`, or the control's `error`               | Under the control, always. [Forms, rule 11](/patterns/forms)                                |
| **One row or one card in a list**                  | The row itself: a badge, a state             | The row, plus one summary line above the list                       | [Status indicators](/patterns/status-indicators)                                            |
| **One form's submit**                              | Not a thing: a submit either worked          | `NbBanner status="error" variant="inline"`                          | Top of the form body. [Forms, rule 12](/patterns/forms)                                     |
| **One page or region, right now**                  | `NbBanner variant="inline"`                  | `NbBanner variant="inline"` with an action                          | Above the content it concerns                                                               |
| **One page or region, for as long as it is open**  | `NbBanner variant="callout"`                 | `NbBanner variant="callout"` with an action                         | Top of the page body, not dismissible                                                       |
| **The account or the application**                 | `NbBanner flush variant="callout"`           | The same, with an action                                            | `NbShell`'s `notification` region. [The app frame](/patterns/app-frame)                     |
| **An action the user just took, offscreen result** | `toast.success()` / `toast.info()`           | `toast.error()` with a `cta`, or a banner if there is a page for it | The toaster. [useToast](/ui/composables/use-toast)                                          |
| **Something that happened while they were away**   | A row in the notification centre             | A row **and** the surface the task actually lives on                | [`NbNotificationCenter`](/ui/components/notification-center)                                |
| **An irreversible decision, not yet taken**        | Not applicable                               | `useConfirm()`                                                      | [Dialogs](/patterns/dialogs)                                                                |
| **A task with its own fields and its own commit**  | Not applicable                               | `NbModal`                                                           | [Modal](/ui/components/modal)                                                               |
| **An operation still running**                     | `NbInlineLoading`, `NbSpinner`, `NbSkeleton` | Same, then report the outcome                                       | Beside the thing that is running. Not a notification at all                                 |
| **An exception the user cannot act on**            | Nothing on screen but a generic failure      | A mapped, human failure on the surface above                        | The raw one goes to your logger. [Writing style](/content/writing-style#raw-exception-text) |

Two rows deserve their own sentence, because both are shipping today:

- **`NbMessage` is not a page-level surface.** It is `font-size: 12px`, an
  `inline-flex` with a 14px icon, no title, no action slot and no dismiss. Thirty
  page-level errors rendered through it read as orphaned validation errors
  attached to nothing. The documented answer is `NbBanner variant="inline"`.
- **A banner is not a row-level surface.** A 44px block inside a table row to say
  "Active" is the same mistake pointing the other way.

---

## `NbMessage`: one field, and nothing larger

**Use it** for something the field itself has to say about its own value: an
error, a warning about an accepted-but-risky value, a success ("Username is
available"), or a helper hint.

**Do not use it** for anything larger than the control it sits under. Not the
form, not the page, not a failed upload, not a network error. If the sentence
does not fit under a 200px-wide input without looking wrong, it is not a field
message.

**It must contain** one sentence naming the constraint, in the register of
[Writing style](/content/writing-style#field-validation-copy). It carries
`role="status"`, and `aria-live="assertive"` when `variant="error"`, so it is
announced where it is. When the control is an `NbTextInput`, prefer the
control's own `error` prop over a loose `NbMessage`, so the description is wired
to the input for you: see [Building a form](/patterns/forms).

This is the live example from the audit, both ways round. On the left is a
failed media upload reported the way one application ships it today; on the
right is the same failure on the surface this page rules for it:

<preview dir="col">
  <div class="nfx-pair">
    <div class="nfx-half nfx-half--wrong">
      <p class="nfx-label">Wrong: a page-level failure in a 12px field helper</p>
      <NbMessage variant="error">Could not upload launch-hero.png: the file is 14 MB and the limit is 10 MB (request 8f21c3)</NbMessage>
      <p class="nfx-note">Attached to no control, so it reads as validation for whatever happens to be above it. No title, no action, and nowhere to put one.</p>
    </div>
    <div class="nfx-half nfx-half--right">
      <p class="nfx-label">Right: NbBanner variant="inline"</p>
      <NbBanner status="error" variant="inline" title="Could not upload launch-hero.png">The file is 14 MB and the limit is 10 MB. Resize it, or link it from the asset store instead.<template #action><NbButton size="sm" variant="ghost">Choose another file</NbButton></template></NbBanner>
      <p class="nfx-note">Names what happened, says why, and carries the next step in the action slot.</p>
    </div>
  </div>
</preview>

`NbMessage` is correct at the only scope it has, which is one control's own
value. The first of these two is the loose message, the second is the same
sentence wired to the input through the control's `error` prop, which is what
[Building a form](/patterns/forms) asks for:

<preview dir="col">
  <div class="nfx-stack nfx-stack--narrow">
    <NbTextInput label="Workspace name" name="nfx-ws" model-value="Marketing site" error="A workspace name cannot contain a slash" />
    <NbMessage variant="helper">Used in the URL, so letters, numbers and hyphens only</NbMessage>
  </div>
</preview>

---

## `NbBanner variant="inline"`: this page, right now

**Use it** for the outcome of something the user did that belongs to a surface
still in front of them: a submit the server rejected, a save that failed, a bulk
action that partly succeeded, a page that could not load part of itself.

**Do not use it** for:

- Something the user cannot see the subject of. That is a toast.
- A standing fact. That is `variant="callout"`, and the difference is
  question 6.
- One field. That is `NbMessage`.
- A question. A banner has no answer, so a banner that asks one is a dead end.

**It must contain** a `title` that names what happened, a body that says why and
what to do next, and, when there is a next step, an action in the `action` slot.
`status="error"` gives it `role="alert"` and `aria-live="assertive"`; every
other status is `role="status"` and polite, which is correct and deliberate (see
[Politeness](#politeness-role-and-why-a-status-is-not-an-alert)).

It may be `dismissible`, because an outcome has been read once it has been read.

```vue
<NbBanner status="error" variant="inline" title="Could not publish the release">
  The environment has unresolved links. Resolve them and publish again.
  <template #action>
    <NbButton size="sm" variant="ghost" @click="showLinks">Show links</NbButton>
  </template>
</NbBanner>
```

The controls under this one are the real props. Flip `status` and the ground,
the ink and the icon change together, which is the whole of what severity is
allowed to decide. Flip `variant` to `callout` and the close button disappears
even with `dismissible` on, because a standing fact does not stop being true
when you look away. Flip `flush` and you get the shape the shell strip expects:

<preview :props="bannerProps" v-slot="{ resultingProps }">
  <div class="nfx-stack">
    <NbBanner v-bind="resultingProps">The environment has unresolved links. Resolve them and publish again.<template #action><NbButton size="sm" variant="ghost">Show links</NbButton></template></NbBanner>
  </div>
</preview>

---

## `NbBanner variant="callout"`: what stays true

**Use it** for a condition that loads with the page and remains true while the
page is open: a draft awaiting approval, a trial expiring, an environment that
is not production, a record someone else has locked.

**Do not use it** for an outcome. A callout that says "Saved" is a lie the
moment the next edit happens, and one audited product wrapped its own six-second
timer around exactly that to make it go away.

**It must contain** the fact, and the route out of it if there is one. It is not
dismissible: passing `dismissible` to a callout does nothing, deliberately,
because dismissing it would not make it untrue.

Both of these pass `dismissible`. Only one of them should have been a callout at
all, and the missing close button on the other is the component refusing to make
an outcome permanent:

<preview dir="col">
  <div class="nfx-pair">
    <div class="nfx-half nfx-half--wrong">
      <p class="nfx-label">Wrong: an outcome frozen into a condition</p>
      <NbBanner status="success" variant="callout" title="Saved" dismissible>Your changes have been saved.</NbBanner>
      <p class="nfx-note">Still says "Saved" after the next edit, and cannot be dismissed. This is the banner one audited product wrapped a hand-written six-second timer around.</p>
    </div>
    <div class="nfx-half nfx-half--right">
      <p class="nfx-label">Right: an outcome is an inline banner</p>
      <NbBanner status="success" variant="inline" title="Draft saved" dismissible>Visitors still see the published version.</NbBanner>
      <p class="nfx-note">Reports something that finished, so it can be read once and closed.</p>
    </div>
  </div>
</preview>

The callout the first one wanted to be is the fact underneath it, which is true
for as long as the page is open and has a way out of it:

<preview dir="col">
  <div class="nfx-stack">
    <NbBanner status="warning" variant="callout" title="Your trial ends in 3 days">After that the workspace becomes read-only until a plan is chosen.<template #action><NbButton size="sm" variant="ghost">See plans</NbButton></template></NbBanner>
  </div>
</preview>

---

## The shell `notification` region: the account, not the page

`NbShell` renders a `notification` region above the topbar. It is a block strip
that collapses when empty, and it is for facts about **the account or the whole
application**, not about the route the user happens to be on.

**Use it** for: a subscription that lapsed, a region degraded, read-only mode,
an impersonation session, a required action that follows the user everywhere.

**Do not use it** for anything that stops being true when the route changes. A
"Saved" banner in this region outlives the save and follows the user to a screen
where it is meaningless.

**It must contain** a `flush` banner, which drops the radius and the side
borders so it spans the strip edge to edge:

```vue
<NbShell>
  <template #notification>
    <NbBanner status="warning" variant="callout" flush title="Read-only mode">
      Your session has viewer access. Ask an admin to grant editing.
    </NbBanner>
  </template>
</NbShell>
```

A view that has to raise one of these from inside the page contributes to the
region with [`useShellSlot('notification')`](/ui/composables/use-shell-slot)
rather than reaching for a DOM id. Eight of the twelve applications had
hand-rolled ids for this class of problem. Placement inside the frame, and the
rest of the region rules, are in [The app frame](/patterns/app-frame).

The region is part of `NbShell`, so demonstrating it means running a shell. Both
frames below are the real `NbShell` with its real `#notification` slot, shrunk
into a fixed-height box the way [Shell](/ui/components/shell) demonstrates
itself. Nothing about the region is faked, only the viewport it sits in:

<preview dir="col">
  <div class="nfx-pair nfx-pair--stack">
    <div class="nfx-half nfx-half--wrong">
      <p class="nfx-label">Wrong: a page outcome in the account strip, and not flush</p>
      <div class="nfx-shell-frame">
        <NbShell style="height: 100%">
          <template #notification>
            <NbBanner status="success" variant="inline" title="Saved" dismissible>Your changes to the pricing page have been saved.</NbBanner>
          </template>
          <template #topbar-left><strong>Pricing page</strong></template>
          <p style="margin: 0">The save finished on this route. The strip will follow the user to every other one.</p>
        </NbShell>
      </div>
      <p class="nfx-note">Two faults at once, and both are visible: the radius and side borders float inside a strip that spans the frame, and the sentence stops being true the moment the route changes. This is the banner one product added a six-second timer to.</p>
    </div>
    <div class="nfx-half nfx-half--right">
      <p class="nfx-label">Right: a fact about the account, flush</p>
      <div class="nfx-shell-frame">
        <NbShell style="height: 100%">
          <template #notification>
            <NbBanner status="warning" variant="callout" flush title="Read-only mode">Your session has viewer access. Ask an admin to grant editing.<template #action><NbButton size="sm" variant="ghost">Request access</NbButton></template></NbBanner>
          </template>
          <template #topbar-left><strong>Pricing page</strong></template>
          <p style="margin: 0">True on this route, the next one, and every one after it, until somebody changes the account.</p>
        </NbShell>
      </div>
      <p class="nfx-note">Edge to edge, not dismissible, and still true wherever the user navigates.</p>
    </div>
  </div>
</preview>

---

## `useToast()`: news that expires

Mount **one** `<NbToaster />` beside `NbShell` at the application root, and call
[`useToast()`](/ui/composables/use-toast) from anywhere. Never render `NbToast`
yourself and never build a host: see
[Never hand-roll any of this](#never-hand-roll-any-of-this).

**Use it** when all four are true:

1. The user (or the system on their behalf) just did something.
2. The result is not visible on the screen they are looking at.
3. They do not have to act on it, or the only action is one optional undo.
4. Nothing in it needs to be re-read later.

**Do not use it** when any of these hold:

- **The user must act on it.** The toast removes itself while they are reading.
- **It has to be re-readable.** No history, no scrollback, no recovery.
- **The subject is on screen.** A row that disappeared has already reported
  itself. Do not narrate the visible.
- **A modal is open.** `--nb-zindex-toast` resolves above `--nb-zindex-modal`,
  so the toast lands on top of the surface the user is actually reading. Report
  it inside the dialog, and toast the result after it closes.
- **It is one of ten identical results.** Ten toasts for ten rows is a wall. Say
  "3 of 10 rows failed" once, and mark the rows.
- **It happened before this page existed.** That is the notification centre.

**It must contain** a past-tense sentence with no full stop ("Draft saved"), the
right `variant`, and, if it carries one, exactly one action whose label is a
verb from [Action labels](/content/action-labels) (`Retry`, `Undo`, `Reload`,
never `OK` or `Dismiss`). The close button is the exit; a second control meaning
"go away" is a coin toss for anyone reading the stack through a screen reader.

Two mechanics worth knowing before you reach for a second toast:

- **One action, one message.** Keep the handle `push()` returns and `update()`
  it, so "Saving" becomes "Saved" in place instead of interrupting twice.
- **Toasts are scoped to the moment.** Call `toast.dismissTransient()` from a
  router guard; mark the few messages that are still true anywhere with
  `retain: true`.

The stack below is the real `NbToaster` on its own queue, teleported into the
dashed frame instead of to `<body>` so it stays inside this page. Raise a
success and an error together and watch which one leaves on its own: that is
the duration table further down, running. Hover the stack and every countdown
stops, because the clock belongs to the region and not to the message. "Route
change" is what a router guard calls, and it clears everything except the
retained one.

Notice what this demo needs and the confirm demo further down does not: a host.
`useConfirm()` mounts one for itself the first time it is called; `useToast()`
does not. A queue with no `NbToaster` rendering it still accepts every push and
still expires every record on schedule, with nobody watching. The host warns
when there are two of them and says nothing when there are none, so the rule
above (exactly one `<NbToaster />` at the application root) is the only thing
standing between a product and a notification surface that silently shows
nothing:

<preview dir="col">
  <NbGrid dir="row" gap="sm" wrap="wrap">
    <NbButton size="sm" @click="goodQueue.success('Draft saved')">Draft saved (4s)</NbButton>
    <NbButton size="sm" @click="goodQueue.info('A new version is available', { cta: { label: 'Reload', action: () => {} } })">Info with an action (persistent)</NbButton>
    <NbButton size="sm" @click="goodQueue.warning('Two people are editing this page')">Warning (8s)</NbButton>
    <NbButton size="sm" @click="goodQueue.error('Could not reach the server', { title: 'Save failed' })">Error (never)</NbButton>
    <NbButton size="sm" variant="secondary" outlined @click="runToastSave">One action, one message</NbButton>
    <NbButton size="sm" variant="secondary" outlined @click="goodQueue.info('Export ready', { retain: true, cta: { label: 'Download', action: () => {} } })">Retained</NbButton>
    <NbButton size="sm" variant="secondary" outlined @click="goodQueue.dismissTransient()">Route change</NbButton>
    <NbButton size="sm" variant="secondary" outlined @click="goodQueue.dismissAll()">Clear</NbButton>
  </NbGrid>
  <div id="nfx-toaster-good" class="nfx-toaster-frame"></div>
  <ClientOnly>
    <NbToaster :queue="goodQueue" to="#nfx-toaster-good" :max="3" />
  </ClientOnly>
</preview>

Question 3 is the one a toast fails, and it fails it silently. Press the button
on the left, then try to recover the request id after it goes:

<preview dir="col">
  <div class="nfx-pair">
    <div class="nfx-half nfx-half--wrong">
      <p class="nfx-label">Wrong: a task and an id on a surface with no history</p>
      <NbButton size="sm" @click="badQueue.error('3 of 120 rows were rejected. Request id 8f21c3.', { title: 'Import finished with errors' })">Toast the import result</NbButton>
      <div id="nfx-toaster-bad" class="nfx-toaster-frame nfx-toaster-frame--short"></div>
      <ClientOnly>
        <NbToaster :queue="badQueue" to="#nfx-toaster-bad" :max="3" />
      </ClientOnly>
      <p class="nfx-note">It carries a task (go and fix three rows) and a string somebody will paste into a support ticket. Closing it destroys both. An error toast at least does not expire, so this one is the better half of the wrong answer.</p>
    </div>
    <div class="nfx-half nfx-half--right">
      <p class="nfx-label">Right: the import result stays on the page it belongs to</p>
      <NbBanner status="warning" variant="inline" title="Import finished with errors">3 of 120 rows were rejected. Request id 8f21c3.<template #action><NbButton size="sm" variant="ghost">Show rejected rows</NbButton></template></NbBanner>
      <p class="nfx-note">Re-readable for as long as the user needs it, and the way to the work is in the banner rather than in the user's memory.</p>
    </div>
  </div>
</preview>

---

## `NbNotificationCenter`: the log

The bell in `topbar-right`, and the panel of things that happened while the user
was working. It is a **container**: it holds no store, fetches nothing, polls
nothing, marks nothing as read and knows nothing about your domain. **What a
notification _is_ in your product is yours**, and it stays yours: the rows, their
source, their read state and what activating one does are all the host's. What
this component owns is everything the three hand-built bells agreed on anyway:
the trigger, the count, the panel, placement, focus order, the read and unread
treatment, and the four states a feed has.

**Use it** for events with a life longer than the moment: a build finished, a
document was approved, an export is ready, someone mentioned you, a key was
rotated.

**Do not use it** for:

- **Anything urgent.** The bell is a log, not an alert. A number on an icon is
  not a way to tell someone that the thing in front of them is broken.
- **A duplicate of every toast.** A centre that mirrors the toast queue is a
  list of things the user already dismissed. Rows go in it because they matter
  tomorrow, not because they were shown today.
- **State the page can show.** If the page can render the truth, render the
  truth.

A message may legitimately be **both** a toast and a row, and the test is
whether it is still worth reading in an hour. "Export ready" is. "Draft saved"
is not.

**It must contain**, per row, a title, an optional body, a time and a read
state. And the panel must distinguish its four states, because collapsing them
is the defect this component exists to prevent: `loading` renders placeholder
rows, `error` renders a failure (with the rows kept and a stale strip when there
were already rows), empty renders the `#empty` state, and rows render rows. Pass
`itemCount` whenever you fill the default slot, or the centre cannot tell an
empty feed from a slot you chose not to fill.

Open both bells. They hold the same number of rows and only one of them is worth
opening tomorrow:

<preview dir="col">
  <div class="nfx-pair">
    <div class="nfx-half nfx-half--wrong">
      <p class="nfx-label">Wrong: the toast queue, written down</p>
      <NbNotificationCenter label="Notifications" :items="mirroredFeed" :item-count="mirroredFeed.length" />
      <p class="nfx-note">Every row is something the user already saw and already dismissed. A log of dismissed toasts trains people to stop opening the bell, which is where the one row that mattered was going to go.</p>
    </div>
    <div class="nfx-half nfx-half--right">
      <p class="nfx-label">Right: things that happened while they were elsewhere</p>
      <NbNotificationCenter label="Notifications" :items="workFeed" :item-count="workFeed.length" />
      <p class="nfx-note">Each row is still worth reading in an hour, and each one has somewhere to go.</p>
    </div>
  </div>
</preview>

The four states are the reason this is a component and not a list. Open the
panel and flip the controls: `loading` is not empty, and a failed refresh over
rows already loaded keeps the rows and says the refresh failed, rather than
reporting an empty feed:

<preview :props="centreProps" v-slot="{ resultingProps }">
  <NbNotificationCenter
    label="Notifications"
    style="align-self: flex-start"
    :loading="resultingProps.loading"
    :error="resultingProps.error"
    :items="resultingProps.rows === 'none' ? [] : workFeed"
    :item-count="resultingProps.rows === 'none' ? 0 : workFeed.length"
  />
</preview>

---

## Modal and Confirm: the two that block

`NbModal` carries a **task**: fields, a commit, a cancel. `useConfirm()` asks a
**question** with a consequence that cannot be undone. Both make the rest of the
page unreachable, which is the highest price any surface in this library
charges.

**Do not use either** to deliver information. A dialog whose only control is a
button that closes it is `window.alert` with better typography: it stops the
user, takes a click, and leaves nothing behind to re-read. Put the sentence on a
banner and let them keep working.

The whole contract for both, including the button rules, the type-to-confirm
threshold, focus return and the undo-instead-of-asking alternative, is in
[Dialogs and destructive confirmation](/patterns/dialogs).

Open both. The left one is a real `NbModal` assembled into a confirmation by
hand, which is what one audited application ships, primary-styled destructive
button included. The right one is `useConfirm()`:

<preview dir="col">
  <div class="nfx-pair">
    <div class="nfx-half nfx-half--wrong">
      <p class="nfx-label">Wrong: a destructive confirm built out of NbModal</p>
      <NbButton size="sm" @click="handRolledOpen = true">Delete environment</NbButton>
      <NbModal :open="handRolledOpen" @close="handRolledOpen = false">
        <template #header>Confirm Action</template>
        <p style="margin: 0">Are you sure you want to continue?</p>
        <template #footer>
          <NbButton size="lg" variant="ghost" @click="handRolledOpen = false">Cancel</NbButton>
          <NbButton size="lg" variant="primary" @click="handRolledOpen = false">Confirm</NbButton>
        </template>
      </NbModal>
      <p class="nfx-note">The confirm button is the same blue as Save, the heading names no action and no record, and nothing on screen says which environment is about to go. Everything the user needs in order to answer is missing from the question.</p>
    </div>
    <div class="nfx-half nfx-half--right">
      <p class="nfx-label">Right: useConfirm(), tone danger</p>
      <NbButton size="sm" @click="runDangerConfirm">Delete environment</NbButton>
      <p class="nfx-note">Names the action in the title and on the button, prints the record it is about to destroy, and the confirm is red because the outcome is. The last answer was: <strong>{{ confirmAnswer }}</strong></p>
    </div>
  </div>
</preview>

The other misuse is a dialog that only tells you something. The left one blocks
the page to deliver a sentence and leaves nothing behind; the right one delivers
the same sentence without stopping anybody:

<preview dir="col">
  <div class="nfx-pair">
    <div class="nfx-half nfx-half--wrong">
      <p class="nfx-label">Wrong: information behind a dialog</p>
      <NbButton size="sm" @click="infoDialogOpen = true">Show what happened</NbButton>
      <NbModal :open="infoDialogOpen" @close="infoDialogOpen = false">
        <template #header>Export finished</template>
        <p style="margin: 0">Your export finished with 3 skipped rows.</p>
        <template #footer>
          <NbButton size="lg" variant="primary" @click="infoDialogOpen = false">OK</NbButton>
        </template>
      </NbModal>
      <p class="nfx-note">One control, and it closes the dialog. The count is gone the moment it is acknowledged, so the only thing the interruption bought was the acknowledgement.</p>
    </div>
    <div class="nfx-half nfx-half--right">
      <p class="nfx-label">Right: the same sentence, on the page</p>
      <NbBanner status="warning" variant="inline" title="Export finished with 3 skipped rows" dismissible>Rows 14, 51 and 92 had no owner. Assign one and export again.<template #action><NbButton size="sm" variant="ghost">Show skipped rows</NbButton></template></NbBanner>
      <p class="nfx-note">Nothing stopped, the count is still on screen, and the way to the work is in the banner.</p>
    </div>
  </div>
</preview>

---

## A successful save must say so

This is the single most common absence in the fleet: platform, tally,
planetcraft, stagewright and the white-label product confirm a successful save
with **nothing at all**.
The user presses Save, nothing changes, and they press it again to find out
whether it worked.

**Rule: every commit reports three moments, and no commit reports fewer.**

| Moment  | What the user gets                                                                    |
| ------- | ------------------------------------------------------------------------------------- |
| Started | The commit control is `:loading`, or an `NbInlineLoading` beside it reads `active`    |
| Worked  | A visible confirmation that persists long enough to read                              |
| Failed  | A mapped, human failure on the surface the work is on, with the values still in place |

Which confirmation depends on where the result lands, and there are only two
answers:

- **The result is visible on screen** (the row appeared, the field now holds the
  new value, the badge flipped to Published): that _is_ the confirmation. Do not
  add a toast to narrate it.
- **The result is not visible**: confirm it explicitly, with
  `toast.success('Draft saved')` when the user has moved on, or an
  `NbInlineLoading` at `finished` when they are still standing at the button.

`NbInlineLoading` is the cheapest correct answer for a form, because it is the
same element for all three moments: `active` shows `label` ("Saving"),
`finished` shows `finishedLabel` ("Saved") for `dwell` milliseconds and then
emits `success`, and `error` shows `errorLabel`. It reserves the width of the
longest of the three so the row does not jump. Drive it with `useInlineLoading()`
rather than a hand-written `try/catch/finally`, which is what the audit found
resetting the flag before anything could be shown:

```vue
<script setup lang="ts">
import { useInlineLoading } from '@nubisco/ui'
const save = useInlineLoading()
</script>

<template>
  <NbButton @click="save.run(() => api.save(form))">Save</NbButton>
  <NbInlineLoading :status="save.status.value" @success="save.reset()" />
</template>
```

Two consequences that follow from the table and are worth stating outright:

- **A silent success is a bug report waiting to be filed.** It is
  indistinguishable from a dropped request.
- **A confirmation that disappears in under a second has not been shown.**
  `dwell` defaults to `1600` for that reason, and the toast durations start at
  `4000`.

Press both. They run the same 1.2 second request. One of them tells you it
worked:

<preview dir="col">
  <div class="nfx-pair">
    <div class="nfx-half nfx-half--wrong">
      <p class="nfx-label">Wrong: started, and then nothing</p>
      <NbGrid dir="row" gap="sm" align="center">
        <NbButton size="sm" :loading="silentSaving" @click="runSilentSave">Save</NbButton>
      </NbGrid>
      <p class="nfx-note">The spinner stops and the row returns to how it looked before. This is what five products ship, and it is indistinguishable from a request that was dropped, which is why people press Save twice.</p>
    </div>
    <div class="nfx-half nfx-half--right">
      <p class="nfx-label">Right: started, worked, failed</p>
      <NbGrid dir="row" gap="sm" align="center">
        <NbButton size="sm" :loading="save.status.value === 'active'" @click="runTrackedSave">Save</NbButton>
        <NbInlineLoading :status="save.status.value" label="Saving contact" finished-label="Contact saved" error-label="Could not save contact" @success="save.reset()" />
      </NbGrid>
      <p class="nfx-note">The same element carries all three moments and reserves the width of the longest of them, so the row does not jump. The confirmation stays for dwell milliseconds, which is long enough to read.</p>
    </div>
  </div>
</preview>

The failure path is the same element, and it is the one a hand-written
`try/catch/finally` loses when the `finally` clears the flag first:

<preview dir="col">
  <NbGrid dir="row" gap="sm" align="center">
    <NbButton size="sm" :loading="failing.status.value === 'active'" @click="runFailingSave">Save</NbButton>
    <NbInlineLoading :status="failing.status.value" label="Saving contact" finished-label="Contact saved" error-label="Could not save contact" @success="failing.reset()" />
  </NbGrid>
</preview>

---

## Errors never auto-dismiss. Successes do.

Lifetime is not a matter of taste. It follows from what the message asks of the
reader, and the queue already encodes the answer in `NB_TOAST_DURATIONS`:

| Variant   | Default life | Why                                                               |
| --------- | ------------ | ----------------------------------------------------------------- |
| `success` | `4000`       | Four expected words. Reading them twice adds nothing              |
| `info`    | `6000`       | Unexpected, so it takes longer to place                           |
| `warning` | `8000`       | A sentence the user did not ask for, about an imperfect outcome   |
| `error`   | `0`          | Never. "It failed" is the beginning of a task, not the end of one |

A toast carrying a `cta` also resolves to `0` unless you pass a `duration`
yourself: an action that removes itself while it is being reached for is not an
action.

The audit found a product where success messages accumulated forever because its
hand-built host had no timer, and failures vanished after four seconds because
that host used one duration for everything. That is exactly backwards, and it is
what this table exists to prevent.

The same logic applies off the toast surface. A banner reporting a failure is
not on a timer at all, and must not be wrapped in one. A banner reporting a
condition is not dismissible. The only message in this library that is allowed
to remove itself unasked is a non-error toast.

---

## An exception the user cannot act on is not a notification

One product raises 21 `alert()` calls carrying raw exception text. Another has a
global handler that only calls `console.error`, so the same class of failure is
invisible. Both are the same mistake, made in opposite directions: an unhandled
exception is **a bug report**, and a bug report has two audiences.

**Split them.**

- **To the user**: a mapped sentence, on the surface the failed work lives on,
  built from the three parts in
  [Writing style](/content/writing-style#the-three-parts) and the status-to-copy
  table beside it. `TypeError: Cannot read properties of undefined` is not a
  message to a person, and neither is "Something went wrong", which is part one
  with the noun removed.
- **To you**: the original error, with its stack and its request id, in your
  logger. That is where the exception text belongs, and it is the only place.

**Never** `window.alert`, `window.confirm` or `window.prompt`. They are
unstyled, unthemed, untranslatable, unbypassable, invisible to the toast queue
and impossible to test.

If the failure has no user-facing surface at all, because nothing on screen was
waiting for it, a persistent `error` toast is the floor, not a `console.error`.
A failure the user is never told about is a failure they will report as
something else.

---

## Ordering, stacking and the cap

When several messages arrive at once, four rules apply, all of them already
implemented in the queue and the host.

- **Three at a time.** `createToastQueue()` defaults `max` to `3`. Extras are
  admitted and wait. Raise it on the `NbToaster` prop only when the host knows
  better than the queue (a demo, a narrow viewport), because the prop writes
  through to `queue.max` and would otherwise overrule a queue that was
  configured deliberately.
- **Overflow is FIFO.** Waiting toasts slide in as visible ones expire. The one
  exception is a stack where nothing can expire, which happens when every
  visible slot is held by an error: rather than swallow every later message
  forever, the oldest visible toast is retired, and its `onDismiss` fires with
  reason `replaced`.
- **Newest sits against the anchored edge.** The stack is painted newest-first
  in the DOM, not with a reversed flex direction, so a keyboard walks it in the
  same order a screen reader reads it: the sentence just announced first, not
  yesterday's news.
- **The whole region pauses together.** Pointer over the stack, focus inside it,
  or a hidden tab holds every countdown, and resuming continues from the exact
  remaining time. This is why the clock lives in the queue and not in the item:
  an item that owns its own timer cannot know the pointer is resting on its
  neighbour.

Two more rules that are yours, not the library's:

- **De-duplicate with `key`.** A double-clicked Save produces one "Saved", not
  two, when the push carries a `key`.
- **Aggregate before you queue.** Loop results are summarised into one message
  with a count. A burst of eleven is a wall whatever the cap is.

---

## Politeness, role, and why a status is not an alert

An `alert` interrupts whatever the screen reader is currently saying. A `status`
waits its turn. Choosing between them is choosing whether this message is worth
cutting someone off for, and the answer is: only when it changes what they
should do next.

What the library already decides for you:

| Surface               | Role                                                   | Politeness                             |
| --------------------- | ------------------------------------------------------ | -------------------------------------- |
| `NbMessage`           | `status`                                               | `assertive` for `error`, else `polite` |
| `NbBanner`            | `alert` for `status="error"`, else `status`            | matches the role                       |
| `NbToast`, standalone | `alert` by default                                     | `assertive` for `error`, else `polite` |
| Under `NbToaster`     | The toast is silent (`role="none"`, `aria-live="off"`) | The host announces instead             |
| `NbInlineLoading`     | `status`                                               | polite                                 |

The toaster's arrangement is the part worth understanding, because three
hand-built hosts got it wrong in three different ways:

- **The live regions are mounted empty, for the life of the host.** A region and
  its first message inserted in the same tick is the most common reason a toast
  is never heard: the node was not being observed when the text arrived.
- **There are two regions, not one**, because politeness cannot be changed after
  the fact. An assertive region that is sometimes polite still interrupts.
  Errors and warnings go to the assertive one, successes and info to the polite
  one. Interrupting someone to tell them the thing they asked for worked is rude
  in a screen reader too.
- **Only the host speaks.** Each toast is silenced (`role="none"`,
  `aria-live="off"`) so the stack does not announce every message twice.
- **The announcement is a full sentence**: the severity word, the title, the
  message, and, when there is an action, that the action exists and the key that
  reaches it. Severity is in words because the icon is `aria-hidden` and the
  accent colour says nothing (WCAG 1.4.1). Translate it once per queue with
  `statusLabels`, not once per call.
- **Announcements are spaced, and cleared before they are rewritten**, because
  an identical string written twice is not a change, and a live region only
  speaks when its content changes. Two consecutive failed saves would otherwise
  announce once.

If you replace the toast body with the `#toast` slot, you keep all of this. The
only contract that slot has to honour is that something inside it is focusable.

More in [Accessibility overview](/accessibility/overview) and
[Keyboard interaction](/accessibility/keyboard).

---

## The words

Message copy is decided once, in [Writing style](/content/writing-style), and
action labels once, in [Action labels](/content/action-labels). Read the
[error construction rule](/content/writing-style#the-three-parts) there rather
than inventing a sentence shape per product; it is the same three parts (what
happened, why, what to do) on every surface on this page.

Three things are peculiar to a message that removes itself:

- **Past tense, no full stop**: "Draft saved", not "Your draft has been saved.".
- **Split failure and recovery** across `title` and `message`:
  `toast.error('Could not reach the server', { title: 'Save failed' })`.
- **One verb, from the register.** `Retry`, `Reload`, `Undo`. Never `OK`,
  `Done`, `Close` or `Dismiss`.

---

## Never hand-roll any of this

Every surface on this page is library code, and every one of them was
hand-rolled by at least one product before it was.

| Do not build           | Use                                                                       | What the hand-built ones lost                                                   |
| ---------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| A toast host or queue  | `<NbToaster />` + [`useToast()`](/ui/composables/use-toast)               | Auto-dismiss, `role="alert"`, the icon, the action, pause-on-hover, the z-index |
| A notification bell    | [`NbNotificationCenter`](/ui/components/notification-center)              | 963 lines across three products, and a placement agreed by comment              |
| A spinner              | [`NbSpinner`](/ui/components/spinner)                                     | `prefers-reduced-motion`, one accessible name, one spelling of "Loading"        |
| A skeleton             | [`NbSkeleton`](/ui/components/skeleton)                                   | Five shapes, and one that shares its element with the empty state               |
| A save-state indicator | [`NbInlineLoading`](/ui/components/inline-loading) + `useInlineLoading()` | The confirmation, every time the `finally` cleared the flag first               |
| A confirmation dialog  | [`useConfirm()`](/ui/composables/use-confirm)                             | Seven mechanics across twelve products, including `window.confirm`              |
| A field error style    | `NbMessage`, or the control's `error` prop                                | Bound zero times across 58 call sites in one product                            |

If you have a local `Toaster.vue`, the replacement is four steps:
[Replacing a hand-built host](/ui/components/toaster#replacing-a-hand-built-host).

**Tokens.** A notification surface touches the tokens its component already
uses. It does not invent one. `--nb-z-toast` does not exist and never has; the
real token is `--nb-zindex-toast`, and a product that guessed ran on the CSS
fallback for months without a single visible symptom. The layer order is in
[Z-index](/principles/z-index), spacing in
[Spacing](/principles/spacing), and the transition rules for a stack that
animates in [Motion](/principles/motion).

---

## Things we have shipped and should not ship again

- 21 `alert()` calls carrying raw exception text.
- A global error handler whose entire user-facing behaviour is `console.error`.
- Five products that confirm a successful save with nothing at all.
- A hand-built toast host with no auto-dismiss, so successes accumulated for the
  life of the route.
- A hand-built toast host that dropped `role="alert"`, the variant icon, the
  action and pause-on-hover, and hardcoded a border radius.
- `var(--nb-z-toast)`, a token that does not exist, silently running on its
  fallback.
- Three notification bells, 963 lines, converged by a code comment.
- 30 page-level errors rendered through `NbMessage`, a 12px field helper.
- A failed media upload reported as an inline `NbMessage` in an application that
  already renders `NbBanner` in the shell notification region eighteen times.
- A `NbBanner` in the shell notification region saying "Saved", with a
  hand-written six-second timer added to make it go away.
- One `.empty-text` element rendering both "loading" and "empty", so a failed
  fetch read as "no contacts yet".
- Two spinners in one product, one of them ignoring `prefers-reduced-motion`.
- `Loading…` and `Loading...` in two files of the same application.
- A toast raised from behind an open modal, landing on top of the dialog the
  user was reading.

---

## Checklist

Apply this to a view you did not write. Every item is checkable by reading the
template and the handlers, and each failure names the fix.

### Step 1: find every message in the view

- [ ] Grep the view and its handlers for `NbMessage`, `NbBanner`, `NbToast`,
      `toast.`, `alert(`, `confirm(`, `prompt(`, `console.error`, and any local
      component whose name contains `Toast`, `Notification`, `Alert`, `Snackbar`
      or `Banner`.
- [ ] Every hit from that list is either one of the seven surfaces on this page,
      or a defect. There is no eighth surface.

### Step 2: check nothing is on a blocked or banned surface

- [ ] No `window.alert`, `window.confirm` or `window.prompt`, anywhere.
- [ ] No local toast host, bell, spinner, skeleton or field-error style. Each has
      a library component ([the table above](#never-hand-roll-any-of-this)).
- [ ] No dialog whose only control closes it. Information does not block.
- [ ] Exactly one `<NbToaster />` in the application, mounted at the root and not
      per view.

### Step 3: check each message against the six questions

- [ ] Nothing on a toast that the user must **act** on.
- [ ] Nothing on a toast that must be **re-read**: no error codes, ids,
      filenames or lists.
- [ ] Nothing on a toast whose subject is **visible on screen**.
- [ ] No toast raised while a modal or confirm is open.
- [ ] No page-level or form-level message rendered through `NbMessage`.
- [ ] No field-level message rendered through `NbBanner`.
- [ ] Every message that is still true after it disappears is a
      `variant="callout"` banner, not a dismissible one and not a toast.
- [ ] Every message about the whole account is in the shell `notification`
      region; every message about this page is in the page.

### Step 4: check the success path

- [ ] Every commit in the view (save, delete, invite, import, publish, upload)
      reports **started**, **worked** and **failed**.
- [ ] The confirmation is visible for at least a second: an on-screen change, an
      `NbInlineLoading` at `finished`, or a `success` toast.
- [ ] No confirmation narrates something already visible.
- [ ] The commit control carries `:loading` while the request is in flight, and
      stops the moment it settles.

### Step 5: check the failure path

- [ ] No raw exception text, status line or JSON body reaches the screen.
- [ ] Every failure is mapped with the three parts: what happened, why, what to
      do next.
- [ ] A failed submit keeps every value the user typed.
- [ ] A field-scoped failure is set on the field, not only in a banner.
- [ ] No error auto-dismisses, on any surface.
- [ ] Every original error reaches the logger.

### Step 6: check the mechanics

- [ ] A router guard calls `toast.dismissTransient()`, and only messages that are
      true anywhere carry `retain: true`.
- [ ] Repeatable actions push with a `key`, so a double click is one message.
- [ ] A loop reports one summarised message with a count, not one per item.
- [ ] `NbNotificationCenter` distinguishes loading, error, empty and rows, and
      slot-filled panels pass `itemCount`.
- [ ] A toast carrying an action passes `onDismiss` and reads the reason, so the
      commit and the undo cannot both run.

### Step 7: check it without a pointer and without colour

- [ ] Every surface was checked with the `.dark` class applied.
- [ ] <kbd>Alt</kbd> + <kbd>T</kbd> reaches the toast stack, its action is
      operable, <kbd>Esc</kbd> dismisses, and focus lands somewhere sensible
      afterwards.
- [ ] No message relies on colour alone: the severity is in the icon shape and in
      the announced word ([Colour contrast](/accessibility/color-contrast),
      [Colour](/principles/color)).
- [ ] Nothing announces twice, and nothing announces never.

---

## Related

- [Toast](/ui/components/toast), [Toaster](/ui/components/toaster) and
  [useToast](/ui/composables/use-toast) for the queue, the durations, the cap
  and the handle.
- [Banner](/ui/components/banner) and [Message](/ui/components/message) for the
  two inline surfaces.
- [Notification Center](/ui/components/notification-center) for the bell, the
  four feed states and the slot contracts.
- [Modal](/ui/components/modal), [Confirm](/ui/components/confirm) and
  [useConfirm](/ui/composables/use-confirm) for the two that block.
- [Inline Loading](/ui/components/inline-loading),
  [Spinner](/ui/components/spinner) and [Skeleton](/ui/components/skeleton) for
  work still in progress.
- [Dialogs and destructive confirmation](/patterns/dialogs) for when a question
  is worth stopping someone.
- [Building a form](/patterns/forms) for field errors, submit failures and the
  loading form.
- [The app frame](/patterns/app-frame) for where each surface sits in the shell.
- [Status indicators](/patterns/status-indicators) for the fixed state
  vocabulary and the badge-versus-banner boundary.
- [Empty states](/patterns/empty-states) for the four reasons a view is blank,
  and why a failed fetch is not one of them.
- [Disabled and read-only](/patterns/disabled-and-read-only) for telling someone
  why they cannot do something.
- [Building an inspector](/patterns/inspectors) for messages inside a dense
  panel.
- [Writing style](/content/writing-style) and
  [Action labels](/content/action-labels) for the words.
- [Accessibility overview](/accessibility/overview) and
  [Keyboard interaction](/accessibility/keyboard) for live regions and focus.
- [Layout](/principles/layout), [Spacing](/principles/spacing),
  [Motion](/principles/motion), [Colour](/principles/color) and
  [Data visualisation](/principles/data-visualisation) for the tokens each
  surface is allowed to touch.

<script setup lang="ts">
import { ref } from 'vue'
import { createToastQueue } from '../../src/composables/useToast.composable'
import { useConfirm } from '../../src/composables/useConfirm.composable'
import { useInlineLoading } from '../../src/composables/useInlineLoading.composable'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/* The banner vocabulary, as controls. Every name here is a real NbBanner prop
   (see src/components/Banner.d.ts), so flipping one is the same edit a call
   site would make. */
const bannerProps = [
  {
    label: 'Status',
    name: 'status',
    type: 'single',
    options: [
      { value: 'info', label: 'info' },
      { value: 'success', label: 'success' },
      { value: 'warning', label: 'warning' },
      { value: 'error', label: 'error' },
      { value: 'neutral', label: 'neutral' },
    ],
    default: 'error',
  },
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    options: [
      { value: 'inline', label: 'inline' },
      { value: 'callout', label: 'callout' },
    ],
    default: 'inline',
  },
  { label: 'Title', name: 'title', type: 'string', default: 'Could not publish the release' },
  { label: 'Dismissible', name: 'dismissible', type: 'boolean', default: true },
  { label: 'Flush', name: 'flush', type: 'boolean', default: false },
  { label: 'Hide icon', name: 'hideIcon', type: 'boolean', default: false },
]

/* `rows` is a control, not a prop: it picks which feed is handed to the
   centre. It is read from `resultingProps` in the template and never bound
   to the component, so nothing invented reaches the DOM. */
const centreProps = [
  { label: 'Loading', name: 'loading', type: 'boolean', default: false },
  { label: 'Error', name: 'error', type: 'boolean', default: false },
  {
    label: 'Rows',
    name: 'rows',
    type: 'single',
    options: [
      { value: 'three', label: 'three rows' },
      { value: 'none', label: 'empty feed' },
    ],
    default: 'three',
  },
]

const goodQueue = createToastQueue({ max: 3 })
const badQueue = createToastQueue({ max: 3 })

async function runToastSave() {
  const saving = goodQueue.push({
    key: 'nfx-save',
    message: 'Saving changes...',
    duration: 0,
  })
  await wait(1200)
  saving.update({ variant: 'success', message: 'Changes saved' })
}

const mirroredFeed = [
  { id: 'm1', title: 'Draft saved', time: '2026-09-03T14:20:00Z' },
  { id: 'm2', title: 'Filter applied', time: '2026-09-03T14:19:00Z' },
  { id: 'm3', title: 'Copied to clipboard', time: '2026-09-03T14:18:00Z' },
]

const workFeed = [
  {
    id: 'w1',
    title: 'Build failed on main',
    body: 'stagewright, 2 failing specs',
    time: '2026-09-03T12:41:00Z',
    variant: 'error',
  },
  {
    id: 'w2',
    title: 'Ana approved "Pricing page"',
    body: 'Ready to publish to production.',
    time: '2026-09-03T09:12:00Z',
    variant: 'success',
  },
  {
    id: 'w3',
    title: 'Export ready',
    body: 'contacts-2026-09.csv, 12 MB',
    time: '2026-09-01T16:20:00Z',
    read: true,
  },
]

const confirm = useConfirm()
const confirmAnswer = ref('nothing yet')
const handRolledOpen = ref(false)
const infoDialogOpen = ref(false)

async function runDangerConfirm() {
  const answered = await confirm({
    title: 'Delete environment',
    subjectLabel: 'Environment',
    subject: 'staging-eu',
    message: 'Every entry, release and API key in it is deleted.',
    confirmLabel: 'Delete environment',
  })
  confirmAnswer.value = answered ? 'confirmed' : 'cancelled'
}

const silentSaving = ref(false)
async function runSilentSave() {
  silentSaving.value = true
  await wait(1200)
  silentSaving.value = false
}

const save = useInlineLoading()
function runTrackedSave() {
  save.run(() => wait(1200))
}

const failing = useInlineLoading()
function runFailingSave() {
  failing.run(async () => {
    await wait(1200)
    throw new Error('The server refused the request')
  })
}
</script>

<style scoped>
/* The preview area stretches its single child, which would make one banner as
   tall as the frame. A plain stacking child keeps each surface at its own
   height, which is the point of the size comparison. */
.nfx-stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  width: 100%;
}

.nfx-stack--narrow {
  max-width: 320px;
}

/* Wrong on the left, right on the right, and one column when there is not
   enough width for two. */
.nfx-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
  align-items: start;
}

.nfx-pair--stack {
  grid-template-columns: 1fr;
}

.nfx-half {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  align-items: flex-start;
  padding: calc(var(--nb-base-unit) * 1.5);
  border-radius: var(--nb-radius-md);
  border: 1px solid var(--nb-c-border);
}

.nfx-half--wrong {
  border-color: var(--nb-c-danger-surface);
}

.nfx-half--right {
  border-color: var(--nb-c-success-surface);
}

.nfx-half > .nb-banner,
.nfx-half > .nfx-shell-frame {
  width: 100%;
}

.nfx-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.nfx-half--wrong .nfx-label {
  color: var(--nb-c-danger);
}

.nfx-half--right .nfx-label {
  color: var(--nb-c-success);
}

.nfx-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--nb-c-text-muted);
}

/* NbShell fills its parent, so the region can only be shown at a size a docs
   column has. Nothing about the shell is changed; it is given a viewport. */
.nfx-shell-frame {
  height: 260px;
  overflow: hidden;
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
}

/* A transformed, relatively positioned frame: NbToaster is position: fixed,
   and a transform on an ancestor is what makes fixed positioning resolve
   against that ancestor rather than the viewport. That is what the `to` prop
   is for. In an application the stack anchors to the viewport corner. */
.nfx-toaster-frame {
  position: relative;
  transform: translateZ(0);
  width: 100%;
  min-height: 220px;
  border: 1px dashed var(--nb-c-border);
  border-radius: var(--nb-radius-md);
}

.nfx-toaster-frame--short {
  min-height: 180px;
}
</style>
