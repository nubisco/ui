---
layout: nubisco
title: Batch Actions
intro: '`NbBatchActions` is the bar that appears while things are selected: how many, what can be done to all of them, and Cancel. Over a table toolbar it covers the strip edge to edge, in a free layout it floats at the foot.'
source: src/components/BatchActions.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: not recorded
  keyboard: native
  screenReader: not recorded
---

## Accessibility

- The bar is a `region` named by `label`, so a screen reader can find it.
- The count is a polite live region: selecting another row is announced.
- Cancel is a real button with text on a desktop, and an icon named by its
  `label` (with a tooltip) on a phone.
- An overlay covers the toolbar it replaces. The host makes that toolbar
  `inert` while the bar is up (`NbDataTable` does), so Tab does not reach
  controls nobody can see.
