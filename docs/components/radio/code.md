---
layout: nubisco
title: Radio
intro: '`NbRadio` renders a group of radio button inputs for single-choice selection. Radio buttons in the same group share a `name` attribute, ensuring only one can be active at a time.'
source: src/components/Radio.vue
tab: code
pageTabs: ['usage', 'code']
---

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

<!--@include: ./_shared.md-->
