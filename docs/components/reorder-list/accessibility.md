---
layout: nubisco
title: Reorder List
intro: "`NbReorderList` is a vertical list whose rows can be dragged into a new order, with a drop indicator and a keyboard path that does the same job. The model editor's field list, a block zone and moving media between folders all want this."
source: src/components/ReorderList.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Keyboard

The keyboard path is the half that gets skipped when a reorder list is written by hand, and it is most of why this is a component rather than a recipe.

| Key                                   | Does                                                    |
| ------------------------------------- | ------------------------------------------------------- |
| <kbd>Tab</kbd>                        | Moves to the next row                                   |
| <kbd>Space</kbd> / <kbd>Enter</kbd>   | Picks the row up, or drops it                           |
| <kbd>&uarr;</kbd> / <kbd>&darr;</kbd> | Moves the held row, or moves focus when nothing is held |
| <kbd>Esc</kbd>                        | Cancels the pick-up                                     |

Arrow keys **browse** until a row is picked up, and only then **move** it. Reordering directly on arrow keys looks simpler but leaves a screen reader user unable to read the list without rearranging it.

Every move is announced through a live region, because a keyboard user does not see the row travel.

<!--@include: ./_shared.md-->
