---
layout: nubisco
title: Data Table
intro: '`NbDataTable` is a presentational, data-driven table for read-mostly application lists. It ships full `<table>` semantics, controlled sorting, row selection, loading / empty / error states, density options, a sticky header with horizontal scroll, and a companion `NbPagination` footer.'
source: src/components/DataTable.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

It is deliberately **not** an editable spreadsheet. When cells need in-place editing, reach for [`NbSpreadsheet`](/labs/spreadsheet) instead.

## Live demo

<preview>
  <NbDataTable
    :columns="columns"
    :rows="rows"
    row-key="id"
    title="Team members"
    description="People with access to this workspace."
    style="width: 100%"
  >
    <template #toolbar-actions>
      <NbButton variant="primary" icon="plus">New</NbButton>
    </template>
    <template #row-actions>
      <NbButton variant="ghost" size="sm">Open</NbButton>
      <NbButton variant="ghost" size="sm">Delete</NbButton>
    </template>
  </NbDataTable>
</preview>

## Content

- **Column titles are one or two words**, sentence case, nouns: `Owner`, `Last updated`. A unit goes in the title, not in every cell: `Size (MB)`.
- **A long cell keeps its full text reachable.** Headers and cells do not wrap, so a clipped value needs a `title` or a tooltip, or a narrower neighbouring column.
- **Empty and failed are different sentences.** `empty-message` names what is missing (`No invoices yet`). A failed load passes `error` (or `error: true` for the default `Could not load the data`), never the empty copy.
- **Batch actions are verb phrases**, and the selection count is the catalogue's `12 selected`, not a sentence you build.

Casing, punctuation and tone are set library-wide, not by this component: [Writing style](/content/writing-style) is the source.

<!--@include: ./_shared.md-->
