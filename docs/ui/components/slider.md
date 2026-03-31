---
layout: nubisco
title: Slider
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbSlider` is a draggable range input with an optional `NbNumberInput` companion. It supports single-value and two-handle range modes.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbSlider v-model="value" v-bind="resultingProps" style="width: 100%" />
</preview>

```vue
<template>
  <NbSlider v-model="volume" label="Volume" :min="0" :max="100" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const volume = ref(50)
</script>
```

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

## Without number input

Hide the companion input when screen space is tight or the precise value is not important.

<preview>
  <NbSlider v-model="value" label="Brightness" :show-input="false" style="width: 100%" />
</preview>

## Validation states

<preview>
  <NbSlider v-model="value" label="Budget" error="Value exceeds limit" style="width: 100%" />
  <NbSlider v-model="value" label="Budget" warning="Approaching limit" style="width: 100%" />
</preview>

</doc-tab>

<doc-tab name="Api">

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
- In range mode, the lower handle cannot cross the upper handle.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const value = ref(50)
const rangeValue = ref<[number, number]>([200, 800])

const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Volume',
    placeholder: 'Label above the slider',
  },
  {
    label: 'Min',
    name: 'min',
    type: 'string',
    default: '0',
    placeholder: 'Minimum value',
  },
  {
    label: 'Max',
    name: 'max',
    type: 'string',
    default: '100',
    placeholder: 'Maximum value',
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    default: false,
    placeholder: 'Disable the slider',
  },
  {
    label: 'Show input',
    name: 'showInput',
    type: 'boolean',
    default: true,
    placeholder: 'Show number input alongside the track',
  },
]
</script>
