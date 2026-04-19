---
layout: nubisco
title: Pie Chart
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbPieChart` shows the relative size of a small set of categories that sum to a meaningful whole. For more than ~6 segments, prefer `NbBarChart`, pies become hard to read with too many slices.

<preview>
  <NbPieChart
    height="280"
    title="Traffic source"
    :data="trafficData"
  />
</preview>

```vue
<template>
  <NbPieChart title="Traffic source" :data="data" />
</template>

<script setup lang="ts">
const data = [
  { label: 'Organic', value: 48 },
  { label: 'Referral', value: 22 },
  { label: 'Paid', value: 18 },
  { label: 'Direct', value: 12 },
]
</script>
```

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

## Label modes

Choose between percentage (default), absolute value, or no labels.

<preview dir="row">
  <NbPieChart height="220" :data="trafficData" labels="percent" />
  <NbPieChart height="220" :data="trafficData" labels="value" />
  <NbPieChart height="220" :data="trafficData" labels="none" />
</preview>

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

</doc-tab>

<doc-tab name="Api">

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

</doc-tab>

<script setup lang="ts">
const trafficData = [
  { label: 'Organic',  value: 48 },
  { label: 'Referral', value: 22 },
  { label: 'Paid',     value: 18 },
  { label: 'Direct',   value: 12 },
]

const browserData = [
  { label: 'Chrome',  value: 64 },
  { label: 'Safari',  value: 19 },
  { label: 'Firefox', value: 8 },
  { label: 'Edge',    value: 6 },
  { label: 'Other',   value: 3 },
]

const statusData = [
  { label: 'Passing', value: 142, color: 'var(--nb-c-success)' },
  { label: 'Warning', value: 23,  color: 'var(--nb-c-warning)' },
  { label: 'Failing', value: 6,   color: 'var(--nb-c-danger)' },
]
</script>
