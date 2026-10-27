---
layout: nubisco
title: JSON Tree
intro: '`NbJsonTree` renders any JSON-compatible value as an interactive, collapsible tree. It supports objects, arrays and primitives (`string`, `number`, `boolean`, `null`), and can optionally be made editable via `v-model`.'
source: src/components/JsonTree.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview>
  <NbJsonTree v-model="sample" title="payload" />
</preview>

```vue
<template>
  <NbJsonTree v-model="payload" title="payload" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const payload = ref({
  name: 'Ada Lovelace',
  active: true,
  score: 99,
  tags: ['math', 'engineering'],
  meta: null,
})
</script>
```

## Starting collapsed

Use `start-collapsed` when the payload is large and you want the user to expand nodes on demand.

<preview>
  <NbJsonTree v-model="sample" title="payload" start-collapsed />
</preview>

## Read-only inspection

Without `editable`, `NbJsonTree` is a pure inspector, useful for debugging API responses, displaying configuration, or rendering log payloads.

<preview>
  <NbJsonTree :model-value="readOnlySample" title="config" />
</preview>

<!--@include: ./_shared.md-->
