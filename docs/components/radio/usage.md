---
layout: nubisco
title: Radio
intro: '`NbRadio` renders a group of radio button inputs for single-choice selection. Radio buttons in the same group share a `name` attribute, ensuring only one can be active at a time.'
source: src/components/Radio.vue
tab: usage
pageTabs: ['usage', 'code']
---

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

<!--@include: ./_shared.md-->
