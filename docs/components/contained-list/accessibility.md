---
layout: nubisco
title: Contained List
intro: '`NbContainedList` is a list for a small space: a panel, a tile, an aside, a disclosure. Each row is a key, a title, one line under it and something at the end. It is the row a product otherwise writes by hand, once per screen.'
source: src/components/ContainedList.vue
tab: accessibility
pageTabs: ['usage', 'style', 'code', 'accessibility']
a11y:
  automated: not recorded
  keyboard: tested
  screenReader: not recorded
---

## Semantics

- The rows are a `<ul>` of `<li>`s, with `role="list"` written out, because
  `list-style: none` makes Safari drop the list role and with it the "list, 5
  items" a screen reader announces.
- The list is named by its title through `aria-labelledby`. Without a title,
  pass `aria-label`.
- The title is a real heading (`h3` by default, `headingLevel` to change it),
  so the list appears in a screen reader's list of headings.
- A row that navigates is an `<a>` (or a `<RouterLink>`), inside its `<li>`. A
  row that acts is an element with `role="button"`, inside its `<li>`. The list
  item stays a list item either way.
- `current` sets `aria-current="page"` on a link and `aria-current="true"` on
  anything else.

## Keyboard

| Key              | Does                                       |
| ---------------- | ------------------------------------------ |
| <kbd>Tab</kbd>   | Moves to the next row that acts            |
| <kbd>Enter</kbd> | Follows a link row, activates a button row |
| <kbd>Space</kbd> | Activates a button row                     |

Rows that neither navigate nor act are not in the tab order.

## What not to put in a row

- **A control in `#trailing` of a row that acts.** A button inside a link is
  two targets in one, and neither a keyboard nor a screen reader can reach the
  inner one reliably. If a row needs its own actions, it is a table row: use
  [`NbDataTable`](/components/data-table/usage).
- **Colour as the only signal.** A red count says nothing to someone who cannot
  see red. Put the state in words in a badge, per
  [Status indicators](/patterns/status-indicators).

## Touch

On a phone touch screen, rows that act are at least 44px tall.
