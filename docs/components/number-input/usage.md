---
layout: nubisco
title: Number Input
intro: '`NbNumberInput` is a numeric field with built-in stepper buttons (`−` and `+`). It shares the same design language as `NbTextInput` and `NbSelect`, with default and fluid variants.'
source: src/components/NumberInput.vue
tab: usage
pageTabs: ['usage', 'code']
---

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

## Validation states

<preview>
  <NbNumberInput v-model="value" label="Editors" error="Enter a valid number (max 4)" :min="1" :max="4" />
  <NbNumberInput v-model="value" label="Editors" warning="Value is near the maximum" :max="4" />
</preview>

## Disabled

<preview>
  <NbNumberInput v-model="value" label="Editors" disabled />
</preview>

<!--@include: ./_shared.md-->
