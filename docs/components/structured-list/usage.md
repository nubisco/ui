---
layout: nubisco
title: Structured List
intro: '`NbStructuredList` is read-only rows under column headers: the roles of a project and who holds them, the sub-items of a record, a short comparison. It has no toolbar, no sorting, no selection and no paging, which is what makes it lighter than a data table for five rows.'
source: src/components/StructuredList.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<preview>
  <NbStructuredList :columns="roleColumns" :rows="roleRows" aria-label="Roles" style="width: 100%" />
</preview>

```vue
<NbStructuredList
  :columns="[
    { key: 'name', label: 'Role' },
    { key: 'people', label: 'People', width: '6rem', align: 'end' },
    { key: 'can', label: 'Can' },
  ]"
  :rows="roles"
  aria-label="Roles"
/>
```

## When to use it

| The list is                                          | Use                                                     |
| ---------------------------------------------------- | ------------------------------------------------------- |
| A few rows with the same facts, read across          | `NbStructuredList`                                      |
| Term and value pairs about one thing                 | [`NbDefinitionList`](/components/definition-list/usage) |
| One name and one line per row, in a small space      | [`NbContainedList`](/components/contained-list/usage)   |
| Anything sorted, filtered, selected, paged or edited | [`NbDataTable`](/components/data-table/usage)           |

Keep it short. Past a dozen rows, or a paragraph in a cell, the reader needs
the tools a data table has.

## Why not a `columns` prop on NbDefinitionList

A definition list is a `<dl>`: each row is one term and its value, about one
thing. A list with a header row is tabular data, several facts about several
things, and a screen reader should announce it as a table with column
headers. Bolting columns onto the `<dl>` would have given it the wrong
semantics, and `layout="columns"` already means something else there. What
the two components share is the safety rule: **the grid is on each row**, so a
row only ever lays out its own cells.

## Condensed and flush

`condensed` halves the space above and below each row, for a list inside a
dense panel. `flush` drops the padding at the edges, so the text lines up with
the heading and the paragraphs around the list.

<preview>
  <NbPanel title="Roles" style="width: 100%">
    <NbStructuredList :columns="roleColumns" :rows="roleRows" aria-label="Roles" condensed flush />
  </NbPanel>
</preview>

## On a phone

On a phone the rows stack: the first cell is the row's title and every other
cell carries its column header as a label. The header row goes, since its
labels are on the cells. Nothing changes on a desktop.

<!--@include: ./_shared.md-->
