---
layout: nubisco
title: Spinner
intro: '`NbSpinner` says one thing: work is happening and we cannot say how much is left. It carries no measurement, so if you can count bytes, files or records, you are holding the wrong component.'
source: src/components/Spinner.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbSpinner v-bind="resultingProps" />
</preview>

```vue
<template>
  <NbSpinner label="Loading invoices" />
</template>
```

## Which loading component

| Situation                                                              | Use                                                            |
| ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| You know the total (files, bytes, steps)                               | [`NbProgressBar`](/components/progress-bar/usage) with `value` |
| You know nothing but the operation blocks a region or the page         | `NbSpinner`                                                    |
| A named action is running and its result must be confirmed             | [`NbInlineLoading`](/components/inline-loading/usage)          |
| A page or list is filling in for the first time and the shape is known | [`NbSkeleton`](/components/skeleton/usage)                     |

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
[`NbSkeleton`](/components/skeleton/usage) shaped like what is coming. Do not
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
[`NbInlineLoading`](/components/inline-loading/usage), because the load is only
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

## Do and don't

- **Do** name what is loading. `label="Loading invoices"` beats `"Loading"`,
  which is what a screen reader user hears from every spinner on the fleet.
- **Do** use `showLabel` on overlays. A scrim with an unlabelled ring gives a
  sighted user no more information than a frozen screen does.
- **Don't** put a spinner where the content shape is already known. A list that
  is about to render twenty rows should render twenty
  [`NbSkeleton`](/components/skeleton/usage) rows.
- **Don't** confirm success with a spinner disappearing. Silence is not
  confirmation. Use [`NbInlineLoading`](/components/inline-loading/usage).
- **Don't** stack two spinners for one operation. If an ancestor already
  announces the load, mark the inner one `decorative`.

<!--@include: ./_shared.md-->
