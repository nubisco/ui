---
layout: nubisco
title: Content Switcher
intro: '`NbContentSwitcher` switches between alternate views of the same content: a list or a grid, this week or this month. One outlined row of equal options, the selected one filled, and a radio group to assistive technology.'
source: src/components/ContentSwitcher.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: not recorded
  keyboard: tested
  screenReader: not recorded
---

## Accessibility

- A `radiogroup` named by `label`, with each option a `radio` carrying
  `aria-checked`. Not a tab list: nothing is controlled but the view.
- One tab stop, on the selected option. The arrow keys move the selection
  and wrap, skipping disabled options, and Home and End go to the ends.
- Icon-only options are named by their label, which is also their tooltip.
- In forced colours the selected option is drawn in the system highlight.
