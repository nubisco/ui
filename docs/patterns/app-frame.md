---
layout: nubisco
title: The app frame, navigation and going back
description: What each region of NbShell is for, how a view contributes controls to it, the single breadcrumb trail, the ban on back buttons, and how an application with no router still says where the user is.
---

The frame is the part of a product the user never chose to look at and never
stops looking at. It answers three questions continuously, without being asked:
**where am I**, **what can I do here**, and **how do I get out**. A product that
answers those three the same way as the other eleven is part of one ecosystem. A
product that answers them its own way is a separate product wearing our colours.

We read twelve applications built on this library end to end. The frame is where
they diverged most:

- **Eight of twelve invented a DOM id** to let a view put controls in the shell:
  `#cms-topbar`, `#nks-topbar-right`, `#verba-topbar`, `#ob-topbar-left`,
  `#nba-topbar-left`, `#tally-topbar`, `#page-actions`, `#verba-inspector`.
  Eight incompatible contracts for one need, and one live bug: in tally a view
  and its own child teleport into the same target, so what the topbar shows
  depends on mount order, and the layout compensates with a `:deep()` rule.
- **Four applications have no way back at all.** One renders its breadcrumbs as
  inert `<span>`s, so from a task list three levels deep the only route back to
  the parent is the sidebar icon, which drops the whole trail.
- **Two render two breadcrumb trails at once** on some routes.
- **Two put a back button** next to, or instead of, a trail.
- **Four fight the frame from outside with CSS**, including one whose single
  `:deep()` override in the entire codebase is load-bearing, and one whose
  comment admits it doubled a selector to out-specify a rule inside the built
  `ui.css`.

None of that is a taste problem. It is the absence of a written decision. This
page is the decision. Every heading is a ruling with the reason attached,
because a rule whose reason is missing gets re-litigated in the next product.

::: tip This page is rules, not mechanics
How the regions render, every prop, every token and every edge case lives in
[Shell](/ui/components/shell) and [`useShellSlot`](/ui/composables/use-shell-slot).
Read those for the API. Read this for what belongs where and why.
:::

## The frame is not the console look

Two of the twelve are graphical: a digital audio workstation and a 3D editor.
Neither looks anything like a console, and neither should. What they still owe
the user is the same three answers, and they are the two applications that
answer none of them: one switches five sibling views with unlabelled topbar
buttons, the other has a project name and nothing else.

So read every rule below as being about **mechanics**, not appearance. A rack of
knobs is app domain and stays app domain. "Which document am I editing, and how
do I get back to the one I came from" is frame, in a DAW exactly as in a CRM.
[Applications with no router](#applications-with-no-router) is the section that
makes the same rules land in a canvas.

## When the pattern applies, and when it does not

This page rules on **any product that mounts `NbShell`**, which is all twelve.
Three carve-outs, so nobody applies a rule where it does harm:

| Situation                                                                               | What still applies                                                                 | What does not                                                                                                  |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **A flat product**: every destination is one click from the rail, nothing nests         | Every region rule, the `useShellSlot` rule, the user menu, the ban on back buttons | The trail. A one-level product renders **no** breadcrumbs. See [Flat products](#flat-products-render-no-trail) |
| **A full-page task** taken over the frame: sign-in, an onboarding wizard, a print route | Nothing. Mount the page without `NbShell`                                          | All of it. A task with one way out does not need a frame that offers six                                       |
| **A view embedded in someone else's page**: an iframe widget, a docs preview            | Nothing                                                                            | `useShellSlot` is inert outside a shell by design, so an embedded view needs no branch                         |

Not a carve-out, and worth stating because two products treated it as one: a
product that looks nothing like a console (a DAW, a 3D editor) is **inside** the
pattern. See [Applications with no router](#applications-with-no-router).

## Anatomy: what each region is for

`NbShell` renders twelve regions, plus one legacy slot. Eight are contributable
from a view (the eight names `TShellSlotName` accepts); the three sidebar slots
and the main body are not. The rule for each is what it holds and, more usefully,
what it must never hold.

Where they sit, at a viewport above `collapse-at`:

```text
┌───────────────────────────────────────────────────────────────────────────┐
│  outer-menu    spans the rail, the body and the inspector                 │
├───────────┬───────────────────────────────────────────────────────────────┤
│  sidebar- │  inner-menu   over the body and the inspector                 │
│    logo   ├───────────────────────────────────────────────┬───────────────┤
├───────────┤  notification                                 ║               │
│           ├───────────────────────────────────────────────┤               │
│  sidebar- │  topbar-left                    topbar-right  ║  inspector    │
│    nav    ├───────────────────────────────────────────────┤               │
│           │  fixedbar   tabs, filters, a search           ║               │
│  scrolls  ├───────────────────────────────────────────────┤               │
│  inside   │                                               ║               │
│  itself   │  <main>     the only scroll                   ║  scrolls      │
│           │             container, one <h1>               ║  on its own   │
├───────────┤                                               ║               │
│  sidebar- ├───────────────────────────────────────────────┤               │
│   bottom  │  bottom     pinned under main                 ║               │
└───────────┴───────────────────────────────────────────────┴───────────────┘
```

`║` is the inspector's resize handle, on its left edge. Below `collapse-at` the
rail leaves the row and becomes an overlay drawer, and the inspector leaves it
and becomes a full-screen sheet; everything else keeps its place.

| Region             | Holds                                                                                                   | Never holds                                                | Why not                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `sidebar-logo`     | The product mark, linking to the product root                                                           | A page title, a tenant switcher                            | It is the one element that never changes. A changing thing there stops reading as "home"                                        |
| `sidebar-nav`      | Top-level destinations, one entry per area                                                              | Anything the current page put there                        | A rail that changes shape per route is not a rail, it is a toolbar with the wrong affordance                                    |
| `sidebar-bottom`   | Account, settings, help, sign-out (inside the account menu)                                             | Page actions                                               | It is the account corner. A Save button there is unfindable and unreachable by muscle memory                                    |
| `outer-menu`       | An application menu bar spanning the full width                                                         | Page-level actions                                         | It spans the inspector too, so it outranks the page. Only application-scope commands earn that                                  |
| `inner-menu`       | A menu bar over the body and inspector but not the rail                                                 | Navigation between areas                                   | Areas are the rail's job, and two navigation surfaces is two mental models                                                      |
| `notification`     | One `NbBanner` about the whole application or account                                                   | The result of the action the user just took                | The banner outlives the action. A "Saved" that survives a route change is a lie. See [Notifications](#where-notifications-land) |
| `topbar-left`      | The location: exactly one breadcrumb trail, ending in the page title                                    | Actions, a second trail, a back button                     | This region is the answer to "where am I". Anything else in it competes with that answer                                        |
| `topbar-right`     | Actions on the thing the page is showing, the notification bell, the account menu when there is no rail | Navigation, a status the page could show inline            | The right side is "what can I do here". Navigation there duplicates the rail                                                    |
| `fixedbar`         | Sub-navigation within the page: tabs, filters, a search row                                             | The primary action, breadcrumbs                            | It does not scroll, and it belongs to the page's own structure, one level below the trail                                       |
| default (`<main>`) | The page, with exactly one `<h1>`                                                                       | Chrome the frame already renders                           | Two page titles is the commonest way a product looks doubled                                                                    |
| `bottom`           | A console, a log, a timeline: a persistent secondary surface                                            | Form actions for the page above it                         | It is pinned, so a Save there is detached from the form it saves                                                                |
| `inspector`        | Properties of the current selection                                                                     | Navigation, a second inspector's worth of unrelated panels | See [One inspector](#one-inspector-and-where-it-sits)                                                                           |

**The thirteenth slot: `menubar`.** `NbShell` also renders a `menubar` slot
inside the body, below `notification` and above the topbar. It predates
`outer-menu` and `inner-menu`, it is not in `TShellSlotName`, and no view can
contribute to it. **Rule.** Do not pass it in new work. Two products still do;
both want `inner-menu` (a bar over the body and inspector) or `outer-menu` (a bar
spanning the rail too). It stays rendered so those two keep working, and it is
the one region on this page with no rule about what it holds, because the answer
is "nothing new".

Two consequences worth stating outright, because both shipped:

::: danger Never these

- **Never two navigation surfaces for the same thing.** A rail plus a
  topbar-left menu of the same destinations means every user learns both and
  trusts neither. One of our products renders route-meta breadcrumbs correctly
  and then renders a second trail into the right slot on three routes.
- **Never reach into the frame with a selector.** `:deep(.nb-shell__topbar)`,
  an unscoped `.nb-shell` restyle, or a doubled class to beat a scoped rule in
  the built stylesheet, are all the same bug: a product coupled to our internal
  markup. There is a prop or a token for every case we found. See
  [Theming the frame](#theming-the-frame-without-selectors).

:::

### The regions, running

Both frames below are one real `NbShell`, given a fixed height the way
[Shell](/ui/components/shell) demonstrates itself. Nothing is drawn by hand:
every label sits in the region whose slot name it carries, so a label in the
strip above `<main>` is proof that the strip is `topbar-left`, not an
illustration of one.

The console shape first: the rail, the two topbar halves, the `fixedbar`, the
body, the pinned `bottom` region and the inspector column.

<preview dir="col">
  <div class="afx-stack">
    <div class="afx-shell-frame afx-shell-frame--tall">
      <NbShell sidebar-variant="verbose" inspector-visible inspector-size="xs" inspector-label="Properties" sidebar-label="Openbridge sections" style="height: 100%">
        <template #sidebar-logo><span class="afx-region">sidebar-logo</span></template>
        <template #sidebar-nav>
          <span class="afx-region">sidebar-nav</span>
          <NbSidebarMenu>
            <NbSidebarMenuItem icon="cpu" label="Devices" href="#the-regions-running" active />
            <NbSidebarMenuItem icon="chart-line" label="Reports" href="#the-regions-running" />
          </NbSidebarMenu>
        </template>
        <template #sidebar-bottom><span class="afx-region">sidebar-bottom</span></template>
        <template #topbar-left><span class="afx-region">topbar-left</span></template>
        <template #topbar-right><span class="afx-region">topbar-right</span></template>
        <template #fixedbar><span class="afx-region">fixedbar</span></template>
        <template #bottom><span class="afx-region">bottom</span></template>
        <template #inspector>
          <NbShellPanel title="inspector" fill>
            <p class="afx-note" style="padding: 0 var(--nb-base-unit)">Properties of the current selection. Its sections are <code>NbShellPanel</code>s, and it scrolls on its own.</p>
          </NbShellPanel>
        </template>
        <p class="afx-region">default slot: the &lt;main&gt; element</p>
        <p class="afx-note" style="margin: 0">The page, with exactly one <code>&lt;h1&gt;</code>, and the only scroll container in the frame.</p>
      </NbShell>
    </div>
  </div>
</preview>

Then the three strips that sit above the topbar, which most products never use
and two of them use for the wrong thing. `outer-menu` spans the rail and the
inspector; `inner-menu` spans the body and the inspector but not the rail;
`notification` is inside the body, above the topbar, and holds a `flush` banner
about the account:

<preview dir="col">
  <div class="afx-stack">
    <div class="afx-shell-frame">
      <NbShell sidebar-variant="verbose" inspector-visible inspector-size="xs" style="height: 100%">
        <template #outer-menu><span class="afx-region">outer-menu, over the rail, the body and the inspector</span></template>
        <template #sidebar-logo><span class="afx-region">sidebar-logo</span></template>
        <template #sidebar-nav><span class="afx-region">sidebar-nav</span></template>
        <template #inner-menu><span class="afx-region">inner-menu, over the body and the inspector</span></template>
        <template #notification>
          <NbBanner status="warning" variant="callout" flush title="Read-only mode">Your session has viewer access. Ask an admin to grant editing.</NbBanner>
        </template>
        <template #topbar-left><span class="afx-region">topbar-left</span></template>
        <template #inspector><NbShellPanel title="inspector" fill /></template>
        <p class="afx-note" style="margin: 0">Three strips, three scopes: the application, the body, the account. None of them is the page.</p>
      </NbShell>
    </div>
  </div>
</preview>

::: info What these frames cannot show, and why they are not shrunk further
Three of the frame's behaviours are **viewport** behaviours, and a fixed-height
box in a docs column is not a viewport:

- **Everything below `collapse-at`.** The shell decides from
  `window.innerWidth`, not from its own box, so the drawer, the drawer toggle
  and the inspector sheet appear when the **browser window** is narrower than
  672px, whatever size the frame above is. Narrow this page and the frames
  collapse together with it; that is the honest way to see them.
- **The scroll contract.** `<main>` is the only scroller, but at 320px each
  region is most of the frame and there is nothing to scroll past.
- **The skip link**, which is visible only while focused. Click inside a frame
  and press Tab: it is the first thing the frame offers.

Shrinking a shell until the rail, the topbar and the inspector are stripes
would demonstrate none of that and would misrepresent all of it, so these
frames stay at a size where each region is still recognisably itself.
:::

### The scroll contract

The frame is `height: 100dvh; overflow: hidden`. That is deliberate and it is
the reason every other rule here holds: the chrome cannot be scrolled away, so
the answers to "where am I" and "how do I get out" are on screen at every scroll
position. It also means there is exactly one place a long page can grow.

**Rule.** `<main>` is the only scroll container in the frame.

| Region                                     | Scrolls                                                                                       |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `<main>`                                   | Yes, vertically. It is the page's scroller and the only one                                   |
| `topbar`, `fixedbar`                       | No. Both are `flex-shrink: 0` above `<main>`, so they stay put without any `position: sticky` |
| `bottom`                                   | No. Pinned under `<main>`, and it keeps its height while the page scrolls                     |
| `outer-menu`, `inner-menu`, `notification` | No. Same reason: they are strips, not content                                                 |
| The rail (`sidebar-nav`)                   | Internally, when the destinations overflow. The logo and the account corner stay pinned       |
| The inspector                              | Independently of the page, inside an `NbShellPanel` marked `fill`                             |

**Two things a product must never do**, both of which shipped:

- **Never make `body` or `html` the scroller.** A page that sets `height: auto`
  on the frame or scrolls the document scrolls the chrome out of view, and then
  the trail, the rail and the account corner are only reachable by scrolling
  back up. Two scroll containers on one page also means the browser restores the
  wrong one, so the user loses their place on every navigation.
- **Never add a `position: sticky` header inside `<main>`.** That is exactly what
  `fixedbar` is, one level up and outside the scroller, and a sticky header
  inside the scroller fights the topbar's shadow, double-stacks on small
  viewports and covers the anchor targets the page links to.

The one legitimate variation is `:main-padding="false"` for a canvas, which also
sets `overflow: hidden` on `<main>`: a canvas manages its own viewport and
nothing above it scrolls either. See
[Applications with no router](#applications-with-no-router).

## Choosing the frame's shape

Four props decide what the frame looks like before a single view renders. All
four have defaults that are right for a console, which is why three of them were
being set by copy-paste rather than by decision. Here is the decision.

### `sidebar-variant`: `compact` (default) or `verbose`

**Rule.** Count the top-level destinations, then look at whether they group.

- **`compact`** (a 56px icon rail) when there are **eight or fewer** destinations
  and no grouping. The icons become muscle memory, and the width is given back
  to the page. Every graphical product is compact: a canvas wants the pixels.
- **`verbose`** (a 240px labelled rail) when destinations **exceed eight**, or
  when they fall into named sections, or when they nest. `NbSidebarMenuGroup`
  and nested `NbSidebarMenuItem`s only exist in this variant, so a product with
  sub-navigation has no choice.

The tie-break, when it is genuinely eight or nine: **do the labels repeat?** A
rail of Devices, Reports, Alerts, Settings is compact. A rail of six report types
needs words, because six chart icons are one icon.

The variant is a **product-level** decision, not a per-route one. Switching it at
runtime is legal (see [Shell](/ui/components/shell#switching-between-compact-and-verbose-at-runtime))
and is for a user preference, never for a route.

### `inspector-size`: `xs` to `xl`, default `md`

Size by **what the panel contains**, not by what looks balanced on your monitor.
`xs`, `sm` and `md` are fixed pixel widths; `lg` and `xl` are fractions of the
viewport, so they grow with the window.

| Size           | Width               | Choose it for                                                                      |
| -------------- | ------------------- | ---------------------------------------------------------------------------------- |
| `xs`           | 288px               | A single column of `xs` fields and nothing else. Also the resize floor             |
| `sm`           | 360px               | The common case: labelled fields, a few groups, short values                       |
| `md` (default) | 560px               | Fields plus something that needs width: a code block, a preview, a small table     |
| `lg`           | 50% of the viewport | The inspector is half the work. A diff, a form as long as the page beside it       |
| `xl`           | 75% of the viewport | The inspector **is** the work and the page behind it is context. Rare; question it |

Two consequences of the fixed/fractional split, both from the source: `lg` and
`xl` reflow as the window changes while `xs`/`sm`/`md` do not, and `xl` is the
one size that opts out of the 50%-of-viewport ceiling the resize handle enforces.
If you find yourself reaching for `xl`, the content probably wants `main`.

### `collapse-at`: `md` (default), `lg` or `none`

Below the threshold the frame becomes single-column: the rail becomes a drawer,
the inspector becomes a sheet.

- **`md`** (672px) for anything a person opens on a phone, and for everything
  else too unless you can name the reason. It is also what zoom hits, which is
  why this threshold is an accessibility behaviour and not only a phone
  behaviour: browser zoom shrinks the viewport in CSS pixels, so 200% zoom on a
  1280px screen is a 640px layout viewport and 400% on a 1440px screen is a
  360px one. Both are below `md`, and both are the case
  [WCAG 2.2 SC 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
  is about. It is the criterion the `collapseAt` docstring cites, and the reason
  the frame collapses rather than letting a 240px rail and a 288px inspector
  leave the page a negative width.
- **`lg`** (1056px) when three columns at 800px would be unusable rather than
  merely tight: a data table with six columns beside a populated inspector.
  Collapsing earlier is a choice to show one thing properly instead of three
  things badly.
- **`none`** only for a product that genuinely cannot run small: a DAW timeline,
  a 3D viewport. Choosing `none` means you own every small-viewport behaviour the
  shell would have given you, including the drawer and the way back to the rail.
  It is not the setting for "we have not tested small yet".

### `topbar`: `auto` (default), `always` or `never`

- **`auto`** unless you can state which of the other two you need. The bar
  appears when `topbar-left` or `topbar-right` has content or a view has claimed
  one of them, and it is absent from the DOM otherwise. This is the setting that
  makes four products' empty-strip CSS deletable.
- **`always`** when something outside the shell is positioned against the bar's
  height or its bottom border, and would jump on the routes that fill neither
  half. It is also the exact pre-`auto` behaviour, so it is the one-line fix for
  a layout that regressed on upgrade.
- **`never`** for a full-bleed route inside a product whose shell is declared
  once further up. It has an exception you do not control: below `collapse-at`, a
  shell with a sidebar renders the bar anyway, because the bar carries the drawer
  toggle. It also has a consequence you do: a view contributing to a suppressed
  topbar has nowhere to render, so the contribution is dropped. It is not
  silent in development: the shell logs one `console.warn` per shell under
  `import.meta.env.DEV`, naming the suppressed topbar and telling you to use
  `topbar="auto"` or a region the shell does render. Production is silent, so
  that warning is the only signal you get. It fires once, not once per
  contribution, because a route transition holds two contributors at a time.

Both settings, side by side, with the same empty shell under each. Neither frame
passes a topbar slot and neither has a contributor, so the only difference is the
prop:

<preview dir="col">
  <div class="afx-pair">
    <div class="afx-half afx-half--neutral">
      <p class="afx-label">topbar="auto", the default</p>
      <div class="afx-shell-frame afx-shell-frame--short">
        <NbShell sidebar-variant="verbose" style="height: 100%">
          <template #sidebar-logo><NbSidebarBrand icon="shield-check" title="Openbridge" subtitle="Fleet" /></template>
          <p class="afx-note" style="margin: 0">The body starts at the top of the frame. There is no bar and no border line, because there is nothing to put in one.</p>
        </NbShell>
      </div>
      <p class="afx-note">Absent from the DOM, not hidden. This is the setting that makes four products' empty-strip CSS deletable.</p>
    </div>
    <div class="afx-half afx-half--neutral">
      <p class="afx-label">topbar="always"</p>
      <div class="afx-shell-frame afx-shell-frame--short">
        <NbShell sidebar-variant="verbose" topbar="always" style="height: 100%">
          <template #sidebar-logo><NbSidebarBrand icon="shield-check" title="Openbridge" subtitle="Fleet" /></template>
          <p class="afx-note" style="margin: 0">The bar is reserved and empty, and the body starts below its border.</p>
        </NbShell>
      </div>
      <p class="afx-note">Correct when something outside the shell is positioned against the bar's height and would jump on the routes that fill neither half. Not correct as a default.</p>
    </div>
  </div>
</preview>

### Order inside `topbar-right`

The region takes whatever a view gives it, so without a rule a five-icon topbar
is five products' worth of taste. **Rule.** Left to right:

| #   | Slot                                                                     | Why there                                                                                                                                           |
| --- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Page-scoped controls (a filter, a view switcher, a search for this page) | They belong to the page, so they sit nearest the page's own content and furthest from the account corner                                            |
| 2   | Secondary page actions                                                   | Read before the primary one, in the reading direction, so the primary is the last thing before the frame's own controls                             |
| 3   | The primary page action                                                  | The rightmost **page** thing: the corner is the most reachable target, and it is where the eye ends after reading the bar                           |
| 4   | The notification bell                                                    | Frame scope begins here. It is fixed across routes, so it must not move when the page's actions change count                                        |
| 5   | The user menu, **only** when there is no rail                            | Last, because it is the least frequent and the most destructive (sign-out lives in it). See [Where the user menu lives](#where-the-user-menu-lives) |

Positions 4 and 5 are **fixed across every route in the product**: they are frame
furniture, and furniture that moves is furniture the user has to look for. Only
1 to 3 change per page. A product with more than three page-scoped controls in
the bar has a `fixedbar`, not a topbar problem.

When a view contributes an additive control with `claim: 'all'`, give it an
`order` that keeps it in this sequence: negative for page scope, positive for
frame scope.

## A view contributes controls with `useShellSlot`, never a DOM id

**Rule.** A view that needs something in the frame calls
[`useShellSlot`](/ui/composables/use-shell-slot) and renders into the outlet it
gets back. It never queries the DOM, never teleports to a selector, and the
layout never declares an empty `<div id="...">` for it to find.

Here is the shape we found, and the shape that replaces it. Both are real: the
left-hand one is condensed from tally and openbridge, which differ only in the id.

::: danger Wrong: an id the layout declares and the view hunts for

```vue
<!-- AppLayout.vue: an empty region declared in case someone teleports to it -->
<template #topbar-left>
  <div id="ob-topbar-left" />
</template>
```

```vue
<!-- DeviceView.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
const mounted = ref(false)
// The child mounts before its ancestors, so the target is not there yet.
onMounted(() => setTimeout(() => (mounted.value = true), 0))
</script>

<template>
  <Teleport v-if="mounted" to="#ob-topbar-left">
    <NbBreadcrumbs title="Openbridge" subtitle="Devices" />
  </Teleport>
</template>
```

Three defects in eleven lines: a `setTimeout` standing in for a lifecycle
guarantee, an empty 50px strip on every route that contributes nothing, and no
answer at all for the tick where the leaving view and the arriving view both
hold `#ob-topbar-left`.
:::

::: tip Right: the view asks the shell for the region

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useShellSlot } from '@nubisco/ui'

const crumbs = useShellSlot('topbar-left')
const actions = useShellSlot('topbar-right')
const dirty = ref(false)
</script>

<template>
  <component :is="crumbs.Outlet">
    <NbBreadcrumbs title="Openbridge" subtitle="Devices">
      <RouterLink to="/devices">Devices</RouterLink>
      <span aria-current="page">Rack 4</span>
    </NbBreadcrumbs>
  </component>

  <component :is="actions.Outlet">
    <NbButton size="sm" :disabled="!dirty" @click="save">Save</NbButton>
  </component>

  <article>...</article>
</template>
```

No id, no `Teleport`, no `mounted` flag, and the layout declares nothing. The
strip exists only while this view is on screen.
:::

`Outlet` is a component object, so `<component :is="crumbs.Outlet">` and the
dotted shorthand `<crumbs.Outlet>` compile to the same thing. **This docs set
writes `<component :is="…">` everywhere**, including
[Shell](/ui/components/shell#contributing-controls-from-a-view) and
[`useShellSlot`](/ui/composables/use-shell-slot#basic-usage), because it is the
form that survives a rename of the local variable in review. Pick one per
product; do not mix them in one file.

### The contribution, running

The frame below is a real `NbShell` with **no** `topbar-left` and **no**
`topbar-right` slot passed to it. Everything in its topbar comes from a view
mounted in the default slot, which calls `useShellSlot('topbar-left')` and
`useShellSlot('topbar-right')` and renders into the outlets it gets back. There
is no id anywhere in it, and the layout declares nothing.

Unmount the view and watch the whole strip go with it: the contribution is what
made the region exist, which is the third of the three defects above
(**existence**) with no CSS involved.

<preview dir="col">
  <div class="afx-stack">
    <div class="afx-controls">
      <NbButton size="sm" variant="secondary" @click="viewMounted = !viewMounted">{{ viewMounted ? 'Unmount the view' : 'Mount the view' }}</NbButton>
      <span class="afx-note">The view is {{ viewMounted ? 'on screen, and holding both topbar halves' : 'gone, and so is the topbar' }}.</span>
    </div>
    <div class="afx-shell-frame">
      <NbShell sidebar-variant="verbose" style="height: 100%">
        <template #sidebar-logo><NbSidebarBrand icon="shield-check" title="Openbridge" subtitle="Fleet" /></template>
        <template #sidebar-nav>
          <NbSidebarMenu>
            <NbSidebarMenuItem icon="cpu" label="Devices" href="#the-contribution-running" active />
            <NbSidebarMenuItem icon="chart-line" label="Reports" href="#the-contribution-running" />
          </NbSidebarMenu>
        </template>
        <ContributingView v-if="viewMounted" />
        <p v-else class="afx-note" style="margin: 0">No view is contributing, so there is no topbar in the DOM at all. Nothing was hidden: <code>topbar="auto"</code> (the default) never rendered it.</p>
      </NbShell>
    </div>
  </div>
</preview>

That view is the one in the tip above. Written as a single-file component, which
is what it would be in a product, it is exactly this:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useShellSlot } from '@nubisco/ui'

const crumbs = useShellSlot('topbar-left')
const actions = useShellSlot('topbar-right')
const dirty = ref(false)
</script>

<template>
  <component :is="crumbs.Outlet">
    <NbBreadcrumbs title="Openbridge" subtitle="Devices">
      <a href="#devices">Devices</a>
      <span aria-current="page">Rack 4</span>
    </NbBreadcrumbs>
  </component>

  <component :is="actions.Outlet">
    <NbButton
      size="sm"
      :variant="dirty ? 'primary' : 'ghost'"
      @click="dirty = !dirty"
    >
      {{ dirty ? 'Save' : 'Edit something' }}
    </NbButton>
  </component>

  <article>…</article>
</template>
```

The page you are reading has no build step for a second single-file component,
so the running one above is the same setup body with a render function instead
of a template: `h(crumbs.Outlet, …)` is the outlet `<component :is="…">`
resolves to, and nothing else about it differs.

**Why.** The id convention looks harmless and fails in three ways we have shipped:

1. **Timing.** A child's `onMounted` runs before its ancestors'. A view that
   queries for a shell element on mount is looking too early, which is why one
   product patched it with a `setTimeout`. `useShellSlot` hands back a reactive
   `target`, so there is nothing to time.
2. **Ordering.** During a route transition both views hold the region. The id
   convention resolves that by mount order, which is why tally's `/horas` shows
   the topbar of whichever of `HoursView` and `HoursMatrix` mounted last. The
   composable's default `claim: 'last'` gives the region to the arriving view on
   the same tick, and gives it back when a nested contributor unmounts.
3. **Existence.** An id target has to be declared whether or not anything uses
   it, which is exactly why four applications ended up with an empty 50px strip
   they then hid with CSS. A contribution _creates_ the region and removes it
   again, so `topbar="auto"` (the default) is enough.

**The one legitimate exception is not an exception.** If two contributions
really are additive, say a background-sync chip that should sit beside the
page's own buttons rather than replace them, opt in per contributor:

```ts
const status = useShellSlot('topbar-right', { claim: 'all', order: -10 })
```

Every other multi-contributor situation is one view too many claiming the
region. Fix the view.

**Migration is mechanical and can be done one view at a time.** The layout keeps
rendering the old id until the last view stops using it, so the two conventions
coexist during the change. Delete the `mounted` flag with the `Teleport`: it
existed to work around the timing problem and now guards nothing.

## One trail, owned by the frame

**Rule.** Every routed application **that has depth** renders **exactly one**
breadcrumb trail, in `topbar-left`, and it is the only navigational statement of
where the user is. Its crumbs are real links. Its last crumb is the current page
and is not a link. Never zero, never two. The flat-product carve-out is
[below](#flat-products-render-no-trail).

```vue
<!-- The layout, once. Views contribute crumbs, they do not render a trail. -->
<template>
  <NbShell sidebar-variant="verbose">
    <template #sidebar-logo><ProductMark /></template>
    <template #sidebar-nav>
      <NbSidebarMenu>
        <NbSidebarMenuItem label="Devices" icon="cpu" to="/devices" />
        <NbSidebarMenuItem label="Reports" icon="chart-line" to="/reports" />
      </NbSidebarMenu>
    </template>
    <template #topbar-left>
      <NbBreadcrumbs :title="product" :subtitle="area">
        <template v-for="crumb in crumbs" :key="crumb.to">
          <RouterLink :to="crumb.to">{{ crumb.label }}</RouterLink>
        </template>
        <span aria-current="page">{{ current }}</span>
      </NbBreadcrumbs>
    </template>
    <RouterView />
  </NbShell>
</template>
```

Derive `crumbs` from route meta rather than from a per-view call. Two of our
products already do, and they are the two whose trail is correct on every route
including a hard refresh into a deep link:

```ts
// routes.ts
{ path: '/devices', name: 'devices', meta: { crumb: 'Devices' } },
{ path: '/devices/:id', name: 'device', meta: { crumb: (r) => r.params.id, parent: 'devices' } },
```

Whether the trail element itself lives in the layout's `#topbar-left` slot or is
contributed by the view with `useShellSlot('topbar-left')` is a product
decision, and both are legal. What is not legal is doing both, which is how two
products came to render two trails.

Two trails and one trail, in two real frames. The left-hand one is the shape two
products ship: a correct trail in `topbar-left`, and a second one rendered into
`topbar-right` on some routes.

<preview dir="col">
  <div class="afx-pair afx-pair--stack">
    <div class="afx-half afx-half--wrong">
      <p class="afx-label">Wrong: two trails, so neither is the answer</p>
      <div class="afx-shell-frame afx-shell-frame--short">
        <NbShell sidebar-variant="verbose" style="height: 100%">
          <template #sidebar-logo><NbSidebarBrand icon="shield-check" title="Openbridge" subtitle="Fleet" /></template>
          <template #topbar-left>
            <NbBreadcrumbs title="Openbridge" subtitle="Devices">
              <a href="#one-trail-owned-by-the-frame">Devices</a>
              <span aria-current="page">Rack 4</span>
            </NbBreadcrumbs>
          </template>
          <template #topbar-right>
            <NbBreadcrumbs title="Fleet" subtitle="Rack 4" />
          </template>
          <p class="afx-note" style="margin: 0">Which of the two says where the user is? Both claim to, they disagree about the wording, and only one of them navigates.</p>
        </NbShell>
      </div>
      <p class="afx-note">There are also now two <code>&lt;nav aria-label="breadcrumb"&gt;</code> landmarks in one document, which is the landmark-uniqueness rule broken as well.</p>
    </div>
    <div class="afx-half afx-half--right">
      <p class="afx-label">Right: one trail on the left, actions on the right</p>
      <div class="afx-shell-frame afx-shell-frame--short">
        <NbShell sidebar-variant="verbose" style="height: 100%">
          <template #sidebar-logo><NbSidebarBrand icon="shield-check" title="Openbridge" subtitle="Fleet" /></template>
          <template #topbar-left>
            <NbBreadcrumbs title="Openbridge" subtitle="Devices">
              <a href="#one-trail-owned-by-the-frame">Devices</a>
              <span aria-current="page">Rack 4</span>
            </NbBreadcrumbs>
          </template>
          <template #topbar-right>
            <NbButton size="sm" variant="ghost">Duplicate</NbButton>
            <NbButton size="sm" variant="primary">Save</NbButton>
          </template>
          <p class="afx-note" style="margin: 0">Left is where you are, right is what you can do. One statement each, and the two halves never argue.</p>
        </NbShell>
      </div>
      <p class="afx-note">One landmark named "breadcrumb", one location, and the corner is free for the primary action.</p>
    </div>
  </div>
</preview>

### Flat products render no trail

**Rule.** If every destination in the product is one activation away from the
rail and nothing nests under it, render **no** breadcrumbs. Pass `title` and
`subtitle` on nothing; put the rail's selected state and the page's `<h1>` to
work instead.

**Why.** A trail with one crumb is a heading with extra chrome. It repeats what
the rail already shows with `aria-current`, it repeats what the `<h1>` already
says, and it teaches the user that the trail is decorative, which is exactly the
lesson that makes them stop reading it in the product where it is load-bearing.
Two of our applications have a genuinely flat shape and one of them renders a
one-crumb trail on all six of its routes.

The line is **depth, not size**. A twelve-destination product where nothing
drills in is flat. A three-destination product where one of them opens a record
is not: that product needs a trail on the record routes. In a mixed product the
trail appears exactly on the routes that have a parent, and `topbar-left` is
simply empty on the ones that do not, which with `topbar="auto"` means the bar
itself may not render. That is correct and it is not a layout jump to fix from
the outside; if it reads as one, that is what `topbar="always"` is for.

### Loading, error and empty: what the trail says before the page can

The trail names a location, and the location is known before the data is. Three
states, three rulings.

| State                                          | The trail shows                                                                          | The page shows                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Route resolving, data in flight                | Every crumb whose label the route already knows, plus a skeleton for the one it does not | `NbSkeleton` in the shape of the content, never the word "Loading"    |
| Route resolved, the fetch failed               | The **full** trail, unchanged, every parent still a link                                 | `NbEmptyState kind="error"` with a retry action                       |
| Route resolved, the thing exists and is empty  | The full trail, unchanged                                                                | `NbEmptyState` (default `kind="empty"`) with the action that fills it |
| Route resolved, the thing does not exist (404) | The trail up to the parent, then a non-link crumb reading "Not found"                    | `NbEmptyState kind="error"`, and the way back is the trail            |

**Rules, with the reason each one exists.**

- **Never blank the trail while loading.** A frame that empties on every
  navigation flickers its own furniture, and for the two or three seconds a slow
  fetch takes, the user has no way back from a page that is not there yet. The
  parents are known from the route; render them.
- **A failed fetch does not change where the user is.** Four applications drop
  the trail into an error branch, which removes the one control that would let
  the user leave. The trail is the frame; the error is the page.
- **The last crumb is derived from the route, not from the response**, wherever
  it can be. `meta.crumb` gives you a label with no request. Only a crumb whose
  label genuinely comes from the record (a device name, a document title) needs a
  placeholder, and that placeholder is a fixed-width `NbSkeleton`, not the id and
  not an ellipsis, because both of those get read aloud.

  ```vue
  <span v-if="device">{{ device.name }}</span>
  <NbSkeleton v-else variant="text" width="8ch" />
  ```

- **Loading, error and empty inside the page are not the frame's problem** and
  are ruled on in [Status indicators](/patterns/status-indicators) and
  [Empty states](/ui/components/empty-state). The frame rule is only this: the
  frame does not join in. The topbar keeps its actions (disabled if they need
  data), the rail keeps its selection, the trail keeps its links.

### Crumbs are links, not text

`NbBreadcrumbs` takes `title` and `subtitle` for the brand prefix and renders
whatever you put in its default slot as the crumbs. It does not decide what a
crumb is, which means it will happily render inert text, and two products let it:

- One renders every crumb as a `<span>`. From `/properties/:id/tasks` there is
  no in-app way back to `/properties`.
- One passes only `title` and `subtitle` at all six of its call sites, so the
  component is being used as a page label. It is the same product that then
  needed a `router.back()` button on one page.

A trail whose crumbs do not navigate is decoration. If your crumbs are not
links, you do not have a trail, you have a heading with chevrons in it, and the
user has no way back.

::: danger Wrong: crumbs the user cannot activate

```vue
<!-- Condensed from a real view. Every crumb is text. -->
<NbBreadcrumbs title="Meridian" subtitle="Properties">
  <span>Properties</span>
  <span>{{ property.name }}</span>
  <span>Tasks</span>
</NbBreadcrumbs>
```

It renders identically to a working trail, which is why it survived review.
Nothing here is focusable, nothing is announced as actionable, and from
`/properties/:id/tasks` the only way back to `/properties` is the rail icon,
which drops both parents at once. The last crumb also carries no
`aria-current="page"`, so nothing says which of the three is the page.
:::

::: tip Right: every crumb but the last navigates

```vue
<NbBreadcrumbs title="Meridian" subtitle="Properties">
  <RouterLink to="/properties">Properties</RouterLink>
  <RouterLink :to="`/properties/${property.id}`">{{ property.name }}</RouterLink>
  <span aria-current="page">Tasks</span>
</NbBreadcrumbs>
```

The last crumb stays a `<span>`, deliberately: it is where the user already is,
so it is not a link, and `aria-current="page"` is what marks it. In a routerless
product the two links are `<button>`s calling `ascend()`; see
[Applications with no router](#applications-with-no-router).
:::

The two trails below are the same component with the same words. The only
difference is what the crumbs are made of, and the difference is invisible until
you use a keyboard. Tab through the pair: the left-hand trail is skipped
entirely, because nothing in it is focusable, while the right-hand one stops on
"Properties" and on "Casa del Mar".

<preview dir="col">
  <div class="afx-pair">
    <div class="afx-half afx-half--wrong">
      <p class="afx-label">Wrong: crumbs the user cannot activate</p>
      <NbBreadcrumbs title="Meridian" subtitle="Properties">
        <span>Properties</span>
        <span>Casa del Mar</span>
        <span>Tasks</span>
      </NbBreadcrumbs>
      <p class="afx-note">Renders identically to a working trail, which is why it survived review. Nothing is focusable, nothing is announced as actionable, and the last crumb carries no <code>aria-current</code>, so nothing says which of the three is the page.</p>
    </div>
    <div class="afx-half afx-half--right">
      <p class="afx-label">Right: every crumb but the last navigates</p>
      <NbBreadcrumbs title="Meridian" subtitle="Properties">
        <a href="#crumbs-are-links-not-text">Properties</a>
        <a href="#crumbs-are-links-not-text">Casa del Mar</a>
        <span aria-current="page">Tasks</span>
      </NbBreadcrumbs>
      <p class="afx-note">Two real links and one current page. In an application the links are <code>RouterLink</code>s, and in a routerless one they are <code>NbButton variant="ghost"</code> calling <code>ascend()</code>.</p>
    </div>
  </div>
</preview>

::: warning What the running demo exposes: the component draws no separator between crumbs
`NbBreadcrumbs` renders one chevron, between the brand prefix and the crumbs,
and **nothing between the crumbs themselves**: they are laid out by a `0.35rem`
gap, so the two trails above read as spaced words rather than as a path. That is
a library gap, not a licence to inject your own `›` into the slot: a separator
typed into the crumb list is read aloud, is not consistent between products, and
is exactly the hand-rolled fix this page rules against. Raise it, the way
[Theming the frame](#theming-the-frame-without-selectors) says to, and pass real
links in the meantime.
:::

### No back buttons

**Rule.** Do not render a back button. Not in the topbar, not beside the trail,
not at the top of a detail page.

**Why**, in the order the reasons bite:

1. **A back button points at history; a trail points at structure.** They give
   different answers, and only one of them is stable. On a deep link, a refresh,
   a link from an email or a new tab, there is no history to go back to, and the
   button either does nothing or leaves the application entirely.
2. **The browser already has one**, it is bigger, it is always in the same
   place, and it is the one users press. A second one that behaves differently
   (`router.back()` versus a hard-coded parent route) makes two controls that
   look identical and are not.
3. **It hides depth.** "Back" cannot say where back is. Three levels deep, a
   trail shows all three and lets the user jump two of them at once. Our audit
   found exactly this: the one product with a back button on its only drill-down
   also loses the search, sort and page state the URL was holding, because
   "back" was implemented as a link to the listing root.
4. **It is the symptom, not the cure.** Every back button we found sits in a
   product whose trail is decorative. Fix the trail and the button has nothing
   left to do.

The narrow thing that is **not** a back button and remains correct: a full-page
task (a wizard, a checkout, an import) may offer **Cancel**, and a multi-step
one may offer **Back** _within the step sequence_. Both are about the task, not
about the application's structure, and both are labelled by what they do. See
[Action labels](/content/action-labels).

The pair, running, because the back button's defect is not visible in a
screenshot: it is what the control **cannot say**.

<preview dir="col">
  <div class="afx-pair afx-pair--stack">
    <div class="afx-half afx-half--wrong">
      <p class="afx-label">Wrong: a back button and a page label</p>
      <div class="afx-shell-frame afx-shell-frame--short">
        <NbShell sidebar-variant="verbose" style="height: 100%">
          <template #sidebar-logo><NbSidebarBrand icon="shield-check" title="Meridian" subtitle="Portfolio" /></template>
          <template #topbar-left>
            <NbButton size="sm" variant="ghost" icon="arrow-left">Back</NbButton>
            <strong>Tasks</strong>
          </template>
          <p class="afx-note" style="margin: 0">Three levels deep. Back to what? On a deep link, a refresh or a link from an email there is no history behind this control, and it cannot name where it goes.</p>
        </NbShell>
      </div>
      <p class="afx-note">It also hides depth: the two parents above this page are unreachable in one activation, and the search and sort the URL was holding are lost when "back" is a hard-coded route.</p>
    </div>
    <div class="afx-half afx-half--right">
      <p class="afx-label">Right: the trail is the way back</p>
      <div class="afx-shell-frame afx-shell-frame--short">
        <NbShell sidebar-variant="verbose" style="height: 100%">
          <template #sidebar-logo><NbSidebarBrand icon="shield-check" title="Meridian" subtitle="Portfolio" /></template>
          <template #topbar-left>
            <NbBreadcrumbs title="Meridian" subtitle="Properties">
              <a href="#no-back-buttons">Properties</a>
              <a href="#no-back-buttons">Casa del Mar</a>
              <span aria-current="page">Tasks</span>
            </NbBreadcrumbs>
          </template>
          <p class="afx-note" style="margin: 0">The same three levels, named. Either parent is one activation away, and the trail says the same thing after a refresh as it did before one.</p>
        </NbShell>
      </div>
      <p class="afx-note">Structure, not history. The browser's own back button is still there, still bigger, and now it is the only one.</p>
    </div>
  </div>
</preview>

## Page titles and the trail

The trail ends in the page. The page begins with a heading. They are two
renderings of the same fact and must agree.

**Rules.**

- The **last crumb is the current page** and is not a link. The `aria-current`
  and heading-semantics rules that go with that are in
  [Accessibility](#accessibility), which is where all of them live.
- `<main>` contains **exactly one `<h1>`**, and it is the same string as the last
  crumb. Two of our products render a page title in the topbar and again at the
  top of the body, in different words.
- **The document title follows the trail**, in the same order the trail reads,
  narrowest first: `Rack 4 · Devices · Openbridge`. It is the tab, the history
  entry and the bookmark, all of which are places the frame is not visible.
- `NbBreadcrumbs`'s `title` and `subtitle` are the **brand prefix**, not the
  page. `title` is the product, `subtitle` is the area. Neither is a substitute
  for a crumb.

### How to word them

The trail is read left to right in about half a second, so every word in it is
expensive. [Writing style](/content/writing-style) is the general rule; these are
the frame's.

- **A crumb is a noun, never a verb.** "Devices", not "Manage devices". The crumb
  names a place; the verb belongs on a button. A verb in the trail reads as an
  action the user is about to take by clicking it.
- **Sentence case for everything in the frame**: crumbs, rail labels, region
  names, the notification bell's rows. Title Case in one product and sentence
  case in the next is the cheapest way for two products to look unrelated.
- **Short, and specific.** Aim for one or two words per crumb. If a crumb needs
  five words to be unambiguous, the ambiguity is in the information architecture,
  not in the label.
- **A record crumb is the record's own name**, not its type and not its id.
  "Rack 4", not "Device" and not "d-8814". A trail of type names is the site map,
  which the user can already see in the rail.
- **Never repeat the parent inside the child.** "Devices › Rack 4 devices" reads
  as two places. The trail supplies the context; the crumb supplies the
  difference.
- **Rail labels and crumbs use the same word for the same place.** If the rail
  says Reports the crumb does not say Analytics. Two words for one place is the
  most common reason a user believes they are somewhere else.
- **Truncate the middle of a long record name, never the parents.** The parents
  are what the user is aiming at; the current crumb is the one they can already
  read on the page in the `<h1>`.

## Where the user menu lives

**Rule.** One `NbUserMenu`, at the bottom of the rail (`#sidebar-bottom`), with
`placement="right-end"`. Never two, and never a second sign-out anywhere else.

```vue
<template #sidebar-bottom>
  <NbUserMenu
    :user="user"
    :accounts="accounts"
    placement="right-end"
    @profile="router.push('/profile')"
    @sign-out="auth.signOut()"
  />
</template>
```

**Why the rail.** The account corner is the one control that is identical in
every product, so it should be in the one place that is identical in every
product. The rail bottom is pinned, is not affected by the page, and does not
compete with page actions for the top-right corner, which is where a page's
primary action belongs. `placement="right-end"` opens the panel out of the rail
rather than over it, and the panel is teleported to `<body>`, so a rail with
`overflow: hidden` cannot clip it.

**The railless case, and a gap to raise.** A product with no rail puts the menu
last in `topbar-right` (position 5 in the
[ordering table](#order-inside-topbar-right)). `TUserMenuPlacement` is
`'right-end' | 'top-start'` and nothing else: `right-end` opens the panel to the
right of the trigger and up from its bottom edge, `top-start` opens it above the
trigger, left-aligned. **Neither is right for a trigger in the top-right corner**,
which wants a panel hanging below it and right-aligned. There is no value for
that today.

So: **do not guess a value, and do not reach for CSS.** Until the library grows
the placement, a railless product uses `placement="top-start"` (the panel is
left-aligned with the trigger, which at least does not run off the right edge the
way `right-end` does) and **raises the gap**, exactly as
[Theming the frame](#theming-the-frame-without-selectors) says to do with a
missing token. Both cases are the same rule: a missing API is a library bug, not
a licence for a local workaround, because a local workaround is invisible to the
next product that hits it.

```vue
<!-- No rail: the account menu is last in topbar-right. -->
<template #topbar-right>
  <PageActions />
  <NbNotificationCenter align="end" :items="items" />
  <NbUserMenu :user="user" placement="top-start" @sign-out="auth.signOut()" />
</template>
```

**Sign-out lives in that menu and nowhere else.** `NbSidebarLink` has a `danger`
prop and it is tempting to spend it on a sign-out rail icon. Do not: an
irreversible session action one mis-click from the navigation is the same class
of mistake as the unguarded destructive actions the audit counted sixteen of.

## Where notifications land

Three destinations, three scopes, no overlap. Getting this wrong is what made
three products hand-build a notification bell (312, 343 and 308 lines) and three
more hand-build a toast host.

| The message is about                                   | Where it goes                                | Component                                                                  |
| ------------------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------- |
| The action the user just took                          | A toast, bottom of the viewport              | [`useToast()`](/ui/composables/use-toast) with one `NbToaster` at the root |
| A standing condition of the account or the application | The `notification` region, above the topbar  | [`NbBanner`](/ui/components/banner) with `flush`                           |
| A page or a region                                     | Inside the page, above the thing it is about | `NbBanner`                                                                 |
| Something that happened while the user was elsewhere   | The bell in `topbar-right`                   | [`NbNotificationCenter`](/ui/components/notification-center)               |
| One field                                              | Under the control                            | `NbMessage`                                                                |

The full carrier decision, including the nine status words and the badge versus
banner boundary, is [Status indicators](/patterns/status-indicators). The frame
rules on top of it are these:

- **One toaster per application**, mounted next to `NbShell` at the root, not
  per view. `useToast()` pushes into one shared queue and every mounted
  `NbToaster` renders all of it, so a second host does not scope anything: it
  duplicates the stack on screen and announces every message twice through its
  live region. The default `placement="bottom-end"` keeps the stack clear of the
  topbar, which is where the actions that raise most toasts live.

  ::: danger Wrong: a toaster per view

  ```vue
  <!-- DeviceView.vue, and the same four lines in five other views -->
  <template>
    <article>…</article>
    <NbToaster />
  </template>
  ```

  On the tick where the leaving view and the arriving view overlap there are two
  hosts, so a "Saved" raised by the route change is shown twice and read twice.
  It also disappears with the view: a toast raised just before a navigation is
  unmounted mid-announcement.
  :::

  ::: tip Right: one host, beside the shell, at the root

  ```vue
  <!-- App.vue -->
  <template>
    <NbShell>…</NbShell>
    <NbToaster />
  </template>
  ```

  Views only call `useToast()`. They never mount a host, and they do not need
  one to be inside the shell.
  :::

- **Clear transient toasts on navigation**, from a router guard. The library
  does not know what a route is and must not guess:

  ```ts
  router.afterEach(() => toast.dismissTransient())
  ```

- **The `notification` region is for facts, not events.** A trial expiring, a
  region degraded, a payment method about to lapse. Use
  `variant="callout"` when the message cannot be dismissed truthfully, because
  dismissing it would not make it untrue. A "Saved" banner in this region
  outlives the save, which is why one product put its own six second timer
  around it.
- **The bell is a log, not an alert.** `NbNotificationCenter` in `topbar-right`,
  `align="end"`. Its rows are things that already happened. If the user must act
  now, that is a toast with an action or a banner, not a number on a bell.
- **`window.alert` is not a notification surface.** One product surfaces
  exception failures through 21 of them.

## One inspector, and where it sits

**Rule.** A frame has **one** inspector: the shell's right-hand column. It shows
properties of the current selection, and its visibility belongs to the shell.

```vue
<NbShell
  v-model:inspector-visible="inspectorOpen"
  inspector-size="sm"
  resizable
>
  <template #inspector>
    <NbShellPanel title="Properties" fill>…</NbShellPanel>
  </template>
</NbShell>
```

- **Views contribute to it** with `useShellSlot('inspector')`, exactly as they
  contribute to the topbar. One product invented `#verba-inspector` for this.
- **Sections are `NbShellPanel`s**, not hand-rolled headers. Use `fill` for the
  one panel that should take the leftover height and scroll internally, `fluid`
  for panels that should be only as tall as their content. Two products
  re-declared `flex: 1 1 auto; min-height: 0` on our internal class names in six
  places before that prop existed.
- **Never a second drawer.** A product that needs a second surface for a second
  kind of detail needs tabs inside the one inspector, or the `bottom` region if
  the content is long rather than deep.
- **Below `collapseAt` the inspector becomes a full-screen sheet** with its own
  dismiss button, and the body goes inert behind it. That is the shell's
  behaviour, not something to reimplement, and it is why the inspector must not
  be the only route to a control the user needs while looking at the page.

Density, hierarchy and control style inside an inspector are
[Building an inspector](/patterns/inspectors). It rules on the `xs` field size,
the three-step text ramp, and the one spacing rhythm.

## The frame's own controls are the frame's

Four things belong to `NbShell` and must not be rebuilt: **the skip link**, **the
navigation drawer and its toggle**, **the landmark names**, and **Escape**. Each
of the four is a rule in the next section, because each of the four is an
accessibility behaviour and a product that reimplements one reimplements it
worse. The only supported opt-out is `:skip-to-content="false"`, and only when
the application already ships a skip link of its own, because the skip link is
how the frame satisfies
[SC 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html):
the rail, the menus and the topbar repeat on every page, and a keyboard user
must be able to jump them. Removing it without replacing it removes the
product's conformance, not just a control.

## Accessibility

The frame is the part of the product a keyboard user meets first on every page
load and a screen reader user meets first on every navigation. It is also the
part that twelve products each got partly right. This section is the whole
contract; nothing about frame accessibility is stated anywhere else on this page.

`NbShell` implements all of it except where a rule says "the product". Component
level detail is in [Shell's own accessibility notes](/ui/components/shell#accessibility);
the general rules are in [Keyboard interaction](/accessibility/keyboard) and
[Accessibility overview](/accessibility/overview). What follows is what a
**product** owes on top.

Four of the rules below are load-bearing because a WCAG 2.2 success criterion
says so, not because we prefer them. Each names its criterion where it appears:

| The rule                                        | The criterion                                                                             |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| The shell's skip link, and not rebuilding it    | [2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html) (A) |
| `collapse-at`, and the zoom case behind it      | [1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) (AA)             |
| One trail, with every crumb but the last a link | [2.4.8 Location](https://www.w3.org/WAI/WCAG22/Understanding/location.html) (AAA)         |
| The tab order below, unmodified by the product  | [2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) (A)     |

The trail's criterion is AAA, which is worth saying plainly: nothing obliges a
product to have breadcrumbs. What obliges it, once it has them, is everything
else on this page.

### The frame's tab order

**Rule.** Tab order follows the frame's DOM order, and the product does not
change it: no positive `tabindex`, no reordering a region with CSS `order` in a
way that leaves the sequence disagreeing with the visual one. That is
[SC 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html),
and it is the criterion behind the "contribution order is not visual order"
consequence below. `NbShell` renders in exactly this sequence, so this is what a
user tabbing from the address bar meets:

| #   | Stop                                                                      | Present when                                                              |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Skip link                                                                 | `skipToContent` (default true). Visible on focus only                     |
| 2   | `outer-menu`                                                              | The region has content                                                    |
| 3   | Sidebar: logo, then nav, then bottom                                      | A sidebar slot has content **and** the drawer is not closed-and-collapsed |
| 4   | `inner-menu`                                                              | The region has content                                                    |
| 5   | `notification`                                                            | The region has content                                                    |
| 5a  | The legacy `menubar`                                                      | Only if the product still passes it. Do not, in new work                  |
| 6   | Drawer toggle                                                             | Below `collapse-at`, with a sidebar                                       |
| 7   | `topbar-left`, then `topbar-right`                                        | The topbar renders                                                        |
| 8   | `fixedbar`                                                                | The region has content                                                    |
| 9   | `<main>`                                                                  | Always. It is `tabindex="-1"`, so it is a focus target, not a tab stop    |
| 10  | `bottom`                                                                  | The region has content                                                    |
| 11  | Inspector: dismiss button (sheet only), then resize handle, then contents | The inspector is open                                                     |

Three consequences a product has to live with:

- **The drawer toggle comes after the sidebar in the DOM but before the topbar.**
  That is correct: when the drawer is closed it is `inert`, so the sidebar is not
  in the sequence at all and the toggle is the first thing after the skip link.
  When it is open, the sidebar is where the user expects it, ahead of the page.
- **The resize handle is a tab stop inside the inspector, before its content.**
  It is a `separator` with a value, not decoration.
- **Contribution order is not visual order.** Under `claim: 'all'` the `order`
  option sorts contributions with CSS `order`; the tab sequence stays
  registration order. If the mismatch matters, it is a sign the region has one
  contributor too many. This is why the
  [`topbar-right` ordering rule](#order-inside-topbar-right) is about **which
  slot** a control belongs in, not about tuning `order` values.

### Focus when the frame navigates

This is the rule with the most missing implementations across the fleet: **not
one of the twelve moves focus on navigation.** A keyboard user who activates a
crumb or a rail item lands with focus still on the control they left, in the old
frame, and has to tab past the whole frame to reach the page they asked for. A
screen reader user is told nothing happened at all.

**Rule.** After any frame-level navigation completes, move focus to `<main>`.
The shell exposes exactly that:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const shell = ref<{ focusMain: () => void } | null>(null)
const router = useRouter()

// After the route resolves, not before: focusing an element the router is
// about to replace moves focus to the body.
router.afterEach(() => {
  requestAnimationFrame(() => shell.value?.focusMain())
})
</script>

<template>
  <NbShell ref="shell">…</NbShell>
</template>
```

`focusMain()` focuses the `<main>` element, which carries `tabindex="-1"` for
this purpose and is the same target the skip link uses. The next Tab is therefore
the first control **in the page**, and a screen reader announces the new page
rather than staying silent.

Four sub-rules, each answering a case we found:

1. **Applies to the trail, the rail and the drawer alike.** Any activation that
   changes what `<main>` contains.
2. **Does not apply to in-page navigation**: a tab strip in `fixedbar`, a filter,
   a sort. Those keep focus on the control the user is operating, because the
   user is still operating it.
3. **A routerless product does the same thing on `enter()` and `ascend()`.** It
   has the same `focusMain` on the same shell ref; it just has no `afterEach` to
   hang it from.
4. **The drawer already handles itself.** Focus moves into the drawer when it
   opens and returns to the toggle when it closes. Do not add your own focus
   management there; you will fight it.

### Breadcrumbs: what the component gives you, and what it does not

`NbBreadcrumbs` renders a `<nav aria-label="breadcrumb">` wrapping a `<span>`
that holds whatever you pass in the default slot. **It is not an `<ol>` and the
crumbs are not `<li>`s.** The named landmark is real and the trail is findable;
what is missing is set position, so nothing announces "2 of 4".

A trail is how a product answers
[SC 2.4.8 Location](https://www.w3.org/WAI/WCAG22/Understanding/location.html):
where this page sits in the set of pages. That criterion is AAA and optional;
the trail stops being optional the moment the product has depth, because the
rest of this page depends on it being the only answer.

**Rules for the product, given that.**

- **Every crumb but the last is a real link or a real `<button>`.** The component
  renders whatever you hand it, including inert `<span>`s, and one product hands
  it exactly that. A `<span>` is not focusable, is not announced as actionable,
  and is not reachable at all by keyboard. This is the single most consequential
  accessibility defect the audit found in the frame.
- **The last crumb carries `aria-current="page"`** and is not a link. That is
  what tells a screen reader which of the crumbs is the destination, and with no
  list semantics it is the only positional information present.
- **Do not hand-build list semantics around it.** Wrapping the slot in your own
  `<ol>` puts a list inside a `<span>` inside a `<nav>`, which is invalid and
  announces worse than what is there now. If your product needs set position
  announced, that is a library gap: raise it, the way
  [Theming the frame](#theming-the-frame-without-selectors) says to.
- **Do not add a second `aria-label="breadcrumb"` region.** See landmark
  uniqueness below.

### Landmark uniqueness

The frame ships three landmarks with names, and a product can easily add a fourth
without one.

| Landmark               | Element             | Named by                               |
| ---------------------- | ------------------- | -------------------------------------- |
| Navigation (the rail)  | `<nav>`             | `sidebar-label`                        |
| Navigation (the trail) | `<nav>`             | `NbBreadcrumbs`, fixed as "breadcrumb" |
| Complementary          | `<aside>` inspector | `inspector-label`                      |
| Main                   | `<main>`            | Implicit, one per document             |

**Rules.**

- **Two `<nav>`s in one document must have different accessible names.** They
  already do here. A **third** `<nav>` (a secondary menu in `inner-menu`, a
  footer nav in `bottom`) needs its own `aria-label`, or a screen reader's
  landmark list reads "navigation, navigation, navigation".
- **Rename per product, do not add.** `sidebar-label="Openbridge sections"` is
  better than the default for a product with a second nav. Note that
  `inspector-label` also names the resize handle, which is announced as
  `Resize <label>`, so the label reads best as a noun phrase ("Properties", not
  "Properties panel panel").
- **Exactly one `<main>`, and the shell renders it.** A product that renders its
  own `<main>` inside the default slot has two, and the skip link then points at
  the wrong one.
- **The topbar is not a heading.** Whatever is in `topbar-left` is not an `<h1>`.
  Assistive technology navigates by headings, and a frame element that never
  changes rank while the page under it changes is noise in that list. The one
  `<h1>` is in `<main>`, and it matches the last crumb.

### The inspector resize handle

The handle is a real control with a real keyboard contract, which means a
keyboard user can size the inspector without a pointer. It is `role="separator"`,
`tabindex="0"`, `aria-orientation="vertical"`, and it carries `aria-valuenow`,
`aria-valuemin` (288, the floor) and `aria-valuemax` (half the viewport, never
below the floor).

| Key                | Does                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| Left / Right arrow | 16px. Left grows the inspector, because the handle is on its left edge |
| Shift + arrow      | 64px, for crossing the range without forty keystrokes                  |
| Home / End         | The floor / the ceiling                                                |
| Enter or Space     | Reset to the `inspector-size` default                                  |
| Double-click       | The same reset, for the pointer                                        |

**Product rules.** Do not re-bind these keys from a parent while focus is in the
handle. Do not render the handle without `resizable`, and do not build your own:
a `<div>` with a `pointerdown` handler is a resize that no keyboard can reach,
which is what two products shipped before the prop existed. Below `collapse-at`
the handle is not rendered at all, because the inspector is an overlay there and
its width is the window's, which is the honest answer rather than a control that
does nothing.

### Inert regions, and the way in and out

Two parts of the frame go `inert`, which removes them from the tab sequence and
from the accessibility tree entirely rather than merely hiding them.

- **The closed drawer.** Below `collapse-at`, a sidebar whose drawer is shut is
  `inert` and `aria-hidden`. Without that, a user tabs into links they cannot
  see, which is the classic off-canvas navigation bug. Focus moves into the
  drawer when it opens and **returns to the toggle** when it closes, so focus is
  never left on a removed element.
- **The body under the inspector sheet.** When the inspector becomes a
  full-screen sheet, the body goes `inert` behind it. The sheet renders its own
  dismiss button as its first child, so it is also the first thing Tab reaches
  inside the sheet.

**Rules.** Do not set `inert` or `aria-hidden` yourself on anything the shell
owns. Do not trap focus inside a contribution. And do not make the inspector the
only route to a control the user needs while looking at the page: below the
breakpoint it covers the page, so a control that lives only there is a control
that cannot be used alongside what it acts on.

### Escape: one owner

**Rule.** Escape belongs to the frame **when the frame is holding an overlay**,
and to whatever is on top of the page otherwise. `NbShell` binds `keydown.esc` on
its root and handles it in exactly two cases, topmost first: an open navigation
drawer, then an inspector sheet. When it holds neither, it does not call
`preventDefault` and does not stop propagation, so the event keeps travelling and
a dialog, a menu or a command palette inside the page still gets its own Escape.

That leaves the key genuinely free for an application binding, with one
condition:

- **A product may bind Escape at the application level** (a routerless product
  binds `ascend`, see [below](#applications-with-no-router)) **provided the
  binding is a no-op while the frame or the page is holding an overlay.** In
  practice: bind it on the shell's own root or on `window`, and return early when
  a dialog, a menu, a drawer or a sheet is open.
- **Never bind Escape to anything destructive or lossy.** It is the key users
  press when they are already unsure.

```ts
// A routerless product's Escape binding, on the shell's root so the shell's own
// handler runs first. `ascend` runs only when Escape is not already spoken for.
// `drawerOpen` and `inspectorOpen` are the product's own v-model refs, not a
// query into our markup: never read the frame's state out of the DOM.
function onEscape(e: KeyboardEvent) {
  if (e.defaultPrevented) return
  if (drawerOpen.value || inspectorOpen.value || dialogOpen.value) return
  ascend()
}
```

```vue
<NbShell
  v-model:sidebar-open="drawerOpen"
  v-model:inspector-visible="inspectorOpen"
  @keydown.esc="onEscape"
>
```

### Motion and contrast

Everything the frame animates (the inspector width, the drawer, the skip link)
is suppressed under `prefers-reduced-motion: reduce`; the states are still
reached, only instantly. **Anything a product animates inside a slot is the
product's to gate**, with the same media query or with `useReducedMotion`. And
every `--nb-shell-*` colour a product overrides has to clear contrast in **both**
themes: the library themes through a `.dark` class, so a value set at `:root` is
set for both. See [Colour contrast](/accessibility/color-contrast).

## Applications with no router

Two of the twelve are graphical and have no router, and the audit's verdict is
worth quoting exactly: having no depth to represent is **fine**; having no
answer to "where am I" is **not**, and that is a different question.

A router is a way to name a location. It is not the only way. What the frame
actually requires is four properties, and a canvas application can have all four
without a single route:

1. **One reactive location value**, owned by the application, not scattered
   across the components that happen to switch views.
2. **One trail that renders it**, in the same place as every other product's
   trail.
3. **Every level but the last is activatable**, so the trail is the way back.
4. **The location survives a reload**, because a graphical app is exactly the
   kind of app people leave open for days and then restart.

Here is the whole thing. It is a store, a trail and a keyboard rule:

```ts
// usePlace.ts. Not a router: a named location and the way up out of it.
import { computed, ref, watch } from 'vue'

export interface IPlace {
  /** Stable key, for the trail and for persistence. */
  id: string
  label: string
  /** Called when the crumb is activated. Restores this level. */
  enter: () => void
}

const stack = ref<IPlace[]>([])

export function usePlace() {
  const current = computed(() => stack.value.at(-1) ?? null)

  function push(place: IPlace) {
    stack.value = [...stack.value, place]
  }

  /** The only "back" a routerless app gets: up one level of structure. */
  function ascend() {
    if (stack.value.length <= 1) return
    stack.value = stack.value.slice(0, -1)
    stack.value.at(-1)?.enter()
  }

  return { stack, current, push, ascend }
}

// Survives a reload. The ids are the location; the app rebuilds the rest.
watch(
  stack,
  (s) => localStorage.setItem('place', JSON.stringify(s.map((p) => p.id))),
  {
    deep: true,
  },
)
```

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useShellSlot } from '@nubisco/ui'
import { usePlace } from './usePlace'

const slot = useShellSlot('topbar-left')
const { stack } = usePlace()

// The brand prefix is the product, fixed. It is NOT the first place: the first
// place is a crumb like any other, and putting it in `subtitle` as well renders
// a one-level stack twice, once as its own parent and once as itself.
const parents = computed(() => stack.value.slice(0, -1))
const current = computed(() => stack.value.at(-1) ?? null)
</script>

<template>
  <component :is="slot.Outlet">
    <NbBreadcrumbs title="Stagewright" subtitle="Session">
      <template v-for="place in parents" :key="place.id">
        <NbButton variant="ghost" size="sm" @click="place.enter()">
          {{ place.label }}
        </NbButton>
      </template>
      <span v-if="current" aria-current="page">{{ current.label }}</span>
    </NbBreadcrumbs>
  </component>
</template>
```

Two details that are load-bearing rather than incidental:

- **A crumb that is not a link is still a control.** With no router there is no
  `href`, so each parent is a real `<button>` (`NbButton variant="ghost"`, which
  is the frame's own quiet button and needs no styles from you). What it must not
  be is a `<span>` with a click handler: unfocusable, unannounced, unreachable.
  There is no `.crumb` class to write, and no product CSS reaching into the trail.
- **Depth 1 renders one crumb, not two.** With a single place, `parents` is empty
  and the trail is the brand prefix plus the current crumb, which is exactly what
  a top-level location should look like. If your product is flat at every depth,
  [render no trail at all](#flat-products-render-no-trail).

Bind `ascend` to Escape as [the Escape rule](#escape-one-owner) describes, and
the DAW gets the same "one level out" affordance the console gets from its trail,
with no history stack to lie about. Call `focusMain()` after `enter()` and
`ascend()`, exactly as a routed product calls it after `afterEach`. Notice what
is not here: a back button. A routerless application has **no history at all**,
so a control labelled "Back" there is not merely ambiguous, it is describing
something that does not exist.

Two more rules specific to this shape, both from real code:

- **A canvas is `:main-padding="false"`, not a `:deep()` override.** One product's
  only `:deep()` in its entire codebase hides `.nb-shell__topbar`. It is
  load-bearing and it will break. `topbar="never"` is the supported way to have
  no topbar, and `topbar="auto"` (the default) means an empty one is never
  rendered in the first place.
- **Sibling views switched by topbar buttons are still places.** Five unlabelled
  toggle buttons are a tab bar with no selected state and no name. Use
  `NbTabs` in `fixedbar` and let the trail name the document above it, or make
  each view a place and let the trail carry it. Either way the answer to "where
  am I" is on screen and in one place.

## Theming the frame without selectors

Four products restyle the frame from outside. Every **colour** case we found is
a token declared once at `:root`, so an application overrides it there without
competing with our scoped styles.

```scss
:root {
  --nb-shell-topbar-bg: var(--nb-c-surface-raised);
  --nb-shell-topbar-border: none;
  --nb-shell-sidebar-bg: #14141f;
  --nb-shell-main-bg: var(--nb-c-surface);
}
```

The reasoning is [Theming the chrome](/ui/components/shell#theming-the-chrome)
and the full list is the
[CSS custom properties](/ui/components/shell#css-custom-properties) table
underneath it. The frame ground, each chrome strip (background, text colour,
border), the rail, the scrim and the inspector's border are all tokens, and each
of them is declared at `:root` and read where it is used, so a `:root` override
reaches it.

Both themes have to work: the library themes through a `.dark` class, so
anything you set at `:root` you set for both, and a hardcoded panel colour that
reads on white is the most common way a frame breaks in dark.

### Size is a prop, not a `:root` token

**Rule.** The inspector's width comes from `inspector-size`, or from
`resizable` with `v-model:inspector-width`. **Never** from setting
`--nb-shell-inspector-width` at `:root`: that override cannot work.

```vue
<!-- Right: the width is an API, and the user's choice is yours to persist. -->
<NbShell inspector-size="sm" resizable v-model:inspector-width="width" />
```

**Why it cannot work**, because this is the one place the token story has an
exception and a product that meets it by accident concludes the whole story is a
lie. `NbShell` re-declares `--nb-shell-inspector-width` **on the inspector
element itself**, once per size, through the `nb-shell__inspector--xs|sm|md|lg|xl`
class it binds whenever the inspector is open. A custom property declared on an
element always beats one inherited from an ancestor, whatever the selectors look
like, so the element's own value wins and a `:root` value never arrives.
`resizable` writes the same property as an inline style on the same element, for
the same reason: it has to out-rank the size class.

Two inspector width tokens a product **can** set at `:root`, because the shell
reads them rather than re-declaring them on the element:

- `--nb-shell-inspector-max-width`, the ceiling a visible inspector may not
  exceed (default `max(288px, 50vw)`). It is re-declared only by `--xl` and
  `--expanded`, which opt out of the ceiling deliberately because both are
  already viewport-relative. Set it to `none` to opt out everywhere.
- `--nb-shell-inspector-expanded-width` (default `50vw`), the width used while
  the inspector is expanded.

**How to tell which kind a token is**, without reading our source: if it names a
colour, a border or a spacing of the chrome, it is a `:root` token and an
override lands. If it names the width of something with a prop for its size, the
prop is the API. When in doubt, set it, look at the element in devtools, and if
the computed value is not yours the property is owned by the component.

If you find a case with no token **and** no prop, that is a gap in the library,
not a licence for a selector. Raise it.

## Checklist

**Regions**

- [ ] The rail's contents are the same on every route.
- [ ] `topbar-left` holds the location and nothing else.
- [ ] `topbar-right` follows the order: page controls, secondary actions,
      primary action, bell, account menu. The last two do not move between routes.
- [ ] No empty region is declared just to be teleported into.
- [ ] No selector anywhere in the product targets a `.nb-shell*` class.
- [ ] No new code passes the legacy `menubar` slot.
- [ ] `<main>` is the only scroll container: nothing makes `body` or `html`
      scroll, and no `position: sticky` header sits inside `<main>`.

**Variants**

- [ ] `sidebar-variant` was chosen from the destination count, not copied.
- [ ] `inspector-size` was chosen from what the panel contains, and no
      stylesheet sets `--nb-shell-inspector-width` at `:root` (it cannot work).
- [ ] `collapse-at="none"`, if set, has a named reason and the product owns its
      small-viewport behaviour.
- [ ] `topbar="always"` or `"never"`, if set, has a named reason.

**Contribution**

- [ ] No view queries the DOM for a shell element, and no layout renders an
      empty `<div id="…">` for one to find.
- [ ] Every view-level control in the frame comes from `useShellSlot`.
- [ ] Any region with more than one contributor at a time opted in with
      `claim: 'all'` deliberately.

**Navigation**

- [ ] Exactly one breadcrumb trail is on screen on every route that has a parent,
      and none at all if the product is flat.
- [ ] Every crumb but the last navigates and is a link or a button, never a
      `<span>`. The last carries `aria-current="page"`.
- [ ] The trail is correct after a hard refresh into a deep link.
- [ ] The trail survives loading and error: parents stay, and stay clickable.
- [ ] Crumbs are sentence-case nouns, and a record's crumb is its name.
- [ ] There is no back button. Any "Back" in the product is a step control
      inside a task.
- [ ] `<main>` has exactly one `<h1>` and it matches the last crumb.
- [ ] The document title follows the trail, narrowest first.

**Frame services**

- [ ] One `NbUserMenu`, and one sign-out, in the account corner.
- [ ] One `NbToaster` at the application root, and a router guard calling
      `dismissTransient()`.
- [ ] The `notification` region carries standing facts only.
- [ ] One inspector, its sections built from `NbShellPanel`.
- [ ] The skip link, the drawer and the landmark names are the shell's, not
      reimplemented.

**Accessibility**

- [ ] Focus moves to `<main>` after every frame-level navigation, via
      `focusMain()`.
- [ ] Tab from the address bar reaches the frame in the documented order and
      nothing in the product overrides it with `tabindex`.
- [ ] No `<span>` is used as a crumb, and no hand-rolled `<ol>` wraps the trail.
- [ ] Any third `<nav>` the product adds carries its own `aria-label`.
- [ ] There is exactly one `<main>` and one `<h1>` per page, and the product
      renders neither of the frame's own landmarks itself.
- [ ] The resize handle is the shell's, and no parent re-binds arrows, Home,
      End, Enter or Space while focus is in it.
- [ ] Any application-level Escape binding no-ops while an overlay is open.
- [ ] Anything the product animates inside a slot respects
      `prefers-reduced-motion`, and every overridden `--nb-shell-*` colour clears
      contrast in both themes.

**No router**

- [ ] There is one location value, and it is on screen.
- [ ] Every level above the current one can be returned to.
- [ ] The location survives a reload.
- [ ] Escape (or an equivalent) goes up one level, no-ops while an overlay is
      open, and nothing is labelled "Back".
- [ ] Every parent crumb is a `<button>`, and focus moves to `<main>` after it.

---

**Related:** [Shell](/ui/components/shell) ·
[`useShellSlot`](/ui/composables/use-shell-slot) ·
[Building an inspector](/patterns/inspectors) ·
[Status indicators](/patterns/status-indicators) ·
[Empty states](/patterns/empty-states) ·
[Layout and breakpoints](/principles/layout) ·
[Writing style](/content/writing-style) ·
[Action labels](/content/action-labels) ·
[Keyboard interaction](/accessibility/keyboard) ·
[Colour contrast](/accessibility/color-contrast)

<script setup>
import { defineComponent, h, ref } from 'vue'
import NbBreadcrumbs from '../../src/components/Breadcrumbs.vue'
import NbButton from '../../src/components/Button.vue'
import { useShellSlot } from '../../src/composables/useShellSlot.composable'

const viewMounted = ref(true)

/**
 * A view, not a mock of one: it is mounted in the shell's default slot and it
 * reaches the topbar the only supported way, through useShellSlot. Written with
 * a render function rather than a template because a docs page has no build step
 * for a second single-file component, and h(crumbs.Outlet) is the same outlet
 * `<component :is="crumbs.Outlet">` resolves to.
 */
const ContributingView = defineComponent({
  name: 'ContributingView',
  setup() {
    const crumbs = useShellSlot('topbar-left')
    const actions = useShellSlot('topbar-right')
    const dirty = ref(false)

    return () => [
      h(crumbs.Outlet, null, {
        default: () =>
          h(NbBreadcrumbs, { title: 'Openbridge', subtitle: 'Devices' }, {
            default: () => [
              h('a', { href: '#the-contribution-running' }, 'Devices'),
              h('span', { 'aria-current': 'page' }, 'Rack 4'),
            ],
          }),
      }),
      h(actions.Outlet, null, {
        default: () =>
          h(
            NbButton,
            {
              size: 'sm',
              variant: dirty.value ? 'primary' : 'ghost',
              onClick: () => (dirty.value = !dirty.value),
            },
            () => (dirty.value ? 'Save' : 'Edit something'),
          ),
      }),
      h('p', { class: 'afx-note', style: 'margin: 0' },
        'This paragraph is the view. The trail and the button in the topbar are the same view, teleported into the two regions it claimed.'),
    ]
  },
})
</script>

<style scoped>
/* The preview area stretches its single child, so a demo with more than one
   thing in it goes in a plain stacking wrapper. */
.afx-stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  width: 100%;
}

.afx-controls {
  display: flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 1.5);
  flex-wrap: wrap;
}

.afx-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
  align-items: start;
}

.afx-pair--stack {
  grid-template-columns: 1fr;
}

.afx-half {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  align-items: flex-start;
  padding: calc(var(--nb-base-unit) * 1.5);
  border-radius: var(--nb-radius-md);
  border: 1px solid var(--nb-c-border);
}

.afx-half--wrong {
  border-color: var(--nb-c-danger-surface);
}

.afx-half--right {
  border-color: var(--nb-c-success-surface);
}

.afx-half > .afx-shell-frame,
.afx-half > .nb-breadcrumbs {
  width: 100%;
}

.afx-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.afx-half--wrong .afx-label {
  color: var(--nb-c-danger);
}

.afx-half--right .afx-label {
  color: var(--nb-c-success);
}

.afx-half--neutral .afx-label {
  color: var(--nb-c-text-muted);
}

.afx-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--nb-c-text-muted);
}

/* The region name, printed in the region. Not a component and not pretending
   to be one: a label, so the slot names in the table above are findable on
   screen. */
.afx-region {
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.4;
  letter-spacing: 0.02em;
  color: var(--nb-c-text-subtle);
  border: 1px dashed currentColor;
  border-radius: 2px;
  padding: 1px 5px;
  white-space: nowrap;
}

/* NbShell is height: 100dvh by design, so the only way to show it in a docs
   column is to give it a smaller viewport. Nothing about the shell is changed. */
.afx-shell-frame {
  height: 260px;
  overflow: hidden;
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
}

.afx-shell-frame--tall {
  height: 320px;
}

.afx-shell-frame--short {
  height: 220px;
}
</style>
