---
layout: nubisco
title: Interpolation Chart
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbInterpolationChart` visualises a piecewise-linear mapping between two numeric scales and lets users calibrate the curve by dragging, adding, or removing control points.

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

</doc-tab>

<doc-tab name="Api">

## Props

| Prop          | Type                    | Default | Description                                         |
| ------------- | ----------------------- | ------- | --------------------------------------------------- |
| `modelValue`  | `IInterpolationPoint[]` | `[]`    | The mapping points. Supports `v-model`.             |
| `inputLabel`  | `string`                | -       | Label for the X (input) axis                        |
| `outputLabel` | `string`                | -       | Label for the Y (output) axis                       |
| `inputMin`    | `number`                | `0`     | Minimum allowed input value                         |
| `inputMax`    | `number`                | `100`   | Maximum allowed input value                         |
| `outputMin`   | `number`                | `0`     | Minimum allowed output value                        |
| `outputMax`   | `number`                | `100`   | Maximum allowed output value                        |
| `editable`    | `boolean`               | `true`  | Enable drag, add, and remove interactions           |
| `minPoints`   | `number`                | `2`     | Minimum number of points (cannot remove below this) |
| `inputStep`   | `number`                | `0`     | Snap input values to this step (0 = no snap)        |
| `outputStep`  | `number`                | `0`     | Snap output values to this step (0 = no snap)       |
| `title`       | `string`                | -       | Chart title                                         |
| `subtitle`    | `string`                | -       | Secondary descriptive line                          |
| `height`      | `number \| string`      | `280`   | Container height                                    |
| `showTooltip` | `boolean`               | `true`  | Show tooltip on hover/drag                          |
| `showGrid`    | `boolean`               | `true`  | Render Y-axis gridlines                             |

## Events

| Event               | Payload                 | Description                               |
| ------------------- | ----------------------- | ----------------------------------------- |
| `update:modelValue` | `IInterpolationPoint[]` | Emitted after each edit (sorted by input) |

## Types

```typescript
interface IInterpolationPoint {
  input: number
  output: number
}
```

## Notes

- Points are always emitted sorted by `input` (ascending).
- While dragging, a point's input value is clamped between its neighbours so points never cross.
- The chart uses piecewise linear interpolation (straight lines between points), matching the actual interpolation algorithm used by devices.
- Input/output step snapping helps users land on clean values (e.g. 0.5C increments).

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const demoPoints = ref([
  { input: 18, output: 35 },
  { input: 20, output: 40 },
  { input: 22, output: 47 },
  { input: 24, output: 55 },
])

const staticPoints = [
  { input: 30, output: 25 },
  { input: 40, output: 35 },
  { input: 50, output: 50 },
  { input: 60, output: 65 },
  { input: 70, output: 75 },
]
</script>
