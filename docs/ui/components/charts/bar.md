---
layout: nubisco
title: Bar Chart
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbBarChart` compares numeric values across discrete categories. It supports single and multiple series; multi-series data renders as grouped bars.

<preview>
  <NbBarChart
    height="280"
    title="Sign-ups per channel"
    :series="singleSeries"
  />
</preview>

```vue
<template>
  <NbBarChart title="Sign-ups per channel" :series="series" />
</template>

<script setup lang="ts">
const series = [
  {
    name: 'Sign-ups',
    data: [
      { x: 'Organic', y: 320 },
      { x: 'Referral', y: 240 },
      { x: 'Paid', y: 180 },
      { x: 'Direct', y: 150 },
    ],
  },
]
</script>
```

## Multiple series

When more than one series shares a category, bars are grouped side-by-side.

<preview>
  <NbBarChart
    height="280"
    title="Quarterly revenue by region"
    subtitle="In thousands of USD"
    :series="groupedSeries"
  />
</preview>

```vue
<template>
  <NbBarChart
    title="Quarterly revenue by region"
    subtitle="In thousands of USD"
    :series="series"
  />
</template>
```

## Negative values

The Y axis automatically extends below zero when the data requires it.

<preview>
  <NbBarChart
    height="280"
    title="Net profit per quarter"
    :series="negativeSeries"
  />
</preview>

## Custom palette

<preview>
  <NbBarChart
    height="240"
    :series="paletteSeries"
    :colors="['var(--nb-c-success)', 'var(--nb-c-warning)', 'var(--nb-c-danger)']"
  />
</preview>

```vue
<template>
  <NbBarChart
    :series="series"
    :colors="[
      'var(--nb-c-success)',
      'var(--nb-c-warning)',
      'var(--nb-c-danger)',
    ]"
  />
</template>
```

## Without legend or tooltip

For dense dashboard tiles, you can suppress the chrome.

<preview>
  <NbBarChart
    height="180"
    :series="singleSeries"
    :show-legend="false"
    :show-tooltip="false"
    :show-grid="false"
  />
</preview>

</doc-tab>

<doc-tab name="Api">

## Props

| Prop          | Type               | Default         | Description                                          |
| ------------- | ------------------ | --------------- | ---------------------------------------------------- |
| `series`      | `IChartSeries[]`   | `[]`            | One or more named series of `{ x, y }` data points   |
| `title`       | `string`           | -               | Chart title                                          |
| `subtitle`    | `string`           | -               | Secondary descriptive line                           |
| `height`      | `number \| string` | `280`           | Container height                                     |
| `showLegend`  | `boolean`          | `true`          | Render a legend below the chart                      |
| `showTooltip` | `boolean`          | `true`          | Show hover tooltip                                   |
| `showGrid`    | `boolean`          | `true`          | Render Y-axis gridlines                              |
| `colors`      | `string[]`         | default palette | Per-series colors, recycled if shorter than `series` |
| `orientation` | `'vertical'`       | `'vertical'`    | Reserved, horizontal mode planned                    |
| `stacked`     | `boolean`          | `false`         | Reserved, stacked mode planned                       |

## Data shape

```ts
interface IChartPoint {
  x: number | string | Date
  y: number
}

interface IChartSeries {
  name: string
  data: IChartPoint[]
  color?: string
}
```

The X values of the **first** series determine the category set; subsequent series should expose the same X values in the same order.

</doc-tab>

<script setup lang="ts">
const singleSeries = [
  {
    name: 'Sign-ups',
    data: [
      { x: 'Organic', y: 320 },
      { x: 'Referral', y: 240 },
      { x: 'Paid', y: 180 },
      { x: 'Direct', y: 150 },
    ],
  },
]

const groupedSeries = [
  {
    name: 'EU',
    data: [
      { x: 'Q1', y: 32 },
      { x: 'Q2', y: 41 },
      { x: 'Q3', y: 38 },
      { x: 'Q4', y: 47 },
    ],
  },
  {
    name: 'NA',
    data: [
      { x: 'Q1', y: 28 },
      { x: 'Q2', y: 33 },
      { x: 'Q3', y: 36 },
      { x: 'Q4', y: 44 },
    ],
  },
  {
    name: 'APAC',
    data: [
      { x: 'Q1', y: 14 },
      { x: 'Q2', y: 22 },
      { x: 'Q3', y: 27 },
      { x: 'Q4', y: 31 },
    ],
  },
]

const negativeSeries = [
  {
    name: 'Net profit',
    data: [
      { x: 'Q1', y: 12 },
      { x: 'Q2', y: -4 },
      { x: 'Q3', y: 8 },
      { x: 'Q4', y: -2 },
    ],
  },
]

const paletteSeries = [
  {
    name: 'Healthy',
    data: [
      { x: 'Mon', y: 24 },
      { x: 'Tue', y: 22 },
      { x: 'Wed', y: 28 },
      { x: 'Thu', y: 30 },
      { x: 'Fri', y: 26 },
    ],
  },
  {
    name: 'Warning',
    data: [
      { x: 'Mon', y: 6 },
      { x: 'Tue', y: 9 },
      { x: 'Wed', y: 7 },
      { x: 'Thu', y: 12 },
      { x: 'Fri', y: 8 },
    ],
  },
  {
    name: 'Critical',
    data: [
      { x: 'Mon', y: 1 },
      { x: 'Tue', y: 3 },
      { x: 'Wed', y: 0 },
      { x: 'Thu', y: 4 },
      { x: 'Fri', y: 2 },
    ],
  },
]
</script>
