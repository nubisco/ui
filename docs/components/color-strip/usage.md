---
layout: nubisco
title: Color Strip
intro: '`NbColorStrip` is a row of color swatches that acts as a color picker. It supports single selection, multi-selection, wrapping into a square grid, a null/clear option, and a view-only mode.'
source: src/components/ColorStrip.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbColorStrip v-bind="resultingProps" v-model="singleModel" />
</preview>

```vue
<template>
  <NbColorStrip v-model="color" label="Theme Color" :options="options" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const color = ref('')
const options = [
  { value: 'grape', color: '#5c35c4' },
  { value: 'emerald', color: '#4acf7b' },
  { value: 'ocean', color: '#214da6' },
]
</script>
```

## View-only mode

Use `onlyView` to display the selected color without allowing interaction.

<preview>
  <NbColorStrip v-model="singleModel" :options="[singleModel]" onlyView />
</preview>

<!--@include: ./_shared.md-->
