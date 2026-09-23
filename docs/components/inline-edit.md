---
layout: nubisco
title: Inline Edit
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbInlineEdit` renders a value as plain text until the user chooses to edit it. Clicking the text (or pressing Enter while it has focus) swaps in an input; Enter or blur commits, Escape restores the value the edit started from. Use it wherever a permanently-rendered input would misrepresent the surface: item and record titles, dialog headings, card names.

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

## Empty values

With an empty value the `placeholder` renders muted in presentation mode, so the affordance stays discoverable.

<preview>
  <NbInlineEdit v-model="subtitle" label="Subtitle" placeholder="Add a subtitle..." />
</preview>

```vue
<NbInlineEdit
  v-model="subtitle"
  label="Subtitle"
  placeholder="Add a subtitle..."
/>
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop          | Type                   | Default | Description                                  |
| ------------- | ---------------------- | ------- | -------------------------------------------- |
| `modelValue`  | `string`               | —       | Current value                                |
| `label`       | `string`               | —       | Accessible name; required                    |
| `placeholder` | `string`               | —       | Muted text when the value is empty           |
| `size`        | `'md' \| 'lg' \| 'xl'` | `'md'`  | Type scale of presentation and edit modes    |
| `disabled`    | `boolean`              | `false` | Presentation only; editing cannot be entered |

## Events

| Event               | Payload  | When                                      |
| ------------------- | -------- | ----------------------------------------- |
| `update:modelValue` | `string` | Live, on every keystroke while editing    |
| `commit`            | `string` | Enter or blur ended the edit              |
| `cancel`            | —        | Escape ended the edit; the value reverted |

## Exposed

| Member    | Description                      |
| --------- | -------------------------------- |
| `start()` | Enter edit mode programmatically |

## Accessibility

- Presentation mode is a real `button` whose accessible name carries the label, the current value, and the edit affordance.
- The input takes the `label` as its `aria-label`, receives focus with the value selected, and hands focus back naturally on commit.
- `disabled` keeps the text readable while removing the interactive affordance.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const title = ref('Migrate corporate blocks onto the primitives')
const bodyLine = ref('A body-scale value')
const sectionTitle = ref('A section heading')
const pageTitle = ref('A page title')
const subtitle = ref('')
</script>
