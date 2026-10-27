---
layout: nubisco
title: Gantt Chart
intro: '`NbGanttChart` visualizes project schedules as horizontal bars along a timeline. It supports task dependencies, milestones, progress indicators, status coloring, and collapsible groups.'
source: src/components/Charts/GanttChart.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview>
  <NbGanttChart
    height="280"
    title="Sprint timeline"
    :tasks="basicTasks"
    :today="'2025-06-20'"
    time-scale="week"
  />
</preview>

```vue
<template>
  <NbGanttChart title="Sprint timeline" :tasks="tasks" time-scale="week" />
</template>

<script setup lang="ts">
const tasks = [
  { id: 't1', label: 'Design', start: '2025-06-01', end: '2025-06-14' },
  { id: 't2', label: 'Develop', start: '2025-06-10', end: '2025-07-10' },
  { id: 't3', label: 'Test', start: '2025-07-05', end: '2025-07-25' },
  { id: 't4', label: 'Deploy', start: '2025-07-26', end: '2025-07-31' },
]
</script>
```

## Time scales

The `timeScale` prop controls the granularity of the header and grid. Options: `day`, `week`, `month`, `quarter`, `year`.

<preview>
  <NbGanttChart
    height="240"
    title="Monthly view"
    :tasks="basicTasks"
    :today="'2025-06-20'"
    time-scale="month"
  />
</preview>

## Without chrome

For compact dashboards, suppress the legend, tooltip, and grid.

<preview>
  <NbGanttChart
    height="200"
    :tasks="basicTasks"
    :show-legend="false"
    :show-tooltip="false"
    :show-grid="false"
    :show-today-marker="false"
    time-scale="week"
  />
</preview>

<!--@include: ./_shared.md-->
