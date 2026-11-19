---
layout: nubisco
title: Spreadsheet
intro: '`NbSpreadsheet` is an editable grid of cells for data people key in: dense rows, a sticky header, row numbers or labels in a gutter, keyboard entry like a desktop spreadsheet, range selection, clipboard, and undo. The app owns the data: the sheet renders it, captures input and emits the changes.'
source: src/components/Spreadsheet.vue
tab: accessibility
pageTabs: ['usage', 'formulas', 'code', 'accessibility']
a11y:
  automated: not recorded
  keyboard: tested
  screenReader: not recorded
---

## Accessibility

- The sheet is an ARIA `grid`. The header and every data row are `row`s, the column labels are `columnheader`s, the gutter cells are `rowheader`s, and the cells are `gridcell`s. Each row and cell carries `aria-rowindex` and `aria-colindex`, and the grid carries `aria-rowcount` and `aria-colcount`, so a screen reader reports the right position while the rows outside the view are not rendered.
- The grid is one tab stop. It keeps the keyboard focus while the person moves around it and names the active cell with `aria-activedescendant`, so no cell is in the tab order and `Tab` inside the sheet moves between cells, as in a desktop spreadsheet.
- Cells in a selected range carry `aria-selected="true"`, and the grid is `aria-multiselectable`. Read-only and computed cells carry `aria-readonly`.
- A sortable column header carries `aria-sort` (`none`, `ascending` or `descending`).
- The cell editor is a text field labelled with the column's label and the row's label or number.
- Name the sheet with `aria-label`. A page with two sheets must name both.
- The active cell draws a 2px `--nb-c-focus-ring` inside the cell, and until a cell is active the grid draws the same ring on its inner edge when it has keyboard focus, so nothing around it moves. A selected range is boxed by a 1px line in the same colour, and each range added with `Cmd/Ctrl` has a box of its own.
- With `column-headers="both"` the letters and the labels are two header rows. With `'letters'` alone, each letter header is named with its letter and its label ("B Quantity"), so the label is not lost to a screen reader.
- The marks hidden columns and rows leave are buttons named for what they show ("Show 2 hidden columns"), out of the tab order like every other part of the grid. From the keyboard, the context menu shows hidden columns and rows, and it opens with `Shift+F10` or the menu key.
- The context menu is `NbMenu`, so it has the menu's own keyboard model: the arrow keys, typeahead, `Esc` to close, and the focus back on the sheet afterwards.
- Every column resizes from the keyboard with `Alt+Shift+←` and `Alt+Shift+→`, as well as by dragging.
- In sheet mode the column headers are the letters, and the cell editor is labelled with the cell's reference ("B3").
- The fill handle is a mouse affordance and is hidden from assistive technology. `Ctrl+D` and `Ctrl+R` fill from the keyboard.
- An infinite sheet reports the rows and columns it has grown to in `aria-rowcount` and `aria-colcount`, which rise as the person moves towards the end.
- The formula bar's field is labelled "Formula", and the name beside it shows the active cell's reference or the selected range.
- While formulas are on, the cell editor and the formula bar are `combobox`es. The function list is a `listbox` named "Functions", and the option the arrow keys are on is the field's `aria-activedescendant`, so a screen reader reads each function as it is reached. The arguments of the function being typed into are the field's description.
- A reference's colour is never the only way to tell it apart: the reference is written in the formula, and the colour only links it to its box on the grid.
- Pointing at cells while a formula is typed works from the keyboard as well as the mouse: in a cell opened by typing, the arrow keys write the cell they reach.
- An error shows its code in the danger colour, and its reason is the cell's tooltip.
- Cell colours are intents, painted with the status surface pairs, which keep AA contrast in both themes. Colour alone should not carry meaning: pair an intent with text or a format that says the same.
- A merged cell is one cell to a screen reader, under its first row and column. Merge for layout and keep data unmerged.
- On a touch screen a tap on the active cell opens it, since there is no key to type into it, and the editor's text is at least 16px so the page does not zoom.

## Keyboard

Every action is on the keyboard. The full table is on [Usage](/components/spreadsheet/usage#keyboard-mouse-and-clipboard). The selection keys are the ones desktop spreadsheets use: `Ctrl+Space` for the column, `Shift+Space` for the row and `Cmd/Ctrl+A` for everything.

<!--@include: ./_shared.md-->
