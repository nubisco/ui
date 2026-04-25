---
layout: nubisco
title: Gantt Chart
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbGanttChart` visualizes project schedules as horizontal bars along a timeline. It supports task dependencies, milestones, progress indicators, status coloring, and collapsible groups, following Carbon Design System conventions.

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

## Dependencies

Link tasks with dependency arrows. The default type is `finish-to-start`. Other types are `start-to-start`, `finish-to-finish`, and `start-to-finish`.

<preview>
  <NbGanttChart
    height="280"
    title="Task dependencies"
    :tasks="depTasks"
    :dependencies="deps"
    :today="'2025-06-20'"
    time-scale="week"
  />
</preview>

```vue
<template>
  <NbGanttChart
    title="Task dependencies"
    :tasks="tasks"
    :dependencies="dependencies"
  />
</template>

<script setup lang="ts">
const tasks = [
  { id: 't1', label: 'Research', start: '2025-06-01', end: '2025-06-10' },
  { id: 't2', label: 'Prototype', start: '2025-06-11', end: '2025-06-25' },
  { id: 't3', label: 'Build', start: '2025-06-26', end: '2025-07-20' },
  { id: 't4', label: 'Ship', start: '2025-07-21', end: '2025-07-31' },
]

const dependencies = [
  { from: 't1', to: 't2', type: 'finish-to-start' },
  { from: 't2', to: 't3', type: 'finish-to-start' },
  { from: 't3', to: 't4', type: 'finish-to-start' },
]
</script>
```

## Milestones

Tasks with `milestone: true` render as diamond markers instead of bars. Milestones only need a `start` date.

<preview>
  <NbGanttChart
    height="260"
    title="Release milestones"
    :tasks="milestoneTasks"
    :dependencies="milestoneDeps"
    :today="'2025-06-20'"
    time-scale="week"
  />
</preview>

```vue
<template>
  <NbGanttChart
    title="Release milestones"
    :tasks="tasks"
    :dependencies="deps"
  />
</template>

<script setup lang="ts">
const tasks = [
  { id: 't1', label: 'Alpha build', start: '2025-06-01', end: '2025-06-20' },
  { id: 'm1', label: 'Alpha release', start: '2025-06-21', milestone: true },
  { id: 't2', label: 'Beta build', start: '2025-06-22', end: '2025-07-15' },
  { id: 'm2', label: 'Beta release', start: '2025-07-16', milestone: true },
]

const deps = [
  { from: 't1', to: 'm1' },
  { from: 'm1', to: 't2' },
  { from: 't2', to: 'm2' },
]
</script>
```

## Status indicators

Assign a `status` to each task to apply semantic colors: `on-track`, `at-risk`, `behind`, or `complete`.

<preview>
  <NbGanttChart
    height="280"
    title="Project health"
    :tasks="statusTasks"
    :today="'2025-06-20'"
    time-scale="week"
  />
</preview>

```vue
<template>
  <NbGanttChart title="Project health" :tasks="tasks" />
</template>

<script setup lang="ts">
const tasks = [
  {
    id: 't1',
    label: 'API integration',
    start: '2025-06-01',
    end: '2025-06-20',
    status: 'complete',
    progress: 100,
  },
  {
    id: 't2',
    label: 'Frontend pages',
    start: '2025-06-05',
    end: '2025-07-05',
    status: 'on-track',
    progress: 65,
  },
  {
    id: 't3',
    label: 'Auth system',
    start: '2025-06-10',
    end: '2025-06-28',
    status: 'at-risk',
    progress: 40,
  },
  {
    id: 't4',
    label: 'Deployment',
    start: '2025-06-20',
    end: '2025-07-10',
    status: 'behind',
    progress: 10,
  },
]
</script>
```

## Groups (collapsible)

Organize tasks into collapsible groups. Click a group header to toggle visibility. Groups display a summary bar spanning the full date range of their children.

<preview>
  <NbGanttChart
    height="360"
    title="Project phases"
    :tasks="groupTasks"
    :groups="groups"
    :today="'2025-06-20'"
    time-scale="week"
  />
</preview>

```vue
<template>
  <NbGanttChart title="Project phases" :tasks="tasks" :groups="groups" />
</template>

<script setup lang="ts">
const groups = [
  { id: 'g1', label: 'Phase 1: Discovery' },
  { id: 'g2', label: 'Phase 2: Build' },
]

const tasks = [
  {
    id: 't1',
    label: 'User research',
    start: '2025-06-01',
    end: '2025-06-14',
    group: 'g1',
  },
  {
    id: 't2',
    label: 'Competitive audit',
    start: '2025-06-05',
    end: '2025-06-18',
    group: 'g1',
  },
  {
    id: 't3',
    label: 'Frontend',
    start: '2025-06-19',
    end: '2025-07-15',
    group: 'g2',
  },
  {
    id: 't4',
    label: 'Backend',
    start: '2025-06-19',
    end: '2025-07-20',
    group: 'g2',
  },
  {
    id: 't5',
    label: 'QA',
    start: '2025-07-21',
    end: '2025-07-31',
    group: 'g2',
  },
]
</script>
```

## Progress bars

When `showProgress` is enabled (default), tasks with a `progress` value (0 to 100) show a filled portion inside the bar.

<preview>
  <NbGanttChart
    height="240"
    title="Sprint progress"
    :tasks="progressTasks"
    :show-progress="true"
    :today="'2025-06-20'"
    time-scale="week"
  />
</preview>

```vue
<template>
  <NbGanttChart :tasks="tasks" :show-progress="true" />
</template>

<script setup lang="ts">
const tasks = [
  {
    id: 't1',
    label: 'Story A',
    start: '2025-06-01',
    end: '2025-06-20',
    progress: 80,
  },
  {
    id: 't2',
    label: 'Story B',
    start: '2025-06-05',
    end: '2025-06-25',
    progress: 50,
  },
  {
    id: 't3',
    label: 'Story C',
    start: '2025-06-10',
    end: '2025-06-30',
    progress: 20,
  },
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

</doc-tab>

<doc-tab name="Api">

## Props

| Prop              | Type                                                | Default         | Description                                 |
| ----------------- | --------------------------------------------------- | --------------- | ------------------------------------------- |
| `tasks`           | `IGanttTask[]`                                      | `[]`            | Array of tasks to display                   |
| `dependencies`    | `IGanttDependency[]`                                | `[]`            | Dependency arrows between tasks             |
| `groups`          | `IGanttGroup[]`                                     | `[]`            | Collapsible group headers                   |
| `timeScale`       | `'day' \| 'week' \| 'month' \| 'quarter' \| 'year'` | `'week'`        | Time granularity for the header and grid    |
| `rowHeight`       | `number`                                            | `36`            | Height of each row in pixels                |
| `listWidth`       | `number`                                            | `200`           | Width of the task list panel (left side)    |
| `showTodayMarker` | `boolean`                                           | `true`          | Show the vertical "today" marker line       |
| `today`           | `string \| Date`                                    | current date    | Override the date used for the today marker |
| `showProgress`    | `boolean`                                           | `true`          | Show progress fill inside task bars         |
| `statusColors`    | `Partial<Record<TGanttTaskStatus, string>>`         | built-in        | Override default status colors              |
| `title`           | `string`                                            | -               | Chart title                                 |
| `subtitle`        | `string`                                            | -               | Secondary descriptive line                  |
| `height`          | `number \| string`                                  | `400`           | Container height                            |
| `showLegend`      | `boolean`                                           | `true`          | Render a legend below the chart             |
| `showTooltip`     | `boolean`                                           | `true`          | Show hover tooltip                          |
| `showGrid`        | `boolean`                                           | `true`          | Render vertical gridlines                   |
| `colors`          | `string[]`                                          | default palette | Per-task colors when no status is set       |

## Data shapes

```ts
interface IGanttTask {
  id: string
  label: string
  start: string | Date // ISO date string or Date object
  end?: string | Date // omit for milestones
  progress?: number // 0 to 100
  status?: 'default' | 'on-track' | 'at-risk' | 'behind' | 'complete'
  group?: string // parent group ID
  color?: string // explicit color override
  milestone?: boolean // render as diamond instead of bar
}

interface IGanttDependency {
  from: string // predecessor task ID
  to: string // successor task ID
  type?:
    | 'finish-to-start'
    | 'start-to-start'
    | 'finish-to-finish'
    | 'start-to-finish'
}

interface IGanttGroup {
  id: string
  label: string
  collapsed?: boolean // start collapsed
}
```

## Status colors

The following default status colors are used. Override them via the `statusColors` prop.

| Status     | Default token                   |
| ---------- | ------------------------------- |
| `default`  | `--nb-c-grape-hyacinth-500`     |
| `on-track` | `--nb-c-emerald-reflection-600` |
| `at-risk`  | `--nb-c-phoenix-flames-500`     |
| `behind`   | `--nb-c-chicken-comb-500`       |
| `complete` | `--nb-c-the-blues-brothers-500` |

</doc-tab>

<script setup lang="ts">
const basicTasks = [
  { id: 't1', label: 'Design', start: '2025-06-01', end: '2025-06-14' },
  { id: 't2', label: 'Develop', start: '2025-06-10', end: '2025-07-10' },
  { id: 't3', label: 'Test', start: '2025-07-05', end: '2025-07-25' },
  { id: 't4', label: 'Deploy', start: '2025-07-26', end: '2025-07-31' },
]

const depTasks = [
  { id: 't1', label: 'Research', start: '2025-06-01', end: '2025-06-10' },
  { id: 't2', label: 'Prototype', start: '2025-06-11', end: '2025-06-25' },
  { id: 't3', label: 'Build', start: '2025-06-26', end: '2025-07-20' },
  { id: 't4', label: 'Ship', start: '2025-07-21', end: '2025-07-31' },
]

const deps = [
  { from: 't1', to: 't2', type: 'finish-to-start' },
  { from: 't2', to: 't3', type: 'finish-to-start' },
  { from: 't3', to: 't4', type: 'finish-to-start' },
]

const milestoneTasks = [
  { id: 't1', label: 'Alpha build', start: '2025-06-01', end: '2025-06-20' },
  { id: 'm1', label: 'Alpha release', start: '2025-06-21', milestone: true },
  { id: 't2', label: 'Beta build', start: '2025-06-22', end: '2025-07-15' },
  { id: 'm2', label: 'Beta release', start: '2025-07-16', milestone: true },
]

const milestoneDeps = [
  { from: 't1', to: 'm1' },
  { from: 'm1', to: 't2' },
  { from: 't2', to: 'm2' },
]

const statusTasks = [
  { id: 't1', label: 'API integration', start: '2025-06-01', end: '2025-06-20', status: 'complete', progress: 100 },
  { id: 't2', label: 'Frontend pages', start: '2025-06-05', end: '2025-07-05', status: 'on-track', progress: 65 },
  { id: 't3', label: 'Auth system', start: '2025-06-10', end: '2025-06-28', status: 'at-risk', progress: 40 },
  { id: 't4', label: 'Deployment', start: '2025-06-20', end: '2025-07-10', status: 'behind', progress: 10 },
]

const groups = [
  { id: 'g1', label: 'Phase 1: Discovery' },
  { id: 'g2', label: 'Phase 2: Build' },
]

const groupTasks = [
  { id: 't1', label: 'User research', start: '2025-06-01', end: '2025-06-14', group: 'g1' },
  { id: 't2', label: 'Competitive audit', start: '2025-06-05', end: '2025-06-18', group: 'g1' },
  { id: 't3', label: 'Frontend', start: '2025-06-19', end: '2025-07-15', group: 'g2' },
  { id: 't4', label: 'Backend', start: '2025-06-19', end: '2025-07-20', group: 'g2' },
  { id: 't5', label: 'QA', start: '2025-07-21', end: '2025-07-31', group: 'g2' },
]

const progressTasks = [
  { id: 't1', label: 'Story A', start: '2025-06-01', end: '2025-06-20', progress: 80 },
  { id: 't2', label: 'Story B', start: '2025-06-05', end: '2025-06-25', progress: 50 },
  { id: 't3', label: 'Story C', start: '2025-06-10', end: '2025-06-30', progress: 20 },
]
</script>
