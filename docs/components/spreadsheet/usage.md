---
layout: nubisco
title: Spreadsheet
intro: '`NbSpreadsheet` is an editable grid of cells for data people key in: dense rows, a sticky header, row numbers or labels in a gutter, keyboard entry like a desktop spreadsheet, range selection, clipboard, and undo. The app owns the data: the sheet renders it, captures input and emits the changes.'
source: src/components/Spreadsheet.vue
tab: usage
pageTabs: ['usage', 'formulas', 'code', 'accessibility']
---

Use it when people edit many values in place: hours per day, quantities per month, a budget. For a list people read, sort and act on row by row, use [`NbDataTable`](/components/data-table/usage) instead.

The sheet has two modes. In **table mode**, the default, the app gives it named columns and rows, and the shape of the grid is the app's. In **sheet mode** the app binds a map of cells instead, keyed `A1`, `B2`, and the grid is a desktop spreadsheet's: columns A, B, C, rows 1, 2, 3, and a size that follows the data. See [Sheet mode](#sheet-mode).

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

## Column letters

A sheet people refer to by position, such as one that is read out loud or checked against a printout, can name its columns A, B, C, as a desktop spreadsheet does. Set `column-headers` to `'letters'` to show the letters in place of the labels, which stay as each header's tooltip and accessible name, or to `'both'` for a compact row of letters above the labels. A column's letter is its place in the sheet, so hiding column C leaves A, B, D, and the row numbers skip hidden rows the same way. The default, `'label'`, shows the labels alone.

Letters are a way to find a cell, not a replacement for a good label. Keep the labels whenever the columns have names.

## Hiding columns and rows

Hidden columns and rows are `v-model:hidden-columns` and `v-model:hidden-rows`, arrays of ids. Bind them to keep what a person hid between visits, or leave them unbound and the sheet keeps them for as long as it is on the page. A hidden column or row leaves a double rule on the edge it was on, and a click on the rule shows it again. Hidden cells are skipped by the arrow keys, the selection, the clipboard and `Delete`, so nothing changes out of sight.

A sheet always keeps one column and one row in view.

## Context menu

Set `context-menu` and a right click, `Shift+F10` or the menu key opens the sheet's own menu in place of the browser's: cut, copy, paste, clear, sorting for a sortable column, and hiding and showing columns and rows. It works on the selection. A right click inside the selection keeps it, and one outside selects the cell, column or row under the pointer first, so a click on a column header offers that column. The menu is off by default, since it replaces the browser's own.

<preview>
  <NbSpreadsheet
    v-model:hidden-columns="budgetHiddenColumns"
    v-model:hidden-rows="budgetHiddenRows"
    :columns="budgetColumns"
    :rows="budgetRows"
    column-headers="both"
    context-menu
    locale="en-GB"
    aria-label="Budget"
    @commit="onBudgetCommit"
  />
</preview>

## Sheet mode

Bind `v-model:cells` and the sheet makes its own columns and rows over the cells, writes what is typed, pasted, filled and cleared back into them, and keeps undo. A value that reads as a number in the sheet's `locale` is stored as one and set to the right. Anything else is text. An empty cell has no key, so the map stays as small as the data.

`extent` sets how far the grid reaches:

- **`'data'`**, the default, ends at the last filled row and column. A paste past the end grows it.
- **An object** sets bounds: `{ minRows: 20, minColumns: 8 }` shows an empty 20 by 8 grid to start with, and `maxRows` and `maxColumns` stop a paste or a fill from going further.
- **`'infinite'`** starts at A to Z and a hundred rows, and adds more as the view nears the end, up to 9,000 rows and 1,000 columns.

An infinite grid is never the default. Pick it for a scratch sheet, and bounds for anything with a known shape.

<preview>
  <NbSpreadsheet
    v-model:cells="sheetCells"
    :extent="{ minRows: 8, minColumns: 6 }"
    locale="en-GB"
    aria-label="Weekly visits"
  />
</preview>

A cell whose text starts with `=` is a formula, such as `=SUM(B2:B9)`: the sheet shows its result and keeps the formula, and the formula bar above the grid shows it as written. See [Formulas](/components/spreadsheet/formulas) for writing them and the functions there are.

Select a range and drag the square on its last corner to fill the cells beyond it. Numbers that step evenly, such as 1, 2 or 10, 20, carry the series on, and anything else repeats. `Ctrl+D` copies the selection's top row down over the rest of it, and `Ctrl+R` its first column to the right. The fill handle is on in sheet mode, and `fill-handle` turns it on in table mode too.

## Styles

A sheet-mode cell can be bold, italic, underlined or struck through, aligned, coloured and given a number format. `Cmd/Ctrl+B`, `I` and `U` set the first three on the selection. The rest come from the app's own toolbar, through the exposed `applyStyle`, so the sheet never decides which controls a page shows. Build the toolbar from [`NbButton`](/components/button/usage) in the `toolbar` slot.

Colours are intents, not colours: `neutral`, `info`, `success`, `warning` and `danger` paint the library's status surfaces, so a coloured cell keeps its contrast in the dark theme. Use them for meaning, such as an overdue figure, and never for decoration.

A number format changes the text, never the value: `{ type: 'currency', currency: 'EUR' }` shows `1200` as €1,200.00 and the cell still holds `1200`. `percent` multiplies by 100 for the text, as a desktop spreadsheet does, and `number` fixes the decimals and the grouping.

<preview>
  <NbSpreadsheet
    ref="lookSheet"
    v-model:cells="lookCells"
    v-model:styles="lookStyles"
    v-model:merges="lookMerges"
    :conditional-formats="lookFormats"
    locale="en-GB"
    context-menu
    aria-label="Quarterly costs"
  >
    <template #toolbar>
      <NbButton variant="ghost" size="sm" icon="text-b" label="Bold" @click="lookSheet?.applyStyle({ bold: true })" />
      <NbButton variant="ghost" size="sm" icon="text-italic" label="Italic" @click="lookSheet?.applyStyle({ italic: true })" />
      <NbButton variant="ghost" size="sm" @click="lookSheet?.applyStyle({ format: { type: 'currency', currency: 'EUR' } })">Currency</NbButton>
      <NbButton variant="ghost" size="sm" @click="lookSheet?.applyStyle({ intent: 'warning' })">Warning</NbButton>
      <NbButton variant="ghost" size="sm" @click="lookSheet?.merge()">Merge</NbButton>
      <NbButton variant="ghost" size="sm" @click="lookSheet?.clearStyles()">Clear styles</NbButton>
    </template>
  </NbSpreadsheet>
</preview>

## Merged cells

Merge a range to show its first cell across all of it, for a heading over several columns or a label beside several rows. Merging is in the context menu and the exposed `merge()`, and the merged ranges are `v-model:merges`, such as `['A1:D1']`. A selection that reaches into a merge takes all of it, and the arrow keys step over it as one cell. The cells under a merge keep their values, out of sight, and come back when the range is unmerged.

Merge for layout, rarely. A merged cell is one cell to a screen reader, and a column with merges in it is harder to select, sort and paste into.

## Conditional formats

`conditional-formats` styles the cells of a range while they pass a rule: greater than, between, contains, empty, an error, and so on. The rules read the value a cell shows, so a formula's result is what counts. Formats apply in order, a later one winning, and all of them over the cell's own style.

A `formula` rule works as in a desktop spreadsheet. It is written for the range's first cell and moves with each cell: `{ range: 'C2:C9', rule: { when: 'formula', formula: '=C2>B2' } }` tests each row's C against its B. The cell is styled when the formula is TRUE or a number other than 0.

## CSV

`exportCsv()` writes the sheet as CSV, and `importCsv(text)` reads a file into a sheet-mode sheet as one step undo takes back. A file saved with semicolons and decimal commas, as spreadsheets in many European locales write them, reads as numbers in a sheet with that `locale`. See [CSV](/components/spreadsheet/code#csv) for the options and the `parseCsv` and `toCsv` helpers.

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

Drag across cells, or hold `Shift` while clicking or moving, to select a range. A click on a column header that does not sort selects the whole column, a click in the gutter selects the row, and the corner selects everything. `Shift` grows any of them. A selected range is boxed by a line around it, and its column and row headers are tinted, so the extent of a selection is clear while scrolling.

Hold `Cmd` (`Ctrl` on Windows and Linux) while clicking or dragging to add another range, and each range gets a box of its own. `Delete` clears every range. Copy, cut, paste and the fill handle work on the range the active cell is in, as a desktop spreadsheet's do with ranges that do not form one block.

## Keyboard, mouse and clipboard

| Action                    | Keys                                                            |
| ------------------------- | --------------------------------------------------------------- |
| Move the active cell      | `↑` `↓` `←` `→` / `Tab` / `Shift+Tab` / `Enter` / `Shift+Enter` |
| Start editing             | Any printable key / `F2` / double-click / tap the active cell   |
| Commit and move           | `Enter` / `Tab` / `↑` `↓`, and `←` `→` in a cell typed into     |
| Cancel editing            | `Esc`                                                           |
| Clear the selected range  | `Delete` / `Backspace`                                          |
| Extend the selection      | Hold `Shift` while moving / Shift-click                         |
| Add a range               | Cmd/Ctrl-click or drag                                          |
| Select the column         | `Ctrl+Space` / click its header                                 |
| Select the row            | `Shift+Space` / click its gutter cell                           |
| Select everything         | `Cmd/Ctrl+A` / click the corner                                 |
| Narrow / widen column     | `Alt+Shift+←` / `Alt+Shift+→`, 8px a step                       |
| Open the context menu     | `Shift+F10` / the menu key / right click (with `context-menu`)  |
| Copy / cut / paste (TSV)  | `Cmd/Ctrl+C` / `Cmd/Ctrl+X` / `Cmd/Ctrl+V`                      |
| Fill down / right         | `Cmd/Ctrl+D` / `Cmd/Ctrl+R` (with the fill handle)              |
| Bold / italic / underline | `Cmd/Ctrl+B` / `Cmd/Ctrl+I` / `Cmd/Ctrl+U` (sheet mode)         |
| Undo / redo               | `Cmd/Ctrl+Z` / `Cmd/Ctrl+Shift+Z`                               |

Editing has the two states of a desktop spreadsheet. A cell opened by typing into it takes every arrow key as "commit and move", so a column of numbers is keyed in as `8`, `↓`, `8`, `↓` without touching the mouse. A cell opened with `F2`, a double click or a tap keeps `←` and `→` for moving the caret inside the text.

Moving the active cell scrolls the sheet only as far as needed to bring it clear of the sticky header, the pinned rows and the pinned columns. Starting or finishing an edit never scrolls it.

Columns are resized by dragging the right edge of a header, or from the keyboard with `Alt+Shift` and the arrows. The sheet emits `column-resize` with the new width when a drag ends and on each key, so the app can keep it.

Clipboard payloads are tab-separated values, so copy and paste round-trip with other spreadsheet applications.

## Content

- **Column labels are one or two words**, sentence case, nouns: `Quantity`, `Unit price`. A unit goes in the label, not in every cell: `Weight (kg)`.
- **Give long labels a `shortLabel`** rather than letting them truncate: `Sep` for `September`.
- **Name rows in the gutter**, with `row.label`, instead of spending a read-only column on the name.
- **Name the sheet** with `aria-label` when the page around it does not, and always when a page has two.

Casing, punctuation and tone are set library-wide, not by this component: [Writing style](/content/writing-style) is the source.

<!--@include: ./_shared.md-->
