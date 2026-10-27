---
layout: nubisco
title: Action Group
intro: '`NbActionGroup` is a row of page actions that knows how to fit a phone. On a desktop it renders exactly the buttons you would have placed by hand. On a phone it keeps the one action that matters on screen as an icon and folds the rest into a "more" menu, so a topbar with five labelled buttons stays usable at 360px instead of being clipped.'
source: src/components/ActionGroup.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- Every action is a real `NbButton`. Folded to an icon, it keeps its label as
  `aria-label`, so a screen reader hears the same name a sighted user read on a
  desktop.
- The overflow trigger is named by `overflowLabel` ("More actions") and carries
  `aria-haspopup="menu"` and `aria-expanded`.
- The menu takes focus on its first row when it opens and hands it back to the
  trigger when it closes from the keyboard or after a choice.
- A disabled or loading action does nothing when chosen, from either its button
  or its menu row.
