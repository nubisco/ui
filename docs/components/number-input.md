---
layout: nubisco
title: Number Input
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbNumberInput` is a numeric field with built-in stepper buttons (`−` and `+`). It shares the same design language as `NbTextInput` and `NbSelect`, with default and fluid variants.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbNumberInput v-model="value" v-bind="resultingProps" />
</preview>

```vue
<template>
  <NbNumberInput v-model="quantity" label="Quantity" :min="1" :max="10" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const quantity = ref(1)
</script>
```

## Variants

### Default

The label sits above the field. Steppers are at the trailing edge.

<preview>
  <NbNumberInput v-model="value" label="Editors" helper="Maximum of 4" :min="1" :max="4" />
</preview>

### Fluid

The label and optional helper icon live inside the field at the top. Useful in dense forms.

<preview>
  <NbNumberInput v-model="value" variant="fluid" label="Editors" helper="Maximum of 4" :min="1" :max="4" />
</preview>

```vue
<template>
  <NbNumberInput
    v-model="count"
    variant="fluid"
    label="Editors"
    :min="1"
    :max="4"
  />
</template>
```

## Validation states

<preview>
  <NbNumberInput v-model="value" label="Editors" error="Enter a valid number (max 4)" :min="1" :max="4" />
  <NbNumberInput v-model="value" label="Editors" warning="Value is near the maximum" :max="4" />
</preview>

## Disabled

<preview>
  <NbNumberInput v-model="value" label="Editors" disabled />
</preview>

</doc-tab>

<doc-tab name="Api">

## Props

| Prop          | Type                   | Default     | Description                                 |
| ------------- | ---------------------- | ----------- | ------------------------------------------- |
| `modelValue`  | `number \| null`       | `null`      | Current value (`v-model`)                   |
| `label`       | `string`               | -           | Label text                                  |
| `placeholder` | `string`               | -           | Placeholder shown when value is empty       |
| `helper`      | `string`               | -           | Helper text below the field                 |
| `error`       | `string`               | -           | Error message — triggers error state        |
| `warning`     | `string`               | -           | Warning message — triggers warning state    |
| `min`         | `number`               | -           | Minimum allowed value                       |
| `max`         | `number`               | -           | Maximum allowed value                       |
| `step`        | `number`               | `1`         | Increment/decrement amount per button press |
| `variant`     | `'default' \| 'fluid'` | `'default'` | Layout variant                              |
| `disabled`    | `boolean`              | `false`     | Disables the field and buttons              |
| `required`    | `boolean`              | `false`     | Marks the field as required (adds `*`)      |
| `id`          | `string`               | auto        | Native input id (auto-generated if omitted) |

## Events

| Event               | Payload          | Description                        |
| ------------------- | ---------------- | ---------------------------------- |
| `update:modelValue` | `number \| null` | Emitted on every value change      |
| `change`            | `number \| null` | Also emitted on every value change |

## Exposed

```typescript
const inputRef = ref<InstanceType<typeof NbNumberInput>>()
inputRef.value?.focus()
```

## Behavior

- The user can type directly into the field. The value is clamped to `min`/`max` on blur or Enter.
- The `−` button is dimmed when the value equals `min`.
- The `+` button is dimmed when the value equals `max`.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const value = ref(2)

const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Quantity',
    placeholder: 'Label text',
  },
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    default: 'default',
    placeholder: 'Layout variant',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Fluid', value: 'fluid' },
    ],
  },
  {
    label: 'Helper',
    name: 'helper',
    type: 'string',
    default: '',
    placeholder: 'Helper text',
  },
  {
    label: 'Error',
    name: 'error',
    type: 'string',
    default: undefined,
    placeholder: 'Error message',
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    default: false,
    placeholder: 'Disable the field',
  },
  {
    label: 'Required',
    name: 'required',
    type: 'boolean',
    default: false,
    placeholder: 'Mark as required',
  },
]
</script>
