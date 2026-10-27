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

<!--@include: ./_shared.md-->
