---
layout: nubisco
title: Chip Group
intro: '`NbChipGroup` is one choice drawn as a row of chips: a scope or a filter that sits beside what it narrows, such as "All products" or a single product above a search field.'
source: src/components/ChipGroup.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: tested
  screenReader: not recorded
---

## What the component guarantees

- **A radio group, because it is one choice of several.** The row is `role="radiogroup"` named by `label`, and each chip is `role="radio"` with `aria-checked`. A screen reader announces the group's question, then each chip as "radio, 2 of 5, checked". Faking it with buttons gives none of that.
- **One tab stop.** <kbd>Tab</kbd> lands on the chosen chip (or the first that can be chosen) and leaves the row on the next press, so a row of six chips costs a keyboard user one stop, not six.
- **The arrow keys choose.** <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> move to the next chip and choose it, wrapping at either end, <kbd>Home</kbd> and <kbd>End</kbd> jump to the first and last, and a disabled chip is skipped. In a right-to-left document <kbd>→</kbd> moves back, following reading order.
- **The chosen chip is not only a colour.** It swaps to the high-contrast fill, which reads in forced colours as a change of background, and `aria-checked` carries the state to assistive technology.
- **The library's focus ring.** Two bands, the ring colour outside and the surface inside, so it reads on the chosen chip's fill as well as on an unchosen one.
- **A touch target on phones.** The `hit-area` mixin grows each chip's tap box to 44px on a phone touch screen without changing how it looks.

## What you own

- A `label` that asks the question the chips answer: "Limit search to a product", not "Filters".
- Short chip labels. The chip's text is its whole accessible name.
