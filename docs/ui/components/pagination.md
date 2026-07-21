---
layout: nubisco
title: Pagination
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbPagination` is the footer companion for [`NbDataTable`](/ui/components/data-table), usable standalone. It is fully controlled: it emits `update:page` / `update:pageSize` and renders whatever `page`, `pageSize` and `total` you pass back, so the same wiring drives client-side slicing or server-side paging.

## Basic Usage

<preview>
  <NbPagination
    :page="page"
    :page-size="pageSize"
    :total="240"
    v-model:page="page"
    @update:page-size="onPageSize"
    style="width: 100%"
  />
</preview>

```vue
<template>
  <NbPagination
    :page="page"
    :page-size="pageSize"
    :total="240"
    v-model:page="page"
    @update:page-size="onPageSize"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const page = ref(1)
const pageSize = ref(10)

function onPageSize(size: number) {
  pageSize.value = size
  page.value = 1 // NbPagination already emits update:page(1) too
}
</script>
```

## Page size options & labels

Customise the selectable page sizes with `pageSizeOptions`, and the copy with `pageSizeLabel` and `itemLabel`.

<preview>
  <NbPagination
    :page="page2"
    :page-size="pageSize2"
    :total="88"
    :page-size-options="[5, 15, 25]"
    page-size-label="Rows:"
    item-label="records"
    v-model:page="page2"
    @update:page-size="pageSize2 = $event"
    style="width: 100%"
  />
</preview>

```vue
<NbPagination
  :page="page"
  :page-size="pageSize"
  :total="88"
  :page-size-options="[5, 15, 25]"
  page-size-label="Rows:"
  item-label="records"
  v-model:page="page"
  @update:page-size="pageSize = $event"
/>
```

## Density

`size` follows the shared `sm` / `md` / `lg` scale.

<preview dir="col">
  <NbPagination :page="1" :page-size="10" :total="50" size="sm" style="width: 100%" />
  <NbPagination :page="1" :page-size="10" :total="50" size="lg" style="width: 100%" />
</preview>

</doc-tab>

<doc-tab name="Api">

## Props

| Prop              | Type                   | Default                | Description                           |
| ----------------- | ---------------------- | ---------------------- | ------------------------------------- |
| `page`            | `number`               | required               | Current 1-based page number           |
| `pageSize`        | `number`               | required               | Rows shown per page                   |
| `total`           | `number`               | required               | Total number of rows across all pages |
| `pageSizeOptions` | `number[]`             | `[10, 20, 30, 40, 50]` | Selectable page sizes                 |
| `size`            | `'sm' \| 'md' \| 'lg'` | `'md'`                 | Control density                       |
| `disabled`        | `boolean`              | `false`                | Disables all controls                 |
| `pageSizeLabel`   | `string`               | `'Items per page:'`    | Label before the page-size select     |
| `itemLabel`       | `string`               | `'items'`              | Noun used in the range read-out       |

## Events

| Event             | Payload  | Description                                          |
| ----------------- | -------- | ---------------------------------------------------- |
| `update:page`     | `number` | New 1-based page (`v-model:page`)                    |
| `update:pageSize` | `number` | New page size (`v-model:pageSize`); page resets to 1 |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const page = ref(1)
const pageSize = ref(10)
function onPageSize(size) {
  pageSize.value = size
  page.value = 1
}

const page2 = ref(1)
const pageSize2 = ref(5)
</script>
