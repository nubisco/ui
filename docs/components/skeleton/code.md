---
layout: nubisco
title: Skeleton
intro: '`NbSkeleton` stands in for content that is about to arrive, in the shape and at the size the real content will occupy. That last part is the whole component: a placeholder that is not the right height is worse than no placeholder, because the page settles twice, once when the skeleton appears and again when it is replaced.'
source: src/components/Skeleton.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Why the sizing rules matter

A text skeleton does not guess a height. The line box is
`font-size x line-height` read straight off a type set through the
`--nb-type-*` custom properties, so a `body-md` skeleton line is exactly as tall
as the `body-md` paragraph that replaces it. The grey bar inside is shorter than
the line box, the way ink is shorter than a line of text, which is why it reads
as text rather than as a wall.

That is also why `type` is a closed list. An unknown name would resolve to an
empty custom property, the line would collapse to zero height, and the page
would shift on load: exactly the bug this component prevents, made invisible by
a typo. An unrecognised value falls back to `body-md`.

The list is every type set that content arrives in: `label`, `label-sm/md/lg`,
`helper-text`, `overline`, `body-sm`, `body-compact`, `body-md/lg`,
`code-sm/md/lg`, `heading-compact` and `heading-01` through `heading-06`. The code
sets are there because monospaced blocks are the worst offenders: a JSON viewer
placeholder measured with `body-md` is a different height from the mono text
that lands in it. `display-01` and `display-02` are deliberately absent, since
hero type does not arrive asynchronously.

```vue
<template>
  <!-- Matches a heading-03 title, to the pixel -->
  <NbSkeleton variant="heading" type="heading-03" />
</template>
```

| Variant   | Sized by                            | Use for                             |
| --------- | ----------------------------------- | ----------------------------------- |
| `text`    | `type` (default `body-md`), `lines` | Paragraphs, cell values, list items |
| `heading` | `type` (default `heading-02`)       | Titles and section headers          |
| `block`   | `width` and `height` you pass       | Cards, images, charts, map panes    |
| `circle`  | One of `width` or `height`          | Avatars, round icon buttons         |
| `button`  | `size`, and `iconOnly`              | An `NbButton` that has not arrived  |

<preview dir="col">
  <NbSkeleton variant="heading" type="heading-03" />
  <NbSkeleton :lines="3" />
  <NbSkeleton variant="block" :height="120" />
  <NbSkeleton variant="circle" :width="40" />
</preview>

## Text and paragraphs

`lines` renders that many line boxes. From two lines up, the last one is
shortened to `lastLineWidth` (60% by default) so a paragraph does not read as a
solid rectangle. A single line keeps its full width, because one short line
reads as a truncated value rather than as flowing text.

<preview dir="col">
  <NbSkeleton :lines="1" />
  <NbSkeleton :lines="4" last-line-width="35%" />
</preview>

```vue
<template>
  <NbSkeleton :lines="4" last-line-width="35%" />
</template>
```

Match the line count to what usually arrives. Three lines standing in for one
line of text is its own layout shift, just in the other direction.

## Blocks and circles

`width` and `height` accept a number (pixels) or any CSS length, including a
token reference. Pass the measurement the real element already has rather than a
round number that looks about right.

```vue
<template>
  <!-- The chart canvas is 240px tall, so the placeholder is too -->
  <NbSkeleton variant="block" :height="240" radius="md" />

  <!-- The avatar is one field height, so the placeholder tracks the scale -->
  <NbSkeleton variant="circle" height="var(--nb-field-height-md)" />
</template>
```

A circle takes one measurement and applies it to both axes, so an avatar
placeholder cannot come out oval. `radius` is ignored for circles and otherwise
takes a step from the radius scale: `none`, `xs`, `sm` (default), `md`, `lg`,
`pill`.

## Buttons

`variant="button"` stands in for an [`NbButton`](/components/button/usage).
`size` takes the button's own scale, so the placeholder is exactly as tall as
the button that replaces it: 16, 24, 32, 40, 48, 64 and 80px from `xxs` to
`xxl`. The corners are the control radius every button has, whatever `radius`
says.

A labelled placeholder is 150px wide: the 16px a button keeps at its start and
the 64px it reserves at its end for the icon, around a 70px label, which is
about a two-word action. Pass `width` when the real label is known to be
longer, or `width="100%"` when the button fills a set. `iconOnly` makes it a
square at the height of `size`, the shape every icon-only button has, and
ignores `width`.

<preview dir="row" gap="md" wrap>
  <NbSkeleton variant="button" size="sm" />
  <NbSkeleton variant="button" size="md" />
  <NbSkeleton variant="button" size="lg" />
  <NbSkeleton variant="button" size="xl" />
  <NbSkeleton variant="button" size="sm" icon-only />
  <NbSkeleton variant="button" size="md" icon-only />
  <NbSkeleton variant="button" size="lg" icon-only />
</preview>

```vue
<template>
  <NbGrid gap="sm">
    <NbSkeleton variant="button" size="lg" label="Loading actions" />
    <NbSkeleton variant="button" size="lg" />
  </NbGrid>
</template>
```

xl and xxl are minimum heights on a real button, where a long label wraps to a
second line. The placeholder takes the one-line height, which is what every
short label has. Before reaching for a button skeleton, ask whether a
`disabled` button would do: a button whose label is already known can render
disabled while its data loads, and keeps its name and its place in the tab
order.

## Composing a loading region

Skeletons are laid out by you, in the same container as the real content, using
the same gaps. Reuse the real component's wrapper so the two states cannot
disagree.

<preview>
  <NbGrid gap="md" align="center" style="width: 100%">
    <NbSkeleton variant="circle" :width="40" />
    <NbGrid dir="col" gap="xs" grow>
      <NbSkeleton variant="heading" type="heading-01" width="45%" />
      <NbSkeleton :lines="2" />
    </NbGrid>
  </NbGrid>
</preview>

```vue
<template>
  <NbGrid gap="md" align="center">
    <NbSkeleton variant="circle" :width="40" label="Loading profile" />
    <NbGrid dir="col" gap="xs" grow>
      <NbSkeleton variant="heading" type="heading-01" width="45%" />
      <NbSkeleton :lines="2" />
    </NbGrid>
  </NbGrid>
</template>
```

Only one skeleton in the region carries a `label`. The rest are silent, so a
table of forty placeholders announces itself once rather than forty times.

## When the fetch fails

A skeleton is not an empty state and not an error state. Swap it for
[`NbEmptyState`](/components/empty-state/usage) when the response is legitimately
empty, and for a [message or banner](/components/banner/usage) when the request
failed. A single "no contacts yet" element for loading, empty and failed alike
makes a broken API read as a user with no data.

**If you set `completeLabel`, the failure path has one more line to write.**
The skeleton announces that message when it is unmounted, and a failed fetch
unmounts it just as surely as a successful one does, so without this a screen
reader user is told "Description loaded" at the exact moment the screen filled
with an error they cannot see. Say so where the failure is known:

```ts
import { suppressLoadingAnnouncement } from '@nubisco/ui'

try {
  description.value = await api.load()
} catch (reason) {
  // The skeleton is about to be replaced by a banner. Nothing completed.
  suppressLoadingAnnouncement()
  error.value = reason
} finally {
  loading.value = false
}
```

The call covers anything queued for the rest of the current task, so it holds
across the render that removes the skeleton, and then lifts by itself: the next
load is a new load and announces its own ending normally.

It has to be a call rather than a `:failed` prop, and the reason is a Vue
detail worth knowing. Props are not updated on the render that unmounts a
component, so a flag flipped in the same tick as `v-if="loading"` is never seen
by the teardown handler that does the announcing. The half of the code that
knows the load failed is the `catch`, so that is the half that speaks.

If the request is driven through
[`useInlineLoading`](/components/inline-loading/usage), this is already done for
you: its `run()` suppresses the announcement when the action rejects.

## Props

| Prop            | Type                                                                                                                                                                 | Default                                          | Description                                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`       | `'text' \| 'heading' \| 'block' \| 'circle' \| 'button'`                                                                                                             | `'text'`                                         | Shape family                                                                                                                                                                |
| `type`          | `'label'`, `'label-sm\|md\|lg'`, `'helper-text'`, `'overline'`, `'body-sm\|compact\|md\|lg'`, `'code-sm\|md\|lg'`, `'heading-compact'`, `'heading-01'..'heading-06'` | `'body-md'` for text, `'heading-02'` for heading | Type set the line height is taken from                                                                                                                                      |
| `lines`         | `number`                                                                                                                                                             | `1`                                              | Number of text lines. Text variant only                                                                                                                                     |
| `lastLineWidth` | `string`                                                                                                                                                             | `'60%'`                                          | Width of the last line when there is more than one                                                                                                                          |
| `width`         | `string \| number`                                                                                                                                                   | `undefined`                                      | Width. A number is pixels. Unset means the CSS default, which is `width: 100%`                                                                                              |
| `height`        | `string \| number`                                                                                                                                                   | `undefined`                                      | Height for block and circle. A number is pixels. Unset means `--nb-skeleton-height`, which is `calc(var(--nb-base-unit) * 8)`. Text sizes itself from `type` and ignores it |
| `size`          | `'xxs' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl'`                                                                                                             | `'md'`                                           | Button variant only. The `NbButton` size it stands in for, which sets the height                                                                                            |
| `iconOnly`      | `boolean`                                                                                                                                                            | `false`                                          | Button variant only. A square at the height of `size`, for an icon-only button                                                                                              |
| `radius`        | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'pill'`                                                                                                                   | `'sm'`                                           | Corner radius step. Ignored by `circle`                                                                                                                                     |
| `animated`      | `boolean`                                                                                                                                                            | `true`                                           | Turns the shimmer off when `false`                                                                                                                                          |
| `label`         | `string`                                                                                                                                                             | `undefined`                                      | Announcement. Set it on one skeleton per region                                                                                                                             |
| `completeLabel` | `string`                                                                                                                                                             | `undefined`                                      | Announced once when the skeleton unmounts and content lands                                                                                                                 |
| `id`            | `string`                                                                                                                                                             | auto                                             | Explicit DOM id, otherwise generated by `useStableId`                                                                                                                       |

## Events

None.

## Tokens

| Token                     | Used for                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `--nb-type-*-size`        | Font size of a text or heading line. With `--nb-type-*-line-height` it gives the line box its height |
| `--nb-type-*-line-height` | Line box height multiplier, so the swap does not shift                                               |
| `--nb-c-discrete`         | Placeholder fill, in both themes                                                                     |
| `--nb-c-surface`          | The shimmer highlight, mixed into the fill                                                           |
| `--nb-radius-*`           | Corner radius steps                                                                                  |
| `--nb-radius-control`     | The button variant's corners, the same radius a real button has                                      |
| `--nb-base-unit`          | Gap between lines, and the button variant's height and width                                         |

Width does not come from a token: it is the `width` prop (and `lastLineWidth`
for the final line of a paragraph), defaulting to `100%` of whatever the
skeleton is placed in. The type tokens control the vertical axis only, which is
the axis that causes layout shift.

Under `forced-colors: active` the fill leaves the token system entirely and
paints from `Canvas` / `CanvasText`, because a discarded background is
indistinguishable from no content at all.

<!--@include: ./_shared.md-->
