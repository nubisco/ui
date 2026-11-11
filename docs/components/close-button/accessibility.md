---
layout: nubisco
title: Close Button
intro: '`NbCloseButton` is the one control that closes or dismisses something: a dialog, a side panel, a sheet, a toast, a banner. It is a ghost icon-only `NbButton` with the `x` icon, in the two sizes Carbon uses for the job.'
source: src/components/CloseButton.vue
tab: accessibility
pageTabs: ['usage', 'style', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: native
  screenReader: not recorded
---

## Accessibility

- It is a native `<button type="button">`, so <kbd>Enter</kbd> and
  <kbd>Space</kbd> press it and `disabled` takes it out of the tab order.
- It always has a name. `label` (or the catalogue's `close`) becomes its
  `aria-label` and the tooltip a sighted pointer user sees, so the two can
  never disagree. An explicit `aria-label` still wins for the spoken name.
- The icon is `aria-hidden`: the name is the words, not the glyph.
- The focus ring is the library's one ring, 2px of `--nb-c-focus-ring` inside
  the button with a 1px band of the surface.
- Put it last in the tab order of the surface it closes. A dialog that opens
  with focus on its close button invites the user to leave before they have
  read it.
