---
layout: nubisco
title: Bar Chart
intro: '`NbBarChart` compares numeric values across discrete categories. It supports single and multiple series; multi-series data renders as grouped bars.'
source: src/components/Charts/BarChart.vue
tab: code
pageTabs: ['usage', 'code']
---

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

## Formatting values

By default a value of 1000 or more prints as `1.2k`, on the axis, in the
tooltip and in each bar's accessible label. Pass `valueFormatter` to print
values your way, for example as currency with `Intl.NumberFormat`. It formats
the text only: the `select` payload still carries the raw number.

<preview>
  <NbBarChart
    height="280"
    title="Revenue per quarter"
    :series="revenueSeries"
    :value-formatter="formatEuro"
  />
</preview>

```vue
<template>
  <NbBarChart
    title="Revenue per quarter"
    :series="series"
    :value-formatter="formatEuro"
  />
</template>

<script setup lang="ts">
const euro = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const formatEuro = (value: number) => euro.format(value)

const series = [
  {
    name: 'Revenue',
    data: [
      { x: 'Q1', y: 12500 },
      { x: 'Q2', y: 18200 },
      { x: 'Q3', y: 9800, label: 'Not yet closed' },
      { x: 'Q4', y: 21400 },
    ],
  },
]
</script>
```

A point's `label` replaces its value in the tooltip, whether or not a
`valueFormatter` is set. Hover Q3 above to see it.

## A dense, quiet chart

Five options, all off by default, turn the chart into a compact strip for a
dense axis such as the hours of a day:

- `bar-radius` rounds the free end of each bar by that many pixels (the top
  of a vertical bar, the bottom of a negative one, the right of a horizontal
  one). In a stack only the outermost segment is rounded, so the stack still
  reads as one bar.
- `show-empty` draws a short dash on the baseline, one bar footprint wide, for
  a category whose values are all zero, so an empty hour reads as "none" rather
  than as a gap in the data.
- `:show-baseline="false"` removes the zero line along the category axis.
- `:show-value-axis="false"` removes the value tick labels and closes the
  gutter they sat in. Keep the gridlines, or the tooltip, if the reader still
  needs magnitudes.
- `category-label-every` labels only every Nth category, starting with the
  first. The bars are all drawn, and the labels that remain sit exactly where
  they would without thinning.

<preview>
  <NbBarChart
    height="200"
    title="Today, by hour"
    stacked
    :series="hourSeries"
    :bar-radius="3"
    show-empty
    :show-baseline="false"
    :show-value-axis="false"
    :show-grid="false"
    :category-label-every="6"
  />
</preview>

```vue
<template>
  <NbBarChart
    title="Today, by hour"
    stacked
    :series="series"
    :bar-radius="3"
    show-empty
    :show-baseline="false"
    :show-value-axis="false"
    :show-grid="false"
    :category-label-every="6"
  />
</template>

<script setup lang="ts">
const hours = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'))

// One series per kind of event, every series over the same 24 hours.
const series = [
  { name: 'Notes', data: hours.map((x, h) => ({ x, y: notesAt(h) })) },
  { name: 'Messages', data: hours.map((x, h) => ({ x, y: messagesAt(h) })) },
]
</script>
```

## Props

| Prop                 | Type                        | Default          | Description                                                          |
| -------------------- | --------------------------- | ---------------- | -------------------------------------------------------------------- |
| `series`             | `IChartSeries[]`            | `[]`             | One or more named series of `{ x, y }` data points                   |
| `title`              | `string`                    | -                | Chart title                                                          |
| `subtitle`           | `string`                    | -                | Secondary descriptive line                                           |
| `height`             | `number \| string`          | `280`            | Container height                                                     |
| `showLegend`         | `boolean`                   | `true`           | Render a legend below the chart                                      |
| `showTooltip`        | `boolean`                   | `true`           | Show hover tooltip                                                   |
| `showGrid`           | `boolean`                   | `true`           | Render Y-axis gridlines                                              |
| `colors`             | `string[]`                  | default palette  | Per-series colors, recycled if shorter than `series`                 |
| `orientation`        | `TBarOrientation`           | `'vertical'`     | `'vertical'` or `'horizontal'`                                       |
| `stacked`            | `boolean`                   | `false`          | Stack series within a category instead of grouping                   |
| `valueFormatter`     | `(value: number) => string` | `1.2k` shorthand | Formats axis ticks, tooltip values and bar labels                    |
| `barRadius`          | `number`                    | `0`              | Rounds the free end of each bar, in pixels. `0` keeps square bars    |
| `showEmpty`          | `boolean`                   | `false`          | Draw a dash on the baseline for a category whose values are all zero |
| `showBaseline`       | `boolean`                   | `true`           | Draw the zero line along the category axis                           |
| `showValueAxis`      | `boolean`                   | `true`           | Draw the value tick labels, and reserve their gutter                 |
| `categoryLabelEvery` | `number`                    | `1`              | Label only every Nth category, starting with the first               |

## Events

| Event    | Payload                 | Description                            |
| -------- | ----------------------- | -------------------------------------- |
| `select` | `IChartSeriesSelection` | A bar was clicked, or activated by key |

## Data shape

```ts
interface IChartPoint {
  x: number | string | Date
  y: number
  label?: string // shown in the tooltip instead of the value
}

interface IChartSeries {
  name: string
  data: IChartPoint[]
  color?: string
}
```

The X values of the **first** series determine the category set; subsequent series should expose the same X values in the same order.

<!--@include: ./_shared.md-->
