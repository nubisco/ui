---
layout: nubisco
title: Badge
intro: '`NbBadge` is a compact label used to highlight status, category, or a short value. Its variants name what it means (neutral, info, success, warning, danger, primary), and each paints a measured pair. Two sizes and an optional dot.'
source: src/components/Badge.vue
tab: code
pageTabs: ['usage', 'code']
---

## Dot mode

Add `dot` to prepend a status indicator before the label.

<preview dir="row">
  <NbBadge variant="success" dot>active</NbBadge>
  <NbBadge variant="danger" dot>error</NbBadge>
  <NbBadge variant="warning" dot>pending</NbBadge>
  <NbBadge variant="neutral" dot>inactive</NbBadge>
</preview>

```vue
<template>
  <NbBadge variant="success" dot>active</NbBadge>
</template>
```

## Placeholder

`placeholder` stands in for a value that is not set yet: a dashed outline and quiet italic text instead of a fill. It is exactly as tall as a filled badge of the same size, so a row that holds either keeps its shape. Add `interactive` when pressing it sets the value: it becomes a real `<button type="button">` with hover and focus states. Name it with `aria-label` when its text does not say what pressing it does, which is always the case for an icon on its own.

<preview dir="row">
  <NbBadge size="sm" variant="success">Feature</NbBadge>
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

| Prop          | Type             | Default     | Description                                                                           |
| ------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------- |
| `variant`     | `NbBadgeVariant` | `'neutral'` | What the badge means. The colour names are deprecated aliases                         |
| `size`        | `NbBadgeSize`    | `'md'`      | Badge size (`'sm'` or `'md'`)                                                         |
| `dot`         | `boolean`        | `false`     | Show a status dot before label                                                        |
| `icon`        | `TIconSource`    | none        | A leading icon, sized to the badge                                                    |
| `placeholder` | `boolean`        | `false`     | A value not set yet: dashed outline, quiet italic text, same height as a filled badge |
| `interactive` | `boolean`        | `false`     | Render a `<button type="button">` with hover and focus states. Listen with `@click`   |

## Variant values

| Value     | Use case                        | Paints                                                |
| --------- | ------------------------------- | ----------------------------------------------------- |
| `neutral` | Default, archived, inactive     | `--nb-c-neutral-surface`, `--nb-c-on-neutral-surface` |
| `info`    | Informational, in progress      | `--nb-c-info-surface`, `--nb-c-on-info-surface`       |
| `success` | Done, active, published         | `--nb-c-success-surface`, `--nb-c-on-success-surface` |
| `warning` | Pending, due soon, suspended    | `--nb-c-warning-surface`, `--nb-c-on-warning-surface` |
| `danger`  | Error, overdue, blocked         | `--nb-c-danger-surface`, `--nb-c-on-danger-surface`   |
| `primary` | Not a status: a brand highlight | `--nb-c-primary`, `--nb-c-primary-a11y`               |

Deprecated aliases: `grey` (neutral), `blue` (info), `green` (success), `orange` (warning), `red` (danger), `purple` (primary). They render as the intent and warn once in development.

## Slots

| Slot      | Description      |
| --------- | ---------------- |
| `default` | Badge label text |

<!--@include: ./_shared.md-->
