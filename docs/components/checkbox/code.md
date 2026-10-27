---
layout: nubisco
title: Checkbox
intro: '`NbCheckbox` provides a clean, accessible checkbox input with optional label support and two-way binding via `v-model`.'
source: src/components/Checkbox.vue
tab: code
pageTabs: ['usage', 'code']
---

## Checkbox group

Wrap related checkboxes in `NbCheckboxGroup` to get a group label, consistent
stacking, validation messages, and group-level `disabled` state, matching what
`NbRadio` provides for radio buttons.

<preview>
  <NbCheckboxGroup label="Interests" helper="Pick as many as you like">
    <NbCheckbox v-model="interests.web" label="Web Development" />
    <NbCheckbox v-model="interests.mobile" label="Mobile Development" />
    <NbCheckbox v-model="interests.design" label="UI/UX Design" />
    <NbCheckbox v-model="interests.backend" label="Backend Development" />
  </NbCheckboxGroup>
</preview>

```vue
<template>
  <NbCheckboxGroup label="Interests" helper="Pick as many as you like">
    <NbCheckbox v-model="interests.web" label="Web Development" />
    <NbCheckbox v-model="interests.mobile" label="Mobile Development" />
    <NbCheckbox v-model="interests.design" label="UI/UX Design" />
  </NbCheckboxGroup>
</template>
```

## Group validation

`error`, `warning` and `helper` are controlled props: bind them to your own
validation state and the message (and red styling) clears as soon as the
condition is met.

<preview>
  <NbCheckboxGroup label="Required consent" :error="consentError">
    <NbCheckbox v-model="consent" label="Terms of service" />
  </NbCheckboxGroup>
</preview>

```vue
<template>
  <NbCheckboxGroup label="Required consent" :error="consentError">
    <NbCheckbox v-model="consent" label="Terms of service" />
  </NbCheckboxGroup>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const consent = ref(false)
const consentError = computed(() =>
  consent.value ? undefined : 'You must accept the terms',
)
</script>
```

## Props

| Prop            | Type      | Default     | Description                                        |
| --------------- | --------- | ----------- | -------------------------------------------------- |
| `modelValue`    | `boolean` | `false`     | The checked state (`v-model`)                      |
| `label`         | `string`  | `undefined` | Optional label text to display                     |
| `disabled`      | `boolean` | `false`     | Prevents interaction and dims the control          |
| `indeterminate` | `boolean` | `false`     | Shows a dash instead of a tick ("select all" rows) |

## NbCheckboxGroup props

| Prop        | Type                         | Default      | Description                                            |
| ----------- | ---------------------------- | ------------ | ------------------------------------------------------ |
| `label`     | `string`                     | `undefined`  | Group label rendered above the checkboxes              |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Stacking direction of the checkboxes                   |
| `disabled`  | `boolean`                    | `false`      | Disables every checkbox in the group                   |
| `error`     | `string`                     | `undefined`  | Validation error, takes precedence over other messages |
| `warning`   | `string`                     | `undefined`  | Non-blocking caution message                           |
| `helper`    | `string`                     | `undefined`  | Contextual hint below the group                        |

## Events

| Event               | Payload   | Description                         |
| ------------------- | --------- | ----------------------------------- |
| `update:modelValue` | `boolean` | Emitted when checkbox state changes |

## Accessibility

- The label is properly associated with the input via the `for` attribute.
- Keyboard navigation: `Space` toggles the checkbox.
- Focus indicators are provided for keyboard users.

<!--@include: ./_shared.md-->
