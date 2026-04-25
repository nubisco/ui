---
layout: nubisco
title: Charts
tabs: ['Overview', 'Concepts', 'Roadmap']
---

<doc-tab name="Overview">

The Nubisco chart family provides a small, opinionated set of data-visualization primitives that share the design system's typography, color palette, and theming. Charts are rendered as inline SVG, support light and dark themes out of the box, and resize responsively to their container.

<preview>
  <NbBarChart
    height="240"
    title="Quarterly revenue"
    subtitle="In thousands of USD"
    :series="overviewBars"
  />
</preview>

```vue
<template>
  <NbBarChart title="Quarterly revenue" :series="series" />
</template>

<script setup lang="ts">
const series = [
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
]
</script>
```

## Available chart types

| Component      | Use for                                                      |
| -------------- | ------------------------------------------------------------ |
| `NbBarChart`   | Comparing discrete categories side by side                   |
| `NbLineChart`  | Showing trends over time or any ordered dimension            |
| `NbPieChart`   | Communicating part-to-whole relationships across few buckets |
| `NbGanttChart` | Visualizing project timelines, dependencies, and milestones  |

More chart types (Area, Radar, Bubble, Histogram, Heatmap, Tree, Network, Alluvial) are on the roadmap, see the **Roadmap** tab.

## Shared API

Every chart component accepts the following common props so dashboards can be built without learning a new contract per chart:

| Prop          | Type               | Default | Description                              |
| ------------- | ------------------ | ------- | ---------------------------------------- |
| `title`       | `string`           | -       | Optional chart title                     |
| `subtitle`    | `string`           | -       | Optional secondary line under the title  |
| `height`      | `number \| string` | `280`   | Container height (px when number)        |
| `showLegend`  | `boolean`          | `true`  | Render a legend below the chart          |
| `showTooltip` | `boolean`          | `true`  | Show interactive hover tooltip           |
| `showGrid`    | `boolean`          | `true`  | Render axis gridlines (cartesian charts) |
| `colors`      | `string[]`         | palette | Override the categorical palette         |

Cartesian charts (`NbBarChart`, `NbLineChart`) accept a `series: IChartSeries[]` prop; categorical charts (`NbPieChart`) accept a `data: ICategoricalDatum[]` prop.

## Theming

Colors are sourced from the design-system CSS variables (`--nb-c-grape-hyacinth-500`, etc.), which means charts automatically follow your light / dark theme without any extra configuration. To use a custom palette, pass `colors` with any CSS color string, including raw hex, rgb, or your own custom properties.

```vue
<template>
  <NbLineChart
    :series="series"
    :colors="['var(--nb-c-info)', 'var(--nb-c-success)', '#f59e0b']"
  />
</template>
```

</doc-tab>

<doc-tab name="Concepts">

## Series and data points

Cartesian charts consume an array of **series**, where each series is a named collection of points:

```ts
interface IChartPoint {
  x: number | string | Date
  y: number
  z?: number // optional third dimension (Bubble, Heatmap)
  label?: string // optional override for tooltip
}

interface IChartSeries {
  name: string
  data: IChartPoint[]
  color?: string
}
```

For categorical charts (Pie, future Donut/Treemap), use `ICategoricalDatum`:

```ts
interface ICategoricalDatum {
  label: string
  value: number
  color?: string
}
```

## Sizing

Charts are 100 % width by default and use the `height` prop for vertical sizing. Internally, a `ResizeObserver` tracks the container so axis scales recompute on every resize, including responsive layout changes and dev-tools toggles.

For fixed-aspect dashboards, wrap the chart in a sized container:

```vue
<template>
  <div style="width: 320px;">
    <NbPieChart :data="data" :height="240" />
  </div>
</template>
```

## Accessibility

Each chart sets an `aria-label` derived from its `title` (falling back to the chart type) and uses semantic SVG. Tooltips are render-only, they don't trap focus. Keyboard navigation across data points is on the roadmap.

## Performance

For datasets above ~10k points per chart, expect to see render slowdowns, the current implementation renders every point as an SVG node. Canvas-backed rendering for high-density charts is planned alongside the histogram/heatmap work.

</doc-tab>

<doc-tab name="Roadmap">

The chart family is being rolled out in phases. The current release ships the three foundational cartesian and categorical primitives, plus the shared scaffolding (legend, tooltip, palette, scales) that the rest of the family will build on.

| Status  | Chart type | Notes                                                         |
| ------- | ---------- | ------------------------------------------------------------- |
| Shipped | Bar        | Vertical, grouped multi-series                                |
| Shipped | Line       | Linear / smooth / step curves, optional area + points         |
| Shipped | Pie        | Donut mode via `inner-radius`                                 |
| Shipped | Gantt      | Dependencies, milestones, status, groups, progress            |
| Planned | Area       | Will share the line renderer with `area` toggle as a shortcut |
| Planned | Radar      | Polar grid + polygon series                                   |
| Planned | Bubble     | Scatter with `z` mapped to point radius                       |
| Planned | Histogram  | Auto-binning, share Bar's renderer                            |
| Planned | Heatmap    | Sequential color scale, optional row/column labels            |
| Planned | Tree       | Hierarchical layout via `d3-hierarchy`                        |
| Planned | Network    | Force-directed via `d3-force`                                 |
| Planned | Alluvial   | Sankey via `d3-sankey`                                        |

Inspiration for the family taxonomy comes from [IBM Carbon's data-visualization guidelines](https://carbondesignsystem.com/data-visualization/chart-types/).

</doc-tab>

<script setup lang="ts">
const overviewBars = [
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
]
</script>
