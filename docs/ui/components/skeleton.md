---
layout: nubisco
title: Skeleton
tabs: ['Usage', 'Accessibility', 'Api']
---

<doc-tab name="Usage">

`NbSkeleton` stands in for content that is about to arrive, in the shape and at
the size the real content will occupy. That last part is the whole component: a
placeholder that is not the right height is worse than no placeholder, because
the page settles twice, once when the skeleton appears and again when it is
replaced.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbSkeleton v-bind="resultingProps" />
</preview>

```vue
<template>
  <NbSkeleton v-if="loading" :lines="3" label="Loading description" />
  <p v-else>{{ description }}</p>
</template>
```

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

The list is every type set that content arrives in: `label-sm/md/lg`,
`body-sm/md/lg`, `code-sm/md/lg` and `heading-01` through `heading-06`. The code
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

## When not to use one

- **The shape is unknown.** A skeleton is a promise about the layout. If the
  response might be empty, or a table might have any number of columns, use
  [`NbSpinner`](/ui/components/spinner) and do not promise.
- **A control that could simply be disabled.** A form waiting for its values is
  a form with disabled fields, not a stack of grey slabs. `NbTextInput`,
  `NbSelect` and `NbButton` all carry `disabled`, and a disabled control keeps
  its label, its help text and its place in the tab order, all of which a
  placeholder throws away. See
  [Disabled and read-only](/patterns/disabled-and-read-only).
- **A load with a measurable total.** That is
  [`NbProgressBar`](/ui/components/progress-bar), which can say how far along it
  is. A skeleton says nothing about time.
- **A refresh of content already on screen.** Replacing rendered rows with grey
  bars destroys what the user was reading. Leave the rows and put a
  [`NbSpinner`](/ui/components/spinner) with `overlay="container"` over them.
- **Loads that finish instantly.** A skeleton that flashes is a flicker. Gate it
  behind the same delay you would give a spinner.

## When the fetch fails

A skeleton is not an empty state and not an error state. Swap it for
[`NbEmptyState`](/ui/components/empty-state) when the response is legitimately
empty, and for a [message or banner](/ui/components/banner) when the request
failed. One product in the audit renders a single "no contacts yet" element for
loading, empty and failed alike, so a broken API reads as a user with no data.

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
[`useInlineLoading`](/ui/components/inline-loading), this is already done for
you: its `run()` suppresses the announcement when the action rejects.

</doc-tab>

<doc-tab name="Accessibility">

## Accessibility

- With no `label`, the whole component is `aria-hidden="true"`. Placeholders are
  decorative: their content is fake, and reading it out would be noise.
- With a `label`, the root becomes `role="status"` with `aria-live="polite"` and
  the label is rendered as visually hidden text (clipped, so it stays in the
  accessibility tree). Put it on exactly one skeleton per region.
- **The region is mounted empty and the label is written on the next task.** A
  live region inserted and filled in the same frame has no previous contents to
  be diffed against, and the update is frequently never reported. Going in blank
  and filling a task later makes it a change to a region that was already being
  watched. [`NbSpinner`](/ui/components/spinner) does the same thing for the
  same reason.
- `aria-busy="true"` sits on the shapes, not on the live region. On a live
  region, `aria-busy` means "withhold every update until I clear it", and a
  skeleton is unmounted rather than flipped back to `busy="false"`, so that
  promise is never kept and the `label` you set would never be spoken. If you
  want the busy state on the surrounding region as well, put `aria-busy` on the
  container the skeletons stand in and clear it when the content lands:

  ```vue
  <template>
    <section :aria-busy="loading">
      <NbSkeleton v-if="loading" :lines="3" label="Loading description" />
      <p v-else>{{ description }}</p>
    </section>
  </template>
  ```

- **Announce the arrival, not only the wait.** The skeleton is unmounted at the
  exact moment the content appears, taking its own live region with it, so the
  end of the load is silent unless something else speaks. `completeLabel` hands
  the message to a shared live region that stays in the document, so it is
  still there to be read after this component is gone:

  ```vue
  <template>
    <NbSkeleton
      v-if="loading"
      :lines="3"
      label="Loading description"
      complete-label="Description loaded"
    />
    <p v-else>{{ description }}</p>
  </template>
  ```

  Same rule as `label`: one skeleton per region carries it, or a table of forty
  placeholders announces itself forty times over. If the load ends by moving
  focus into the content that arrived, that move is the announcement and
  `completeLabel` would repeat it. Choose one. What you must not do is choose
  neither, which is what every hand-rolled placeholder in the fleet does today.

- **The message is fired on any unmount, including a failed one.** The component
  cannot tell the two apart: Vue does not update props on the render that
  removes a component, so a flag set in the same tick as the failure never
  reaches the teardown handler. Call `suppressLoadingAnnouncement()` in your
  `catch`, or drive the request through
  [`useInlineLoading`](/ui/components/inline-loading), which does it for you.
  The Usage tab spells out the pattern under "when the fetch fails". Without it,
  a failure announces itself as an arrival, which is worse than saying nothing.
- Because the skeleton reserves the real geometry, the focus ring and the
  scroll position do not move when content lands, which is an accessibility
  outcome and not only a visual one: a shifting page loses low-vision users
  their place and moves click targets under the pointer.
- Skeletons hold no focus and take no tab stop. Do not put one inside a control
  that can be focused while it is loading.
- **Reduced motion**: under `prefers-reduced-motion: reduce` the travelling
  highlight is dropped and the bar fades slowly in place instead. Nothing
  translates, and the placeholder is still visibly loading rather than looking
  like broken layout. `animated: false` stays genuinely still in both cases.
  The preference is honoured twice, by the media query and by a
  `nb-skeleton--reduced-motion` class read from `matchMedia`, so flipping the
  OS setting with the page already open takes effect without a reload.
- **Windows high contrast**: forced colours discard every author background,
  which would turn the fill into a blank rectangle on a blank page and make the
  region read as empty rather than as loading. Under `forced-colors: active` the
  fill opts out with `forced-color-adjust` and repaints from the system
  palette: text and heading bars in `CanvasText`, blocks and circles outlined so
  they stay visible against either scheme.
- The placeholder colour (`--nb-c-discrete`) is a surface, not text, and carries
  no information that colour alone must convey.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop            | Type                                                                                         | Default                                          | Description                                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`       | `'text' \| 'heading' \| 'block' \| 'circle'`                                                 | `'text'`                                         | Shape family                                                                                                                                                                |
| `type`          | `'label-sm\|md\|lg'`, `'body-sm\|md\|lg'`, `'code-sm\|md\|lg'`, `'heading-01'..'heading-06'` | `'body-md'` for text, `'heading-02'` for heading | Type set the line height is taken from                                                                                                                                      |
| `lines`         | `number`                                                                                     | `1`                                              | Number of text lines. Text variant only                                                                                                                                     |
| `lastLineWidth` | `string`                                                                                     | `'60%'`                                          | Width of the last line when there is more than one                                                                                                                          |
| `width`         | `string \| number`                                                                           | `undefined`                                      | Width. A number is pixels. Unset means the CSS default, which is `width: 100%`                                                                                              |
| `height`        | `string \| number`                                                                           | `undefined`                                      | Height for block and circle. A number is pixels. Unset means `--nb-skeleton-height`, which is `calc(var(--nb-base-unit) * 8)`. Text sizes itself from `type` and ignores it |
| `radius`        | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'pill'`                                           | `'sm'`                                           | Corner radius step. Ignored by `circle`                                                                                                                                     |
| `animated`      | `boolean`                                                                                    | `true`                                           | Turns the shimmer off when `false`                                                                                                                                          |
| `label`         | `string`                                                                                     | `undefined`                                      | Announcement. Set it on one skeleton per region                                                                                                                             |
| `completeLabel` | `string`                                                                                     | `undefined`                                      | Announced once when the skeleton unmounts and content lands                                                                                                                 |
| `id`            | `string`                                                                                     | auto                                             | Explicit DOM id, otherwise generated by `useStableId`                                                                                                                       |

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
| `--nb-base-unit`          | Gap between lines                                                                                    |

Width does not come from a token: it is the `width` prop (and `lastLineWidth`
for the final line of a paragraph), defaulting to `100%` of whatever the
skeleton is placed in. The type tokens control the vertical axis only, which is
the axis that causes layout shift.

Under `forced-colors: active` the fill leaves the token system entirely and
paints from `Canvas` / `CanvasText`, because a discarded background is
indistinguishable from no content at all.

</doc-tab>

<script setup lang="ts">
const availableProps = [
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    default: 'text',
    options: [
      { value: 'text', label: 'text' },
      { value: 'heading', label: 'heading' },
      { value: 'block', label: 'block' },
      { value: 'circle', label: 'circle' },
    ],
  },
  {
    label: 'Lines',
    name: 'lines',
    type: 'number',
    default: 3,
    min: 1,
    max: 8,
    step: 1,
  },
  {
    label: 'Animated',
    name: 'animated',
    type: 'boolean',
    default: true,
  },
]
</script>
