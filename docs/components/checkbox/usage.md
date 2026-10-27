---
layout: nubisco
title: Checkbox
intro: '`NbCheckbox` provides a clean, accessible checkbox input with optional label support and two-way binding via `v-model`.'
source: src/components/Checkbox.vue
tab: usage
pageTabs: ['usage', 'code']
---

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

## Horizontal group

<preview>
  <NbCheckboxGroup label="Notifications" direction="horizontal">
    <NbCheckbox v-model="channels.email" label="Email" />
    <NbCheckbox v-model="channels.sms" label="SMS" />
    <NbCheckbox v-model="channels.push" label="Push" />
  </NbCheckboxGroup>
</preview>

<!--@include: ./_shared.md-->
