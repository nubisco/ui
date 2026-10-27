---
layout: nubisco
title: Toaster
intro: '`NbToaster` is the host: one region, mounted once, that renders the shared toast queue. `useToast()` is how everything else talks to it. Between them they own the parts of a notification that are not about how one message looks: where the stack sits, how many are on screen, when each one leaves, what pauses the clock, what is announced and what happens to focus when a message the user was reading disappears.'
source: src/components/Toaster.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

[`NbToast`](/components/toast/usage) renders a single message and stays exactly what it was. `NbToaster` decides when it appears and when it goes.

## Why this is library code now

The 12-application audit found three products with a hand-built host over `NbToast`, because the toast page used to state as policy that the library shipped no container. Each one lost something different:

- one had no auto-dismiss at all, so successes accumulated for the life of the route,
- one wrote `var(--nb-z-toast)`, a name that does not exist, and silently ran on the fallback rather than `--nb-zindex-toast`,
- one dropped `role="alert"`, the variant icon, the action and pause-on-hover.

None of those are careless. They are what a container costs to get right. The page that caused them now points here.

## When to toast

A toast is news that expires. If the message would still be true and still be worth reading five minutes from now, it is not a toast.

| Use                                                          | When                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `NbToaster`                                                  | Something just finished, anywhere on the page, and the news self-clears. |
| [`NbBanner`](/components/banner/usage)                       | Something is true about this page or task and stays on screen.           |
| [`NbMessage`](/components/message/usage)                     | One field has something to say about its own value.                      |
| [`NbConfirm`](/components/confirm/usage)                     | Nothing else may proceed until the user answers.                         |
| [Notification centre](/components/notification-center/usage) | The news outlives the moment and has to be findable later.               |

Do not toast a validation error: it belongs next to the field that caused it. Do not toast something the user can already see happening. Do not toast twice for one action.

The row above is the surface. Which _words_ a state is allowed to be called, and which component owns "what is true about this thing right now", are settled once in [Status indicators](/patterns/status-indicators) rather than restated here. A toast is the only entry in that vocabulary that is a _change_ rather than a state, which is exactly why it may expire and the others may not.

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

## The clock is shared

The whole region pauses, not the toast under the pointer. Pausing only the hovered one lets the two below it expire while they are being read, which is the bug that makes people distrust toasts.

The clock is held while:

- the pointer is over the stack,
- focus is anywhere inside it,
- the browser tab is hidden.

It resumes from the time that was left, never from the beginning. That is why every expiring toast carries a hairline countdown at its bottom edge: it is the only visible statement of how long is left, and it stops where the clock stops.

## Writing the message

Say what happened, in the past tense, without a full stop. Put anything the user has to do in a `title` and keep the message to the recovery.

| Do                                                                    | Don't                                                    |
| --------------------------------------------------------------------- | -------------------------------------------------------- |
| `toast.success('Draft saved')`                                        | `toast.success('Success!')`                              |
| `toast.error('Could not reach the server', { title: 'Save failed' })` | `toast.error('Something went wrong. Please try again.')` |
| `cta: { label: 'Retry', ... }`                                        | `cta: { label: 'OK', ... }`                              |
| One toast per action                                                  | One toast for the request and another for the response   |

Tense, capitalisation and the sentence shapes are the fleet's, not this component's: [Writing style](/content/writing-style) is the source, and this section only adds what is peculiar to a message that removes itself.

Label the action with its verb: `Retry`, `Reload`, `Undo`. The audit found `Cancel`, `Done`, `Close` and `Dismiss` used interchangeably across 12 products, so a toast's action should never be one of them: the close button is the exit, and a second control that also means "go away" is a coin toss for anyone reading the stack through a screen reader.

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

<!--@include: ./_shared.md-->
