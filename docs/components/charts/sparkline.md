---
layout: nubisco
title: Sparkline
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbSparkline` is a tiny inline chart for embedding in dashboard tiles, table cells, and KPI widgets. It renders a single line with an optional gradient fill underneath, with no axes, labels, legend, or tooltip. The SVG uses `viewBox` with `preserveAspectRatio="none"` so it stretches to fill its container while the stroke stays visually consistent thanks to `vector-effect="non-scaling-stroke"`.

<preview>
  <NbSparkline :data="defaultData" />
</preview>

```vue
<template>
  <NbSparkline :data="series" />
</template>

<script setup lang="ts">
const series = [3, 5, 4, 7, 6, 9, 8, 10, 12, 11, 14, 13]
</script>
```

## Inline in a KPI tile

Sparklines are designed to live inside other UI. They take 100 % of their parent width by default and the height you give them.

<preview>
  <div style="display: flex; gap: 16px; flex-wrap: wrap;">
    <div style="min-width: 180px; padding: 12px 16px; background: var(--nb-c-surface); border: 1px solid var(--nb-c-component-plain-border); border-radius: 6px;">
      <div style="font-size: 11px; color: var(--nb-c-text-muted); text-transform: uppercase; letter-spacing: 0.4px;">Active users</div>
      <div style="font-size: 22px; font-weight: 600; margin: 4px 0 6px;">12,418</div>
      <NbSparkline :data="kpiUp" :height="36" />
    </div>
    <div style="min-width: 180px; padding: 12px 16px; background: var(--nb-c-surface); border: 1px solid var(--nb-c-component-plain-border); border-radius: 6px;">
      <div style="font-size: 11px; color: var(--nb-c-text-muted); text-transform: uppercase; letter-spacing: 0.4px;">Errors</div>
      <div style="font-size: 22px; font-weight: 600; margin: 4px 0 6px;">42</div>
      <NbSparkline :data="kpiDown" :height="36" color="var(--nb-c-danger)" />
    </div>
    <div style="min-width: 180px; padding: 12px 16px; background: var(--nb-c-surface); border: 1px solid var(--nb-c-component-plain-border); border-radius: 6px;">
      <div style="font-size: 11px; color: var(--nb-c-text-muted); text-transform: uppercase; letter-spacing: 0.4px;">Latency p95</div>
      <div style="font-size: 22px; font-weight: 600; margin: 4px 0 6px;">186 ms</div>
      <NbSparkline :data="kpiVolatile" :height="36" color="var(--nb-c-warning)" />
    </div>
  </div>
</preview>

## Color

Pass any valid CSS color, including design-system tokens.

<preview>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <NbSparkline :data="defaultData" color="var(--nb-c-primary)" />
    <NbSparkline :data="defaultData" color="var(--nb-c-success)" />
    <NbSparkline :data="defaultData" color="var(--nb-c-warning)" />
    <NbSparkline :data="defaultData" color="var(--nb-c-danger)" />
    <NbSparkline :data="defaultData" color="var(--nb-c-info)" />
  </div>
</preview>

```vue
<template>
  <NbSparkline :data="series" color="var(--nb-c-success)" />
</template>
```

## Without fill

Set `fill` to `false` for a clean line-only sparkline.

<preview>
  <NbSparkline :data="defaultData" :fill="false" />
</preview>

## Straight segments

Set `smooth` to `false` to draw straight segments between points instead of smoothed cubic curves.

<preview>
  <NbSparkline :data="defaultData" :smooth="false" />
</preview>

## Stroke width

<preview>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <NbSparkline :data="defaultData" :stroke-width="1" />
    <NbSparkline :data="defaultData" :stroke-width="1.5" />
    <NbSparkline :data="defaultData" :stroke-width="2.5" />
  </div>
</preview>

</doc-tab>

<doc-tab name="Api">

## Props

| Prop          | Type               | Default               | Description                                         |
| ------------- | ------------------ | --------------------- | --------------------------------------------------- |
| `data`        | `number[]`         | required              | Values to plot. Needs at least 2 entries to render. |
| `color`       | `string`           | `var(--nb-c-primary)` | Line and gradient color. Any CSS color string.      |
| `height`      | `number \| string` | `40`                  | SVG height. Numbers are interpreted as pixels.      |
| `width`       | `number \| string` | `'100%'`              | SVG width. Numbers are interpreted as pixels.       |
| `strokeWidth` | `number`           | `1.5`                 | Line thickness in pixels (non-scaling-stroke).      |
| `fill`        | `boolean`          | `true`                | Render the gradient area under the line.            |
| `smooth`      | `boolean`          | `true`                | Use bezier smoothing between data points.           |

## Notes

- The component renders a fixed internal `viewBox` of `0 0 100 30` and stretches it via `preserveAspectRatio="none"` to match the requested width and height. Stroke width stays visually constant because the line uses `vector-effect="non-scaling-stroke"`.
- The gradient fades from `color` at 30 % opacity at the top to fully transparent at the bottom.
- Each instance generates a unique gradient id via Vue's `useId()`, so multiple sparklines on the same page do not collide.
- A small vertical padding (~8 % of height) is reserved so the line never touches the top or bottom edge.

</doc-tab>

<script setup lang="ts">
const defaultData = [3, 5, 4, 7, 6, 9, 8, 10, 12, 11, 14, 13]
const kpiUp = [120, 132, 128, 141, 145, 150, 158, 162, 170, 178, 184, 190]
const kpiDown = [98, 92, 87, 81, 76, 70, 64, 58, 52, 48, 44, 42]
const kpiVolatile = [180, 220, 175, 230, 195, 240, 205, 260, 190, 215, 250, 186]
</script>
