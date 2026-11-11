---
layout: nubisco
title: Chip Group
intro: '`NbChipGroup` is one choice drawn as a row of chips: a scope or a filter that sits beside what it narrows, such as "All products" or a single product above a search field.'
source: src/components/ChipGroup.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'

const scope = ref('all')
const scopes = [
  { value: 'all', label: 'All products' },
  { value: 'docs', label: 'Docs' },
  { value: 'guides', label: 'Guides' },
  { value: 'api', label: 'API' },
]
</script>

<template>
  <NbChipGroup
    v-model="scope"
    :items="scopes"
    label="Limit search to a product"
  />
</template>
```

<preview>
  <NbChipGroup v-model="scope" :items="scopes" label="Limit search to a product" />
</preview>

## Sizes

`md` is 32px tall and sits under a field. `sm` is 24px, for a dense toolbar or a panel header.

<preview>
  <NbChipGroup v-model="scopeSm" :items="scopes" size="sm" label="Limit search to a product" />
</preview>

## Props

| Prop         | Type                       | Default | Description                                    |
| ------------ | -------------------------- | ------- | ---------------------------------------------- |
| `modelValue` | `string \| number \| null` | `null`  | The chosen chip's `value`. Supports `v-model`. |
| `items`      | `IChipGroupItem[]`         |         | The chips, in order.                           |
| `label`      | `string`                   |         | The group's accessible name. Required.         |
| `size`       | `'sm' \| 'md'`             | `'md'`  | 24px or 32px tall.                             |

## IChipGroupItem

| Field      | Type               | Description                   |
| ---------- | ------------------ | ----------------------------- |
| `value`    | `string \| number` | What `v-model` carries.       |
| `label`    | `string`           | The chip's text.              |
| `icon`     | `TIconSource`      | A 16px icon before the label. |
| `disabled` | `boolean`          | Shown, but cannot be chosen.  |

## Events

| Event               | Payload            | Description                                        |
| ------------------- | ------------------ | -------------------------------------------------- |
| `update:modelValue` | `string \| number` | A different chip was chosen.                       |
| `change`            | `string \| number` | Same moment, for a group not bound with `v-model`. |

<!--@include: ./_shared.md-->
