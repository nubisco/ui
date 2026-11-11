---
layout: nubisco
title: Search
intro: '`NbSearch` is the search field: a magnifying glass at the start, a clear button once there is a query, and Escape to clear it. It sits flush in a toolbar or a table header, and `expandable` folds it into a square button until it is wanted.'
source: src/components/Search.vue
tab: code
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Props

| Prop          | Type                           | Default   | Description                                                    |
| ------------- | ------------------------------ | --------- | -------------------------------------------------------------- |
| `modelValue`  | `string`                       | `''`      | The query (`v-model`)                                          |
| `expanded`    | `boolean`                      | `false`   | Whether an expandable search is open (`v-model:expanded`)      |
| `expandable`  | `boolean`                      | `false`   | Folds to a square icon-only button until it is wanted          |
| `size`        | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'`    | The shared control height                                      |
| `label`       | `string`                       | catalogue | The field's accessible name and the collapsed button's tooltip |
| `placeholder` | `string`                       | catalogue | Placeholder text                                               |
| `disabled`    | `boolean`                      | `false`   | Disables the field or the collapsed button                     |
| `id`          | `string`                       | auto      | The native input's id                                          |
| `name`        | `string`                       | -         | The native input's name                                        |

`label` and `placeholder` default to the string catalogue's `searchLabel` and `searchPlaceholder` ("Search"). The clear button's name is `textInputClear`.

## Events

| Event               | Payload   | Description                                    |
| ------------------- | --------- | ---------------------------------------------- |
| `update:modelValue` | `string`  | On every keystroke, and when cleared           |
| `update:expanded`   | `boolean` | When an expandable search opens or folds       |
| `clear`             | -         | The query was cleared, by the button or Escape |
| `search`            | `string`  | Enter was pressed in the field                 |

## Exposed

| Name    | Type         | Description                                           |
| ------- | ------------ | ----------------------------------------------------- |
| `focus` | `() => void` | Focuses the field, opening an expandable search first |

## Filtering a table

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

const query = ref('')
const visible = computed(() =>
  invoices.value.filter((row) =>
    row.customer.toLowerCase().includes(query.value.toLowerCase()),
  ),
)
</script>

<template>
  <NbSearch v-model="query" size="sm" placeholder="Search invoices" />
  <NbDataTable :rows="visible" :columns="columns" size="sm" />
</template>
```

<!--@include: ./_shared.md-->
