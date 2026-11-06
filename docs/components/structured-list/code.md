---
layout: nubisco
title: Structured List
intro: '`NbStructuredList` is read-only rows under column headers: the roles of a project and who holds them, the sub-items of a record, a short comparison. It has no toolbar, no sorting, no selection and no paging, which is what makes it lighter than a data table for five rows.'
source: src/components/StructuredList.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Cells with markup

Each column has a slot, `cell-{key}`, that receives the row and the value.

<preview>
  <NbStructuredList :columns="roleColumns" :rows="roleRows" aria-label="Roles" style="width: 100%">
    <template #cell-people="{ value }">
      <NbBadge size="sm" variant="grey">{{ value }}</NbBadge>
    </template>
  </NbStructuredList>
</preview>

```vue
<NbStructuredList :columns="columns" :rows="roles" aria-label="Roles">
  <template #cell-people="{ value }">
    <NbBadge size="sm" variant="grey">{{ value }}</NbBadge>
  </template>
</NbStructuredList>
```

## Props

| Prop        | Type                            | Default     | Description                                         |
| ----------- | ------------------------------- | ----------- | --------------------------------------------------- |
| `columns`   | `IStructuredListColumn[]`       | required    | `{ key, label, width?, align? }`, in reading order. |
| `rows`      | `Record<string, unknown>[]`     | required    | The rows, read by column `key`.                     |
| `rowKey`    | `string \| (row, index) => key` | `'id'`      | What identifies a row. Falls back to the index.     |
| `condensed` | `boolean`                       | `false`     | 8px above and below each row instead of 16px.       |
| `flush`     | `boolean`                       | `false`     | No inline padding at the edges.                     |
| `ariaLabel` | `string`                        | `undefined` | The list's accessible name.                         |
| `empty`     | `string`                        | `'–'`       | Shown in a cell with no value.                      |

A column's `width` is a CSS grid track (`'6rem'`, `'auto'`), and defaults to
`minmax(0, 1fr)`. `align: 'end'` right-aligns a column of figures with tabular
numerals.

## Slots

| Slot         | Props            | Description                 |
| ------------ | ---------------- | --------------------------- |
| `cell-{key}` | `{ row, value }` | Replaces one column's cell. |

<!--@include: ./_shared.md-->
