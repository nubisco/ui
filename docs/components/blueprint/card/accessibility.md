---
layout: nubisco
title: Blueprint Card
intro: "`NbBlueprintCard` is a node card designed to live inside an [`NbBlueprint`](/components/blueprint/usage) canvas. It renders a card with an identity rail down its left edge, typed input/output ports, a category label, an optional enable toggle, and an optional remove button. It is presentational: the parent owns the card's position and the connections between cards."
source: src/components/BlueprintCard.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Keyboard and assistive technology

The card is a focusable `role="group"`, labelled with its title, category, status and enabled state. Every control inside it is a real button with its own accessible name.

| Key                                                                     | Where                            | Does                                                   |
| ----------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------ |
| <kbd>Tab</kbd>                                                          | Anywhere                         | Moves through the card and its controls.               |
| <kbd>&larr;</kbd> <kbd>&rarr;</kbd> <kbd>&uarr;</kbd> <kbd>&darr;</kbd> | Card                             | Moves the card by one canvas unit.                     |
| <kbd>Shift</kbd> + arrow                                                | Card                             | Moves it by ten.                                       |
| <kbd>Enter</kbd> / <kbd>Space</kbd>                                     | Port                             | Starts a connection, or completes one already started. |
| <kbd>Esc</kbd>                                                          | Port                             | Abandons a connection in progress.                     |
| <kbd>Enter</kbd> / <kbd>Space</kbd>                                     | Collapse chevron, toggle, remove | Activates that control.                                |

Connecting by keyboard walks the same two-step path the mouse does and goes through the same handlers, so a keyboard connection is indistinguishable from a dragged one to the host. While a connection is in progress, valid targets ring and invalid ones dim exactly as they do for the mouse, which is what makes the keyboard flow navigable at all.

Nudging is routed through the parent `NbBlueprint`, so it reports itself with the same `move` event a drag does, and nudging a card that is part of the selection moves the whole selection, again matching the mouse. Positions have one path out of the component, not two.

Focusing a card also selects it, so the inspector and the canvas agree about what the user is looking at.
