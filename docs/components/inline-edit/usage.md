---
layout: nubisco
title: Inline Edit
intro: '`NbInlineEdit` renders a value as plain text until the user chooses to edit it. Clicking the text (or pressing Enter while it has focus) swaps in an input; Enter or blur commits, Escape restores the value the edit started from. Use it wherever a permanently-rendered input would misrepresent the surface: item and record titles, dialog headings, card names.'
source: src/components/InlineEdit.vue
tab: usage
pageTabs: ['usage', 'code']
---

Presentation mode wraps long values instead of truncating them, which is the point: a title should read as a title, not as a form field that happens to be full.

<preview>
  <NbInlineEdit v-model="title" label="Item title" size="xl" />
</preview>

```vue
<template>
  <NbInlineEdit v-model="title" label="Item title" size="xl" @commit="save" />
</template>

<script setup>
import { ref } from 'vue'

const title = ref('Migrate corporate blocks onto the primitives')

function save(value) {
  // Persist. `update:modelValue` fired live while typing; `commit` fires
  // once, when the edit ends via Enter or blur.
}
</script>
```

## Sizes

`size` sets the type scale of both modes so nothing jumps when the input swaps in: `md` (body), `lg` (section heading), `xl` (page/dialog title).

<preview>
  <div style="display: grid; gap: 8px; width: 100%">
    <NbInlineEdit v-model="bodyLine" label="Body line" size="md" />
    <NbInlineEdit v-model="sectionTitle" label="Section title" size="lg" />
    <NbInlineEdit v-model="pageTitle" label="Page title" size="xl" />
  </div>
</preview>

<!--@include: ./_shared.md-->
