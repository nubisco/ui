---
layout: nubisco
title: Line Chart
intro: '`NbLineChart` plots one or more numeric series along a shared X dimension, typically time or any ordered category.'
source: src/components/Charts/LineChart.vue
tab: code
pageTabs: ['usage', 'code']
---

## Formatting values

Values of 1000 or more print as `1.2k` by default. `valueFormatter` replaces
that on the axis and in the tooltip, and a point's `label`, when it has one, is
shown in the tooltip instead of its value.

<preview>
  <NbLineChart
    height="240"
    :series="trendSeries"
    :value-formatter="formatUsers"
  />
</preview>

```vue
<template>
  <NbLineChart :series="series" :value-formatter="formatUsers" />
</template>

<script setup lang="ts">
const users = new Intl.NumberFormat('en-GB')
const formatUsers = (value: number) => `${users.format(value)} users`
</script>
```

## Props

| Prop             | Type                             | Default          | Description                                        |
| ---------------- | -------------------------------- | ---------------- | -------------------------------------------------- |
| `series`         | `IChartSeries[]`                 | `[]`             | One or more named series of `{ x, y }` data points |
| `title`          | `string`                         | -                | Chart title                                        |
| `subtitle`       | `string`                         | -                | Secondary descriptive line                         |
| `height`         | `number \| string`               | `280`            | Container height                                   |
| `area`           | `boolean`                        | `false`          | Render filled area under each line                 |
| `points`         | `boolean`                        | `false`          | Render a circle at each data point                 |
| `curve`          | `'linear' \| 'smooth' \| 'step'` | `'smooth'`       | Path interpolation                                 |
| `showLegend`     | `boolean`                        | `true`           | Render a legend below the chart                    |
| `showTooltip`    | `boolean`                        | `true`           | Show hover tooltip with vertical guide             |
| `showGrid`       | `boolean`                        | `true`           | Render Y-axis gridlines                            |
| `colors`         | `string[]`                       | default palette  | Per-series colors                                  |
| `valueFormatter` | `(value: number) => string`      | `1.2k` shorthand | Formats axis ticks and tooltip values              |

## Notes

- The X dimension is treated as **ordinal**, points are spaced evenly along the X axis, regardless of the underlying value. Use the order of `data` to control point sequence.
- All series should share the same X-value sequence (the first series defines the X-axis labels).
- For cumulative / area mode, ensure your data is sorted ascending on X.

<!--@include: ./_shared.md-->
