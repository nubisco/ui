---
layout: nubisco
title: Sparkline
intro: '`NbSparkline` is a tiny inline chart for embedding in dashboard tiles, table cells, and KPI widgets. It renders a single line with an optional gradient fill underneath, with no axes, labels, legend, or tooltip. The SVG uses `viewBox` with `preserveAspectRatio="none"` so it stretches to fill its container while the stroke stays visually consistent thanks to `vector-effect="non-scaling-stroke"`.'
source: src/components/Charts/Sparkline.vue
tab: usage
pageTabs: ['usage', 'code']
---

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

<!--@include: ./_shared.md-->
