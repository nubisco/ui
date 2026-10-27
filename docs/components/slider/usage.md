---
layout: nubisco
title: Slider
intro: '`NbSlider` is a draggable range input with an optional `NbNumberInput` companion. It supports single-value and two-handle range modes.'
source: src/components/Slider.vue
tab: usage
pageTabs: ['usage', 'code']
---

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

<!--@include: ./_shared.md-->
