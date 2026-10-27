---
layout: nubisco
title: Notification Center
intro: '`NbNotificationCenter` is the bell in the shell topbar: a trigger carrying an unread count, and an anchored panel listing what happened while you were working.'
source: src/components/NotificationCenter.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- The trigger is a `<button>` with `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` pointing at the panel while it is open. Its accessible name carries the **uncapped** unread count.
- The badge is `aria-hidden`, because its number is the capped one.
- A trigger you supply through `#trigger` gets the same guarantees, but only if you take them: `triggerProps` carries the ARIA relationship and `setTriggerRef` carries the focus return. This is the one place where the escape hatch can cost you something the component otherwise owns, so it is spelled out in [Replacing the bell](#replacing-the-bell) rather than left to be discovered.
- The failure state is a `role="alert"` region, so a request that did not come back is announced rather than sitting there waiting to be found. A refresh that failed over rows already on screen is `role="status"` instead: it is a correction, not an emergency.
- The panel is `role="dialog"` labelled by its heading. It is deliberately **not** `aria-modal`: there is no scrim, the page behind it stays live, and it closes when you click there. Because of that it does **not** hold <kbd>Tab</kbd>: tabbing off either end leaves the panel and closes it, forward onto whatever follows the trigger and backward onto the trigger itself. A focus trap belongs to a surface that has made the rest of the page inert, and this one has not.
- <kbd>Escape</kbd> is not taken when a surface layered above the panel already answered it, so an `NbConfirm` opened from a row action closes without taking the centre with it.
- The list carries an explicit `role="list"` and each row an explicit `role="listitem"`. Both are needed: WebKit strips list semantics from a list styled with `list-style: none`, which every list in this library is, and without them VoiceOver never says "list, 12 items". [`NbReorderList`](/components/reorder-list/usage) carries the same explicit `role="list"`, though not the item role, so this is the library's convention taken one step further rather than a local invention.
- Focus moves to the first row on open, or to the panel itself when there is nothing to read, so the dialog title and the empty state are both announced.
- Arrow keys move the roving focus only when focus is on a row or on a non-field control. A field in any slot keeps its own arrows; only <kbd>Escape</kbd> is taken from it.
- Read state is a word for assistive technology, not only a dot and a tint.
- A row that leads nowhere is not a button. `interactive: false` renders it as a plain element with no tabindex, outside the roving focus, emitting nothing: inert in the accessibility tree, the keyboard order and the event contract at once. A row that is focusable and activatable but has no role is a WCAG 4.1.2 failure, and it is the failure this component was fixed for.
- When a list holds no control at all, the scrolling list takes the tab stop, so the region can still be entered and scrolled from the keyboard. With one control in it, the extra stop is dropped.
- A slotted row is only taken into the keyboard order if it is genuinely a control: a `<button>`, an `<a href>`, or an explicit `role` of button, link, menuitem or option. Anything else is ignored and warned about in development rather than dressed up as a control the browser never agreed to.
- Per-row controls live outside the row's own button or link. A button inside a button is invalid, and some browsers make the inner one unreachable.
- Times render as `<time>` with a machine-readable `datetime` beside the human wording, and the wording comes from `Intl.RelativeTimeFormat`, so "yesterday" arrives in the reader's language.
- The mark-all control is `aria-disabled` while its request is in flight rather than `disabled`, so it keeps the focus the user gave it, and the pending label is announced from a `role="status"` region rather than relying on a silent label swap.
- Under `prefers-reduced-motion: reduce` the open and close transition is dropped. The loading placeholders follow whatever `NbSkeleton` does under that preference, because they are `NbSkeleton`.
- Under `forced-colors: active` the unread row keeps a marker: see [Theme](#theme).
