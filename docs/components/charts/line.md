---
layout: nubisco
title: Line Chart
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbLineChart` plots one or more numeric series along a shared X dimension, typically time or any ordered category.

<preview>
  <NbLineChart
    height="280"
    title="Daily active users"
    subtitle="Last 14 days"
    :series="trendSeries"
  />
</preview>

```vue
<template>
  <NbLineChart title="Daily active users" :series="series" />
</template>

<script setup lang="ts">
const series = [
  {
    name: 'DAU',
    data: [
      { x: 'Mon', y: 1240 },
      { x: 'Tue', y: 1380 },
      { x: 'Wed', y: 1410 },
      { x: 'Thu', y: 1620 },
      { x: 'Fri', y: 1530 },
      { x: 'Sat', y: 1180 },
      { x: 'Sun', y: 1090 },
    ],
  },
]
</script>
```

## Multiple series

<preview>
  <NbLineChart
    height="280"
    title="Latency by region"
    subtitle="P95 in milliseconds"
    :series="multiSeries"
  />
</preview>

## Curve styles

<preview>
  <NbLineChart
    height="240"
    title="Smooth (default)"
    :series="multiSeries"
    curve="smooth"
  />
</preview>

<preview>
  <NbLineChart
    height="240"
    title="Linear"
    :series="multiSeries"
    curve="linear"
  />
</preview>

<preview>
  <NbLineChart
    height="240"
    title="Step"
    :series="multiSeries"
    curve="step"
  />
</preview>

## Filled area

Toggle `area` to fill the region under each line, useful for cumulative metrics.

<preview>
  <NbLineChart
    height="280"
    title="Cumulative sign-ups"
    :series="cumulativeSeries"
    area
  />
</preview>

## Data points

Toggle `points` to mark each data point with a circle.

<preview>
  <NbLineChart
    height="240"
    :series="trendSeries"
    points
  />
</preview>

## Axis labels on narrow charts

The x axis shows about six evenly spaced labels, always including the first
and the last point. The chart measures those labels in the axis font against
the width it actually has. When they fit, they stay where they are. When two of
them would overlap, on a phone or with long labels such as `2026-10-20 14:00`,
the chart shows fewer, with room between them. Every point is still in the line
and in the tooltip. Nothing about this depends on the viewport, only on the
chart's own width and its labels.

No axis label is cut off at the chart's edge. A first or last label too long to
centre under its point moves in just far enough to show in full, and if that
brings it against its neighbour, the neighbour gives way. The top y-axis label,
whose rounded value can sit above the plot, moves down the same way, while its
gridline and the scale stay where they are.

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

</doc-tab>

<doc-tab name="Api">

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

</doc-tab>

<script setup lang="ts">
const users = new Intl.NumberFormat('en-GB')
const formatUsers = (value) => `${users.format(value)} users`

const trendSeries = [
  {
    name: 'DAU',
    data: [
      { x: 'D1', y: 1240 },
      { x: 'D2', y: 1380 },
      { x: 'D3', y: 1410 },
      { x: 'D4', y: 1620 },
      { x: 'D5', y: 1530 },
      { x: 'D6', y: 1180 },
      { x: 'D7', y: 1090 },
      { x: 'D8', y: 1310 },
      { x: 'D9', y: 1490 },
      { x: 'D10', y: 1640 },
      { x: 'D11', y: 1720 },
      { x: 'D12', y: 1680 },
      { x: 'D13', y: 1390 },
      { x: 'D14', y: 1240 },
    ],
  },
]

const multiSeries = [
  {
    name: 'EU',
    data: [
      { x: 'Mon', y: 120 },
      { x: 'Tue', y: 138 },
      { x: 'Wed', y: 145 },
      { x: 'Thu', y: 162 },
      { x: 'Fri', y: 153 },
      { x: 'Sat', y: 118 },
      { x: 'Sun', y: 109 },
    ],
  },
  {
    name: 'NA',
    data: [
      { x: 'Mon', y: 95 },
      { x: 'Tue', y: 102 },
      { x: 'Wed', y: 117 },
      { x: 'Thu', y: 130 },
      { x: 'Fri', y: 140 },
      { x: 'Sat', y: 110 },
      { x: 'Sun', y: 98 },
    ],
  },
  {
    name: 'APAC',
    data: [
      { x: 'Mon', y: 168 },
      { x: 'Tue', y: 175 },
      { x: 'Wed', y: 182 },
      { x: 'Thu', y: 195 },
      { x: 'Fri', y: 203 },
      { x: 'Sat', y: 188 },
      { x: 'Sun', y: 174 },
    ],
  },
]

const cumulativeSeries = [
  {
    name: 'Total',
    data: [
      { x: 'W1', y: 120 },
      { x: 'W2', y: 280 },
      { x: 'W3', y: 410 },
      { x: 'W4', y: 530 },
      { x: 'W5', y: 690 },
      { x: 'W6', y: 880 },
      { x: 'W7', y: 1020 },
      { x: 'W8', y: 1240 },
    ],
  },
]
</script>
