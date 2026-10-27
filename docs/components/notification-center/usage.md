---
layout: nubisco
title: Notification Center
intro: '`NbNotificationCenter` is the bell in the shell topbar: a trigger carrying an unread count, and an anchored panel listing what happened while you were working.'
source: src/components/NotificationCenter.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

It is a **container**, not a feed. It holds no store, fetches nothing, polls nothing, marks nothing as read and knows nothing about your domain. Three Nubisco consoles each wrote this bell independently, and the parts that differed were the parts that should differ: what a notification is, where it came from, and what tapping it does. Everything the three agreed on, the trigger, the count, the dropdown, the dismissal rules, the focus order, the read/unread distinction, is here. One of those three files carries a comment saying it copied another console's placement so the two products would not disagree; that is the coordination this component makes unnecessary.

::: info Where the evidence on this page comes from
Claims about "the audit" refer to a review of the twelve applications that consume this library (cms, keystone, verba, openbridge, platform, analytics, tally, openbridge-marketplace, stagewright, planetcraft, stratos, and one white-label client product). That review is a report about **those** repositories and is not checked into this one, so do not go looking for it here. What it found in this repository is checkable here, and is linked wherever it is used.
:::

<preview dir="col">
  <!-- Trailing edge, matching the shell topbar this belongs in; the panel
       anchors to the trigger's right edge. -->
  <NbNotificationCenter
    style="align-self: flex-end"
    :items="[
      { id: 1, title: 'Build failed on main', body: 'stagewright · 2 failing specs', time: '2026-09-03T12:41:00Z', variant: 'error' },
      { id: 2, title: 'Ana approved “Pricing page”', body: 'Ready to publish to production.', time: '2026-09-03T09:12:00Z', variant: 'success' },
      { id: 3, title: 'API key rotated', time: '2026-09-01T16:20:00Z', read: true }
    ]"
  />
</preview>

```vue
<template>
  <NbNotificationCenter
    :items="items"
    :loading="pending"
    @select="go($event)"
    @mark-all-read="markAll()"
  />
</template>
```

## Read and unread

Three cues, deliberately, because one is never enough:

- a dot at the leading edge, which is the scannable one,
- a heavier title and a tinted row, which survive being seen through a colour-vision deficiency or a bad monitor,
- the visually hidden word **Unread** or **Read** at the start of the row, which is the only one a screen reader gets.

The dot is one shape in every variant. `variant` colours the leading icon (`info`, `success`, `warning`, `error`), not the unread affordance, so unread stays a thing you learn once rather than five things that all mean the same.

<preview dir="col">
  <NbNotificationCenter
    :items="[
      { id: 1, title: 'Deploy queued', variant: 'info' },
      { id: 2, title: 'Certificate renewed', variant: 'success', read: true },
      { id: 3, title: 'Quota at 90%', variant: 'warning' },
      { id: 4, title: 'Webhook failing', variant: 'error', read: true }
    ]"
    label="Activity"
  />
</preview>

## Opening, dismissing, and focus

The behaviour is the one `NbMenu` and `NbUserMenu` already ship, on purpose: the panel is teleported to `<body>` and positioned from the trigger's viewport rect, because every shell that hosts a bell clips its topbar; a press outside closes it; <kbd>Escape</kbd> closes it.

Being honest about the placement code, since the audit's whole complaint is duplication: this is a **fourth** implementation of anchored positioning in the library, after `NbMenu`, `NbUserMenu` and `utils/anchorPosition.helper.ts`. It does not call that helper because the helper centres a surface on its anchor's cross axis, and a 360px panel centred on a 32px bell hangs half off the right edge of every topbar in the fleet: this panel aligns to a trigger **edge**. What it does borrow is the helper's actual argument, that placement is easy to get subtly wrong and impossible to eyeball, so the arithmetic is an exported pure function (`placeNotificationPanel`) with tests over the edge alignment, the viewport clamp, the flip and the list-height floor. If `placeAnchored` grows an `align` option, this function should collapse into a call to it.

| Key                                 | Result                                                                                                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | On the trigger, opens and moves focus to the first row. On a row, activates it.                                                                                                                                                 |
| <kbd>↓</kbd> / <kbd>↑</kbd>         | Move between rows. The list does not wrap, so the ends stay findable. Inside a field in one of the slots the arrows belong to the field, not to the list.                                                                       |
| <kbd>Home</kbd> / <kbd>End</kbd>    | First and last row, when focus is already on a row.                                                                                                                                                                             |
| <kbd>Tab</kbd>                      | Moves through the panel's controls and then **out** of it, closing it. Forward off the last control lands on whatever follows the trigger in the page; <kbd>Shift</kbd>+<kbd>Tab</kbd> off the first lands back on the trigger. |
| <kbd>Escape</kbd>                   | Closes, from anywhere in the panel including a field. Focus returns to the trigger when it was inside the panel. Not taken when a surface layered above the panel already answered the key: see below.                          |

The whole list is one tab stop, not one per notification: arrows move the roving focus inside it. Forty notifications between the bell and the next control in the topbar would be forty presses of <kbd>Tab</kbd>.

<kbd>Tab</kbd> leaves the panel rather than looping inside it, and this changed after review. The panel is a `role="dialog"` **without** `aria-modal`: there is no scrim, nothing behind it is inert, and a screen reader's virtual cursor can read the page underneath freely. Trapping <kbd>Tab</kbd> in a surface like that is a contradiction, and it left a keyboard user able to reach the bell and then leave only by <kbd>Escape</kbd>. The APG rule for a non-modal dialog is that <kbd>Tab</kbd> moves out of it and moving out dismisses it, so that is what happens. The one correction the panel makes is _where_ out is: it is teleported to the end of `<body>`, so the browser's own next stop is nothing near the bell, and the two edges are handled explicitly instead.

### An Escape a nested surface already answered

A row action or a `#footer` link can open something that is itself dismissible: an [`NbModal`](/components/modal/usage), an [`NbConfirm`](/components/confirm/usage), a teleported [`NbSelect`](/components/select/usage) listbox. That surface is nearer the user, so its <kbd>Escape</kbd> is its own, and one keystroke must not cost two dialogs. The centre stands down on two tests: `event.defaultPrevented`, for anything that consumed the key outright, and containment in an `[aria-modal="true"]` element that is not the panel, which is how `NbModal` and `NbConfirm` mark themselves (`Modal.vue`'s own topmost check reads the same attribute) and which they do not `preventDefault` on.

The arrows are only taken while focus is on a row or on a non-field control. An `<input>`, `<textarea>`, `<select>` or `contenteditable` inside any of the slots keeps its own arrow keys, because <kbd>↑</kbd> in a filter box moves the caret and jumping the user into the list instead is a bug they cannot work around. A filter field in the header is a supported composition, so this is a contract, not an accident. Put it in `#header-start`, which adds to the header, rather than `#header-actions`, which replaces it. See [Adding to the header](#adding-to-the-header).

Focus returns to the trigger when the panel had focus, so <kbd>Escape</kbd> and the toggle both put you back where you started. Three cases deliberately leave focus alone:

- You dismissed by clicking somewhere else. You already said where you wanted to be, and dragging focus back to the bell would undo that.
- <kbd>Escape</kbd> arrived while focus was somewhere else on the page. The panel is not modal, so the page underneath is live and that keystroke is usually not about the bell at all: the realistic sender is a nested overlay opened from a row action or from `#footer` (an [`NbModal`](/components/modal/usage), a teleported [`NbSelect`](/components/select/usage) listbox) dismissing itself in the same tick. The panel goes; the caret stays. The exception is the trigger already holding focus, where "leave it alone" and "put it back" are the same thing.
- The trigger scrolled out of view, or a navigation happened. By then the user is somewhere else.

## Two centres on one page

Two bells in one shell is a reasonable thing to build: a product centre beside an account one, or a tenant-scoped one beside a platform one. Two open panels is not. They overlap, each cycles <kbd>Tab</kbd> within itself, and the one underneath is unreachable, so **opening one dismisses any other that is open**. Focus is not moved when that happens: you are on the bell you just pressed, and pulling you to the other one would be the same theft the component refuses everywhere else.

The arbitration is per page, not per app, and it works through the same `update:open` every other close goes through. A host that fully controls `open` and ignores `update:open` can therefore still force two open at once. That is your decision to make and the centre will not fight you for it, but nothing below the top of the stack will be reachable by keyboard.

## Announcing arrivals

The panel is not a live region and the count is not announced when it changes. A bell that speaks every time something lands interrupts the work the user is actually doing, and the arrival of a notification is rarely worth that.

When an event genuinely needs to interrupt, raise an [`NbToast`](/components/toast/usage) for it and let it also land in the centre, so the toast is the interruption and the panel is the record. Reserve `role="alert"` for what would be worth a person tapping you on the shoulder.

## When a notification centre is the wrong answer

The container is cheap; the feed behind it is not. Before you add one, check that the answer to all three is yes:

1. **Does anything arrive while the user is not looking?** If every event in your product is the direct result of a button the user just pressed, an [`NbToast`](/components/toast/usage) or an [`NbInlineLoading`](/components/inline-loading/usage) beside that button says it better, and a bell that only ever mirrors your own clicks trains people to stop opening it.
2. **Is there more than one source?** One source with a natural home (a comment thread, a build page, a run log) is better read where it lives. A centre earns its place when four subsystems all need somewhere to speak and none of them owns the screen.
3. **Can the user act on it, or is it a log?** A record of everything that happened is an audit trail, and an audit trail belongs on a page with filters, dates and paging, not in a 384px panel.

And what does not belong in the feed, whichever way you answered:

- **Anything blocking.** If the user cannot proceed until they respond, that is an [`NbConfirm`](/components/confirm/usage) or an [`NbModal`](/components/modal/usage), in front of them, now. A bell badge is not consent.
- **Anything catastrophic and current.** A production incident, an expired card, a locked account: those are an [`NbBanner`](/components/banner/usage) on the page they affect. A person who has not opened the panel has not been told.
- **Per-keystroke or per-row chatter.** One notification per saved field, per uploaded file, per synced record. Batch to the unit the user thinks in ("14 files uploaded"), or do not send it.

Two rules for what you do send:

- **Newest first, and group what belongs together.** Twelve rows saying "Ana commented" are one row saying "Ana commented 12 times on Pricing page". Grouping is the host's job, done before the array reaches this component, because only the host knows what "the same thing" means.
- **Let people turn categories off.** A feed nobody can tune is a feed everybody ignores, and the first thing an ignored bell costs you is the one notification that mattered. WCAG 2.2.4 Interruptions (AAA) asks for exactly that, a way to postpone or suppress what interrupts. The preferences screen is not part of this component, but shipping the bell without one is how alert fatigue starts.

On timing: nothing here disappears on a timer, which is deliberate. A notification the user has to be quick to read fails WCAG 2.2.1 Timing Adjustable, and content that moves or updates under a reader's cursor fails 2.2.2 Pause, Stop, Hide. Rows stay until the data behind them changes, and the panel only closes when the user, the navigation or a vanished trigger says so.

## Copy

- `label` names the trigger and titles the panel. Keep it a noun: **Notifications**, **Activity**, **Inbox**.
- Titles are one line, no trailing full stop. The body is a sentence and gets one.
- Never write the count into the label yourself. It is already in the accessible name, and "Notifications (3), 3 unread" is what doubling it sounds like.
- `unreadLabel` and `readLabel` are read aloud, not shown. They are props because they need translating, not because they need styling.

## Theme

Every colour is a token: `--nb-c-layer-3` and `--nb-c-layer-border-3` for the panel, `--nb-c-danger` with `--nb-c-danger-a11y` for the badge, `--nb-c-primary` for the unread dot and the mark-all control, `--nb-c-focus-ring` for focus, `--nb-c-text`, `--nb-c-text-muted` and `--nb-c-text-subtle` for the three levels of type. The unread tint is a `color-mix` of `--nb-c-primary` into transparency, so it follows whatever a white-label deployment sets primary to and it works on both grounds. No colour in this component names a brand ramp, so nothing purple leaks into a white-label build.

The one value that is not a token is the panel's elevation, `0 12px 32px rgba(0, 0, 0, 0.18)`, which is what [`NbUserMenu`](/components/user-menu/usage) uses byte for byte. There is no shadow token in `src/styles` to point at yet, so it is behind an override instead: set `--nb-notification-center-shadow` anywhere that reaches `<body>` and the panel takes it. The library's own `.dark` theme does exactly that, because the same black elevation over a dark ground reads as nothing at all. When a real shadow token arrives, that default becomes a `var()` and nothing else about this changes.

### Windows high contrast

Forced colours throw away every background, every fill and every shadow, and repaint text, borders and outlines from the user's own palette. Three things in this component were carried by colour alone and would have gone with it, so each is redrawn under `@media (forced-colors: active)` in the one currency the mode keeps, a border:

| What             | Normally                             | Under forced colours                                         |
| ---------------- | ------------------------------------ | ------------------------------------------------------------ |
| The panel's edge | A shadow over `--nb-c-layer-3`       | A `1px` `CanvasText` border, no shadow.                      |
| The unread badge | A `--nb-c-danger` fill               | `Canvas` with a `CanvasText` border and `CanvasText` digits. |
| An unread row    | A 6% `--nb-c-primary` tint and a dot | A `Highlight` leading edge and a bordered `Highlight` dot.   |

The unread row is the one that mattered. Its three cues are a tint, a dot and a heavier title, and forced colours removes the first two: that would have left font weight, which is not a reliable difference, and the visually hidden `unreadLabel`, which only a screen reader hears. A sighted high-contrast user would have seen read and unread as identical rows.

### Server rendering

`NbNotificationCenterItem` formats `time` relative to the clock, and a server and a browser do not read the same clock: a row rendered as "just now" is "2 minutes ago" by the time the client hydrates, and Vue reports the mismatch. So the relative form waits for `onMounted`, and until then the row shows the absolute date and time in the same locale, which is true at both ends. Pass `timeLabel` instead and the centre renders your string untouched at both ends, which is the escape hatch if the one-tick swap is not acceptable to you. The panel itself is teleported and shut on the server, so the server renders the trigger and nothing else.

## What this component will never do

Fetch, poll, subscribe, cache, mark read, deduplicate or decide what deserves a notification. Those are product decisions and they were correctly different in all three consoles. If a future version grows a store, it will be a separate composable that this component still knows nothing about.
