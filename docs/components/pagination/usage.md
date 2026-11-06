---
layout: nubisco
title: Pagination
intro: '`NbPagination` is the footer companion for [`NbDataTable`](/components/data-table/usage), usable standalone. It is fully controlled: it emits `update:page` / `update:pageSize` and renders whatever `page`, `pageSize` and `total` you pass back, so the same wiring drives client-side slicing or server-side paging.'
source: src/components/Pagination.vue
tab: usage
pageTabs: ['usage', 'code']
---

## Density

`size` follows the shared `sm` / `md` / `lg` scale.

<preview dir="col">
  <NbPagination :page="1" :page-size="10" :total="50" size="sm" style="width: 100%" />
  <NbPagination :page="1" :page-size="10" :total="50" size="lg" style="width: 100%" />
</preview>

## Content

- **`itemLabel` is a plural noun** for what the rows are: `invoices`, `members`. The range reads `11-20 of 95 invoices`, so `items` is a fallback, not a choice.
- **`pageSizeLabel` keeps its colon**, because it introduces a control on the same line.
- **The range uses a hyphen**, never an en dash, and the numbers are numerals.
- **Translate the rest through the catalogue** (`paginationPageOf`, `paginationRange`, `paginationPrevious`), not by wrapping the component.

Casing, punctuation and tone are the fleet's, not this component's: [Writing style](/content/writing-style) is the source.

<!--@include: ./_shared.md-->
