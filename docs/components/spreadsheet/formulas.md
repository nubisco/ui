---
layout: nubisco
title: Spreadsheet
intro: '`NbSpreadsheet` is an editable grid of cells for data people key in: dense rows, a sticky header, row numbers or labels in a gutter, keyboard entry like a desktop spreadsheet, range selection, clipboard, and undo. The app owns the data: the sheet renders it, captures input and emits the changes.'
source: src/components/Spreadsheet.vue
tab: formulas
pageTabs: ['usage', 'formulas', 'code', 'accessibility']
---

In sheet mode, a cell whose text starts with `=` is a formula. The cell keeps the formula and shows what it works out to, and the sheet works it out again whenever a cell it reads changes. The engine is the library's own, with no dependencies, and it is also published on its own as `@nubisco/ui/formula`.

<preview>
  <NbSpreadsheet
    v-model:cells="formulaCells"
    :extent="{ minRows: 8, minColumns: 5 }"
    locale="en-GB"
    aria-label="Order lines"
  />
</preview>

## Writing a formula

Type `=` in a cell, or in the formula bar above the grid, and then the formula. The formula bar shows the active cell's reference and its contents, a formula as written rather than its result.

- **References** name a cell, `B3`, or a range, `B2:B9`. A whole column is `C:C` and a whole row is `3:3`, both as far as the sheet's data reaches.
- **`$` fixes a part of a reference**: `$A$1` stays put when the formula is filled or pasted elsewhere, `$A1` keeps its column and `A$1` its row. Without `$`, a reference moves with the formula.
- **Point instead of typing**: while a formula waits for an operand, after `=`, a bracket, an operator or a separator, a click on a cell writes its reference, and a drag writes a range. In a cell opened by typing, the arrow keys do the same, and `Shift` with them makes a range.
- **Functions** are offered as their name is typed. `↑` and `↓` move through the list, and `Tab` or `Enter` writes the function and its opening bracket. Inside the brackets, the function's arguments show under the field, the current one in bold.

While a formula is being edited, each reference has a colour, the same in the text and in a box on the grid around the cells it names.

## Operators

| Operator                   | Meaning                    | Example          |
| -------------------------- | -------------------------- | ---------------- |
| `+` `-` `*` `/`            | Arithmetic                 | `=B2*C2`         |
| `^`                        | Power                      | `=2^10`          |
| `%`                        | Percent, after a number    | `=B2*15%`        |
| `&`                        | Joins text                 | `=A2&" (draft)"` |
| `=` `<>` `<` `>` `<=` `>=` | Comparisons, TRUE or FALSE | `=B2>=100`       |
| `:`                        | A range                    | `=SUM(B2:B9)`    |

Comparisons ignore the case of text, as a desktop spreadsheet's do. An empty cell is 0 in arithmetic and empty text when joined.

## Your locale's syntax

A formula is typed and shown in the sheet's `locale`. Where the decimal separator is a comma, as in `pt-PT` or `de-DE`, arguments are separated with semicolons and decimals take the comma: `=ROUND(B2*1,23;2)`. The cell stores the formula in one canonical form, `=ROUND(B2*1.23,2)`, so the same cells read the same in every locale. Function names are always in English.

## Errors

A formula that cannot be worked out shows an error code in the danger colour, and the cell's tooltip says why.

| Error     | Means                                                                |
| --------- | -------------------------------------------------------------------- |
| `#DIV/0!` | A division by zero                                                   |
| `#VALUE!` | A value of the wrong kind, such as text in arithmetic                |
| `#REF!`   | A reference that leaves the sheet, or a circular reference           |
| `#NAME?`  | A function the engine does not know                                  |
| `#N/A`    | A lookup found nothing, or a function had the wrong number of values |
| `#NUM!`   | A number out of range, such as the square root of a negative         |
| `#ERROR!` | The formula itself does not parse                                    |

A cell that reads a cell with an error shows that error too, so the first one in a chain is the one to fix.

## Filling, copying and pasting

The fill handle, `Ctrl+D` and `Ctrl+R` copy a formula and move its references with it: `=B2*C2` filled down becomes `=B3*C3`, `=B4*C4` and so on, while the parts fixed with `$` stay. Pasting a formula copied from the same sheet moves it the same way, by the distance between the copy and the paste. A cut and paste moves the formula unchanged, as a desktop spreadsheet does.

## Turning formulas off

A sheet whose text may start with `=` without being a formula sets `:formulas="false"`. The cells then show their text as it is, and the formula bar is hidden unless `formula-bar` asks for it.

## The engine on its own

`@nubisco/ui/formula` works out formulas without a sheet on the page, for a server, a worker or a test. It reads the same cells as sheet mode.

```ts
import { createFormulaSheet, isFormulaError } from '@nubisco/ui/formula'

const sheet = createFormulaSheet()
const values = sheet.compute({ A1: 120, A2: 80, A3: '=SUM(A1:A2)' })
values.get('A3') // 200

const result = values.get('B1')
if (isFormulaError(result)) console.warn(result.error, result.message)
```

`compute` returns the result of every formula cell, keyed by reference, and keeps each formula's parse for the next call, so a change re-reads only the formulas whose text changed. It also exports the tokenizer, `shiftFormula` for moving references, `toCanonical` and `toLocalized` for the locale syntax, and `FORMULA_FUNCTIONS`, the list this page's reference is built from.

## Functions

<template v-for="group in functionGroups" :key="group.category">
  <h3 :id="`functions-${group.category}`">{{ group.label }}</h3>
  <table>
    <thead>
      <tr><th>Function</th><th>Syntax</th><th>Description</th></tr>
    </thead>
    <tbody>
      <tr v-for="fn in group.functions" :key="fn.name">
        <td><code>{{ fn.name }}</code></td>
        <td><code>{{ fn.syntax }}</code></td>
        <td>{{ fn.description }}</td>
      </tr>
    </tbody>
  </table>
</template>

<!--@include: ./_shared.md-->
