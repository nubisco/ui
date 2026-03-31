---
layout: nubisco
title: Checkbox
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbCheckbox` provides a clean, accessible checkbox input with optional label support and two-way binding via `v-model`.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbCheckbox v-model="checked" v-bind="resultingProps" />
</preview>

```vue
<template>
  <NbCheckbox v-model="agreed" label="I agree to the terms and conditions" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const agreed = ref(false)
</script>
```

## Without label

<preview>
  <NbCheckbox v-model="checked" />
</preview>

## Multiple checkboxes

<preview>
  <NbCheckbox v-model="interests.web" label="Web Development" />
  <NbCheckbox v-model="interests.mobile" label="Mobile Development" />
  <NbCheckbox v-model="interests.design" label="UI/UX Design" />
  <NbCheckbox v-model="interests.backend" label="Backend Development" />
</preview>

```vue
<template>
  <NbCheckbox v-model="interests.web" label="Web Development" />
  <NbCheckbox v-model="interests.mobile" label="Mobile Development" />
  <NbCheckbox v-model="interests.design" label="UI/UX Design" />
</template>
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop         | Type      | Default     | Description                    |
| ------------ | --------- | ----------- | ------------------------------ |
| `modelValue` | `boolean` | `false`     | The checked state (`v-model`)  |
| `label`      | `string`  | `undefined` | Optional label text to display |

## Events

| Event               | Payload   | Description                         |
| ------------------- | --------- | ----------------------------------- |
| `update:modelValue` | `boolean` | Emitted when checkbox state changes |

## Accessibility

- The label is properly associated with the input via the `for` attribute.
- Keyboard navigation: `Space` toggles the checkbox.
- Focus indicators are provided for keyboard users.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const checked = ref(false)

const interests = ref({
  web: true,
  mobile: false,
  design: false,
  backend: false,
})

const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Accept terms',
    placeholder: 'Label text',
  },
]
</script>
