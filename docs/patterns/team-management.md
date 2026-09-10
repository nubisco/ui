# Team management

A complete application screen, built only from library components, with
fictional in-memory data and no backend.

The component pages show one thing at a time. This shows what the library looks
like when the pieces have to work together: a list with search, filters,
sorting, selection and paging that stay coherent with each other, a dialog that
validates, a destructive confirmation, feedback that follows an action, and
every state a real list reaches.

It is functional. Search narrows the results, the filters combine, sorting and
paging survive each other, editing validates and updates the row, Cancel
discards, and Remove only affects the demo data. Everything resets with **Reset
demo**.

<team-management />

## The whole workflow is reachable from the keyboard

<kbd>Tab</kbd> to the search field, type, <kbd>Tab</kbd> to the filters and
choose with the arrow keys, <kbd>Tab</kbd> into the table, sort a column with
<kbd>Enter</kbd>, select rows with <kbd>Space</kbd>, and open a row's editor
from its action button. The dialog takes focus on its first field, holds
<kbd>Tab</kbd> inside itself, closes on <kbd>Esc</kbd>, and hands focus back to
the control that opened it. The destructive confirmation lands on Cancel, never
on the button that deletes.

## What it demonstrates, and where each piece is documented

| On screen                    | Component                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------- |
| Location and page title      | `NbBreadcrumbs` (no page yet)                                                   |
| Search and filters           | [`NbTextInput`](/ui/components/text-input), [`NbSelect`](/ui/components/select) |
| The list                     | [`NbDataTable`](/ui/components/data-table)                                      |
| Paging                       | [`NbPagination`](/ui/components/pagination)                                     |
| Status                       | [`NbBadge`](/ui/components/badge)                                               |
| Editing                      | [`NbModal`](/ui/components/modal)                                               |
| Destructive confirmation     | [`NbConfirm`](/ui/components/confirm)                                           |
| Success and failure feedback | [`NbToaster`](/ui/components/toaster)                                           |

## Decisions worth copying

**Filters compose, and an empty result is its own state.** Combining a role
with a status asks for the intersection and is allowed to return nothing. That
is a different sentence from "nobody has been added yet", so the table says
something different, and the way out ("Clear filters") is in the toolbar
directly above it.

**One empty surface, not two.** An earlier version put an `NbEmptyState` under
the table while the table showed its own default "No data to display", which
stacked two different empty messages on one result. The table is the thing that
is empty, so the table is what speaks.

**Selection narrows with the results.** Filter to one team, select three
people, clear the filter, press Remove: without reconciliation you delete rows
the user never saw. Narrowing the results narrows the selection with it.

**Paging is clamped, not trusted.** Deleting the last row of the last page
leaves the page number past the end. Unclamped, that renders an empty page with
a working "previous" button, which reads as data loss.

**One primary action.** The header has a single filled button. "Reset demo" is
quiet because it is not what the screen is for, and neither is coloured by
status. `danger` is used exactly twice, both times on a control that destroys
data.

**Icon-only row actions carry names.** Each one is labelled with the person it
acts on ("Edit Ama Boateng"), so a screen reader user hears which row a button
belongs to instead of "button, button" twenty-two times.

**Long values truncate rather than reflow.** Names and addresses are clipped
with an ellipsis so a long one cannot change the row height.

**A custom cell has to take part in density.** The Member cell stacks a name
over an address, which made it 48px tall and pinned the row height there: the
density control moved the table's own token and changed nothing visible.
Compact now drops the second line and shrinks the avatar, so the control means
something. A cell that ignores density silently overrides it.

## Demo controls

The strip below the title is dashed on purpose: it is not part of the product
screen. It switches the table between its ready, loading and error states,
between compact and comfortable density, between
[square and rounded appearance](/theming#appearance), and between the default field
treatment and the [`classic-fields`](/theming#field-presets) opt-out, so the
same screen can be compared in each without leaving the page.

::: tip This example is the test
If a component needed changing to make this screen work, the component was
changed, not this page. There are no private selectors here and no styles that
compensate for a component shipping something different. Anything you can see
in it, you can build.
:::
