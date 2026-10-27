---
layout: nubisco
title: Board
intro: '`NbBoard` is a kanban-style board with columns, optional swim lanes, and drag-and-drop support. Card rendering is fully customizable via the `card` slot.'
source: src/components/Board.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Keyboard

Every card is focusable and can be moved without a pointer, the same pick-up-move-drop model as `NbReorderList`.

| Key                                                    | Does                                                                                                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| <kbd>Tab</kbd>                                         | Moves to the next card                                                                                                                    |
| <kbd>Space</kbd> / <kbd>Enter</kbd>                    | Picks the card up, or drops it (which emits `move`)                                                                                       |
| <kbd>&uarr;</kbd> / <kbd>&darr;</kbd>                  | Moves the held card within its cell, or moves focus when nothing is held; past the edge of a cell it continues into the neighbouring lane |
| <kbd>&larr;</kbd> / <kbd>&rarr;</kbd>                  | Moves the held card to the adjacent column, or moves focus when nothing is held                                                           |
| <kbd>Shift</kbd> + <kbd>Space</kbd> / <kbd>Enter</kbd> | Drops the held card **onto** the card below the ghost, emitting `nest` (requires `nestable`)                                              |
| <kbd>Esc</kbd>                                         | Cancels the pick-up                                                                                                                       |

Arrow keys **browse** until a card is picked up, and only then **move** it. A held card does not travel until it is dropped: the board shows a ghost drop line at the target position and emits the same `move` event a pointer drop would.

Every pick-up, move and drop is announced through a live region, because a keyboard user does not see the card travel.

<!--@include: ./_shared.md-->
