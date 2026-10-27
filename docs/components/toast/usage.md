---
layout: nubisco
title: Toast
intro: '`NbToast` is one toast: an icon, an optional title, a message, an optional action and a close button. It is the leaf.'
source: src/components/Toast.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

**You almost certainly want [`NbToaster`](/components/toaster/usage) instead.** The host owns everything a notification needs beyond the look of one message: the queue, the shared clock, the visible cap, pause on hover and focus, announcement, dismissal and where focus goes afterwards. Mount `<NbToaster />` once, call [`useToast()`](/composables/use-toast) from anywhere, and you never render `NbToast` yourself.

```ts
import { useToast } from '@nubisco/ui'

const toast = useToast()
toast.success('Draft saved')
```

::: warning This page used to say the opposite
Until this release, this page stated as policy that the library shipped no container and walked you through building one. Three applications did exactly that. The 12-application audit found that each host lost something different: one had no auto-dismiss, so successes accumulated for the life of the route; one wrote `var(--nb-z-toast)`, a token that does not exist, and silently ran on the fallback instead of `--nb-zindex-toast`; one dropped `role="alert"`, the variant icon, the action and pause-on-hover.

None of that was careless. It is what a container costs to get right, which is why it is library code now. The build-your-own recipe has been removed rather than corrected. If you have a local `Toaster.vue`, the [migration steps](/components/toaster/usage#replacing-a-hand-built-host) are four short ones.
:::

<preview>
  <NbGrid dir="col" gap="sm" align="start">
    <NbToast variant="success" message="Draft saved" :duration="0" />
    <NbToast variant="error" title="Save failed" message="Could not reach the server" :duration="0" />
  </NbGrid>
</preview>

## When to use

A toast is **news that expires**. Something finished, the user does not have to answer it, and in thirty seconds it will not matter. Four cases fit.

### An action succeeded and there is nothing on screen that says so

"Draft saved", "Invitation sent", "3 rows imported". The audit found four applications confirming a successful save with nothing at all, which leaves the user pressing the button again to find out whether it worked. A four-word toast is the cheapest fix in this library.

### An action failed in a way that is not about the page in front of you

A background sync, an export, a request fired from a menu the user has already closed. A failure that belongs to a visible form or a visible page is not a toast; see the table below. An `error` toast is persistent by default (`NB_TOAST_DURATIONS.error` is `0`), because "it failed" is the beginning of a task, not the end of one.

### Something reversible just happened, and you would rather offer undo than ask

"Comment deleted" with an `Undo` action costs one optional click. A confirmation dialog costs one mandatory click, every time, forever. When the delete is genuinely reversible, this is the better design, and it is the only case where a toast is allowed to carry an action. The mechanics (a `cta`, an explicit `duration`, and `onDismiss` telling you the true reason it ended) are in [Undo, correctly](/patterns/dialogs#undo-correctly).

### Something changed that the user did not do

"Connection restored", "New version available, reload to update". These carry `retain: true` if they are still true after a navigation.

## When not to use

Two questions disqualify a toast, and neither is about tone or severity:

1. **Must the user act on it?** A toast times out. Anything that must be done cannot live on a surface that removes itself while it is being read.
2. **Must the user be able to re-read it?** A toast is gone and unrecoverable. An error code, an ID, a list of what failed, anything the user might paste into a support ticket, cannot be the toast's only home.

If either answer is yes, the message belongs somewhere with a lifetime. The audit shows what happens when it does not: 21 `alert()` calls thrown for exceptions in one application, and 30 page-level errors squeezed into `NbMessage`, a 12px inline field helper, in another.

| What you have                                                    | Use instead                                                                                       | Because                                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| A validation error                                               | [`NbMessage`](/components/message/usage) on the field                                             | The fix happens at the field. A toast makes the user remember which one                               |
| A failure that belongs to the page or the form                   | [`NbBanner`](/components/banner/usage) `variant="inline"`, in place                               | The user has to see the failure and the thing that failed together, for as long as it takes to fix it |
| A condition that stays true while the page is open               | [`NbBanner`](/components/banner/usage) `variant="callout"`                                        | A standing fact that expires has been told to the user exactly once, at random                        |
| A question that must be answered before anything continues       | [`useConfirm()`](/composables/use-confirm)                                                        | A toast cannot block, and it cannot be answered. A toast that "confirms" something confirms nothing   |
| News that outlives the moment and has to be findable later       | [`NbNotificationCenter`](/components/notification-center/usage)                                   | Three applications hand-built a bell (312, 343 and 308 lines) because this distinction had no home    |
| Work that is still in progress on this screen                    | [`NbInlineLoading`](/components/inline-loading/usage) or [`NbSpinner`](/components/spinner/usage) | Progress belongs next to the thing making progress ([Status indicators](/patterns/status-indicators)) |
| A per-row or per-item result in a long list                      | The row itself                                                                                    | Ten toasts for ten rows is a wall. Say "3 of 10 failed" once, and mark the rows                       |
| Anything with an error code, an id, or a list the user must keep | An inline banner, a details panel, or the notification centre                                     | A toast cannot be scrolled back to                                                                    |

Three more rules that come straight from what the fleet shipped:

- **Never toast something the user can already see.** A row that disappeared reported itself.
- **Never toast twice for one action.** One message for the request and another for the response is two interruptions for one thing. Keep the handle from `push()` and `update()` it.
- **Do not raise a toast from behind a modal.** Toasts stack above dialogs (`--nb-zindex-toast` resolves above `--nb-zindex-modal`), so a toast fired while a dialog is open covers the surface the user is actually reading. Report it inside the dialog, and toast the result after it closes.

## Choosing the variant

The variant is not a colour choice. It sets the icon, the accent, the hidden severity word, the politeness of the announcement (`error` is `assertive`, everything else is `polite`) and, under [`NbToaster`](/components/toaster/usage), how long the message lives. Severity and lifetime are one decision, which is why they are in one table. The durations are `NB_TOAST_DURATIONS` as it ships.

| Variant   | It says                                                        | Default life | Reach for it when                                                                       | It is the wrong variant when                                                                       |
| --------- | -------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `success` | The thing you asked for is done                                | `4000`       | The result is not visible on screen: "Draft saved", "Invitation sent"                   | The result is visible. A row that appeared has already reported itself                             |
| `info`    | Something changed, and you do not have to do anything about it | `6000`       | State moved without the user: "Connection restored", "Export queued"                    | You are announcing something the user just did. That is `success`                                  |
| `warning` | It worked, but not cleanly, or it is about to stop working     | `8000`       | The outcome was partial and momentary: "3 of 10 rows skipped", "Retrying on the backup" | The condition is still true after the toast goes. See below                                        |
| `error`   | It failed                                                      | `0`          | Something the user cannot see failed: a background sync, an export, a fired request     | The failure belongs to a form or a page in front of them. That is an inline banner, at the failure |

`error` is `0` on purpose: it never auto-dismisses, because "it failed" is the beginning of a task, not the end of one. A toast carrying a `cta` also gets `0` from the queue unless you pass a `duration` yourself, since an action that removes itself while it is being reached for is not an action.

### When a warning should have been a banner

Most `warning` toasts in the fleet were not warnings, they were conditions, and a condition on a surface with an eight-second lifetime has been told to the user exactly once, at random. One question separates them.

**Is it still true after the toast disappears?**

If yes, it is not a toast at all. "Your trial ends in three days", "this environment is not production", "two members are still awaiting approval" are all true for as long as the page is, so they belong in [`NbBanner`](/components/banner/usage) `variant="callout"`, which cannot be dismissed because dismissing it would not make it untrue. If the warning is about the form or the page in front of the user, it is `variant="inline"` on that page.

A `warning` toast is only correct for an outcome that is finished and imperfect: the import ran, three rows were skipped, and nothing about that is still happening. If the user has to go and fix those three rows, the sentence has an action in it, and [When not to use](#when-not-to-use) applies: give it a surface with a lifetime.

## When you would still use `NbToast` directly

Only when the thing on screen is not a toast: a message pinned inside a panel, a story or a visual test that needs one frozen toast, a custom host that already exists and cannot be replaced this week. A bare `NbToast` times itself, so it works standalone.

For anything that is genuinely a toast, use the host.

## Writing one

The words are covered once, in [Writing style](/content/writing-style). Three things are peculiar to a message that removes itself:

- Past tense, no full stop: "Draft saved", not "Your draft has been saved.".
- The `title` carries what went wrong and the `message` carries the recovery: `toast.error('Could not reach the server', { title: 'Save failed' })`.
- The action is a verb from the shared register (`Retry`, `Reload`, `Undo`), never `OK`, `Done`, `Close` or `Dismiss`. The close button is the exit; a second control that also means "go away" is a coin toss for anyone reading the stack through a screen reader.

## Severity is in words, not only in colour

Every toast renders a visually hidden severity word before the title, because the icon is `aria-hidden` inside `NbIcon` and the accent colour says nothing to a screen reader. Without it, "Could not reach the server" arrives with no indication that it is an error, which is a [WCAG 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) failure. Override `statusLabel` per toast, or once per queue with `createToastQueue({ statusLabels })`.

## One clock, or its own

Standalone, `NbToast` times itself and pauses under the pointer. That is the right behaviour for one toast and the wrong behaviour for three: pausing only the hovered one lets the two below it expire while they are being read.

Under `NbToaster` the toast is `managed`. The queue owns the clock, the whole region pauses together, and the toast draws the bar from `duration`, `paused` and `cycle`. There is one countdown implementation either way.

## Announcement, under a host

`NbToaster` renders its toasts with `role="none"` and `aria-live="off"` and announces from a live region that was mounted long before the message existed. A live region and its first message inserted in the same tick is the most common reason a toast is never heard at all. The severity word stays inside the toast, so browse mode still reads it, but only one thing speaks.

Used standalone, `NbToast` keeps its own `role="alert"` default and announces itself.

## Related

- [`NbToaster`](/components/toaster/usage) is the host, and the page to read first.
- [`useToast()`](/composables/use-toast) is the API every call site uses.
- [`NbBanner`](/components/banner/usage) for a message that belongs to the page rather than to a moment, and [`NbMessage`](/components/message/usage) for one about a single field.
- [`NbNotificationCenter`](/components/notification-center/usage) for news that has to be findable later.
- [Status indicators](/patterns/status-indicators) settles which surface owns which kind of state, and [Dialogs](/patterns/dialogs) covers undo instead of confirmation.
