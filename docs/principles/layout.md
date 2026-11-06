---
layout: nubisco
title: Layout and breakpoints
tabs:
  [
    'Overview',
    'Breakpoints',
    'The column grid',
    'Choosing a tool',
    'Width and measure',
    'Inside the shell',
    'Small screens',
  ]
---

<doc-tab name="Overview">

Nubisco UI has exactly five breakpoints. They have existed since the grid was
written, they are compiled into every `.nb-grid` class, and they are the only
widths the library itself knows about.

They apply to every width you write, not only to `NbGrid`. A plain `@media`
query with a hand-picked number is a breakpoint no other screen shares, so the
layout changes at a width where nothing else does.

This page is the answer to "what width do I write". It is authoritative for
the whole library, not only for the grid.

## The three facts that decide most layout questions

**1. The scale lives in SCSS, not in the component.**
`src/styles/variables/_breakpoints.scss` declares `$bp-sm` through `$bp-xxl`
and an `mq()` mixin. `NbGrid` compiles the same map into class prefixes. Both
read the same source, so a hand-written media query and a `NbGrid` responsive
map switch on the same pixel.

**2. The library reflows on one signal, the phone, and caps everything else.**
Apart from the generated grid classes, the library's viewport queries are the
phone signal (`$phone-query` in `_breakpoints.scss`, `usePhoneLayout()` in
script, unit-tested to match): below `md`, or a touch screen too short to be
anything but a phone held sideways. `NbShell` collapses there by default
(`collapseAt`), `NbModal` becomes a sheet, fields grow to touch size. Above it,
components cap their own size instead (`NbModal` at 520 to 1600px,
`NbCommandPalette` at 640px, `NbToast` at 380px), which is why they behave
identically in a 1440px window and in a 424px sliver of one. Any other
responsive behaviour is a decision the application makes, and this page is
where the values for it come from.

**3. Inside `NbShell`, the viewport is not the layout width.**
The shell subtracts a sidebar (56px or 240px), an inspector (288px up to 75vw)
and 48px of main padding before your content sees a single pixel. A viewport
media query at `lg` can fire while your content column is 424px wide. The
**Inside the shell** tab has the arithmetic and the rule that follows from it.

## Decision order

Work down this list and stop at the first line that applies. It is ordered so
that the cheapest and least breakable option comes first.

| Step | Question                                                 | Do this                                                                                    |
| ---- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1    | Can the layout just wrap or shrink?                      | `flex-wrap: wrap` with a `min-width` on the items. No breakpoint at all.                   |
| 2    | Does an item have a natural minimum readable width?      | CSS grid with `repeat(auto-fit, minmax(<min>, 1fr))`. Still no breakpoint.                 |
| 3    | Does the change depend on the container, not the window? | Drive it from state or a container query in your app. A viewport breakpoint will be wrong. |
| 4    | Does the change genuinely depend on the window?          | Use `sm` / `md` / `lg` / `xl` / `xxl`. Never a number.                                     |
| 5    | None of the five fit.                                    | The layout is wrong, or the value belongs in the library. Raise it, do not inline it.      |

Steps 1 and 2 cover more real cases than teams expect. A hand-written
breakpoint guarding a card row is usually doing what a single `auto-fit` track
does at every width, including the ones nobody tested.

</doc-tab>

<doc-tab name="Breakpoints">

## The scale

Five values, mobile first, all `min-width`. Declared once in
`src/styles/variables/_breakpoints.scss`:

| Name  | Min-width | What it is for                                                                                                               |
| ----- | --------: | ---------------------------------------------------------------------------------------------------------------------------- |
| `sm`  |   `320px` | The narrowest window we support at all. Single column, chrome collapsed, nothing optional on screen.                         |
| `md`  |   `672px` | The first width where two columns of content are honest. Large tablets, half-screen desktop windows, a wide phone landscape. |
| `lg`  |  `1056px` | The first width where persistent chrome (sidebar, inspector, filters rail) can stay open without squeezing content.          |
| `xl`  |  `1312px` | Comfortable desktop. Content can hold a third column, or keep a fixed sidebar next to a full-width table.                    |
| `xxl` |  `1584px` | Large and ultrawide displays. Use it to stop growing, not to add more: cap widths, add margin, do not add a fourth column.   |

Two things to internalise about the values themselves.

**Base is not `sm`.** Base styles (the unprefixed `.nb-grid` classes, the CSS
you write outside any query) apply everywhere, including below 320px. `sm`
starts a media query at 320px. So a `sm` rule is not "the mobile rule", it is
"from 320px up". If you want something true on a 280px-wide embedded panel,
put it in the base, not in `sm`.

**`sm` is rarely worth writing.** Anything at or above 320px is almost every
real device, so a `sm` rule and a base rule mostly do the same thing. Reach for
`sm` only when you deliberately want a different behaviour below 320px.

## Using them in SCSS

Inside an SFC `<style lang="scss">` block, load the variables partial and use
the `mq()` mixin. It takes a breakpoint name and errors at compile time on a
name that does not exist, which is the point: a typo fails the build instead of
shipping a query that never matches.

```vue
<style scoped lang="scss">
// In a consuming application. `@nubisco/ui/variables` forwards the breakpoint
// partial, so `mq()` comes with it. Inside this repository the same import is
// the relative path to the partial: `@use '../styles/variables/breakpoints'`.
@use '@nubisco/ui/variables' as variables;

.report-header {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-8);

  @include variables.mq('lg') {
    flex-direction: row;
    align-items: center;
    gap: var(--nb-spacing-16);
  }
}
</style>
```

::: danger CSS lives in the style block, always
Never place a `<style>` block, or anything that compiles to CSS, above the
`<template>` in an SFC. The compiler discards it silently. That shipped broken
for three releases once. `tests/sfc-styles.test.ts` guards it.
:::

The raw values are also exported as Sass variables (`variables.$bp-md` and
friends, unitless numbers) and as the `variables.$breakpoints` map, for the
rare case where you need the number rather than a query, for example to pass a
width into a `matchMedia` call in script.

```ts
// A viewport-driven behaviour that CSS cannot express (a JS-owned layout mode).
// 672 is `$bp-md`. Keep the two in sync, or better, avoid needing this.
const wide = window.matchMedia('(min-width: 672px)')
```

## Using them in templates

`NbGrid` accepts a breakpoint map on `dir`, `gap`, `grid`, `shift`, `justify`,
`align`, `wrap` and `visible`, and an array of breakpoint names on `first`,
`last` and `reverse`. The keys are the same five names, and the generated
classes sit inside the same media queries.

```vue
<template>
  <!-- Full width until 1056px, then a two-thirds / one-third split -->
  <nb-grid dir="row" wrap="wrap" gap="md">
    <nb-grid dir="col" :grid="{ sm: 16, lg: 11 }">
      <slot name="report" />
    </nb-grid>
    <nb-grid dir="col" :grid="{ sm: 16, lg: 5 }">
      <slot name="summary" />
    </nb-grid>
  </nb-grid>
</template>
```

## `dir` in a map goes both ways

`:dir="{ sm: 'col', md: 'row' }"` is a column from 320px and a row from 672px.
`NbGrid` emits the breakpoint's `row` like any other value (`md-row`), so a
map can switch back to a row. Older versions skipped it, and the workaround of
a hand-written `class="md-row"` can go.

## Rules

- **Never invent a width.** If none of the five fit, the layout is telling
  you something.
- **Never write a `max-width` query.** The scale is mobile first and
  exclusively `min-width`. Mixing directions produces the one-pixel gaps and
  double-applied rules that a single-direction cascade cannot have.
- **Do not hide function at a breakpoint.** Hiding a decorative column at `sm`
  is fine. Hiding the only delete button is not: it must move, not vanish.
  WCAG 1.4.10 (Reflow) expects content and function to survive down to 320px.
- **Breakpoints are for layout, not for content.** Do not swap copy, load
  different data or change what an action does at a width.

</doc-tab>

<doc-tab name="The column grid">

## Sixteen columns

`NbGrid` is a flexbox implementation of a 16-column grid, configured in
`src/styles/variables/_grid.scss`.

| Setting                                     | Value                         | Token                 |
| ------------------------------------------- | ----------------------------- | --------------------- |
| Columns                                     | `16`                          | `--nb-grid-columns`   |
| Page margin (`container`)                   | `0` phone, `16px`, `24px` xxl | `--nb-grid-gutter`    |
| Max content width                           | `1440px`                      | `--nb-grid-max-width` |
| Base unit (everything else derives from it) | `8px`                         | `--nb-base-unit`      |

Sixteen divides cleanly into halves, quarters and eighths, and the 11/5 split
above. It does not divide into thirds, fifths or sixths, so `grid` also takes a
fraction (`'1/3'`, `'2/3'`, `'1/5'` to `'4/5'`, `'1/6'`, `'5/6'`) on the same
arithmetic. See [Thirds, fifths and sixths](/components/grid/code#thirds-fifths-and-sixths).

`grid` accepts 1 to 16 or a fraction, and sets `flex-basis`, `max-width` and
`min-width` to the span's share of the row minus its share of the gaps.
`shift` accepts 0 to 15 and sets a matching `margin-inline-start`, so it
mirrors under right-to-left, and `0` takes a shift back off at a breakpoint.

**Percentages, not pixels.** A `grid` span is a percentage of its parent, so a
`grid="8"` inside a 424px shell column is 212px, not half of your monitor. This
is the behaviour you want, and it is also the reason viewport breakpoints and
column spans can disagree. See the **Inside the shell** tab.

## Gutters and gaps

A grid has no gutter unless you give it one, with `gap` or with `mode`. What
a step means is [Spacing and rhythm](/principles/spacing#choosing-a-step)'s
call, and this table follows it:

| `gap` | Computed | Use it for                                                                |
| ----- | -------: | ------------------------------------------------------------------------- |
| `xxs` |    `2px` | One thing. Icon next to its own label, chips in a dense row.              |
| `xs`  |    `4px` | Tightly bound controls that read as one unit (a split button, a stepper). |
| `sm`  |    `8px` | Two controls that act together. Related controls in a toolbar.            |
| `md`  |   `16px` | Sibling fields in a form. Between grid columns, between cards.            |
| `lg`  |   `24px` | Between groups inside one section.                                        |
| `xl`  |   `32px` | Between sections of a page.                                               |
| `xxl` |   `48px` | A major break the eye should treat as a page boundary.                    |

Which of these a page's groups, regions and headline region take, and why
equal gaps make every region a peer, is on
[Information hierarchy](/principles/hierarchy#spacing-the-gap-states-the-relationship).
The same page says which region is first and widest
([Position](/principles/hierarchy#position-area-is-rank)).

Each gap reads its token (`gap: var(--nb-spacing-16)`), so a product that
retunes the spacing scale moves its grid gaps with its padding.

### Modes, hang and subgrid

`mode` gives a grid Carbon's gutters when it has no `gap`: `wide` 32px,
`narrow` 16px, `condensed` 1px. `hang` on a span keeps its box against the
gutter and insets its text to where a wide grid would put it. `subgrid` makes
a nested grid take its parent's gap, so its spans land on the parent's column
lines. `ratio` holds a span at an aspect ratio. All four are on the
[Grid code tab](/components/grid/code#modes).

Reach for `gap` before you reach for margins. A margin on each child is a
hardcoded value per element, and a gap is one token on the container.

## Responsive input forms

Every responsive prop takes three shapes, in increasing order of cost:

```vue
<!-- 1. Scalar: one value, all widths -->
<nb-grid gap="md">...</nb-grid>

<!-- 2. Breakpoint map: cascades upward from each named width -->
<nb-grid :gap="{ sm: 'sm', lg: 'md', xxl: 'lg' }">...</nb-grid>

<!-- 3. Function: re-evaluated reactively, for state and not for width -->
<nb-grid :dir="() => (compact ? 'col' : 'row')">...</nb-grid>
```

Use the function form for component state (a collapsed panel, a density
toggle) and the map form for width. Do not use the function form to read
`window.innerWidth`: it will not re-run on resize unless the value you read is
reactive, and you would be reimplementing a media query in JavaScript.

## Escape hatches on `NbGrid`

These are scalar-only and easy to misuse, so they are worth naming:

| Prop          | Effect                                        | When                                                                          |
| ------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| `grow`        | `flex: 1 1 0`                                 | One child should absorb the leftover space.                                   |
| `flex`        | `flex: 1`                                     | Same idea, legacy spelling. Prefer `grow` in new code.                        |
| `shrink`      | `flex-shrink: 1` or `0`                       | `:shrink="false"` protects a toolbar from being crushed.                      |
| `distributed` | `flex: 1` on every direct child               | Equal-width children without giving each one a `grid` span.                   |
| `is`          | Renders a different element (`section`, `ul`) | Always, when the region has a semantic element. A grid is a `div` by default. |

`is` matters for accessibility: a landmark, a list or a `nav` should not lose
its element just because it is also a layout container.

</doc-tab>

<doc-tab name="Choosing a tool">

`NbGrid` is not always the answer, and a hand-written layout is not always
wrong. Three tools, three jobs.

## Use `NbGrid` when

- The layout changes at a breakpoint. This is the strongest reason: the map
  form keeps the five widths in one place and out of your stylesheet.
- You are dividing a region into proportional columns (`grid` spans).
- You want a page frame outside the shell: `container` applies the max width
  and the page margin.
- You are inside a `.md` or `.vue` file where a style block would be awkward:
  documentation pages, a slot passed from a parent, a template-only component.
- You want the order props (`first`, `last`, `reverse`) per breakpoint.

## Use `NbCardGrid` when

- You have a collection of like things (cards, tiles, thumbnails) and the
  question is "how many fit", not "how much of the page does this take".
  `<nb-card-grid min="280px">` reflows from four across to one at every width,
  with no breakpoint, and clamps the minimum to the container so a phone or a
  narrow inspector never overflows. `ratio` holds every tile at one shape.
- You were about to write `repeat(auto-fit, minmax(...))` by hand. That is
  what `NbCardGrid` is, written once, with one minimum instead of a different
  one per view.

## Use plain flexbox in a style block when

- The layout is static: a row of two buttons, a label beside a value, a card
  with a header and a body. `NbGrid` costs you a wrapper element and a class
  string to express `display: flex; gap: 8px`.
- You need `flex` behaviour the props do not expose (`flex-basis` in pixels,
  `align-self`, `order` on a specific child, `gap` that reads a token).
- The element already exists and already has a class. Wrapping it in a grid to
  set one property is the wrapper-per-property habit that makes trees deep.

## Use CSS grid in a style block when

- The layout is genuinely two dimensional: a form of label and control pairs
  that must align across rows, a dashboard where cards span rows and columns.
  `NbGrid` is flexbox. It has no row tracks and cannot align across rows.
- You want intrinsic responsiveness with no breakpoint for something that is
  not a collection of cards (for a collection, use `NbCardGrid` above):

```vue
<style scoped lang="scss">
// Filter controls reflow from four across to one, at every width in
// between, with no media query and no invented breakpoint.
.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--nb-spacing-16);
}
</style>
```

- You need the layout to respond to its own container rather than the window.
  Inside the shell, that is usually the correct instinct: see the next tab.

## Do not

- Nest `NbGrid` more than about three deep. Each level is a real DOM element
  with `display: flex`, and deep nesting is how a "why is this 3px off" bug
  becomes a forty-minute bisect.
- Use a `grid` span to set a fixed pixel width. Spans are percentages. If you
  want 280px, write `width: 280px` or `flex: 0 0 280px`.
- Use `visible` to build two parallel implementations of the same UI, one for
  narrow and one for wide. Both render, both mount, both fetch, and one of them
  is invisible. Move the element instead of duplicating it.

</doc-tab>

<doc-tab name="Width and measure">

## Measure: the width of readable text

Line length is a legibility constraint, not a taste. Past roughly 75 characters
the eye loses the line return; below about 45 it breaks the rhythm. Set the cap
in `ch` so it tracks the font, and set it on the text element, not on its
container.

| Content                                      | Cap              | Why                                                                                   |
| -------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| Body prose, documentation, changelogs        | `65ch` to `75ch` | Long-form reading.                                                                    |
| Descriptions and helper text under a control | `60ch`           | Read once, in place, next to the thing they explain.                                  |
| Centred copy (empty states, dialogs)         | `44ch`           | Centred text is harder to track, so cap it earlier. This is what `NbEmptyState` uses. |
| Centred copy in a small container            | `36ch`           | `NbEmptyState` in its `sm` size.                                                      |
| Error and validation messages                | `60ch`           | Should not out-measure the field they belong to.                                      |

```vue
<style scoped lang="scss">
.release-notes p {
  max-width: 68ch;
}
</style>
```

Two things this is not. It is not a reason to cap a data table, a chart or a
code block: those are scanned, not read, and want the width. And it is not a
container width: cap the paragraph, and let the panel around it fill.

## Page and region widths

`--nb-grid-max-width` (1440px) is the maximum content width, and
`--nb-grid-gutter` is the page margin: 16px up to `xl`, phones included,
and 24px at `xxl`. `NbGrid`'s `container` prop applies both, centred. On a
full-bleed marketing or settings page outside the shell, put it on the content
wrapper, not on the page background, so the background still bleeds.

```vue
<template>
  <section class="hero">
    <nb-grid container dir="row" mode="wide" wrap="wrap">...</nb-grid>
  </section>
</template>
```

A full-bleed public surface may also breathe with the viewport through
`--nb-fluid-spacing-01` to `-04` (0, 2vw, 5vw, 10vw). Never inside the shell.

Inside the shell, a max width is usually the wrong instinct: the shell has
already constrained the content for you, and a second cap leaves a stripe of
dead space beside a sidebar and an inspector that are both already taking
width. Cap prose, not panels.

## What the components already cap

You rarely need to size these. They are listed so that you do not wrap one in a
width you think it needs, and so that you can predict the narrowest space a
piece of UI can survive in.

| Component              | Cap                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NbModal`              | `sm` 520px, `md` 720px, `lg` 960px, `xl` 1280px, `immersive` 1600px. Every size collapses toward full width on a narrow viewport and keeps its margin. |
| `NbCommandPalette`     | 640px                                                                                                                                                  |
| `NbToast`              | 380px                                                                                                                                                  |
| `NbNotificationCenter` | `100vw - 16px`, so it never overflows a phone                                                                                                          |
| `NbInfoHint`           | 272px                                                                                                                                                  |
| `NbEmptyState`         | copy capped at 44ch (36ch when `size="sm"`)                                                                                                            |

</doc-tab>

<doc-tab name="Inside the shell">

## The usable width is not the viewport

`NbShell` is a fixed frame: `height: 100vh`, `overflow: hidden`, a column
sidebar on the left, an optional inspector column on the right, and a `main`
region with `1.5rem var(--nb-shell-chrome-padding-x)` of padding (24px on
each side) that scrolls internally. That padding is the page margin inside the
shell, so do not add a `container` there.

Your content sees:

```
viewport - sidebar - inspector - 48px of main padding
```

| Viewport | Sidebar         | Inspector           | Content width | The grid class that is active |
| -------: | --------------- | ------------------- | ------------: | ----------------------------- |
|   1440px | compact (56px)  | closed              |      `1336px` | `xl`                          |
|   1440px | compact (56px)  | `md` (560px)        |       `776px` | `xl`                          |
|   1440px | verbose (240px) | `md` (560px)        |       `592px` | `xl`                          |
|   1280px | verbose (240px) | `md` (560px)        |       `432px` | `lg`                          |
|   1600px | compact (56px)  | `xl` (75vw, 1200px) |       `296px` | `xxl`                         |

Read the last row again. The window is at `xxl` and the content column is
296px, narrower than a phone. Every `NbGrid` breakpoint class in that column is
firing on the window's width, so a `:grid="{ xl: 4 }"` span resolves to 4 of 16
columns of 296px, which is 74px.

**The rule.** Inside the shell, do not let a viewport breakpoint decide
anything that lives in the content column. Decide it from the state you already
have (`inspectorVisible`, the sidebar variant, a density toggle) or let the
layout be intrinsic (`auto-fit` tracks, `flex-wrap`). Viewport breakpoints in
the shell are for the chrome itself, which really does track the window.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const inspectorVisible = ref(false)
const cards = ref([{ id: 'a', title: 'Throughput' }])
</script>

<template>
  <nb-shell :inspector-visible="inspectorVisible" inspector-size="sm">
    <!-- Correct: the column count follows the space that actually changed -->
    <nb-grid dir="row" wrap="wrap" gap="md">
      <nb-grid
        v-for="card in cards"
        :key="card.id"
        dir="col"
        :grid="() => (inspectorVisible ? 8 : 4)"
      >
        <nb-card :title="card.title" />
      </nb-grid>
    </nb-grid>
  </nb-shell>
</template>
```

## Fixed widths in the frame

| Region            | Width             | Token / class                        |
| ----------------- | ----------------- | ------------------------------------ |
| Sidebar, compact  | `56px`            | `--nb-shell-sidebar-width` (default) |
| Sidebar, verbose  | `240px`           | set by `.nb-shell--sidebar-verbose`  |
| Inspector `xs`    | `288px`           | `--nb-shell-inspector-width`         |
| Inspector `sm`    | `360px`           | `--nb-shell-inspector-width`         |
| Inspector `md`    | `560px` (default) | `--nb-shell-inspector-width`         |
| Inspector `lg`    | `50vw`            | `--nb-shell-inspector-width`         |
| Inspector `xl`    | `75vw`            | `--nb-shell-inspector-width`         |
| Topbar height     | `50px`            | `--nb-shell-topbar-height`           |
| Chrome padding, x | `24px`            | `--nb-shell-chrome-padding-x`        |
| Main padding      | `1.5rem` x `24px` | `--nb-shell-chrome-padding-x`        |

All the `--nb-shell-*` variables are declared on `:root`, so an application
overrides them in its own stylesheet without fighting scoped-style specificity.
That is the supported way to widen a rail; a `:deep()` selector aimed at shell
internals is not.

## The inspector is a width transition, not a layout switch

The inspector column is always in the DOM. Hidden, it is `width: 0` with a
transparent border; visible, it animates to `--nb-shell-inspector-width` over
200ms. Consequences worth planning for:

- **Content inside it renders while it is closed.** If the inspector holds an
  expensive tree or a chart, guard it with `v-if` on your own state rather than
  relying on the column being zero-width.
- **Opening it reflows the content column.** Anything in `main` that measured
  itself on mount (a canvas, a virtualised list, a chart) needs a
  `ResizeObserver`, not a resize listener on `window`. The window does not
  change size when the inspector opens.
- **The width animation respects `prefers-reduced-motion`.** Under `reduce`
  the column snaps open, with no transition to switch off in the application.

- **`resizable` clamps the drag between 288px and 50% of the viewport.** The
  chosen width comes back through `v-model:inspector-width`; persisting it is
  the application's job, and a double-click on the handle emits `null` to reset.
  Persist it per user, not per document, and re-clamp on restore: a width saved
  on a 2560px monitor is most of a laptop screen.

## Filling and scrolling

The shell is a bounded flex column all the way down, and every region sets
`min-height: 0`. Two rules follow.

**Never put a scrollbar on the page.** The shell already scrolls `main`
internally. A second scroller (`overflow: auto` on a wrapper inside `main`)
gives you two scrollbars and a header that scrolls away in one of them.

**To make something fill its column and scroll inside itself, use the prop
that exists.** `NbShellPanel` has `fill` (`flex: 1 1 auto; min-height: 0`, with
the scrollbar in its content region) and so does `NbDataTable`. Do not
re-declare that pair of properties on `.nb-shell-panel`. Like the table, `fill` claims a height,
it cannot create one: the ancestor must be a bounded flex column, which the
shell's inspector and `bottom` regions already are.

`NbShellPanel` sizing, for reference: `collapsed` is header-only and does not
grow, `default` shares the column equally with its siblings, `fluid` makes a
`default` panel take only the height its content needs, and `full` collapses
its siblings to headers. `fill` wins over `fluid` when both are set.

## Contributing controls to the chrome

A view that needs buttons in the shell's topbar must not invent a DOM id to
teleport into. Each id is its own contract, and two views mounting at once
race for it. This is a layout question because it is how a view gets
something into a region it does not own.

Use `useShellSlot`. The shell registers each region's host element, counts the
contributions, and renders the region on demand. The topbar's own presence is
decided from the slots, so a topbar with nothing in it does not render at all,
with no CSS from you to hide an empty strip.

</doc-tab>

<doc-tab name="Small screens">

## What the library does on a phone

`NbShell` collapses below `collapseAt` (`md` by default, `lg` or `none` to
change it), and also on a touch screen too short to be anything but a phone
held sideways. Collapsed, the sidebar becomes an overlay drawer opened from a
topbar toggle, the inspector becomes a sheet over the content with its own
dismiss control, the contextbar folds away, and `main` drops to `1rem` of
padding. The drawer closes after navigation, and focus follows both overlays.
None of it touches the desktop.

Every component caps its own width and degrades to full width rather than
overflowing, `NbModal` becomes a sheet, and fields and frame controls grow to
44px touch targets on a touch screen. Your own phone changes go through the
same signal: the `phone` and `phone-touch` mixins in SCSS, `usePhoneLayout()`
in script. Never a raw width.

## Making a shell usable narrow

What is left to the application, in this order, because each step buys the
most width for the least loss of function.

1. **Close the inspector below `lg`.** Above `collapseAt` it is still a column
   beside the content, and below 1056px there is not enough room for content
   and a 560px column. Drive `inspector-visible` from your own state.
2. **Keep the sidebar compact below `xl`.** The verbose variant costs 184px
   more. `sidebar-variant` is a prop, so this is one binding.
3. **Put page actions in `NbActionGroup` with `overflow="phone"`.** Do not hide
   them: an action that disappears below a width is an action the narrow user
   cannot perform.
4. **Let the content column go single-column.** Base (unprefixed) values in a
   `NbGrid` map are the narrow case, so `:grid="{ sm: 16, lg: 8 }"` is already
   single-column narrow with no extra work. For collections, `NbCardGrid` does
   it with no map at all.

## Touch and pointer

- **Hit targets.** Aim for 44px of touch target. Several controls in the
  library are visually smaller than that; pad the container rather than
  enlarging the control, so the visual density is unchanged.
- **Nothing important behind hover.** The sidebar's tooltips, hover-revealed
  row actions and hover-only affordances have no touch equivalent. If an action
  only appears on hover, it must also be reachable from a menu or a focused
  state.
- **Drag handles need an alternative.** The inspector resize handle takes
  pointer events, so it works with a pen or a finger, but for keyboard users
  the `inspectorSize` prop is the path. Do not make resizing the only way to
  see something.

## Accessibility of a responsive layout

- **Reflow, WCAG 1.4.10.** Content must be usable at 320px wide with no
  two-dimensional scrolling. That is what the `sm` value is: not a phone
  preset, the floor of support. Tables and charts are the allowed exception,
  and they should scroll horizontally inside their own container, never make
  the page scroll.
- **Zoom is a width change.** A user at 400% zoom on a 1280px display is
  browsing at an effective 320px. Every breakpoint decision you make is also a
  zoom decision, which is another reason to prefer intrinsic layouts.
- **Visual order is not focus order.** `first`, `last` and `reverse` set the
  CSS `order` property. They move the box, not the DOM node, so the tab order
  keeps following the source. Reordering that changes what the reading order
  should be is a bug: change the source order instead, and use the props only
  where the visual and logical orders still agree.
- **Hiding is not a layout tool.** `:visible="{ sm: false, lg: true }"`
  applies `display: none`, which removes the element from the accessibility
  tree at that width. That is correct for something decorative and wrong for
  anything a screen reader user needs. Move it, do not hide it.
- **Motion.** Any layout that animates on a width change should be inert under
  `prefers-reduced-motion: reduce`. The `useReducedMotion` composable reports
  it in script; a `@media (prefers-reduced-motion: reduce)` block handles it in
  CSS.
- **Landmarks survive the grid.** Use `is="nav"`, `is="section"` or `is="ul"`
  on an `NbGrid` that is one of those things. A layout wrapper should not cost
  you a landmark, and a list styled as a grid is still a list.

## Dark theme

Layout carries no colour, and nothing on this page introduces any. If your
responsive rule adds a border or a background at a breakpoint, it must read
from `--nb-c-*` tokens so it survives the `.dark` class, exactly as it would
outside a media query.

</doc-tab>
