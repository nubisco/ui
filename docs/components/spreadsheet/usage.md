---
layout: nubisco
title: Spreadsheet
intro: '`NbSpreadsheet` is an editable grid of cells for data people key in: dense rows, a sticky header, row numbers or labels in a gutter, keyboard entry like a desktop spreadsheet, range selection, clipboard, and undo. The app owns the data: the sheet renders it, captures input and emits the changes.'
source: src/components/Spreadsheet.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

Use it when people edit many values in place: hours per day, quantities per month, a budget. For a list people read, sort and act on row by row, use [`NbDataTable`](/components/data-table/usage) instead.

<preview>
  <NbSpreadsheet
    :columns="basicColumns"
    :rows="basicRows"
    aria-label="Parts"
    @commit="onBasicCommit"
  />
</preview>

## The data stays in the app

The sheet never changes a value itself. A typed value, a paste, a cleared range, an undo: each emits `commit` for every cell and `change` once with the batch, and the app writes them into its own rows. Derived cells come from a `computed` callback the app supplies, so totals and formulas live with the data, in a store, a worker or a server.

## Sizes

Carbon's row heights, with the header as tall as a row: `xs` (24px), `sm` (32px, the default), `md` (40px) and `lg` (48px). Keep one size per screen. A sheet people key into all day is `sm`, and `xs` suits a reference grid read more than edited.

<preview>
  <NbSpreadsheet
    :columns="basicColumns"
    :rows="basicRows"
    size="md"
    aria-label="Parts, medium rows"
  />
</preview>

## Row labels in the gutter

The gutter numbers the rows by default. When rows have names of their own, such as the days of a month or the totals under them, give each row a `label` and the gutter shows it instead. The sheet then needs no read-only column to carry the name, and the arrow keys never stop on one. Widen the gutter with `gutter-width` to fit the longest label.

<preview>
  <NbSpreadsheet
    :columns="labelColumns"
    :rows="labelRows"
    :gutter-width="96"
    :computed="computeLabelTotal"
    aria-label="Hours by day"
    @commit="onLabelCommit"
  />
</preview>

## Totals and other derived rows

Mark a row `computed: true` and pin it to the bottom, and supply a `computed` callback that returns its values. Computed cells are read-only and set in semibold on the plain surface, so they read as results, not inputs. Rows pinned to the same edge stack, so two totals rows both stay in view.

<preview>
  <NbSpreadsheet
    :columns="computedColumns"
    :rows="computedRows"
    :computed="computeTotal"
    aria-label="Order"
    @commit="onComputedCommit"
  />
</preview>

## Pinned columns and rows

Set `column.pinned` to `'left'` or `'right'` to keep a column in view while the sheet scrolls sideways, and `row.pinned` to `'top'` or `'bottom'` to do the same vertically. Several can pin to the same edge, in the order of the array.

<preview>
  <NbSpreadsheet
    :columns="pinnedColumns"
    :rows="pinnedRows"
    aria-label="Units sold"
  />
</preview>

## Filling the page

By default the sheet is as wide as its columns and scrolls inside a box capped at 70% of the viewport. A sheet that is the page, such as a year of hours with a day per row, should use the room it has instead. Set `fit` and the sheet fills its parent: the columns share the width beyond their own `width`, which becomes the least each one gets, and the rows shrink, down to 20px, until every row fits the height. When even 20px rows do not fit, the sheet scrolls as usual. Pinned columns keep their width.

A touch phone keeps the full row height, so every cell stays a target a finger can hit, and the sheet scrolls there instead.

Give columns a `shortLabel` when their labels are long. While any `label` does not fit its column, every column with a `shortLabel` shows it instead, so the header row never mixes "January" with "Feb", and the full label stays as the header's tooltip.

## Sorting

Set `column.sortable` to let a header click sort the rows. The first click sorts ascending, the second descending, the third clears it. Only the unpinned rows move: pinned rows keep their place. The arrows appear when the header is hovered, and stay on the sorted column.

<preview>
  <NbSpreadsheet
    :columns="sortableColumns"
    :rows="sortableRows"
    aria-label="Countries"
  />
</preview>

## Selecting

Drag across cells, or hold `Shift` while clicking or moving, to select a range. A click on a column header that does not sort selects the whole column, a click in the gutter selects the row, and the corner selects everything. `Shift` grows any of them. A selected range can be copied, cut, pasted over and cleared, and its column and row headers are tinted, so the extent of a selection is clear while scrolling.

## Keyboard, mouse and clipboard

| Action                   | Keys                                                            |
| ------------------------ | --------------------------------------------------------------- |
| Move the active cell     | `↑` `↓` `←` `→` / `Tab` / `Shift+Tab` / `Enter` / `Shift+Enter` |
| Start editing            | Any printable key / `F2` / double-click / tap the active cell   |
| Commit and move          | `Enter` / `Tab` / `↑` `↓`, and `←` `→` in a cell typed into     |
| Cancel editing           | `Esc`                                                           |
| Clear the selected range | `Delete` / `Backspace`                                          |
| Extend the selection     | Hold `Shift` while moving / Shift-click                         |
| Select the column        | `Ctrl+Space` / click its header                                 |
| Select the row           | `Shift+Space` / click its gutter cell                           |
| Select everything        | `Cmd/Ctrl+A` / click the corner                                 |
| Copy / cut / paste (TSV) | `Cmd/Ctrl+C` / `Cmd/Ctrl+X` / `Cmd/Ctrl+V`                      |
| Undo / redo              | `Cmd/Ctrl+Z` / `Cmd/Ctrl+Shift+Z`                               |

Editing has the two states of a desktop spreadsheet. A cell opened by typing into it takes every arrow key as "commit and move", so a column of numbers is keyed in as `8`, `↓`, `8`, `↓` without touching the mouse. A cell opened with `F2`, a double click or a tap keeps `←` and `→` for moving the caret inside the text.

Moving the active cell scrolls the sheet only as far as needed to bring it clear of the sticky header, the pinned rows and the pinned columns. Starting or finishing an edit never scrolls it.

Clipboard payloads are tab-separated values, so copy and paste round-trip with other spreadsheet applications.

## Content

- **Column labels are one or two words**, sentence case, nouns: `Quantity`, `Unit price`. A unit goes in the label, not in every cell: `Weight (kg)`.
- **Give long labels a `shortLabel`** rather than letting them truncate: `Sep` for `September`.
- **Name rows in the gutter**, with `row.label`, instead of spending a read-only column on the name.
- **Name the sheet** with `aria-label` when the page around it does not, and always when a page has two.

Casing, punctuation and tone are set library-wide, not by this component: [Writing style](/content/writing-style) is the source.

<!--@include: ./_shared.md-->
