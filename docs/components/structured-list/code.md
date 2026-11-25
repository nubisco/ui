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

## Columns sized by their content

A column with `width: 'auto'` is as wide as its widest cell in any row, the
header included, so it lines up from the first row to the last. The list holds
the column tracks and every row is a subgrid of them: each row still lays out
only its own cells, and the tracks are measured once for the whole list. The
`minmax(0, 1fr)` columns share what is left.

<preview>
  <NbStructuredList :columns="fileColumns" :rows="fileRows" aria-label="Files" class="structured-list-auto-demo" style="width: 100%" />
</preview>

```vue
<NbStructuredList
  :columns="[
    { key: 'path', label: 'File', width: 'auto' },
    { key: 'owner', label: 'Owner', width: 'auto' },
    { key: 'note', label: 'Note' },
  ]"
  :rows="files"
  aria-label="Files"
/>
```

## Slots

| Slot         | Props            | Description                 |
| ------------ | ---------------- | --------------------------- |
| `cell-{key}` | `{ row, value }` | Replaces one column's cell. |

<!--@include: ./_shared.md-->
