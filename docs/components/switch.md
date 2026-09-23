---
layout: nubisco
title: Switch
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbSwitch` is a toggle control that represents an on/off binary state. It supports labels, sizes, variants, and a verbose mode that shows the current state as text.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbSwitch name="demo" v-bind="resultingProps" />
</preview>

```vue
<template>
  <NbSwitch v-model="enabled" name="notifications" label="Notifications" />
</template>
```

## Sizes

<preview dir="row">
  <NbSwitch name="sm" size="sm" label="Small" />
  <NbSwitch name="md" size="md" label="Medium" />
  <NbSwitch name="lg" size="lg" label="Large" />
</preview>

## Verbose mode

When `verbose` is enabled, the switch shows the current state as a text label (`On` / `Off`) alongside the toggle.

<preview dir="row">
  <NbSwitch name="verbose" verbose label="Verbose" />
</preview>

## Disabled

<preview dir="row">
  <NbSwitch name="dis1" disabled label="Disabled off" />
  <NbSwitch name="dis2" disabled :model-value="true" label="Disabled on" />
</preview>

</doc-tab>

<doc-tab name="Api">

## Props

| Prop         | Type                       | Default     | Description                        |
| ------------ | -------------------------- | ----------- | ---------------------------------- |
| `modelValue` | `boolean`                  | `false`     | Current state (`v-model`)          |
| `name`       | `string`                   | required    | Native `name` attribute            |
| `label`      | `string`                   | -           | Label text shown beside the toggle |
| `size`       | `'sm' \| 'md' \| 'lg'`     | `'md'`      | Toggle size                        |
| `variant`    | `'primary' \| 'secondary'` | `'primary'` | Color variant for the active state |
| `verbose`    | `boolean`                  | `false`     | Show `On` / `Off` state text       |
| `disabled`   | `boolean`                  | `false`     | Disable the toggle                 |

## Events

| Event               | Payload   | Description                        |
| ------------------- | --------- | ---------------------------------- |
| `update:modelValue` | `boolean` | Emitted when the toggle is clicked |

</doc-tab>

<script setup lang="ts">
const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    placeholder: 'The component label',
    default: 'Enable feature',
  },
  {
    label: 'Verbose',
    name: 'verbose',
    type: 'boolean',
    placeholder: 'Verbose mode',
    default: false,
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    placeholder: 'Disable component',
    default: false,
  },
  {
    label: 'Size',
    name: 'size',
    type: 'single',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
    ],
    default: 'md',
  },
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    options: [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
    ],
    default: 'primary',
  },
]
</script>
