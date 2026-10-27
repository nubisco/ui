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

<!--@include: ./_shared.md-->
