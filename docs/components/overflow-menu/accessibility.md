---
layout: nubisco
title: Overflow Menu
intro: '`NbOverflowMenu` is the "more actions" button: a ghost, icon-only `dots-three` trigger that opens a menu of the actions there was no room for, in a toolbar, a table row or a card header.'
source: src/components/OverflowMenu.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: not recorded
  keyboard: tested
  screenReader: not recorded
---

## Accessibility

- The trigger is a button named by `label` (its tooltip says the same
  words), with `aria-haspopup="menu"` and `aria-expanded`.
- Enter, Space and ArrowDown open the menu, and focus moves to its first
  row. The arrow keys, Home, End and first-letter typeahead move inside it.
- Escape, a choice or a press outside closes it, and focus goes back to the
  trigger.
- Name the trigger after what it acts on when a page has several ("More
  actions for invoice 2026/002"), so they are not all "More actions".
