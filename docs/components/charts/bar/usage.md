---
layout: nubisco
title: Bar Chart
intro: '`NbBarChart` compares numeric values across discrete categories. It supports single and multiple series; multi-series data renders as grouped bars.'
source: src/components/Charts/BarChart.vue
tab: usage
pageTabs: ['usage', 'code']
---

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

## Negative values

The Y axis automatically extends below zero when the data requires it.

<preview>
  <NbBarChart
    height="280"
    title="Net profit per quarter"
    :series="negativeSeries"
  />
</preview>

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

<!--@include: ./_shared.md-->
