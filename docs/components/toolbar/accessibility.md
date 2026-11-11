---
layout: nubisco
title: Toolbar
intro: '`NbToolbar` is the strip of tools above a table, a list or a panel: a labelled `role="toolbar"` with one height that every button inside it takes, an optional flush layout with the primary action in the corner, and one tab stop that the arrow keys move along.'
source: src/components/Toolbar.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: not recorded
  keyboard: tested
  screenReader: not recorded
---

## Accessibility

- The strip is `role="toolbar"` named by `label`, which is required: a
  screen reader announces it on the way in.
- It is one tab stop. Left and Right move between the buttons, Home and End
  go to the first and the last, and the stop stays on the button last used.
  Disabled buttons are skipped.
- A text field (the search in `#start`) is not part of the roving set. It
  keeps its own tab stop, and the arrow keys inside it move the caret.
- Icon-only tools carry `label`, which is their accessible name and their
  tooltip. Never add `aria-label` or `v-nb-tooltip` as well.
