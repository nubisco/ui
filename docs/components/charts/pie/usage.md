---
layout: nubisco
title: Pie Chart
intro: '`NbPieChart` shows the relative size of a small set of categories that sum to a meaningful whole. For more than ~6 segments, prefer `NbBarChart`, pies become hard to read with too many slices.'
source: src/components/Charts/PieChart.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview>
  <NbPieChart
    height="280"
    title="Traffic source"
    :data="trafficData"
  />
</preview>

```vue
<template>
  <NbPieChart title="Traffic source" :data="data" />
</template>

<script setup lang="ts">
const data = [
  { label: 'Organic', value: 48 },
  { label: 'Referral', value: 22 },
  { label: 'Paid', value: 18 },
  { label: 'Direct', value: 12 },
]
</script>
```

## Label modes

Choose between percentage (default), absolute value, or no labels.

<preview dir="row">
  <NbPieChart height="220" :data="trafficData" labels="percent" />
  <NbPieChart height="220" :data="trafficData" labels="value" />
  <NbPieChart height="220" :data="trafficData" labels="none" />
</preview>

<!--@include: ./_shared.md-->
