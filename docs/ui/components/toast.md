---
layout: nubisco
title: Toast
---

`NbToast` is one toast: an icon, an optional title, a message, an optional action and a close button. It is the leaf.

**You almost certainly want [`NbToaster`](/ui/components/toaster) instead.** The host owns everything a notification needs beyond the look of one message: the queue, the shared clock, the visible cap, pause on hover and focus, announcement, dismissal and where focus goes afterwards. Mount `<NbToaster />` once, call [`useToast()`](/ui/composables/use-toast) from anywhere, and you never render `NbToast` yourself.

```ts
import { useToast } from '@nubisco/ui'

const toast = useToast()
toast.success('Draft saved')
```

::: warning This page used to say the opposite
Until this release, this page stated as policy that the library shipped no container and walked you through building one. Three applications did exactly that. The 12-application audit found that each host lost something different: one had no auto-dismiss, so successes accumulated for the life of the route; one wrote `var(--nb-z-toast)`, a token that does not exist, and silently ran on the fallback instead of `--nb-zindex-toast`; one dropped `role="alert"`, the variant icon, the action and pause-on-hover.

None of that was careless. It is what a container costs to get right, which is why it is library code now. The build-your-own recipe has been removed rather than corrected. If you have a local `Toaster.vue`, the [migration steps](/ui/components/toaster#replacing-a-hand-built-host) are four short ones.
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

| What you have                                                    | Use instead                                                                                 | Because                                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| A validation error                                               | [`NbMessage`](/ui/components/message) on the field                                          | The fix happens at the field. A toast makes the user remember which one                               |
| A failure that belongs to the page or the form                   | [`NbBanner`](/ui/components/banner) `variant="inline"`, in place                            | The user has to see the failure and the thing that failed together, for as long as it takes to fix it |
| A condition that stays true while the page is open               | [`NbBanner`](/ui/components/banner) `variant="callout"`                                     | A standing fact that expires has been told to the user exactly once, at random                        |
| A question that must be answered before anything continues       | [`useConfirm()`](/ui/composables/use-confirm)                                               | A toast cannot block, and it cannot be answered. A toast that "confirms" something confirms nothing   |
| News that outlives the moment and has to be findable later       | [`NbNotificationCenter`](/ui/components/notification-center)                                | Three applications hand-built a bell (312, 343 and 308 lines) because this distinction had no home    |
| Work that is still in progress on this screen                    | [`NbInlineLoading`](/ui/components/inline-loading) or [`NbSpinner`](/ui/components/spinner) | Progress belongs next to the thing making progress ([Status indicators](/patterns/status-indicators)) |
| A per-row or per-item result in a long list                      | The row itself                                                                              | Ten toasts for ten rows is a wall. Say "3 of 10 failed" once, and mark the rows                       |
| Anything with an error code, an id, or a list the user must keep | An inline banner, a details panel, or the notification centre                               | A toast cannot be scrolled back to                                                                    |

Three more rules that come straight from what the fleet shipped:

- **Never toast something the user can already see.** A row that disappeared reported itself.
- **Never toast twice for one action.** One message for the request and another for the response is two interruptions for one thing. Keep the handle from `push()` and `update()` it.
- **Do not raise a toast from behind a modal.** Toasts stack above dialogs (`--nb-zindex-toast` resolves above `--nb-zindex-modal`), so a toast fired while a dialog is open covers the surface the user is actually reading. Report it inside the dialog, and toast the result after it closes.

## Choosing the variant

The variant is not a colour choice. It sets the icon, the accent, the hidden severity word, the politeness of the announcement (`error` is `assertive`, everything else is `polite`) and, under [`NbToaster`](/ui/components/toaster), how long the message lives. Severity and lifetime are one decision, which is why they are in one table. The durations are `NB_TOAST_DURATIONS` as it ships.

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

If yes, it is not a toast at all. "Your trial ends in three days", "this environment is not production", "two members are still awaiting approval" are all true for as long as the page is, so they belong in [`NbBanner`](/ui/components/banner) `variant="callout"`, which cannot be dismissed because dismissing it would not make it untrue. If the warning is about the form or the page in front of the user, it is `variant="inline"` on that page.

A `warning` toast is only correct for an outcome that is finished and imperfect: the import ran, three rows were skipped, and nothing about that is still happening. If the user has to go and fix those three rows, the sentence has an action in it, and [When not to use](#when-not-to-use) applies: give it a surface with a lifetime.

## When you would still use `NbToast` directly

Only when the thing on screen is not a toast: a message pinned inside a panel, a story or a visual test that needs one frozen toast, a custom host that already exists and cannot be replaced this week. A bare `NbToast` times itself, so it works standalone.

For anything that is genuinely a toast, use the host.

## Writing one

The words are covered once, in [Writing style](/content/writing-style) and [Action labels](/content/action-labels). Three things are peculiar to a message that removes itself:

- Past tense, no full stop: "Draft saved", not "Your draft has been saved.".
- The `title` carries what went wrong and the `message` carries the recovery: `toast.error('Could not reach the server', { title: 'Save failed' })`.
- The action is a verb from the shared register (`Retry`, `Reload`, `Undo`), never `OK`, `Done`, `Close` or `Dismiss`. The close button is the exit; a second control that also means "go away" is a coin toss for anyone reading the stack through a screen reader.

## Props

| Prop          | Type                                          | Default               | Description                                                                                                                                                                                                                                                 |
| ------------- | --------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`     | `string`                                      | none                  | **Required.** The body text.                                                                                                                                                                                                                                |
| `variant`     | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'`              | Accent, icon, hidden severity word, announcement politeness, and under a host the lifetime. [Choosing the variant](#choosing-the-variant).                                                                                                                  |
| `title`       | `string`                                      | none                  | Optional heading above the message.                                                                                                                                                                                                                         |
| `duration`    | `number`                                      | `4000`                | Milliseconds the countdown bar represents. Standalone, it is also the auto-dismiss timer. `0` draws no bar and never dismisses. Under a host the default comes from the variant instead (`NB_TOAST_DURATIONS`), and any toast with a `cta` defaults to `0`. |
| `cta`         | `{ label: string; action: () => void }`       | none                  | One action. Pressing it runs `action()`, emits `action`, then emits `close`.                                                                                                                                                                                |
| `role`        | `'alert' \| 'status' \| 'none'`               | `'alert'`             | ARIA role. A real prop, not a fallthrough attribute, so it cannot be lost by a later refactor. `NbToaster` passes `none` (see below).                                                                                                                       |
| `ariaLive`    | `'assertive' \| 'polite' \| 'off'`            | by variant            | Politeness. Defaults to `assertive` for `error` and `polite` otherwise.                                                                                                                                                                                     |
| `statusLabel` | `string`                                      | the variant, in words | Visually hidden severity word, read before the title. Pass your own to translate it, or `''` to suppress it.                                                                                                                                                |
| `closeLabel`  | `string`                                      | `'Close'`             | Accessible name of the close button. Translate it.                                                                                                                                                                                                          |
| `managed`     | `boolean`                                     | `false`               | `true` when a host owns the clock. The toast then runs no timer of its own and takes its pause state from `paused`.                                                                                                                                         |
| `paused`      | `boolean`                                     | `false`               | Countdown held. Only read when `managed`.                                                                                                                                                                                                                   |
| `cycle`       | `number`                                      | `0`                   | Bump it to restart the countdown bar after the message changed, so a rewritten toast does not inherit the previous message's remainder.                                                                                                                     |

## Events

| Event    | Payload | Description                                                                                                     |
| -------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| `close`  | none    | The toast should be removed: the timer elapsed, the close button was pressed, or the action was taken.          |
| `action` | none    | The action was pressed. Emitted just before `close`, so a host can tell "the reader acted" from "it timed out". |

The parent removes the component. `NbToast` never removes itself from the DOM.

## Severity is in words, not only in colour

Every toast renders a visually hidden severity word before the title, because the icon is `aria-hidden` inside `NbIcon` and the accent colour says nothing to a screen reader. Without it, "Could not reach the server" arrives with no indication that it is an error, which is a [WCAG 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) failure. Override `statusLabel` per toast, or once per queue with `createToastQueue({ statusLabels })`.

## One clock, or its own

Standalone, `NbToast` times itself and pauses under the pointer. That is the right behaviour for one toast and the wrong behaviour for three: pausing only the hovered one lets the two below it expire while they are being read.

Under `NbToaster` the toast is `managed`. The queue owns the clock, the whole region pauses together, and the toast draws the bar from `duration`, `paused` and `cycle`. There is one countdown implementation either way.

## Announcement, under a host

`NbToaster` renders its toasts with `role="none"` and `aria-live="off"` and announces from a live region that was mounted long before the message existed. A live region and its first message inserted in the same tick is the most common reason a toast is never heard at all. The severity word stays inside the toast, so browse mode still reads it, but only one thing speaks.

Used standalone, `NbToast` keeps its own `role="alert"` default and announces itself.

## Keyboard and focus

A toast is the one surface in the library that can vanish while it is being read, so its keyboard story is a different question from every other component's: not "can it be operated" but "can it be reached before it is gone". Four answers, and two of them differ between a bare `NbToast` and one under a host.

**Is the toast in the tab order?** The toast itself, no. `.nb-toast` is a plain `div` with no `tabindex`, so it is never a stop. Its controls are: the `cta` button, then the close button, in that DOM order. A toast with no `cta` therefore costs a keyboard user exactly one <kbd>Tab</kbd> stop, and one with a `cta` costs two. That is deliberate. Toasts are teleported to the end of the document, so every stop inside one is a stop the user has to travel to.

**Is the close button reachable?** Yes, always. It is a real `<button>` with `aria-label` taken from `closeLabel`, which defaults to `Close` and is there to be translated. Under [`NbToaster`](/ui/components/toaster#keyboard) it is also reachable directly: the stack is a labelled `role="region"` with a hotkey (<kbd>Alt</kbd>+<kbd>T</kbd> by default) that moves focus into the newest toast and back out again, because a region at the end of the document is otherwise a long walk.

**Does <kbd>Esc</kbd> dismiss it?** Under the host, yes: it dismisses the toast focus is inside, not the whole stack, because toasts arrive independently and clearing all of them on one key press throws away messages nobody has read. A bare `NbToast` binds no key handler at all, so <kbd>Esc</kbd> does nothing and the only keyboard exit is tabbing to the close button.

**Where does focus go when a focused toast is dismissed?** Under the host, onto the first focusable control of the next toast in the rendered stack, or, when that was the last one, back to whatever held focus before the user entered the region. This matters most for exactly the case that has a `cta`: pressing `Undo` removes the toast that contains the button being pressed, and without this, focus lands on `<body>` and a keyboard user is back at the top of the document. A bare `NbToast` does not do this, because it does not own the DOM around itself. It is the strongest of the reasons to let the host render your toasts.

One more difference worth knowing before you use `NbToast` standalone: it pauses its own countdown on `mouseenter`, not on focus. A keyboard user who tabs into a standalone toast can watch it expire under the caret. The queue holds the clock for pointer **and** focus together, so under `NbToaster` a toast cannot time out while anyone is inside it.

::: tip The rule this adds up to
Never let a toast be the only route to an action. A toast with an `Undo` is a shortcut offered to someone who is already looking at it; the same undo must exist somewhere with a lifetime, or the action needed a [confirmation](/ui/composables/use-confirm) rather than a toast.
:::

## Tokens

| Token                                                              | Used for                                                        |
| ------------------------------------------------------------------ | --------------------------------------------------------------- |
| `--nb-c-bg`, `--nb-c-border`                                       | Surface and outline.                                            |
| `--nb-c-success`, `--nb-c-danger`, `--nb-c-warning`, `--nb-c-info` | Icon and the leading accent rule, per variant.                  |
| `--nb-c-text`, `--nb-c-text-muted`, `--nb-c-text-subtle`           | Title, message, close button.                                   |
| `--nb-c-scrim`                                                     | The shadow is mixed from it, so it deepens with the dark theme. |
| `--nb-radius-md`, `--nb-radius-sm`                                 | Corners.                                                        |
| `--nb-spacing-2/4/10/12/14/16/24`                                  | Gaps, padding and the close button's box.                       |
| `--nb-font-size-12`, `--nb-font-size-13`                           | Action, and the title and message.                              |

Nothing here is a raw hex value or a token with a hardcoded fallback, and `tests/Toaster.test.ts` fails the build if one comes back.

## Related

- [`NbToaster`](/ui/components/toaster) is the host, and the page to read first.
- [`useToast()`](/ui/composables/use-toast) is the API every call site uses.
- [`NbBanner`](/ui/components/banner) for a message that belongs to the page rather than to a moment, and [`NbMessage`](/ui/components/message) for one about a single field.
- [`NbNotificationCenter`](/ui/components/notification-center) for news that has to be findable later.
- [Status indicators](/patterns/status-indicators) settles which surface owns which kind of state, and [Dialogs](/patterns/dialogs) covers undo instead of confirmation.
