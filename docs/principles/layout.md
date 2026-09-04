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

An audit of twelve applications built on this library found five of them
carrying hand-written breakpoint sets: 14 values in one, then 5, 2, 2 and 1.
No two of those five apps shared a single value. Twenty-four distinct widths
across a fleet that ships one design system, and none of them were 320, 672,
1056, 1312 or 1584.

That is not twelve teams disagreeing about design. It is a discovery failure.
The scale was only ever written down on the `NbGrid` component page, so you
could only find it after you had already decided to use `NbGrid`. Everyone who
reached for a plain `@media` query invented a number instead.

This page is the answer to "what width do I write". It is authoritative for
the whole library, not only for the grid.

## The three facts that decide most layout questions

**1. The scale lives in SCSS, not in the component.**
`src/styles/variables/_breakpoints.scss` declares `$bp-sm` through `$bp-xxl`
and an `mq()` mixin. `NbGrid` compiles the same map into class prefixes. Both
read the same source, so a hand-written media query and a `NbGrid` responsive
map switch on the same pixel.

**2. The library ships no viewport media queries of its own.**
Outside of the generated grid classes, every `@media` rule in `src/` is a
`prefers-reduced-motion` block. No component reflows itself at a viewport
width. Components cap their own size instead (`NbModal` at 520 to 1600px,
`NbCommandPalette` at 640px, `NbToast` at 380px), which is why they behave
identically in a 1440px window and in a 424px sliver of one. Responsive
behaviour is a decision the application makes, and this page is where the
values for it come from.

**3. Inside `NbShell`, the viewport is not the layout width.**
The shell subtracts a sidebar (56px or 240px), an inspector (288px up to 75vw)
and 56px of main padding before your content sees a single pixel. A viewport
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

Steps 1 and 2 cover more real cases than teams expect. Of the twenty-four
invented breakpoints in the audit, most were guarding a card row that a single
`auto-fit` track would have handled at every width including the ones nobody
tested.

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

## Known trap: `dir` cannot go back to `row` in a map

`NbGrid` treats `row` as the grid default and skips emitting a class for it at
a breakpoint, so `:dir="{ sm: 'col', md: 'row' }"` produces only `sm-col`. The
element stays a column above 672px. The CSS class it would need
(`.nb-grid.md-row`, inside the 672px query) is generated and present in the
stylesheet, the component just never puts it on the element.

Until that is fixed in the component, write the direction the other way round,
which needs no reversal:

```vue
<!-- Correct: column is the base, row is added at md -->
<nb-grid dir="col" class="md-row">...</nb-grid>
```

The base `dir="col"` gives the column everywhere, and the hand-written
`md-row` class flips it at 672px using the library's own generated rule. Do not
work around this with an inline `@media` and a fresh pixel value.

## Rules

- **Never invent a width.** Twenty-four invented values across five apps is
  what this page exists to stop. If none of the five fit, the layout is telling
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

| Setting                                     | Value    | Token                 |
| ------------------------------------------- | -------- | --------------------- |
| Columns                                     | `16`     | `--nb-grid-columns`   |
| Gutter                                      | `16px`   | `--nb-grid-gutter`    |
| Max content width                           | `1440px` | `--nb-grid-max-width` |
| Base unit (everything else derives from it) | `8px`    | `--nb-base-unit`      |

Sixteen divides cleanly by 2, 4 and 8, so halves, thirds (5 + 6 + 5), quarters
and the 11/5 split above are all expressible without fractional columns.

`grid` accepts 1 to 16 and sets `flex-basis`, `max-width` and `min-width` to
`calc(100% * n / 16)`. `shift` accepts 1 to 15 and sets a matching
`margin-left`. Note the asymmetry: there is no `.shift-0` rule, so passing
`:shift="0"` puts a class on the element that no stylesheet defines. To remove
a shift at a wider breakpoint, do not pass `shift` at the narrow one.

**Percentages, not pixels.** A `grid` span is a percentage of its parent, so a
`grid="8"` inside a 424px shell column is 212px, not half of your monitor. This
is the behaviour you want, and it is also the reason viewport breakpoints and
column spans can disagree. See the **Inside the shell** tab.

## Gutters and gaps

The grid does not apply a gutter for you. `--nb-grid-gutter` is a published
token (16px) that nothing in the library consumes: gaps come from the `gap`
prop, and a grid with no `gap` has none.

| `gap` | Computed | Use it for                                                                |
| ----- | -------: | ------------------------------------------------------------------------- |
| `xxs` |    `2px` | Hairline separation. Icon next to its own label, chips in a dense row.    |
| `xs`  |    `4px` | Tightly bound controls that read as one unit (a split button, a stepper). |
| `sm`  |    `8px` | Related controls in a toolbar. Fields in one row of a form.               |
| `md`  |   `16px` | The default gutter. Between grid columns, between cards.                  |
| `lg`  |   `24px` | Between sections of a page.                                               |
| `xl`  |   `32px` | Between major regions that should read as separate.                       |
| `xxl` |   `48px` | Around a lone, centred thing: an empty state, a sign-in card.             |

Gap values are compiled pixels (`gap: 16px`), not `var()` references, so
overriding `--nb-spacing-16` in your app does not move them. Where you need a
gap that tracks a token, set `gap` in your own style block instead of using the
prop.

Reach for `gap` before you reach for margins. Two apps in the audit accumulated
462 and 287 hardcoded pixel values respectively, against zero spacing tokens;
a large share of those were margins doing a gap's job.

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

`NbGrid` is not always the answer, and the audit's hand-rolled layouts were not
all wrong. Three tools, three jobs.

## Use `NbGrid` when

- The layout changes at a breakpoint. This is the strongest reason: the map
  form keeps the five widths in one place and out of your stylesheet.
- You are dividing a region into proportional columns (`grid` spans).
- You are inside a `.md` or `.vue` file where a style block would be awkward:
  documentation pages, a slot passed from a parent, a template-only component.
- You want the order props (`first`, `last`, `reverse`) per breakpoint.

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
- You want intrinsic responsiveness with no breakpoint at all. This is the
  single most useful pattern on this page:

```vue
<style scoped lang="scss">
// Cards reflow from four across to one, at every width in between,
// with no media query and no invented breakpoint.
.card-wall {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

`--nb-grid-max-width` (1440px) is published as the maximum content width.
Nothing in the library applies it, which means it is yours to apply and yours
to override. On a full-bleed marketing or settings page, apply it to the
content wrapper, not to the page background, so the background still bleeds.

```vue
<style scoped lang="scss">
.page-content {
  width: 100%;
  max-width: var(--nb-grid-max-width);
  margin-inline: auto;
}
</style>
```

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
region with `1.5rem 1.75rem` of padding that scrolls internally.

Your content sees:

```
viewport - sidebar - inspector - 56px of main padding
```

| Viewport | Sidebar         | Inspector           | Content width | The grid class that is active |
| -------: | --------------- | ------------------- | ------------: | ----------------------------- |
|   1440px | compact (56px)  | closed              |      `1328px` | `xl`                          |
|   1440px | compact (56px)  | `md` (560px)        |       `768px` | `xl`                          |
|   1440px | verbose (240px) | `md` (560px)        |       `584px` | `xl`                          |
|   1280px | verbose (240px) | `md` (560px)        |       `424px` | `md`                          |
|   1600px | compact (56px)  | `xl` (75vw, 1200px) |       `288px` | `xxl`                         |

Read the last row again. The window is at `xxl` and the content column is
288px, narrower than a phone. Every `NbGrid` breakpoint class in that column is
firing on the window's width, so a `:grid="{ xl: 4 }"` span resolves to 4 of 16
columns of 288px, which is 72px.

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
| Main padding      | `1.5rem 1.75rem`  | fixed in `NbShell`                   |

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
- **The width animation does not currently check `prefers-reduced-motion`.**
  Until it does, an application that needs it can turn the animation off from
  its own stylesheet:

```css
@media (prefers-reduced-motion: reduce) {
  .nb-shell__inspector {
    transition: none;
  }
}
```

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
the scrollbar in its content region) and so does `NbDataTable`. Two apps in the
audit re-declared exactly that pair of properties on `.nb-shell-panel` across
six stylesheets before the prop existed. Like the table, `fill` claims a height,
it cannot create one: the ancestor must be a bounded flex column, which the
shell's inspector and `bottom` regions already are.

`NbShellPanel` sizing, for reference: `collapsed` is header-only and does not
grow, `default` shares the column equally with its siblings, `fluid` makes a
`default` panel take only the height its content needs, and `full` collapses
its siblings to headers. `fill` wins over `fluid` when both are set.

## Contributing controls to the chrome

Eight of the twelve audited applications invented a DOM id (`#cms-topbar`,
`#verba-topbar`, `#ob-topbar-left` and five more) so that a view could put
buttons in the shell's topbar. Eight incompatible contracts and one live
mount-order bug. This is a layout question because it is how a view gets
something into a region it does not own.

Use `useShellSlot`. The shell registers each region's host element, counts the
contributions, and renders the region on demand. The topbar's own presence is
decided from the slots, so a topbar with nothing in it does not render at all,
which is what four applications were fighting from the outside.

</doc-tab>

<doc-tab name="Small screens">

## What the library does and does not do

Be honest about the starting point: `NbShell` is a desktop frame. It is
`100vh`, its sidebar is always present, and its inspector is a column beside
the content rather than an overlay. There is no mobile variant of the shell and
no automatic collapse. Everything below is what an application has to decide.

What the library does give you for free: every component caps its own width and
degrades to full width rather than overflowing, `NbNotificationCenter` is
capped at `100vw - 16px`, and `NbModal`'s tallest size also caps against
`100dvh` so a mobile address bar cannot overhang it.

## Making a shell usable narrow

Work down the frame, in this order, because each step buys the most width for
the least loss of function.

1. **Close the inspector below `lg`.** It is the widest thing on screen. Drive
   `inspector-visible` from your own state and reopen it as an overlay if the
   content demands it. Below 1056px there is not enough room for content and a
   560px column.
2. **Keep the sidebar compact below `xl`.** The verbose variant costs 184px
   more. `sidebar-variant` is a prop, so this is one binding.
3. **Collapse the topbar's secondary actions into a menu.** Do this by moving
   controls into `NbMenu`, not by hiding them: an action that disappears below
   a width is an action the narrow user cannot perform.
4. **Let the content column go single-column.** Base (unprefixed) values in a
   `NbGrid` map are the narrow case, so `:grid="{ sm: 16, lg: 8 }"` is already
   single-column narrow with no extra work.

## Touch and pointer

- **Hit targets.** Aim for 44px of touch target. Several controls in the
  library are visually smaller than that; pad the container rather than
  enlarging the control, so the visual density is unchanged.
- **Nothing important behind hover.** The sidebar's tooltips, hover-revealed
  row actions and hover-only affordances have no touch equivalent. If an action
  only appears on hover, it must also be reachable from a menu or a focused
  state.
- **Drag handles need an alternative.** The inspector resize handle is
  mouse-driven (`mousedown` / `mousemove`). On touch, and for keyboard users,
  the `inspectorSize` prop is the path; do not make resizing the only way to
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
