---
layout: nubisco
title: Badge
intro: '`NbBadge` is a compact label used to highlight status, category, or a short value. It supports multiple color variants, two sizes, and an optional dot indicator.'
source: src/components/Badge.vue
tab: code
pageTabs: ['usage', 'code']
---

## Dot mode

Add `dot` to prepend a status indicator before the label.

<preview dir="row">
  <NbBadge variant="green" dot>active</NbBadge>
  <NbBadge variant="red" dot>error</NbBadge>
  <NbBadge variant="orange" dot>pending</NbBadge>
  <NbBadge variant="grey" dot>inactive</NbBadge>
</preview>

```vue
<template>
  <NbBadge variant="green" dot>active</NbBadge>
</template>
```

## Placeholder

`placeholder` stands in for a value that is not set yet: a dashed outline and quiet italic text instead of a fill. It is exactly as tall as a filled badge of the same size, so a row that holds either keeps its shape. Add `interactive` when pressing it sets the value: it becomes a real `<button type="button">` with hover and focus states. Name it with `aria-label` when its text does not say what pressing it does, which is always the case for an icon on its own.

<preview dir="row">
  <NbBadge size="sm" variant="green">Feature</NbBadge>
  <NbBadge size="sm" placeholder>No labels</NbBadge>
  <NbBadge size="sm" placeholder interactive icon="tag">No labels</NbBadge>
  <NbBadge size="sm" placeholder interactive icon="calendar-blank" aria-label="Set a due date" />
</preview>

```vue
<template>
  <NbBadge size="sm" placeholder interactive icon="tag" @click="pickLabels">
    No labels
  </NbBadge>
</template>
```

## Props

| Prop          | Type             | Default  | Description                                                                           |
| ------------- | ---------------- | -------- | ------------------------------------------------------------------------------------- |
| `variant`     | `NbBadgeVariant` | `'grey'` | Color variant                                                                         |
| `size`        | `NbBadgeSize`    | `'md'`   | Badge size (`'sm'` or `'md'`)                                                         |
| `dot`         | `boolean`        | `false`  | Show a status dot before label                                                        |
| `icon`        | `TIconSource`    | none     | A leading icon, sized to the badge                                                    |
| `placeholder` | `boolean`        | `false`  | A value not set yet: dashed outline, quiet italic text, same height as a filled badge |
| `interactive` | `boolean`        | `false`  | Render a `<button type="button">` with hover and focus states. Listen with `@click`   |

## Variant values

| Value     | Use case            |
| --------- | ------------------- |
| `grey`    | Neutral / default   |
| `blue`    | Informational       |
| `green`   | Success / active    |
| `orange`  | Warning / pending   |
| `red`     | Error / danger      |
| `purple`  | Special / highlight |
| `primary` | Brand accent        |

## Slots

| Slot      | Description      |
| --------- | ---------------- |
| `default` | Badge label text |

<!--@include: ./_shared.md-->
