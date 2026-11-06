---
layout: nubisco
title: Structured List
intro: '`NbStructuredList` is read-only rows under column headers: the roles of a project and who holds them, the sub-items of a record, a short comparison. It has no toolbar, no sorting, no selection and no paging, which is what makes it lighter than a data table for five rows.'
source: src/components/StructuredList.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

- The list is `role="table"`, with a `rowgroup` for the header and one for
  the body, `row`s, `columnheader`s and `cell`s. A screen reader announces it
  as a table and reads each cell with its column header.
- Name it with `aria-label`, or with `aria-labelledby` pointing at the heading
  above it.
- It holds nothing interactive of its own, so it adds nothing to the tab
  order. A link in a cell slot is reached as any link is.
- On a phone each cell after the first carries its column header as visible
  text, so the stacked rows read the same with and without a screen reader.
- An empty value is a dash, not a blank cell, so a missing fact is announced
  rather than skipped.
