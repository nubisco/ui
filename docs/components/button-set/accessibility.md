---
layout: nubisco
title: Button Set
intro: '`NbButtonSet` is a row of up to three buttons that knows where the primary goes: last in a row, first in a column, whatever order the slot was written in. It is the footer of every dialog in the library, and the row under a form or a tour step.'
source: src/components/ButtonSet.vue
tab: accessibility
pageTabs: ['usage', 'style', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: native
  screenReader: not recorded
---

## Accessibility

- The set adds no role and no tab stop of its own. Each button is a real
  `NbButton` with its own name, state and focus ring.
- The tab order follows the reading order by default: left to right in a row,
  top to bottom in a column, so focus never jumps against the eye.
- `focus-order="rank"`, which `NbModal`'s footer uses, puts the primary first
  and then moves left: Carbon's dialog order, where from the body the commit
  is one <kbd>Tab</kbd> away and the way out is one more. In a rank set,
  stacking for a phone changes only the stylesheet, so the order is the same
  at every width.
- Buttons are keyed by their slot position, so a button that appears or
  disappears behind a `v-if` does not move focus off the button the user is
  on.
