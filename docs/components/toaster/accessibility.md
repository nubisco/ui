---
layout: nubisco
title: Toaster
intro: '`NbToaster` is the host: one region, mounted once, that renders the shared toast queue. `useToast()` is how everything else talks to it. Between them they own the parts of a notification that are not about how one message looks: where the stack sits, how many are on screen, when each one leaves, what pauses the clock, what is announced and what happens to focus when a message the user was reading disappears.'
source: src/components/Toaster.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

Auto-dismissal is a time limit and an interruption at once, so this component is answering [WCAG 2.2.1 Timing Adjustable](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html), [2.2.4 Interruptions](https://www.w3.org/WAI/WCAG22/Understanding/interruptions.html), [1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) and [4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) at the same time.

## What is announced, and how

Two live regions are mounted, empty, for the life of the host: one polite, one assertive. Messages are written into the matching one when a toast becomes visible.

This ordering is the whole point. A live region and its first message inserted into the DOM in the same tick is routinely missed by NVDA and by JAWS, because the region was not being observed when the text arrived, and that is precisely what happens when the container is rendered with `v-if="toasts.length"`. Mounting the region first is the only reliable order.

Severity decides which region speaks. `error` and `warning` are assertive and interrupt, because they change what the user should do next. `success` and `info` are polite and wait their turn: telling somebody their save worked is not worth cutting off the sentence they were listening to.

The announcement reads the severity word, then the title, then the message, and then, if there is an action, its label and the key that reaches it.

**A toast that is still waiting for a slot is not announced yet.** The announcer follows the visible records, so with the cap full the fourth message is spoken at the moment it is admitted, not at the moment it was raised. It is late, never lost, and it is the right way round: announcing something a sighted user cannot see, with a `Retry` that is not on screen, is worse than announcing it a few seconds later along with everyone else. If a message cannot afford to wait for a slot, it is not a toast: see [When to toast](#when-to-toast).

Only one thing speaks. The visible toasts are rendered with `aria-live="off"`, which switches off the live region that `NbToast`'s standalone `role="alert"` would otherwise create, so the announcer is the only voice. Each toast still carries the severity word visually hidden, so browse mode reads "Error. Could not reach the server" rather than a sentence whose severity was only ever a colour and an `aria-hidden` icon.

**One voice means the voice has to be a queue, not a variable.** This is the failure mode a single announcer buys, and it is worth naming because the naive design does not have it. A live region is read by observing a mutation, so a sentence has to sit in the DOM long enough to be observed. Two successes raised in the same tick, or the four-in-a-row burst in [The cap and what overflows](#the-cap-and-what-overflows), would write two sentences into one region in one frame, and only the second would ever be seen: a screen reader user would hear one of four messages a sighted user can count on screen. A live region per toast is cruder and does not lose them, so buffering is not optional here, it is the price of the single announcer.

Each politeness therefore has its own FIFO buffer, drained one sentence at a time on a 500ms interval: long enough for the assistive technology to take its copy (a screen reader queues polite speech itself, so this is not the speaking time), short enough that a burst of four is fully announced in about two seconds. The two buffers drain independently, so an error is spoken immediately rather than waiting behind a queue of confirmations it is more urgent than. The consequence to know about: with a long burst, the last sentence is heard a second or two after its toast appeared, and if the toast was short-lived it may have gone by then. That is the trade for hearing it at all.

The markup also carries `role="none"`, and it is worth being precise about what that does, because an earlier revision of this page was not: presentational-role conflict resolution discards `role="none"` on any element that carries a global ARIA attribute, and `aria-live` is one. What a screen reader sees is therefore an ordinary generic element with its live region off. That is the intended result, and the attribute is kept only because `NbToast` defaults `role` to `alert` for standalone use and something has to override it.

## Keyboard

| Key                                 | Does                                                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| <kbd>Alt</kbd> + <kbd>T</kbd>       | Moves focus to the first control in the newest toast: its action if it has one, otherwise Close. Press it again to go back exactly where you were. |
| <kbd>Tab</kbd>                      | Moves through the actions and close buttons in the stack. Nothing is trapped.                                                                      |
| <kbd>Escape</kbd>                   | Dismisses the toast that contains focus, not the whole stack. Other people's messages are not the current one's to clear.                          |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Takes the focused action.                                                                                                                          |

The hotkey exists because a toast at the end of the document is a long way from wherever the user was, and the countdown is running while they travel. It is a round trip: in and back out, two keystrokes, no lost place. Entering the stack also holds the clock, so nothing expires while it is being read.

### Under an open dialog

The stack is teleported to `body` and painted above modals (`--nb-zindex-toast` is modal + 50), so a toast raised by a dialog's own Save is visible over it. The hotkey is the collision that matters, and the host answers it explicitly: while any `[aria-modal="true"]` element is on screen and does not contain the stack, <kbd>Alt</kbd> + <kbd>T</kbd> does nothing and the keystroke is left to the page.

Moving focus out of a modal surface is the wrong thing to do from both ends. A dialog with a focus trap takes focus straight back, leaving the reader nowhere; a dialog without one has told assistive technology that everything outside it is inert, and there is nothing to hand focus back with. The message is not lost: the live region announces it from inside the dialog, because a live region is not part of the modal's node tree, and the same two keystrokes reach the stack once the dialog closes. What follows for you is a content rule, not a code one: anything the reader must be able to act on while a dialog is open belongs in the dialog, not in a toast behind it.

### The hotkey is a physical key, and the hint is a promise

<kbd>Alt</kbd> + <kbd>T</kbd> is matched on `event.code === 'KeyT'`, the key's position, not on the character it produces.

This is not pedantry. On macOS, Option is a character modifier: Option+T types a dagger in Chrome, Safari and Firefox alike, and never a `t`. A hotkey matched on `event.key` is therefore dead on macOS, and layout-dependent everywhere else, since the letter engraved on a key is not the same on QWERTY, AZERTY and Dvorak. An earlier revision of this component got that wrong while its announcer told screen reader users to press the key, which is worse than offering no hotkey at all. It is now asserted with the event a Mac really emits.

Two things follow for you:

- `hotkeyHint` is spoken to somebody who cannot see the stack. If you change `hotkey`, change the hint, and say the letter your users have on their keyboard. Set `hotkey` to `null` and the hint is not spoken at all.
- Under the `#toast` slot the host looks for focusable elements inside its own item wrapper, so a slotted body keeps the hotkey as long as it contains one. If it contains none, there is nowhere to land and the keystroke is left to the page rather than swallowed, but then the hint is a promise you are not keeping: pass `hotkey-hint=""`, or put a close button in your body.

A toast that carries an action never auto-dismisses by default, so reaching it is never a race.

## Focus

Nothing steals focus. A toast that grabbed focus would throw a keyboard user out of the field they were typing in, and toasts arrive without being asked for.

When a toast holding focus leaves, focus moves to the first control of the nearest surviving toast, and when there is none left, back to the control the user came from. Focus does not fall to `<body>`, and that holds for every way a toast can leave, not just the two the user drove: the close button, <kbd>Escape</kbd>, a clock that ran out while they were reading, `dismissAll()` on sign-out, the `router.afterEach(() => toast.dismissTransient())` guard, and a keyed message superseded by its successor.

That breadth is why the restore is a watcher on the queue rather than a step inside the dismiss handler. Only the close button and <kbd>Escape</kbd> reach that handler; every other removal above bypasses it, and an earlier revision of this component put the restore there and dropped focus to `<body>` on all of them, including the two recipes this page teaches. The watcher runs before the DOM is patched, which is the only moment where the focused element is still attached and the return target has not yet been cleared by the `focusout` that removing it will fire.

The surviving neighbour is found by querying focusable elements inside the host's own item wrapper, so this works under the `#toast` slot too, and `dismissAll()` is handled by skipping any neighbour that is leaving in the same batch rather than focusing a dying node.

## Time limits

The clock is held while the pointer is over the stack, while focus is anywhere inside it, and while the browser tab is hidden, including when the host mounts into a tab that is already in the background. It resumes from the time that was left, never from the beginning. Errors never expire at all, and any duration, including `0`, can be set per toast or per queue.

`queue.pause()` is yours as well, for the cases the host cannot see (an import running, a video playing). The host only ever undoes a pause it took itself: if you paused the queue, hovering the stack and unmounting the toaster both leave it paused, the same way the host gives `queue.max` back when it lets go of a queue.

## Motion

`prefers-reduced-motion: reduce` removes the travel and the reflow: toasts cross-fade in place. The countdown bar keeps running, in discrete steps rather than a sweep. It is not decoration, it is the statement of how long is left, and hiding it would take information away from the users least able to hurry.

## Forced colours

Windows High Contrast (`forced-colors: active`) discards box shadows and overrides every author colour. A toast is made of almost nothing else: a surface, a drop shadow that lifts it off the page, and a 3px accent rule that is its only non-text severity cue. Left unanswered, three toasts read as one undivided block painted over content, with no severity signal at all.

So the surface is repainted from the system palette: `Canvas` background, `CanvasText` border, the accent kept at 3px on the inline start, and the countdown bar given `Highlight` at full opacity so it is still visible as a countdown. What cannot come back is the severity hue: forced colours has no four-way severity palette to spend, and minting one with `forced-color-adjust: none` would opt the close button out of the contrast settings the user chose, which is the opposite of the point. Severity falls to the two channels that survive, and both are already there: the per-variant icon, which differs in shape and not only in colour, and the visually hidden severity word, which is exactly why that word is not decoration ([Colour and contrast](/accessibility/color-contrast)).

The host adds one rule the toast body cannot: an item whose body came from the `#toast` slot gets its own `CanvasText` outline, because nothing guarantees a replacement body draws a boundary. An item using the default body does not, so a normal toast is not ringed twice.

## Right to left

The stack anchors with `inset-inline-start` and `inset-inline-end`, so `bottom-end` is the bottom right of an English build and the bottom left of an Arabic one, and the enter and exit motion follows it. The variant accent uses `border-inline-start` for the same reason: a physical `border-left` would leave the rule on the far side of the toast from the edge the stack is pinned to, which is the RTL bug the logical placement exists to prevent. The countdown bar drains towards the end of the line in both directions.

## Naming

The conventions below are the fleet's ([Accessibility overview](/accessibility/overview), [Keyboard](/accessibility/keyboard)); what follows is what this component does with them.

The region is a `region` landmark named by `label`, so it can be found deliberately rather than stumbled into. The close button is named by `closeLabel`, and the severity words by `statusLabels`, both stated once per queue: the fleet includes a Spanish-market product, and a hardcoded "Close" is a defect there.

## What is still on you

- Do not put a toast in place of a form error. A field's error belongs to the field ([`NbMessage`](/components/message/usage)).
- Do not put the only route to something in a toast. It is the shortest-lived surface in the product.
- If you replace the body through the `#toast` slot, the severity word and the labelled close button become yours to render. Keep something focusable in it, or the hotkey has nowhere to land.
- Decide what a route change does to a toast raised by the page the user just left. `dismissTransient()` in a router guard is the answer for most products; doing nothing is a decision too, but make it deliberately.

<!--@include: ./_shared.md-->
