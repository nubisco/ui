---
layout: nubisco
title: Pie Chart
intro: '`NbPieChart` shows the relative size of a small set of categories that sum to a meaningful whole. For more than ~6 segments, prefer `NbBarChart`, pies become hard to read with too many slices.'
source: src/components/Charts/PieChart.vue
tab: code
pageTabs: ['usage', 'code']
---

## Donut mode

Set `inner-radius` to a value between `0` and `1` to render a donut. The slice labels move into the ring instead of being centred.

<preview>
  <NbPieChart
    height="280"
    title="Browser share"
    :data="browserData"
    :inner-radius="0.55"
  />
</preview>

```vue
<template>
  <NbPieChart :data="data" :inner-radius="0.55" />
</template>
```

## Custom colors per slice

Supply a `color` on individual data items to override the palette per slice, useful for status palettes.

<preview>
  <NbPieChart
    height="240"
    title="Build status across services"
    :data="statusData"
  />
</preview>

```vue
<template>
  <NbPieChart :data="data" />
</template>

<script setup lang="ts">
const data = [
  { label: 'Passing', value: 142, color: 'var(--nb-c-success)' },
  { label: 'Warning', value: 23, color: 'var(--nb-c-warning)' },
  { label: 'Failing', value: 6, color: 'var(--nb-c-danger)' },
]
</script>
```

## Props

| Prop          | Type                             | Default         | Description                                      |
| ------------- | -------------------------------- | --------------- | ------------------------------------------------ |
| `data`        | `ICategoricalDatum[]`            | `[]`            | Slice values and labels                          |
| `title`       | `string`                         | -               | Chart title                                      |
| `subtitle`    | `string`                         | -               | Secondary descriptive line                       |
| `height`      | `number \| string`               | `280`           | Container height                                 |
| `innerRadius` | `number`                         | `0`             | Ring radius ratio (0 to 1) for donut mode        |
| `labels`      | `'none' \| 'percent' \| 'value'` | `'percent'`     | Label rendering style on each slice              |
| `showLegend`  | `boolean`                        | `true`          | Render a legend below the chart                  |
| `showTooltip` | `boolean`                        | `true`          | Show hover tooltip                               |
| `colors`      | `string[]`                       | default palette | Per-slice colors (overridden by per-datum color) |

## Events

| Event    | Payload                      | Description                              |
| -------- | ---------------------------- | ---------------------------------------- |
| `select` | `IChartCategoricalSelection` | A slice was clicked, or activated by key |

```vue
<template>
  <NbPieChart :data="data" @select="onSelect" />
</template>

<script setup lang="ts">
import type { IChartCategoricalSelection } from '@nubisco/ui'

const onSelect = (selection: IChartCategoricalSelection) => {
  // { kind: 'categorical', label, value, index, datum }
  console.log(selection.label, selection.value)
}
</script>
```

Interactivity is opt-in and works the same way it does on
[the bar chart](/components/charts/bar/usage): with no `@select` listener the chart
is a picture, and with one each slice becomes a focusable button, activated with
<kbd>Enter</kbd> or <kbd>Space</kbd>.

## Data shape

```ts
interface ICategoricalDatum {
  label: string
  value: number
  color?: string
}
```

## Notes

- Negative `value`s are clamped to zero, pie charts can only render non-negative slices.
- Slice ordering follows the array order, starting at the 12-o'clock position and progressing clockwise.

<!--@include: ./_shared.md-->
