---
layout: nubisco
title: Radio
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbRadio` renders a group of radio button inputs for single-choice selection. Radio buttons in the same group share a `name` attribute, ensuring only one can be active at a time.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbRadio v-model="selected" name="demo" v-bind="resultingProps" :options="options" />
</preview>

```vue
<template>
  <NbRadio
    v-model="size"
    name="size"
    label="Choose your size"
    :options="[
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
      { label: 'Large', value: 'lg' },
    ]"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const size = ref('')
</script>
```

## Without group label

The `label` prop is optional. Omit it when the context makes the purpose clear.

<preview>
  <NbRadio v-model="color" name="color" :options="colorOptions" />
</preview>

## Multiple groups

Each group must have a unique `name` to function independently.

<preview>
  <NbRadio v-model="plan" name="plan" label="Billing plan" :options="planOptions" />
  <NbRadio v-model="cycle" name="cycle" label="Billing cycle" :options="cycleOptions" />
</preview>

```vue
<template>
  <NbRadio
    v-model="plan"
    name="plan"
    label="Billing plan"
    :options="planOptions"
  />
  <NbRadio
    v-model="cycle"
    name="cycle"
    label="Billing cycle"
    :options="cycleOptions"
  />
</template>
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop         | Type       | Default     | Description                           |
| ------------ | ---------- | ----------- | ------------------------------------- |
| `modelValue` | `string`   | `undefined` | The selected option value (`v-model`) |
| `name`       | `string`   | required    | `name` attribute shared by the group  |
| `options`    | `Option[]` | `[]`        | Array of radio button options         |
| `label`      | `string`   | `undefined` | Optional group label                  |

## Option interface

```typescript
interface Option {
  label: string // Display text
  value: string // Option value
}
```

## Events

| Event               | Payload  | Description                        |
| ------------------- | -------- | ---------------------------------- |
| `update:modelValue` | `string` | Emitted when the selection changes |

## Accessibility

- Radio buttons are grouped by a shared `name` attribute.
- Keyboard navigation: `Arrow` keys to move between options, `Space` to select.
- Provide a `label` whenever the group purpose isn't obvious from surrounding context.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const selected = ref('')
const color = ref('')
const plan = ref('')
const cycle = ref('')

const options = [
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
]

const colorOptions = [
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
]

const planOptions = [
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
]

const cycleOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annually', value: 'annually' },
]

const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Choose an option',
    placeholder: 'Group label text',
  },
]
</script>
