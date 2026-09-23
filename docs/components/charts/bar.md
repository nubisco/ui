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

## Horizontal orientation

`orientation="horizontal"` puts the categories on the vertical axis and the
values on the horizontal one. Reach for it when the category labels are words
rather than short codes: vertically each label gets one band of width to fit in
and they collide, horizontally each gets its own row and the full panel width.

<preview>
  <NbBarChart
    height="320"
    title="Open issues by area"
    orientation="horizontal"
    :series="areaSeries"
  />
</preview>

```vue
<template>
  <NbBarChart
    title="Open issues by area"
    orientation="horizontal"
    :series="series"
  />
</template>
```

The same data vertically, for comparison. On a wide desktop panel the labels
just fit; give the chart a dashboard tile's width instead, and each category
has around 60px to spend on a label that needs three times that. Horizontal is
the fix, because the category axis then has the whole panel width for text:

<preview>
  <NbBarChart height="320" :series="areaSeries" />
</preview>

The left gutter sizes itself to the longest label, up to 40% of the chart
width. Past that the chart keeps its plot and the labels are the part that
gives, so one unusually long category cannot crush the bars it belongs to.

## Stacked series

`stacked` puts the series of a category on top of each other rather than side
by side, so the bar length reads as the category total. It works in both
orientations, and negative values stack downward (or leftward) from the
baseline rather than cancelling the positive ones out.

<preview>
  <NbBarChart
    height="280"
    title="Quarterly revenue by region"
    subtitle="Stacked to show the quarter total"
    stacked
    :series="groupedSeries"
  />
</preview>

```vue
<template>
  <NbBarChart title="Quarterly revenue by region" stacked :series="series" />
</template>
```

## Reacting to a click

Bind `@select` to make the bars a way into the data behind them, typically a
filtered list view.

<preview>
  <NbBarChart
    height="280"
    title="Open issues by area"
    orientation="horizontal"
    :series="areaSeries"
    @select="onSelect"
  />
  <p class="nb-chart-selection-note">{{ selectionNote }}</p>
</preview>

```vue
<template>
  <NbBarChart :series="series" orientation="horizontal" @select="onSelect" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { IChartSeriesSelection } from '@nubisco/ui'

const router = useRouter()

const onSelect = (selection: IChartSeriesSelection) => {
  // `x` is the value from your data, not the rendered label, so this keeps
  // working when the axis is formatted or translated.
  router.push({ name: 'issues', query: { area: String(selection.x) } })
}
</script>
```

The payload identifies the datum rather than describing the pixel that was
clicked:

| Field         | Type           | Description                                    |
| ------------- | -------------- | ---------------------------------------------- |
| `kind`        | `'series'`     | Discriminator shared across the chart family   |
| `x`           | `TChartScalar` | The category value, as supplied in the data    |
| `y`           | `number`       | The value of the selected bar                  |
| `seriesName`  | `string`       | Name of the series the bar belongs to          |
| `seriesIndex` | `number`       | Index of that series                           |
| `index`       | `number`       | Index of the category along the shared axis    |
| `point`       | `IChartPoint`  | The datum itself, so `z` and `label` come back |

The clickable target is the whole category band, not the exact rectangle, so a
near miss still selects. In a grouped chart the position within the band picks
the series; in a stacked one the position along the value axis picks the
segment.

**Interactivity is opt-in.** With no `@select` listener bound, the chart is a
picture: no pointer cursor, no focus ring, no button semantics. Bind one and
each bar becomes a real focusable button, reachable by <kbd>Tab</kbd> and
activated with <kbd>Enter</kbd> or <kbd>Space</kbd>, labelled with its category
and value. The `<svg>` also stops presenting itself as a single image, so
assistive technology can reach the controls inside it.

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
| `orientation` | `TBarOrientation`  | `'vertical'`    | `'vertical'` or `'horizontal'`                       |
| `stacked`     | `boolean`          | `false`         | Stack series within a category instead of grouping   |

## Events

| Event    | Payload                 | Description                            |
| -------- | ----------------------- | -------------------------------------- |
| `select` | `IChartSeriesSelection` | A bar was clicked, or activated by key |

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
import { ref } from 'vue'

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

const areaSeries = [
  {
    name: 'Open issues',
    data: [
      { x: 'Authentication and access', y: 24 },
      { x: 'Billing and invoicing', y: 18 },
      { x: 'Developer documentation', y: 15 },
      { x: 'Infrastructure', y: 12 },
      { x: 'Notifications', y: 9 },
      { x: 'Onboarding', y: 7 },
      { x: 'Reporting and exports', y: 6 },
      { x: 'Search relevance', y: 4 },
      { x: 'Localisation', y: 3 },
    ],
  },
]

const selectionNote = ref('Click a bar.')
const onSelect = (selection) => {
  selectionNote.value = `${selection.x}: ${selection.y} open`
}

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

<style scoped>
.nb-chart-selection-note {
  margin: 12px 0 0;
  font-family: var(--nb-font-family-mono);
  font-size: 12px;
  color: var(--nb-c-text-muted);
}
</style>
