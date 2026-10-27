---
layout: nubisco
title: Spinner
intro: '`NbSpinner` says one thing: work is happening and we cannot say how much is left. It carries no measurement, so if you can count bytes, files or records, you are holding the wrong component.'
source: src/components/Spinner.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Tone

`primary` paints the arc in `var(--nb-c-primary)`. Inside a coloured surface,
switch to `inherit` so the arc takes the surrounding `color`, whatever the
consuming product themed it to. Never restate a brand colour at the call site:
that is how a white-label build ends up with a purple ring.

<preview>
  <NbSpinner size="sm" />
  <span style="display:inline-flex; align-items:center; gap:8px; color: var(--nb-c-danger)">
    <NbSpinner size="sm" tone="inherit" decorative />
    Revoking access
  </span>
</preview>

```vue
<template>
  <span class="row-status">
    <NbSpinner size="sm" tone="inherit" decorative />
    Revoking access
  </span>
</template>
```

### Buttons already have one

Do not nest a spinner inside a button to show that the button's own action is
running. [`NbButton`](/components/button/usage) has a `loading` prop that swaps its
decoration for a ring, blocks pointer events and sets `disabled`, all of which a
nested spinner would leave to you.

<preview>
  <NbButton variant="primary" loading>Saving</NbButton>
</preview>

```vue
<template>
  <NbButton variant="primary" :loading="saving" @click="save">Save</NbButton>
</template>
```

The button draws that ring itself with a border trick rather than mounting an
`NbSpinner`, and the two now agree about reduced motion: under
`prefers-reduced-motion: reduce` the button's ring also closes
(`border-top-color: currentcolor`) and breathes instead of rotating, so a
product cannot show one indicator spinning and another one not.

They are not identical, and the difference is worth knowing if you are
comparing them side by side. The button answers the preference with a media
query only, so it picks up a change to the OS setting on the next load; the
spinner also mirrors the preference onto a class read from `matchMedia`, so it
reacts with the page already open. The button breathes `opacity` between 0.35
and 1, the spinner breathes `stroke-opacity` between 0.25 and 1. Both read as
alive; neither freezes.

## Delay

A spinner that appears and disappears inside 100ms reads as a glitch, and it is
the reason so many screens flicker on a warm cache. `delay` gates rendering:
during the delay nothing is in the DOM at all, so a request that resolves in
80ms draws nothing and announces nothing.

```vue
<template>
  <!-- Local, usually instant: only show a spinner if it actually stalls -->
  <NbSpinner v-if="loading" :delay="300" label="Searching" />
</template>
```

Rule of thumb: `0` for anything that crosses a network under load, `300` for
cached or local work, and never above `1000`, past which the screen looks
frozen.

`delay` is reactive while the spinner is still hidden: raising it pushes the
reveal out, and dropping it to `0` shows the ring at once. It deliberately does
not re-hide a spinner that is already visible. Taking an indicator back out of
the accessibility tree after its live region has already spoken is worse than
leaving it where it is.

## Overlay

`overlay="container"` covers the nearest **positioned** ancestor with a scrim
and centres the spinner. If nothing above it is positioned, it escapes to the
next one that is, so set `position: relative` on the region you mean to cover.

It blocks that region rather than only shading it. While the spinner is up, its
DOM parent is marked `aria-busy="true"` and every other child of that parent is
marked `inert`, so the controls under the scrim leave the tab order and the hit
testing along with it. This is the difference between a container overlay and a
grey rectangle: a scrim that only stops the mouse lets a keyboard user tab
straight into a form that looks unavailable and submit it. Both attributes are
put back exactly as they were found, including an `aria-busy` the application
had already set for its own reasons.

The parent that gets contained is the spinner's **DOM parent**, which is why
the positioned element and the spinner have to be siblings-of-content in the
same box. If you wrap the spinner in an extra `<div>`, that `<div>` is the
region, and it contains nothing.

Getting the positioning wrong splits the two halves apart: the containment
still scopes itself to the DOM parent, while the scrim escapes upwards to
whatever _is_ positioned and shades that instead. In development the component
says so in the console rather than leaving you to report it as a styling bug,
because the wrong thing on screen looks nothing like the actual cause.

<preview>
  <div style="position: relative; min-height: 140px; width: 100%; border: 1px solid var(--nb-c-border); padding: var(--nb-base-unit)">
    <p>Contact list</p>
    <p>Rows stay in place under the scrim, so nothing moves when it lifts.</p>
    <NbSpinner overlay="container" size="lg" show-label label="Refreshing contacts" />
  </div>
</preview>

```vue
<template>
  <section style="position: relative">
    <ContactTable :rows="rows" />
    <NbSpinner
      v-if="refreshing"
      overlay="container"
      size="lg"
      show-label
      label="Refreshing contacts"
    />
  </section>
</template>
```

### `overlay="page"` blocks for real

`overlay="page"` is the same scrim pinned to the viewport, and it is the only
mode that changes the state of the document. Reserve it for work that genuinely
disables the whole application, such as a tenant switch that invalidates every
view. If the rest of the page is still usable, covering it is a lie about what
is blocked.

Everything it does follows from one rule, and it is worth stating before the
list because it is the only thing you have to remember:

> **A page overlay blocks the application as it stood when it went up. Anything
> that arrives afterwards arrived on top of it, and stays usable.**

That is the same arbitration [`NbModal`](/components/modal/usage) already uses to
decide which of a stack of dialogs answers `Escape`: the last one in document
order wins. Here it decides both halves at once.

1. **It teleports to `<body>`.** `position: fixed` resolves against the nearest
   transformed, filtered or contained ancestor, not the viewport, so a sidebar
   with a `transform` transition on it is enough to trap a "page" overlay inside
   the sidebar. Leaving the tree removes the question, and it is why a caller's
   `class` still lands on the ring: the component rebinds `$attrs` by hand,
   since a `<Teleport>` root has no element to fall attributes through to.
2. **The application is marked `inert`.** Every child of `<body>` that existed
   when the overlay claimed gets the attribute, so nothing behind the scrim is
   clickable, focusable or reachable by a screen reader's virtual cursor.
   `inert` is the containment: there is no focus trap here, no listener that
   pulls focus back, and nothing that swallows `Tab`. A trap has to decide, on
   every focus change, whether the new holder outranks the overlay, and a widget
   that refocuses itself when it loses focus turns that decision into an
   unbounded recursion. The attribute has no such conversation to have.
3. **Focus moves onto the scrim**, which is why it is the one element in the
   subtree with a `tabindex`. When the overlay leaves, focus goes back to
   whatever had it before. If the work destroyed that control, which is normal
   for a delete, focus lands on the nearest thing near it that was **already**
   focusable. It never lands on a container we made focusable: writing
   `tabindex="-1"` onto an element of yours would outlive the spinner and turn
   an ordinary `<div>` into a target for every later `.focus()` in your
   application. If nothing focusable survived, focus is left where the browser
   put it, and the fix is a `tabindex="-1"` on your own region, chosen by you.
4. **Body scroll is locked**, through the same counted lock `NbModal` and
   `NbCommandPalette` hold a share of. Counting is the whole point: with two
   uncounted owners, a spinner released while a dialog is still open hands the
   page back its scrollbar mid-decision, and the dialog then restores the
   `hidden` it saved and leaves the page unscrollable forever with nothing on
   screen. The original `overflow` is read once, when the first owner claims,
   and restored verbatim when the last one leaves.

### What happens when a dialog opens on top

This is the ordering that breaks hand-rolled versions, and it is not exotic:
the blocked work itself raises a confirmation, or the session expires and an
`NbModal` teleports to `<body>` while the scrim is up.

Under the rule, that dialog arrived after the claim, so it is **not** inert and
is fully usable, and it paints above the scrim because the page overlay sits at
exactly `var(--nb-zindex-modal)` and teleported siblings at equal `z-index`
paint in document order. Paint and focus agree because they are the same rule.
When the spinner releases, it does not yank the user back out of the dialog.

The reverse ordering is the same rule read the other way: a spinner raised
while a dialog is already open covers that dialog and inerts it, because the
dialog was part of the application at claim time. That is usually what you want,
since the dialog is what started the work.

Two page overlays at once (a save still blocking when a tenant switch fires)
stack without double-darkening: only the first paints the scrim, and if it
leaves first the survivor takes over the paint rather than blocking invisibly.
Both hold a share of every attribute they set, so the first one to release
cannot unblock half the application underneath a scrim that is still up.

### What it does not block

Toasts (`--nb-zindex-toast`, fifty layers above `--nb-zindex-modal`) and
tooltips paint above the page overlay by token, on purpose: a message about
what just happened is worth more than an unbroken scrim.

Painting above it is not enough. `inert` removes a subtree from hit testing,
from the tab order **and from the accessibility tree**, so a live region caught
by the snapshot is drawn above the scrim and silent: "Session expired" on
screen, unspoken, for exactly the user who cannot see it. That is the same
paint-and-focus disagreement the rule above exists to make impossible, arrived
at from the other side.

So the rule has one exception, and it is one attribute:

```html
<div data-nb-overlay-exempt role="status" aria-live="polite"></div>
```

A host carrying `data-nb-overlay-exempt` is never inerted by `overlay="page"`
or by `overlay="container"`. The library's own announcers are exempt already:
the shared completion announcer behind `completeLabel` carries the attribute,
and [`NbToaster`](/components/toaster/usage)'s live regions and stack are
recognised by class name as well, so a toast raised while the page is blocked
stays both audible and operable (its action button is reachable under the
scrim) even against a build of the toaster that predates the attribute.

Set it on a live region **you** own and mount at the top of the document. For a
region created from script, there is a helper:

```ts
import { markOverlayExempt } from '@nubisco/ui'

const region = document.createElement('div')
region.setAttribute('role', 'status')
document.body.appendChild(region)
const undo = markOverlayExempt(region)
```

Two limits worth knowing:

- If an exempt host sits **inside** a wrapper of yours (a toaster teleported to
  your own `#toasts` element), the wrapper is not blocked whole. The question
  is asked again of each of its children, so the announcer stays live and its
  siblings are still blocked. The walk stops after eight levels: anything
  exempt buried deeper than that is treated as part of the page, because the
  alternative is an unbounded query over your whole tree on every claim.
- The attribute is read **at claim time**. Marking a region while an overlay is
  already up does not retroactively free it.

Carry it only on hosts that exist to tell the user something: an announcer, or
a toast stack whose single action is the way out of the block. A form that opts
itself out of blocking is a form the user can submit while the page says it
cannot be used, which is worse than never blocking at all.

## Long waits, and a way out

An indeterminate spinner stops informing after about ten seconds. It says the
same thing at second one and at second forty, and by then the honest reading is
that something is stuck. A page overlay makes that worse than a stuck screen: a
request with no timeout behind an `overlay="page"` is an application the user
cannot leave, and closing the tab is the only exit left.

Three answers, in order of preference:

1. Learn a number and switch to [`NbProgressBar`](/components/progress-bar/usage).
2. Give the block a way out. The default slot renders below the ring, inside
   the one subtree a page overlay does not inert, so a control there is
   genuinely reachable and focusable while everything behind the scrim is not.
3. Stop blocking. Let the work continue in the background, tell the user when
   it lands with a toast, and give them the page back.

```vue
<template>
  <NbSpinner
    v-if="switching"
    overlay="page"
    size="lg"
    show-label
    label="Switching tenant"
  >
    <NbButton variant="secondary" @click="abort">Cancel</NbButton>
  </NbSpinner>
</template>
```

Whatever you choose, put a timeout on the request itself. The overlay's
lifetime is your `v-if`, and nothing in the component will ever take it down
for you.

## Saying it finished

A spinner announces the start of a load and then vanishes. Sighted users see
the content arrive; a screen reader user gets silence, because the live region
that was doing the talking is removed at the same moment the content lands, and
newly inserted content is not itself an update anything is watching. Completion
is the half of the load that goes missing everywhere.

`completeLabel` closes it. The message is written into a shared, permanently
mounted live region owned by the library, so it survives the unmount that
triggers it.

```vue
<template>
  <NbSpinner
    v-if="loading"
    label="Loading invoices"
    complete-label="Invoices loaded"
  />
</template>
```

Two rules keep it from becoming noise:

- Set it only where the user is **waiting** rather than watching. A background
  refresh of a widget nobody asked about should stay silent.
- Set it once per load. If a region has a skeleton and a spinner, one of them
  carries `completeLabel` and the other does not.

If the load ends by moving focus somewhere (a detail panel opening, a wizard
advancing) then the focus move is the announcement, and adding `completeLabel`
on top of it says the same thing twice. Pick one.

## Props

| Prop            | Type                              | Default     | Description                                                    |
| --------------- | --------------------------------- | ----------- | -------------------------------------------------------------- |
| `size`          | `'xs' \| 'sm' \| 'md' \| 'lg'`    | `'md'`      | Diameter, at half the matching field height                    |
| `label`         | `string`                          | `'Loading'` | Accessible name. Say what is loading                           |
| `showLabel`     | `boolean`                         | `false`     | Renders `label` as visible text as well as announcing it       |
| `overlay`       | `'none' \| 'container' \| 'page'` | `'none'`    | Inline, over the nearest positioned ancestor, or over the page |
| `tone`          | `'primary' \| 'inherit'`          | `'primary'` | Arc colour source                                              |
| `delay`         | `number`                          | `0`         | Milliseconds before the component renders anything             |
| `completeLabel` | `string`                          | none        | Announced once when the spinner unmounts because work finished |
| `decorative`    | `boolean`                         | `false`     | Drops the role, live region and label for nested use           |
| `id`            | `string`                          | auto        | Explicit DOM id, otherwise generated by `useStableId`          |

## Slots

| Slot      | Description                                                                                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default` | Rendered below the ring, in `aria-live="off"`. Meant for the one control that gets a user out of a long block (a cancel), and reachable under a page overlay because the overlay's own subtree is never inerted. |

## Events

None. The spinner is presentational and fully controlled by whoever renders it.

## Module exports

| Export                   | Type       | Description                                                                                            |
| ------------------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `markOverlayExempt(el)`  | `function` | Marks a live region a blocking overlay must not inert. Returns a function that puts the attribute back |
| `NB_OVERLAY_EXEMPT_ATTR` | `string`   | `'data-nb-overlay-exempt'`, the attribute behind that helper                                           |

## Tokens

| Token                    | Used for                                       |
| ------------------------ | ---------------------------------------------- |
| `--nb-field-height-*`    | Diameter, at half the field height             |
| `--nb-c-primary`         | Arc colour in `primary` tone                   |
| `--nb-c-discrete`        | The unfilled track behind the arc              |
| `--nb-c-scrim`           | Overlay scrim                                  |
| `--nb-c-text-muted`      | Inline visible label                           |
| `--nb-zindex-pageheader` | Container overlay stacking                     |
| `--nb-zindex-modal`      | Page overlay stacking, exactly the modal layer |
| `--nb-c-white`           | Label text on a scrim                          |

Under `forced-colors: active` the ring and the scrim leave the token system and
paint from `Canvas` / `CanvasText`, because discarded author colours would make
a spinner indistinguishable from a static circle.

<!--@include: ./_shared.md-->
