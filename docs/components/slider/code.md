---
layout: nubisco
title: Slider
intro: '`NbSlider` is a draggable range input with an optional `NbNumberInput` companion. It supports single-value and two-handle range modes.'
source: src/components/Slider.vue
tab: code
pageTabs: ['usage', 'code']
---

## Range mode

Set `:range="true"` and bind to a `[low, high]` array to enable two handles.

<preview>
  <NbSlider v-model="rangeValue" label="Price range" :min="0" :max="1000" :step="10" :range="true" style="width: 100%" />
</preview>

```vue
<template>
  <NbSlider
    v-model="range"
    label="Price range"
    :min="0"
    :max="1000"
    :step="10"
    :range="true"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const range = ref<[number, number]>([200, 800])
</script>
```

## Props

| Prop         | Type                         | Default | Description                                        |
| ------------ | ---------------------------- | ------- | -------------------------------------------------- |
| `modelValue` | `number \| [number, number]` | -       | Current value or `[low, high]` for range mode      |
| `label`      | `string`                     | -       | Label above the slider                             |
| `helper`     | `string`                     | -       | Helper text                                        |
| `error`      | `string`                     | -       | Error message — shows colored underline on track   |
| `warning`    | `string`                     | -       | Warning message — shows colored underline on track |
| `min`        | `number`                     | `0`     | Minimum value                                      |
| `max`        | `number`                     | `100`   | Maximum value                                      |
| `step`       | `number`                     | `1`     | Snap interval                                      |
| `range`      | `boolean`                    | `false` | Enables two-handle range mode                      |
| `disabled`   | `boolean`                    | `false` | Disables dragging and input editing                |
| `showInput`  | `boolean`                    | `true`  | Show `NbNumberInput` alongside the track           |

## Events

| Event               | Payload                      | Description                           |
| ------------------- | ---------------------------- | ------------------------------------- |
| `update:modelValue` | `number \| [number, number]` | Emitted while dragging and on release |
| `change`            | `number \| [number, number]` | Also emitted on every value change    |

## Interaction

- Click anywhere on the track to jump the nearest handle to that position.
- Drag a handle with mouse or touch.
- Edit the value directly in the `NbNumberInput`; the handle snaps to the new value.
- Values are always snapped to the nearest `step` increment.
- The number readout is rounded to the precision implied by `step` (a `step`
  of `0.01` shows two decimals), so an off-grid value passed in from outside,
  e.g. `0.35433`, reads as `0.35` instead of overflowing the field. The handle
  position still reflects the exact value.
- In range mode, the lower handle cannot cross the upper handle.

<!--@include: ./_shared.md-->
