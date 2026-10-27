---
layout: nubisco
title: Line Chart
intro: '`NbLineChart` plots one or more numeric series along a shared X dimension, typically time or any ordered category.'
source: src/components/Charts/LineChart.vue
tab: usage
pageTabs: ['usage', 'code']
---

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

<!--@include: ./_shared.md-->
