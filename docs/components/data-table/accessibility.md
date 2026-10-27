---
layout: nubisco
title: Data Table
intro: '`NbDataTable` is a presentational, data-driven table for read-mostly application lists. It ships full `<table>` semantics, controlled sorting, row selection, loading / empty / error states, density options, a sticky header with horizontal scroll, and a companion `NbPagination` footer.'
source: src/components/DataTable.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- Renders a real `<table>` with `<th scope="col">` header cells and a `<colgroup>` for widths.
- Sortable headers are `<button>`s inside the `<th>` and expose `aria-sort` (`ascending` / `descending` / `none`), so sorting works with keyboard and screen readers.
- Selection controls are labelled checkboxes / radios; selected rows carry `aria-selected`.
- The table exposes `aria-busy` while loading, and uses `aria-label` (from `ariaLabel` or `title`).
- Clickable rows (with a `row-click` listener) are focusable with `tabindex="0"` and keep their native row role, so the table is still a table and a screen reader names the focused row from its cells. Enter and Space activate the row, and a key pressed on a control inside the row (a checkbox, a row action, a link in a cell) belongs to that control. The row draws a 2px `--nb-c-focus-ring` outline on keyboard focus.
- Expandable rows: the toggle is a `<button>` with `aria-expanded`, and while the row is open, `aria-controls` points at the detail. The detail is a `region` inside a full-width cell, so the cell stays a table cell. The toggle and the region are both named after the row's title column (`Details for Ada Lovelace`), the same column a phone card uses as its title, so a screen reader hears whose details they are. The header cell of the toggle column has a visually hidden "Row details" label. Focus stays on the toggle when the row opens or closes.
- Stacked on a phone, the table, rows and cells carry explicit `table`, `row` and `cell` roles, because the change of `display` that makes the cards would otherwise strip the table semantics in some browsers.

<!--@include: ./_shared.md-->
