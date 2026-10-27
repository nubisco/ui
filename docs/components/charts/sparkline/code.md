---
layout: nubisco
title: Sparkline
intro: '`NbSparkline` is a tiny inline chart for embedding in dashboard tiles, table cells, and KPI widgets. It renders a single line with an optional gradient fill underneath, with no axes, labels, legend, or tooltip. The SVG uses `viewBox` with `preserveAspectRatio="none"` so it stretches to fill its container while the stroke stays visually consistent thanks to `vector-effect="non-scaling-stroke"`.'
source: src/components/Charts/Sparkline.vue
tab: code
pageTabs: ['usage', 'code']
---

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

<!--@include: ./_shared.md-->
