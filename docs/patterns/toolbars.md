---
layout: nubisco
title: Toolbars and overflow
description: What goes in a toolbar, how many tools it shows before the rest fold into a menu, how a batch bar replaces it while things are selected, and how a table row shows its actions.
---

A toolbar is the strip of tools for one region: a table, a list, a canvas, a
panel. It is not the page's header (that is
[`NbPageHeader`](/components/page-header/usage)) and it does not float over a
selection (that is [`NbFloatingToolbar`](/components/floating-toolbar/usage)).
Four components do the work, and this page is about how they fit together.

| Component                                                 | Its job                                                     |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| [`NbToolbar`](/components/toolbar/usage)                  | The strip: one height, flush layout, one tab stop           |
| [`NbOverflowMenu`](/components/overflow-menu/usage)       | The "more" button for what does not fit                     |
| [`NbActionGroup`](/components/action-group/usage)         | A row of actions that folds on its own                      |
| [`NbBatchActions`](/components/batch-actions/usage)       | The bar that replaces the toolbar while things are selected |
| [`NbContentSwitcher`](/components/content-switcher/usage) | Another view of the same content                            |

---

## Rule 1: the toolbar is as tall as its row

A table's toolbar is as tall as the table's rows, up to 48px. Give the
toolbar that `size` and nothing else: every button inside it that has no
size of its own takes it, so they line up without being sized one by one.
`NbDataTable` does this for its own strip.

## Rule 2: ghost tools, one primary in the corner

The tools are ghost or icon-only buttons. The one primary action goes in the
`end` slot, and with `flush` it sits in the toolbar's corner, full height.
Every icon-only tool has a `label`: it is the tool's accessible name and its
tooltip, and nothing else is added for either.

## Rule 3: up to five, then an overflow menu

Show at most five tools. The rest go into one `NbOverflowMenu` at the end of
the tools, before the primary. Fewer than three actions never go into a menu:
two actions stay inline as icon buttons, because a menu of two costs a click
and hides both.

For a row that should fold as its container narrows, put an
`NbActionGroup` with `overflow="auto"` in the toolbar. It keeps as many
actions as fit, in reading order, and moves the rest into its overflow menu.

## Rule 4: search fills the start

A search goes in the toolbar's `start` slot, which grows into whatever width
the tools leave and moves to its own line when that is too little. An
expandable `NbSearch` goes there. Any field works the same way.

## Rule 5: selection replaces the toolbar, it does not add to it

While rows are selected, `NbBatchActions` covers the toolbar strip: the
count, the actions for all of them, and Cancel on the far right. It is the
strip's height, so nothing below it moves. The toolbar under it is `inert`
until the selection is cleared, and the row actions are disabled: a row
cannot be acted on behind a selection.

## Rule 6: row actions are icons, and they never vanish

A table row's actions are ghost, small, icon-only buttons with a `label`.
Every row shows the same actions in the same places. An action that does not
apply to a row stays where it is, disabled, and its tooltip says why
(`disabledReason`). Past three actions, two stay and the rest go into an
`NbOverflowMenu` at the end of the row. `NbDataTable`'s `rowActions` prop
does all of this:

```ts
const rowActions = (row: Invoice): IActionGroupItem[] => [
  {
    id: 'edit',
    label: 'Edit',
    icon: 'pencil-simple',
    onSelect: () => edit(row),
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: 'trash',
    disabled: row.status === 'paid',
    disabledReason: 'Paid invoices cannot be deleted',
    onSelect: () => remove(row),
  },
]
```

## Rule 7: a content switcher changes the view, not the content

A list or a grid, this week or this month: the same content shown another
way is an `NbContentSwitcher`, often in the toolbar's tools. Moving between
different content is tabs.
