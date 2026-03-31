---
layout: nubisco
title: Badge
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbBadge` is a compact label used to highlight status, category, or a short value. It supports multiple color variants, two sizes, and an optional dot indicator.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbBadge v-bind="resultingProps">badge</NbBadge>
</preview>

```vue
<template>
  <NbBadge variant="blue">badge</NbBadge>
</template>
```

## Variants

Use `variant` to communicate meaning through color.

<preview dir="row">
  <NbBadge variant="grey">grey</NbBadge>
  <NbBadge variant="blue">blue</NbBadge>
  <NbBadge variant="green">green</NbBadge>
  <NbBadge variant="orange">orange</NbBadge>
  <NbBadge variant="red">red</NbBadge>
  <NbBadge variant="purple">purple</NbBadge>
  <NbBadge variant="primary">primary</NbBadge>
</preview>

## Sizes

<preview dir="row">
  <NbBadge size="md">medium</NbBadge>
  <NbBadge size="sm">small</NbBadge>
</preview>

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

</doc-tab>

<doc-tab name="Api">

## Props

| Prop      | Type             | Default  | Description                    |
| --------- | ---------------- | -------- | ------------------------------ |
| `variant` | `NbBadgeVariant` | `'grey'` | Color variant                  |
| `size`    | `NbBadgeSize`    | `'md'`   | Badge size (`'sm'` or `'md'`)  |
| `dot`     | `boolean`        | `false`  | Show a status dot before label |

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

</doc-tab>

<script setup lang="ts">
import { EBadgeVariant, EBadgeSize } from '../../../src/components/Badge.d'

const availableProps = [
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    options: [
      { value: EBadgeVariant.Grey, label: 'grey' },
      { value: EBadgeVariant.Blue, label: 'blue' },
      { value: EBadgeVariant.Orange, label: 'orange' },
      { value: EBadgeVariant.Green, label: 'green' },
      { value: EBadgeVariant.Red, label: 'red' },
      { value: EBadgeVariant.Purple, label: 'purple' },
      { value: EBadgeVariant.Primary, label: 'primary' },
    ],
    placeholder: 'The variant of the component',
    default: EBadgeVariant.Grey,
  },
  {
    label: 'Size',
    name: 'size',
    type: 'single',
    options: [
      { value: EBadgeSize.Small, label: 'Small' },
      { value: EBadgeSize.Medium, label: 'Medium' },
    ],
    placeholder: 'The size of the component',
    default: EBadgeSize.Medium,
  },
  {
    label: 'Dot',
    name: 'dot',
    type: 'boolean',
    placeholder: 'Render the dot',
    default: false,
  },
]
</script>
