---
layout: nubisco
title: Interpolation Chart
intro: '`NbInterpolationChart` visualises a piecewise-linear mapping between two numeric scales and lets users calibrate the curve by dragging, adding, or removing control points.'
source: src/components/Charts/InterpolationChart.vue
tab: usage
pageTabs: ['usage', 'code']
---

Typical use case: bridging the gap between a device setpoint and the real-world effect it produces (e.g. water temperature vs. room temperature in a heat pump).

<preview>
  <NbInterpolationChart
    v-model="demoPoints"
    height="280"
    title="Room to Water temperature"
    input-label="Room (C)"
    output-label="Water (C)"
    :input-min="18"
    :input-max="24"
    :output-min="30"
    :output-max="60"
    :input-step="0.5"
    :output-step="1"
  />
</preview>

```vue
<template>
  <NbInterpolationChart
    v-model="points"
    title="Room to Water temperature"
    input-label="Room (C)"
    output-label="Water (C)"
    :input-min="18"
    :input-max="24"
    :output-min="30"
    :output-max="60"
    :input-step="0.5"
    :output-step="1"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const points = ref([
  { input: 18, output: 35 },
  { input: 20, output: 40 },
  { input: 22, output: 47 },
  { input: 24, output: 55 },
])
</script>
```

## Interactions

- **Drag** a point to adjust its input/output values
- **Double-click** on the chart area to add a new point
- **Right-click** a point to remove it (minimum 2 points)
- Points cannot cross each other on the input axis

## Read-only mode

Set `editable` to `false` to render the chart without drag/add/remove interactions.

<preview>
  <NbInterpolationChart
    :model-value="staticPoints"
    height="240"
    title="Humidity mapping"
    input-label="Target (%)"
    output-label="Device (%)"
    :input-min="30"
    :input-max="70"
    :output-min="20"
    :output-max="80"
    :editable="false"
  />
</preview>

## Without axis labels

<preview>
  <NbInterpolationChart
    v-model="demoPoints"
    height="200"
    :input-min="18"
    :input-max="24"
    :output-min="30"
    :output-max="60"
  />
</preview>

<!--@include: ./_shared.md-->
