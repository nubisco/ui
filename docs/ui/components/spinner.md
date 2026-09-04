---
layout: nubisco
title: Spinner
tabs: ['Usage', 'Accessibility', 'Api']
---

<doc-tab name="Usage">

`NbSpinner` says one thing: work is happening and we cannot say how much is
left. It carries no measurement, so if you can count bytes, files or records,
you are holding the wrong component.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbSpinner v-bind="resultingProps" />
</preview>

```vue
<template>
  <NbSpinner label="Loading invoices" />
</template>
```

## Which loading component

| Situation                                                              | Use                                                         |
| ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| You know the total (files, bytes, steps)                               | [`NbProgressBar`](/ui/components/progress-bar) with `value` |
| You know nothing but the operation blocks a region or the page         | `NbSpinner`                                                 |
| A named action is running and its result must be confirmed             | [`NbInlineLoading`](/ui/components/inline-loading)          |
| A page or list is filling in for the first time and the shape is known | [`NbSkeleton`](/ui/components/skeleton)                     |

The overlap that matters is with `NbProgressBar`. It accepts no `value` and
sweeps indeterminately, which looks like it competes with this component. It
does not: use the bar when the operation has a measurable total that you are
about to learn (an upload negotiating its size), and the spinner when there
will never be a number. A bar that sweeps forever is a promise of a percentage
that never arrives.

## Sequencing a whole page load

The three components are rarely a choice made once. A real screen loads in
stages, and the stage decides the indicator. The audit found one app rendering
the literal string "Loading" under eight different class names, largely because
nobody had written down what a second and a third wait are supposed to look
like.

**First paint.** Show the shell you already know: the page title, the empty
table frame, the sidebar. Fill the unknown parts with
[`NbSkeleton`](/ui/components/skeleton) shaped like what is coming. Do not
cover a shell you have already drawn with a scrim, and do not spinner-block a
page whose header is ready to read.

**Regions that arrive late.** A chart or a panel that resolves after the rest
gets its own `overlay="container"` spinner, scoped to that region. The rest of
the page stays live. This is the stage most often over-blocked: a full page
scrim for one slow widget tells the user the whole application is unavailable
when it is not.

**Refresh in place.** Content is already on screen and is being replaced.
Never swap it back to skeletons: the page collapses and rebuilds, the scroll
position moves and the user loses their place. Keep the stale content, dim it
with `overlay="container"`, and let the new data replace it underneath.

**Load more.** Appending a page of results is not a page load. Put a small
inline spinner in the footer row of the list, or reuse the trigger button's own
`loading` state, and leave everything above it untouched. A skeleton row at the
bottom is also fine, since it predicts exactly what is about to appear there.
What is never fine is a scrim over results the user is still reading.

**A named action the user started.** Saving, publishing, revoking. That is
[`NbInlineLoading`](/ui/components/inline-loading), because the load is only
half the story and the outcome is the half that four apps currently omit
entirely.

## Sizes

Diameter is derived from the field height scale, at exactly half the height of
the control of the same size step. A spinner dropped into an `md` button is
optically centred with no per-call-site nudging, and stays that way if the
field scale is ever retuned.

<preview>
  <NbSpinner size="xs" show-label label="xs" />
  <NbSpinner size="sm" show-label label="sm" />
  <NbSpinner size="md" show-label label="md" />
  <NbSpinner size="lg" show-label label="lg" />
</preview>

| Size | Diameter                              | Use with                 |
| ---- | ------------------------------------- | ------------------------ |
| `xs` | `calc(var(--nb-field-height-xs) / 2)` | Toolbars, table cells    |
| `sm` | `calc(var(--nb-field-height-sm) / 2)` | Buttons, rows, chips     |
| `md` | `calc(var(--nb-field-height-md) / 2)` | Panels and cards         |
| `lg` | `calc(var(--nb-field-height-lg) / 2)` | Page and region overlays |

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
running. [`NbButton`](/ui/components/button/button) has a `loading` prop that swaps its
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

That is the same arbitration [`NbModal`](/ui/components/modal) already uses to
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
and [`NbToaster`](/ui/components/toaster)'s live regions and stack are
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

1. Learn a number and switch to [`NbProgressBar`](/ui/components/progress-bar).
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

## Do and don't

- **Do** name what is loading. `label="Loading invoices"` beats `"Loading"`,
  which is what a screen reader user hears from every spinner on the fleet.
- **Do** use `showLabel` on overlays. A scrim with an unlabelled ring gives a
  sighted user no more information than a frozen screen does.
- **Don't** put a spinner where the content shape is already known. A list that
  is about to render twenty rows should render twenty
  [`NbSkeleton`](/ui/components/skeleton) rows.
- **Don't** confirm success with a spinner disappearing. Silence is not
  confirmation. Use [`NbInlineLoading`](/ui/components/inline-loading).
- **Don't** stack two spinners for one operation. If an ancestor already
  announces the load, mark the inner one `decorative`.

</doc-tab>

<doc-tab name="Accessibility">

## Accessibility

- The root element is `role="status"` with `aria-live="polite"`, so the label is
  announced without interrupting whatever the user is reading.
- **The live region is mounted empty and filled on the next task.** A region
  that is inserted into the document and filled in the same frame has no
  previous contents to be compared against, and the update is frequently never
  reported at all. So the announcement node goes in blank and the label is
  written a task later, which makes it a change to a region that was already
  being watched. This is the same reason `completeLabel` waits before writing,
  and the reason [`NbInlineLoading`](/ui/components/inline-loading) keeps its
  text node mounted while inactive.
- **The visible label and the announced label are two different nodes.** With
  `showLabel`, the text you can see is `aria-hidden="true"` and the text that is
  announced is visually hidden (clipped, never `display: none`). One label, read
  once.
- The ring is an `<svg>` marked `aria-hidden="true"` and `focusable="false"`,
  which also keeps it out of the tab order in older Edge.
- `decorative` removes the role, the live region and the label, and marks the
  whole component `aria-hidden="true"`. Use it whenever an ancestor already
  announces the state, which is what [`NbInlineLoading`](/ui/components/inline-loading)
  does internally. Two live regions for one operation is worse than none.
- **`decorative` is ignored by `overlay="page"`.** A full-viewport scrim is the
  element holding focus and the only thing on the screen; there is no ancestor
  left to announce on its behalf. Marking it `aria-hidden` would park a screen
  reader user on a node that reports nothing at all, so a page overlay always
  keeps its name. It is the one place in the component where a prop does not do
  what it says, and it is deliberate.
- `delay` keeps the component out of the DOM entirely until it fires, so an
  operation that finishes first never announces a load that already ended.
- **Reduced motion**: under `prefers-reduced-motion: reduce` the arc becomes a
  complete ring that breathes in opacity. Nothing rotates and nothing
  translates, but the indicator is still visibly alive. Freezing a partial arc
  into a static crescent is the common shortcut and it is wrong: it reads as a
  hung process, which is the exact message the component exists to disprove.
- The preference is honoured twice: by the media query, and by a
  `nb-spinner--reduced-motion` class read from `matchMedia`, so flipping the OS
  setting with the page already open takes effect without a reload.
- **Windows high contrast**: forced colours discard author colours, which would
  leave the track and the arc the same system colour (a plain grey circle with
  no motion cue) and collapse the scrim into opaque `Canvas`. Under
  `forced-colors: active` the arc opts out with `forced-color-adjust` and paints
  in `CanvasText`, the track drops back to `Canvas`, and both overlays keep a
  `CanvasText` outline so the blocked region is still legible as blocked.
- **Completion is announced only if you ask for it.** `completeLabel` speaks
  once, politely, through a shared live region that outlives the component,
  because a region being torn down cannot say anything. Nothing is spoken if
  the spinner never became visible (a `delay` that outran the request announced
  no load, so it has no completion to report) or if it is `decorative`.
  Alternatively, move focus to the content that arrived and let that be the
  announcement, but do one or the other: a load that ends in silence is the
  most common accessibility defect in this whole area.
- **`overlay="page"` blocks, and it blocks with `inert`.** It teleports to
  `<body>`, marks every body child that existed at claim time `inert`, takes
  focus itself, locks body scroll and hands focus back when it leaves. A scrim
  a keyboard user can tab straight through is not blocking anything, and that
  is the defect this mode exists to avoid.
- **There is no focus trap, on purpose.** `inert` removes a subtree from the
  tab order, from hit testing and from the accessibility tree in one attribute,
  which is strictly more than a trap can do, and it cannot get into a fight. A
  trap that reclaims focus has to rank itself against every other holder, and
  against a widget that refocuses itself on `focusout` it recurses until the
  stack ends. Nothing here listens to `focusin` and nothing swallows `Tab`.
- **A dialog opened on top of the overlay stays usable**, because it arrived
  after the claim and was never inerted, and it paints above the scrim because
  both sit at `--nb-zindex-modal` and it is later in document order. This is the
  one ordering worth testing yourself if you change anything here: an element
  that is painted on top and cannot be focused is worse than no containment.
- **Containment has one exception, and it is announcers.** A host marked
  `data-nb-overlay-exempt` is never inerted, because `inert` would take it out
  of the accessibility tree as well as out of the tab order and leave a toast
  painted above the scrim and silent. The library marks its own live regions
  (`NbToaster`'s two announcers and its stack, and the shared completion
  announcer); mark your own with the attribute or with `markOverlayExempt()`,
  and mark nothing else. The attribute is read when the overlay claims, and an
  exempt host inside a wrapper of yours keeps the wrapper's other children
  blocked.
- **The default slot is outside the announcement.** Content slotted into an
  overlay sits in `aria-live="off"`, so a cancel button is a control the user
  can reach rather than a phrase appended to "Switching tenant". It is inside
  the overlay's own subtree, which is the part a page overlay never inerts, so
  it is genuinely focusable while the application behind it is not.
- **`overlay="container"` contains its region too.** The covered parent is
  marked `aria-busy="true"` and its other children are marked `inert`, so the
  form under the scrim is not tabbable while it is unavailable.
- Colour is never the only signal here, since the component's whole content is
  motion plus text.

</doc-tab>

<doc-tab name="Api">

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

</doc-tab>

<script setup lang="ts">
const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Loading invoices',
    placeholder: 'What is loading',
  },
  {
    label: 'Show label',
    name: 'showLabel',
    type: 'boolean',
    default: true,
  },
  {
    label: 'Size',
    name: 'size',
    type: 'single',
    default: 'md',
    options: [
      { value: 'xs', label: 'xs' },
      { value: 'sm', label: 'sm' },
      { value: 'md', label: 'md' },
      { value: 'lg', label: 'lg' },
    ],
  },
  {
    label: 'Tone',
    name: 'tone',
    type: 'single',
    default: 'primary',
    options: [
      { value: 'primary', label: 'primary' },
      { value: 'inherit', label: 'inherit' },
    ],
  },
]
</script>
