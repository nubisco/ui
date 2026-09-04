---
layout: nubisco
title: Notification Center
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbNotificationCenter` is the bell in the shell topbar: a trigger carrying an unread count, and an anchored panel listing what happened while you were working.

It is a **container**, not a feed. It holds no store, fetches nothing, polls nothing, marks nothing as read and knows nothing about your domain. Three Nubisco consoles each wrote this bell independently, and the parts that differed were the parts that should differ: what a notification is, where it came from, and what tapping it does. Everything the three agreed on, the trigger, the count, the dropdown, the dismissal rules, the focus order, the read/unread distinction, is here. One of those three files carries a comment saying it copied another console's placement so the two products would not disagree; that is the coordination this component makes unnecessary.

::: info Where the evidence on this page comes from
Claims about "the audit" refer to a review of the twelve applications that consume this library (cms, keystone, verba, openbridge, platform, analytics, tally, openbridge-marketplace, stagewright, planetcraft, a white-label client product, stratos). That review is a report about **those** repositories and is not checked into this one, so do not go looking for it here. What it found in this repository is checkable here, and is linked wherever it is used.
:::

<preview dir="col">
  <NbNotificationCenter
    style="align-self: flex-start"
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

## Two ways to supply rows

**The `items` array** is the short path. A row is a title, an optional body, an optional time and a read flag, which covers the majority of what the three consoles were rendering.

**The default slot** is the escape hatch, for rows that carry an avatar, a diff, a pair of buttons or anything else the array cannot describe. Compose them from `NbNotificationCenterItem`, which is the same row the array path renders, so a product that outgrows `items` keeps its geometry, its read/unread treatment and its place in the keyboard order.

```vue
<template>
  <NbNotificationCenter :unread-count="unread" @mark-all-read="markAll()">
    <NbNotificationCenterItem
      v-for="event in events"
      :key="event.id"
      :read="event.seen"
      :time="event.createdAt"
      :href="`/deploys/${event.deployId}`"
      variant="warning"
    >
      <template #media>
        <img class="avatar" :src="event.actor.avatarUrl" alt="" />
      </template>
      <template #title>
        <strong>{{ event.actor.name }}</strong> rolled back
        {{ event.service }}
      </template>
      Rollback finished in {{ event.duration }}s.
      <template #actions>
        <NbButton size="sm" variant="ghost" @click="mute(event)">Mute</NbButton>
      </template>
    </NbNotificationCenterItem>
  </NbNotificationCenter>
</template>
```

Two numbers move to you when you use the slot, and both for the same reason: the centre renders your slot, it does not read it, so it has no array to count.

- **`unreadCount`**, or the badge and the trigger's accessible name both say zero.
- **`itemCount`**, or the centre cannot tell an empty feed from a slot you chose not to fill.

`itemCount` is the one that decides which of [the four answers](#the-four-answers-loading-failed-empty-and-a-list) the panel gives, so leaving it out has consequences worth stating plainly rather than burying:

| With `itemCount`                                   | Without it                                                               |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| `itemCount: 0` renders `#empty`.                   | `#empty` never renders. The centre has no way to know the feed is empty. |
| `error` with rows shows the stale strip over them. | `error` always resolves to the full `role="alert"` error region.         |

The second row is a deliberate choice and not an accident: with the count unknown, assuming the slot has rows would let a failed fetch render as content, which is the exact defect this component was built to end. So a failure wins an unknown count. A dev-mode warning is printed the first time a panel opens with a filled default slot and no `itemCount`.

```vue
<NbNotificationCenter
  :unread-count="feed.unread"
  :item-count="feed.rows.length"
  :loading="feed.pending"
  :error="feed.failed"
>
  <NbNotificationCenterItem v-for="row in feed.rows" :key="row.id" ... />
</NbNotificationCenter>
```

`loading` and `error` are props and stay props: they are never inferred from your markup.

Slotted rows still take part in the keyboard model and still emit `select`. A row that carries the `data-nb-notification-item` attribute **and is a control** is picked up by the roving focus and, when activated, emits `select` with a **null** item and the original event. Null because the centre never saw an item object for that row: you already have the object in your own `v-for`, so bind your handler there when you want it typed, and use the centre's event when you only need "a row was activated" (closing the panel, logging, marking seen). `NbNotificationCenterItem` sets the attribute for you, on the rows that are controls. What counts as one is the next section, and it is a short list.

## Rows you press, and rows you only read

A row is a control or it is text. There is no third thing, and the difference is not a style.

`NbNotificationCenterItem` renders a `<button>` by default, an `<a>` when you give it `href`, and a plain element when you say `:interactive="false"`. That plain element is **inert**: no `tabindex`, no place in the arrow-key order, no `select`, no pointer cursor. Set it when the row is an announcement rather than a destination, and the reader is told nothing that turns out to be untrue.

<preview dir="row">
  <NbNotificationCenter
    label="Notifications"
    :items="[
      { id: 1, title: 'Deploy finished', body: 'stagewright · production', variant: 'success' },
      { id: 2, title: 'Ana mentioned you', body: 'in “Pricing page”' }
    ]"
  />
  <NbNotificationCenter
    label="Activity"
    :interactive="false"
    :items="[
      { id: 1, title: 'Quota reset for September', body: 'Nothing to do.', variant: 'info' },
      { id: 2, title: 'Key rotated automatically', read: true }
    ]"
  />
</preview>

```vue
<template>
  <!-- Pressable rows, each going somewhere. -->
  <NbNotificationCenter :items="items" @select="go($event)" />

  <!-- A feed with nowhere to go: rows are read, not pressed. -->
  <NbNotificationCenter :items="events" :interactive="false" />

  <!-- Mixed, per row. The item wins over the centre. -->
  <NbNotificationCenter
    :items="[
      { id: 1, title: 'Deploy finished', href: '/deploys/91' },
      { id: 2, title: 'Quota reset for September', interactive: false },
    ]"
  />
</template>
```

This component shipped once with the opposite behaviour, and it is worth being explicit about why it was wrong. `interactive: false` used to render a `<div>` that still carried a `tabindex`, still took focus from the roving index, and still emitted `select` on click, <kbd>Enter</kbd> and <kbd>Space</kbd>. That is a focusable, activatable widget with no role, no name and no value: [WCAG 4.1.2 Name, Role, Value](/accessibility/overview) fails outright, a screen reader announces a blank stop in the middle of a list, and the prop meant the opposite of what it said. An inert row is now inert in the accessibility tree, in the keyboard order and in the event contract, all three, or it is not inert at all.

### An inert list is still a list you can reach

Take every control out of a scrolling box and you have made a region a keyboard cannot enter, which means content below the fold that a keyboard user cannot read. So when the list holds nothing focusable, **the list itself becomes the tab stop**: <kbd>Tab</kbd> reaches it, the arrow keys and <kbd>Page&nbsp;Down</kbd> scroll it, and it takes its place in the panel's tab cycle. One activatable row anywhere in the list and the extra stop disappears again, because the arrows already reach the bottom through the rows.

### What the centre will not do for a slotted row

In the default slot the markup is yours, so the attribute is an opt-in and the centre checks what it was put on. It accepts a `<button>` that is not disabled, an `<a href>`, and any element carrying `role="button"`, `"link"`, `"menuitem"` or `"option"`. Anything else keeps the attribute and gets nothing: no tabindex, no `select`, and a console warning in development saying which element and what to do about it.

```vue
<!-- Picked up: a control by construction. -->
<li><button data-nb-notification-item>Deploy finished</button></li>

<!-- Picked up: you supplied the role, so you own the key handling too,
     and the centre supplies Enter and Space on top of it. -->
<li>
  <div role="button" tabindex="0" data-nb-notification-item>Deploy finished</div>
</li>

<!-- Ignored, and warned about: nothing here is a control. -->
<li><div data-nb-notification-item>Deploy finished</div></li>
```

The last case is not pedantry. Handing that `<div>` a tabindex is the same defect as the one above, only authored one repository further out, where nobody in this library would ever see it.

## The count

The badge is capped, the accessible name is not. A 15px circle has room for `99+`; a screen reader has room for the truth, so the button announces "Notifications, 142 unread" while the badge reads `99+`. The badge itself is `aria-hidden`, because otherwise the same number is announced twice, once truthfully and once capped.

<preview dir="row">
  <NbNotificationCenter :items="[]" :unread-count="3" />
  <NbNotificationCenter :items="[]" :unread-count="142" />
  <NbNotificationCenter :items="[]" :unread-count="0" />
</preview>

```vue
<template>
  <!-- Counted from the array: every item where read is not true. -->
  <NbNotificationCenter :items="items" />

  <!-- Or stated outright, for a paged feed whose server knows a total the
       loaded page does not. -->
  <NbNotificationCenter :items="page" :unread-count="meta.unread" />
</template>
```

`formatUnread` builds the unread half of that name. The default is English and counts in the two forms English has. Replace it with your `t()` call in any product that ships another language, because Portuguese, Polish and Arabic do not pluralise on `n === 1`.

```vue
<NbNotificationCenter :format-unread="(n) => t('notifications.unread', n)" />
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

## Mark all as read

The centre emits `mark-all-read` and does nothing else. It never mutates `items`: your list is your data, and a component that quietly flipped flags on it would be lying to the store that owns them. Until you push a new array back, the rows stay exactly as they were, which is also what makes an optimistic update and a failed request distinguishable.

The control disables itself at zero unread rather than disappearing, so the panel does not change shape as you use it.

A mark-all that hits the network is not instant, so say so with `markAllPending`. While it is true the control shows a spinner and `markAllPendingLabel`, swallows further clicks, and announces itself once from a `role="status"` region. It is `aria-disabled`, not `disabled`, on purpose: the user pressed that button, so it has focus, and adding a `disabled` attribute to a focused button drops focus to `<body>` for the length of the request. Without this prop, the audit's pattern repeats: a slow server, no feedback, and four identical requests.

```vue
<template>
  <NbNotificationCenter
    :items="items"
    :mark-all-pending="marking"
    @mark-all-read="markAll()"
  />
</template>

<script setup lang="ts">
const marking = ref(false)

async function markAll() {
  marking.value = true
  try {
    items.value = await api.markAllRead()
  } catch (error) {
    toast.error('Could not mark everything as read')
  } finally {
    marking.value = false
  }
}
</script>
```

An optimistic update is the other legitimate answer: push the read flags into `items` at once, leave `markAllPending` false, and put them back if the request fails. What is not an answer is doing neither, which is what "the control is only disabled at zero unread" used to mean.

The label is **Mark all as read**. Across the fleet the same commit intent is currently written as Save, Done, Apply and Create in different products; this one is fixed because a bell in two consoles that disagree on the wording is exactly the drift this component exists to end.

## The four answers: loading, failed, empty, and a list

A panel that has been asked for notifications can be in exactly one of four states, and they must never share an element. One audited app rendered a single `.empty-text` for both loading and empty, so a failed fetch read as "no contacts yet". All four are props here, none is an override of another's slot, and the component picks between them in one place so no future edit can make two of them true at once.

| State       | You set              | The panel renders                                                                  |
| ----------- | -------------------- | ---------------------------------------------------------------------------------- |
| **Loading** | `loading`            | Three [`NbSkeleton`](/ui/components/skeleton) rows, `aria-busy`, one announcement. |
| **Failed**  | `error`, and no rows | `NbEmptyState kind="error"` in a `role="alert"` region, with a retry.              |
| **Empty**   | neither, and no rows | `NbEmptyState` with `emptyTitle` and `emptyDescription`.                           |
| **List**    | rows                 | The scrolling list.                                                                |

`loading` wins over everything: a request that has not come back is not yet a failure, and it is certainly not a result. The empty state cannot appear while either `loading` or `error` is true, which is the whole point.

"Rows" means the length of `items`, or `itemCount` when you supply rows through the default slot. Fill the slot without `itemCount` and the count is unknown, which is a third answer and not a zero: the panel then treats `error` as the failure state (never as the stale strip) and cannot reach the empty state at all. [Two ways to supply rows](#two-ways-to-supply-rows) has the table.

### Failure is a state, not a flavour of empty

Give the panel `error` and it stops guessing. It says the request failed, it offers `retryLabel`, and it emits `retry` when the user takes it up; the component fetches nothing, so `retry` is the whole of its part in the recovery.

```vue
<script setup lang="ts">
const { data, pending, error, refresh } = useNotifications()
</script>

<template>
  <NbNotificationCenter
    :items="data"
    :loading="pending"
    :error="Boolean(error)"
    error-title="Could not load notifications"
    error-description="The activity service did not answer."
    @retry="refresh()"
  />
</template>
```

<preview dir="row">
  <NbNotificationCenter :items="[]" />
  <NbNotificationCenter :items="[]" loading />
  <NbNotificationCenter :items="[]" error />
</preview>

Note what does **not** happen: no offer to create the first notification, no "you're all caught up". `NbEmptyState`'s `kind="error"` exists precisely so a view that could not load never invites you to make something.

### A refresh that fails over rows you already have

If the panel already has rows and a background refresh fails, throwing those rows away to show a full-panel error would lose the notifications the user was reading. So it keeps them and says so above them, in a `role="status"` strip rather than a `role="alert"` one: nothing was lost, nothing is urgent, the list is just older than it looks.

<preview dir="col">
  <NbNotificationCenter
    style="align-self: flex-start"
    error
    :items="[
      { id: 1, title: 'Deploy queued', time: '2026-09-03T12:41:00Z' },
      { id: 2, title: 'Invite accepted', time: '2026-09-03T09:12:00Z', read: true }
    ]"
  />
</preview>

If your product's failure needs more than a title, a sentence and a retry, `#error` replaces the whole region and still receives the `retry` callback so your own control keeps the same event contract.

```vue
<template #error="{ retry }">
  <NbEmptyState kind="error" size="sm" title="Activity is offline">
    <template #actions>
      <NbButton size="sm" @click="retry()">Try again</NbButton>
      <NbButton size="sm" variant="ghost" href="/status">Status page</NbButton>
    </template>
  </NbEmptyState>
</template>
```

## Replacing the bell

The `#trigger` slot swaps the button for anything you like, and it hands you the four things you cannot work out for yourself:

| Slot prop                                                 | What it is for                                                                                                                      |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `triggerProps`                                            | `id`, `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` and a default `aria-label` carrying the uncapped count. Spread it. |
| `setTriggerRef`                                           | Template ref setter. This is how <kbd>Escape</kbd> knows where to send focus back to.                                               |
| `panelId`                                                 | The teleported panel's id, if you would rather wire `aria-controls` yourself.                                                       |
| `toggle`, `show`, `close`, `open`, `unreadCount`, `badge` | Behaviour and state, so your trigger can look like anything.                                                                        |

```vue
<template #trigger="{ triggerProps, setTriggerRef, toggle, unreadCount }">
  <NbButton
    :ref="setTriggerRef"
    v-bind="triggerProps"
    variant="ghost"
    size="sm"
    icon="bell"
    @click="toggle"
  >
    Activity<template v-if="unreadCount"> ({{ unreadCount }})</template>
  </NbButton>
</template>
```

`aria-label` comes last in `triggerProps`, so bind your own **after** the spread to replace it. Everything else should stay: a trigger without `aria-expanded` does not tell a screen reader whether the panel is open, and one without `setTriggerRef` leaves the panel unable to give focus back, which is a [WCAG 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) failure, not a cosmetic one. If you skip `setTriggerRef` anyway, the panel falls back to the first focusable element inside its own root, which in practice is your trigger. That is a safety net, not the contract.

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

A row action or a `#footer` link can open something that is itself dismissible: an [`NbModal`](/ui/components/modal), an [`NbConfirm`](/ui/components/confirm), a teleported [`NbSelect`](/ui/components/select) listbox. That surface is nearer the user, so its <kbd>Escape</kbd> is its own, and one keystroke must not cost two dialogs. The centre stands down on two tests: `event.defaultPrevented`, for anything that consumed the key outright, and containment in an `[aria-modal="true"]` element that is not the panel, which is how `NbModal` and `NbConfirm` mark themselves (`Modal.vue`'s own topmost check reads the same attribute) and which they do not `preventDefault` on.

The arrows are only taken while focus is on a row or on a non-field control. An `<input>`, `<textarea>`, `<select>` or `contenteditable` inside any of the slots keeps its own arrow keys, because <kbd>↑</kbd> in a filter box moves the caret and jumping the user into the list instead is a bug they cannot work around. A filter field in the header is a supported composition, so this is a contract, not an accident. Put it in `#header-start`, which adds to the header, rather than `#header-actions`, which replaces it. See [Adding to the header](#adding-to-the-header).

Focus returns to the trigger when the panel had focus, so <kbd>Escape</kbd> and the toggle both put you back where you started. Three cases deliberately leave focus alone:

- You dismissed by clicking somewhere else. You already said where you wanted to be, and dragging focus back to the bell would undo that.
- <kbd>Escape</kbd> arrived while focus was somewhere else on the page. The panel is not modal, so the page underneath is live and that keystroke is usually not about the bell at all: the realistic sender is a nested overlay opened from a row action or from `#footer` (an [`NbModal`](/ui/components/modal), a teleported [`NbSelect`](/ui/components/select) listbox) dismissing itself in the same tick. The panel goes; the caret stays. The exception is the trigger already holding focus, where "leave it alone" and "put it back" are the same thing.
- The trigger scrolled out of view, or a navigation happened. By then the user is somewhere else.

## Adding to the header

`#header-start` sits beside the mark-all control and costs you nothing:

```vue
<template>
  <NbNotificationCenter :items="items" @mark-all-read="markAll">
    <template #header-start>
      <NbSelect
        v-model="filter"
        variant="fluid"
        label="Filter"
        name="notification-filter"
        :options="filters"
      />
    </template>
  </NbNotificationCenter>
</template>
```

`#header-actions` is the other one, and it is a trade: it replaces the mark-all control entirely, so you own the pending rules described in [Mark all as read](#mark-all-as-read). You do not have to re-derive them. The slot hands you `markAllProps`, which is everything the built-in button binds including `onClick`, and `markAllText`, which is the label that swaps while a request is in flight:

```vue
<template #header-actions="{ markAllProps, markAllText }">
  <NbButton size="sm" variant="ghost" v-bind="markAllProps">
    {{ markAllText }}
  </NbButton>
</template>
```

Reach for `#header-actions` when the mark-all control itself has to change. Reach for `#header-start` for everything else.

## Two centres on one page

Two bells in one shell is a reasonable thing to build: a product centre beside an account one, or a tenant-scoped one beside a platform one. Two open panels is not. They overlap, each cycles <kbd>Tab</kbd> within itself, and the one underneath is unreachable, so **opening one dismisses any other that is open**. Focus is not moved when that happens: you are on the bell you just pressed, and pulling you to the other one would be the same theft the component refuses everywhere else.

The arbitration is per page, not per app, and it works through the same `update:open` every other close goes through. A host that fully controls `open` and ignores `update:open` can therefore still force two open at once. That is your decision to make and the centre will not fight you for it, but nothing below the top of the stack will be reachable by keyboard.

## Placement

`align` picks which trigger edge the panel lines up with (`end` for a bell at the right of a topbar, `start` for one in a left rail), `width` and `maxHeight` size it. The panel clamps itself inside the viewport, shortens its list when there is not enough room, and flips above the trigger only when below is genuinely cramped, so the same bell does not open in a different direction on every scroll position. It sits at `--nb-zindex-menu`, the same layer as the other two panels.

Only the list scrolls. The header and the footer stay put, so **Mark all as read** and your "See all activity" link cannot be pushed off the bottom of a long feed.

```vue
<template>
  <NbNotificationCenter
    :items="items"
    align="start"
    :width="320"
    :max-height="320"
  >
    <template #footer="{ close }">
      <NbButton
        size="sm"
        variant="ghost"
        @click="
          close()
          go('/activity')
        "
      >
        See all activity
      </NbButton>
    </template>
  </NbNotificationCenter>
</template>
```

## Leaving the page

A bell lives in a shell that outlives the view under it, so its panel can survive things it should not survive. Two of those are handled here:

- **Navigation.** The panel closes on a history navigation (back, forward, a hash change) and on anything the browser reports through the Navigation API, which is how a `pushState` router change is seen where the browser supports it. Set `closeOnNavigate` to `false` if you want it to stay. In a router that predates that API, the reliable belt-and-braces is one line in your shell: watch the route and call `close({ restoreFocus: false })` on the exposed instance. Pass the option: a bare `close()` restores focus when the panel happened to have it, and on a route change that is a focus jump into the old page's shell that the user did not ask for.
- **A trigger that scrolls away.** The panel is `position: fixed`, so once the bell it hangs off has left the viewport the panel is floating over content it has nothing to do with. When that happens it closes rather than pinning itself to an edge. Focus is left where it is, because by then the user is somewhere else.

```vue
<template>
  <NbNotificationCenter ref="bell" :items="items" />
</template>

<script setup lang="ts">
const bell = ref()
const route = useRoute()
watch(
  () => route.fullPath,
  () => bell.value?.close({ restoreFocus: false }),
)
</script>
```

## Announcing arrivals

The panel is not a live region and the count is not announced when it changes. A bell that speaks every time something lands interrupts the work the user is actually doing, and the arrival of a notification is rarely worth that.

When an event genuinely needs to interrupt, raise an [`NbToast`](/ui/components/toast) for it and let it also land in the centre, so the toast is the interruption and the panel is the record. Reserve `role="alert"` for what would be worth a person tapping you on the shoulder.

## When a notification centre is the wrong answer

The container is cheap; the feed behind it is not. Before you add one, check that the answer to all three is yes:

1. **Does anything arrive while the user is not looking?** If every event in your product is the direct result of a button the user just pressed, an [`NbToast`](/ui/components/toast) or an [`NbInlineLoading`](/ui/components/inline-loading) beside that button says it better, and a bell that only ever mirrors your own clicks trains people to stop opening it.
2. **Is there more than one source?** One source with a natural home (a comment thread, a build page, a run log) is better read where it lives. A centre earns its place when four subsystems all need somewhere to speak and none of them owns the screen.
3. **Can the user act on it, or is it a log?** A record of everything that happened is an audit trail, and an audit trail belongs on a page with filters, dates and paging, not in a 384px panel.

And what does not belong in the feed, whichever way you answered:

- **Anything blocking.** If the user cannot proceed until they respond, that is an [`NbConfirm`](/ui/components/confirm) or an [`NbModal`](/ui/components/modal), in front of them, now. A bell badge is not consent.
- **Anything catastrophic and current.** A production incident, an expired card, a locked account: those are an [`NbBanner`](/ui/components/banner) on the page they affect. A person who has not opened the panel has not been told.
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

The one value that is not a token is the panel's elevation, `0 12px 32px rgba(0, 0, 0, 0.18)`, which is what [`NbUserMenu`](/ui/components/user-menu) uses byte for byte. There is no shadow token in `src/styles` to point at yet, so it is behind an override instead: set `--nb-notification-center-shadow` anywhere that reaches `<body>` and the panel takes it. The library's own `.dark` theme does exactly that, because the same black elevation over a dark ground reads as nothing at all. When a real shadow token arrives, that default becomes a `var()` and nothing else about this changes.

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

## Accessibility

- The trigger is a `<button>` with `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` pointing at the panel while it is open. Its accessible name carries the **uncapped** unread count.
- The badge is `aria-hidden`, because its number is the capped one.
- A trigger you supply through `#trigger` gets the same guarantees, but only if you take them: `triggerProps` carries the ARIA relationship and `setTriggerRef` carries the focus return. This is the one place where the escape hatch can cost you something the component otherwise owns, so it is spelled out in [Replacing the bell](#replacing-the-bell) rather than left to be discovered.
- The failure state is a `role="alert"` region, so a request that did not come back is announced rather than sitting there waiting to be found. A refresh that failed over rows already on screen is `role="status"` instead: it is a correction, not an emergency.
- The panel is `role="dialog"` labelled by its heading. It is deliberately **not** `aria-modal`: there is no scrim, the page behind it stays live, and it closes when you click there. Because of that it does **not** hold <kbd>Tab</kbd>: tabbing off either end leaves the panel and closes it, forward onto whatever follows the trigger and backward onto the trigger itself. A focus trap belongs to a surface that has made the rest of the page inert, and this one has not.
- <kbd>Escape</kbd> is not taken when a surface layered above the panel already answered it, so an `NbConfirm` opened from a row action closes without taking the centre with it.
- The list carries an explicit `role="list"` and each row an explicit `role="listitem"`. Both are needed: WebKit strips list semantics from a list styled with `list-style: none`, which every list in this library is, and without them VoiceOver never says "list, 12 items". [`NbReorderList`](/ui/components/reorder-list) carries the same explicit `role="list"`, though not the item role, so this is the library's convention taken one step further rather than a local invention.
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

## What this component will never do

Fetch, poll, subscribe, cache, mark read, deduplicate or decide what deserves a notification. Those are product decisions and they were correctly different in all three consoles. If a future version grows a store, it will be a separate composable that this component still knows nothing about.

</doc-tab>

<doc-tab name="Api">

## `NbNotificationCenter`

### Props

| Prop                  | Type                        | Default                                        | Description                                                                                                                                                                                  |
| --------------------- | --------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`               | `INotificationItem[]`       | `[]`                                           | The rows. Omit and use the default slot for richer content.                                                                                                                                  |
| `unreadCount`         | `number`                    | counted from `items`                           | Authoritative unread total. Required when you supply rows through the slot.                                                                                                                  |
| `itemCount`           | `number`                    | `items.length`, or unknown with a filled slot  | How many rows are on screen. Required alongside `unreadCount` when you supply rows through the slot: without it `#empty` cannot render and `error` always resolves to the full error region. |
| `open`                | `boolean`                   | `undefined`                                    | Optional `v-model:open`. Left undefined, the centre owns its own open state.                                                                                                                 |
| `label`               | `string`                    | `'Notifications'`                              | Names the trigger and titles the panel.                                                                                                                                                      |
| `markAllLabel`        | `string`                    | `'Mark all as read'`                           | Label of the mark-all control.                                                                                                                                                               |
| `markAllPending`      | `boolean`                   | `false`                                        | The host's mark-all request is in flight: spinner, pending label, further clicks ignored, focus kept.                                                                                        |
| `markAllPendingLabel` | `string`                    | `'Marking all as read'`                        | Shown and announced while `markAllPending` is true. Present tense.                                                                                                                           |
| `emptyTitle`          | `string`                    | `'No notifications'`                           | Title of the built-in empty state.                                                                                                                                                           |
| `emptyDescription`    | `string`                    | `'New activity shows up here.'`                | Body of the built-in empty state.                                                                                                                                                            |
| `loading`             | `boolean`                   | `false`                                        | Renders placeholder rows. Suppresses the empty state.                                                                                                                                        |
| `loadingLabel`        | `string`                    | `'Loading notifications'`                      | Announced from the `role="status"` region while loading.                                                                                                                                     |
| `error`               | `boolean`                   | `false`                                        | The request failed. A state of its own: never rendered as emptiness.                                                                                                                         |
| `errorTitle`          | `string`                    | `'Could not load notifications'`               | Title of the built-in error state.                                                                                                                                                           |
| `errorDescription`    | `string`                    | `'The request failed. Nothing has been lost.'` | Body of the built-in error state.                                                                                                                                                            |
| `errorStaleLabel`     | `string`                    | `'These may be out of date.'`                  | Shown on the strip when a refresh fails over rows already loaded.                                                                                                                            |
| `retryLabel`          | `string`                    | `'Try again'`                                  | Label of the retry control in both failure presentations.                                                                                                                                    |
| `showRetry`           | `boolean`                   | `true`                                         | Offer a retry control. Turn it off when you retry on your own and a button would be a lie.                                                                                                   |
| `maxCount`            | `number`                    | `99`                                           | Counts above this render as `n+` on the badge only.                                                                                                                                          |
| `width`               | `number`                    | `360`                                          | Panel width in px.                                                                                                                                                                           |
| `maxHeight`           | `number`                    | `384`                                          | Tallest the scrolling list may get, in px. Clamped further on a short viewport.                                                                                                              |
| `align`               | `'start' \| 'end'`          | `'end'`                                        | Which trigger edge the panel lines up with.                                                                                                                                                  |
| `showMarkAll`         | `boolean`                   | `true`                                         | Renders the mark-all control.                                                                                                                                                                |
| `interactive`         | `boolean`                   | `true`                                         | Default activatability of rows. `false` makes them inert: no tabindex, no `select`. Per-item wins.                                                                                           |
| `closeOnSelect`       | `boolean`                   | `true`                                         | Closes the panel when a row is activated.                                                                                                                                                    |
| `closeOnNavigate`     | `boolean`                   | `true`                                         | Closes on a history navigation, a hash change, or a Navigation API navigate event.                                                                                                           |
| `disabled`            | `boolean`                   | `false`                                        | The trigger does not open.                                                                                                                                                                   |
| `icon`                | `string`                    | `'bell'`                                       | Phosphor icon for the trigger and the empty state.                                                                                                                                           |
| `locale`              | `string`                    | runtime locale                                 | BCP 47 tag for relative times.                                                                                                                                                               |
| `unreadLabel`         | `string`                    | `'Unread'`                                     | Visually hidden state word.                                                                                                                                                                  |
| `readLabel`           | `string`                    | `'Read'`                                       | Visually hidden state word.                                                                                                                                                                  |
| `formatUnread`        | `(count: number) => string` | English, two forms                             | Builds the unread half of the trigger's accessible name: "1 unread", "4 unread".                                                                                                             |

### `INotificationItem`

| Field         | Type                                                       | Description                                                          |
| ------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `id`          | `string \| number`                                         | **Required.** Stable key across refetches.                           |
| `title`       | `string`                                                   | **Required.** One line, no trailing full stop.                       |
| `body`        | `string`                                                   | Supporting sentence. Clipped at three lines.                         |
| `time`        | `string \| number \| Date`                                 | ISO string, epoch ms or a Date. Rendered relative to now.            |
| `timeLabel`   | `string`                                                   | Pre-formatted time. Wins over `time` for display.                    |
| `read`        | `boolean`                                                  | Anything not `true` counts as unread.                                |
| `variant`     | `'neutral' \| 'info' \| 'success' \| 'warning' \| 'error'` | Colours the leading icon.                                            |
| `icon`        | `string \| null`                                           | Overrides the variant icon. `null` removes the icon gutter.          |
| `href`        | `string`                                                   | Renders the row as a link.                                           |
| `interactive` | `boolean`                                                  | Overrides the centre's `interactive` for this row. `false` is inert. |

### Events

| Event           | Payload                                           | Description                                                                                                                                                            |
| --------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `select`        | `(item: INotificationItem \| null, event: Event)` | A control row was activated. The item is `null` for a row you rendered into the default slot, because the centre never saw an object for it. Inert rows never fire it. |
| `mark-all-read` | none                                              | The user asked for everything to be marked read. Nothing changes until you say so.                                                                                     |
| `retry`         | none                                              | The user asked for a failed request to be tried again. The centre fetches nothing, so this is the whole of its part in it.                                             |
| `open`          | none                                              | The panel opened.                                                                                                                                                      |
| `close`         | none                                              | The panel closed, by any route.                                                                                                                                        |
| `update:open`   | `boolean`                                         | Fired on every open and close, controlled or not.                                                                                                                      |

### Slots

| Slot             | Props                                                                                     | Description                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`        | `{ close, items }`                                                                        | Replaces the generated rows. Render `NbNotificationCenterItem`s inside a list, and pass `unreadCount` and `itemCount` with it: the centre renders this slot, it does not read it.         |
| `trigger`        | `{ triggerProps, setTriggerRef, panelId, open, toggle, show, close, unreadCount, badge }` | Replaces the bell entirely. Spread `triggerProps` and bind `setTriggerRef`, or the panel loses its ARIA relationship and its focus return. See [Replacing the bell](#replacing-the-bell). |
| `header-start`   | `{ close, unreadCount }`                                                                  | Adds to the header, beside the mark-all control. Where a filter field goes.                                                                                                               |
| `header-actions` | `{ close, unreadCount, markAllRead, markAllPending, markAllProps, markAllText }`          | Replaces the mark-all control. Spread `markAllProps` onto your own button to keep the pending rules. See [Adding to the header](#adding-to-the-header).                                   |
| `empty`          | none                                                                                      | Replaces the empty state. Empty only: failure has its own slot.                                                                                                                           |
| `error`          | `{ retry }`                                                                               | Replaces the failure state. `retry()` emits `retry` for you.                                                                                                                              |
| `footer`         | `{ close }`                                                                               | Fixed strip below the scrolling list.                                                                                                                                                     |

### Exposed

| Member        | Type                                             | Description                                                                                                                            |
| ------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `show()`      | `() => void`                                     | Opens the panel. Named `show` because `open` is already a prop.                                                                        |
| `close()`     | `(options?: { restoreFocus?: boolean }) => void` | Closes it. Focus returns to the trigger when the panel had it; pass `{ restoreFocus: false }` to suppress that, or `true` to force it. |
| `toggle()`    | `() => void`                                     | Toggles it.                                                                                                                            |
| `isOpen`      | `ComputedRef<boolean>`                           | Current state.                                                                                                                         |
| `unreadCount` | `ComputedRef<number>`                            | The resolved count, capped by nothing.                                                                                                 |

## `NbNotificationCenterItem`

One row. Usable on its own inside the default slot, and what the `items` array renders.

`variant` takes the library's status words: `neutral`, `info`, `success`, `warning`, `error`. `error`, not `danger`, because that is what [`NbToast`](/ui/components/toast), [`NbMessage`](/ui/components/message) and [`NbBanner`](/ui/components/banner) say, and the whole point of raising a toast and letting the same event land here is that you do not translate a status word at the boundary. `danger` is accepted and treated as `error` so the fleet's existing habit does not render an unstyled row, but it is deprecated and will not be documented anywhere else. The colour behind `error` is `--nb-c-danger`, which is what this library calls that token; the API word and the token name disagree on purpose, and neither is renamed to please the other.

### Props

| Prop          | Type                                                       | Default     | Description                                                        |
| ------------- | ---------------------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| `title`       | `string`                                                   | `''`        | Headline. The `#title` slot overrides it.                          |
| `body`        | `string`                                                   | `''`        | Supporting sentence. The default slot overrides it.                |
| `time`        | `string \| number \| Date`                                 | none        | Rendered as a relative `<time>` with a machine-readable value.     |
| `timeLabel`   | `string`                                                   | none        | Pre-formatted time. Wins over `time` for display.                  |
| `read`        | `boolean`                                                  | `false`     | Drops the dot, the tint and the heavier title.                     |
| `variant`     | `'neutral' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'neutral'` | Colours the leading icon.                                          |
| `icon`        | `string \| null`                                           | per variant | `null` removes the icon gutter.                                    |
| `href`        | `string`                                                   | none        | Renders the row as a link. Wins over `interactive`.                |
| `interactive` | `boolean`                                                  | `true`      | `false` renders an inert row: no tabindex, no `select`, no cursor. |
| `locale`      | `string`                                                   | runtime     | BCP 47 tag for the relative time.                                  |
| `unreadLabel` | `string`                                                   | `'Unread'`  | Visually hidden state word.                                        |
| `readLabel`   | `string`                                                   | `'Read'`    | Visually hidden state word.                                        |

### Events

| Event    | Payload | Description                                                                                                               |
| -------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `select` | `Event` | The row was activated. Only fires on a control row: with `interactive: false` and no `href` there is nothing to activate. |

### Slots

| Slot      | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `default` | The body, in place of the `body` prop.                                   |
| `title`   | The headline, in place of the `title` prop.                              |
| `media`   | Leading element, in place of the variant icon. An avatar goes here.      |
| `actions` | Per-row controls. Rendered outside the activatable row, never inside it. |

</doc-tab>
