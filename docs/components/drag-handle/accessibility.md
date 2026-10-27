---
layout: nubisco
title: Drag Handle
intro: '`NbDragHandle` is the six-dot grip you press to move a block, a table row or a table column. It is a real button with a name, a visible focus ring and a keyboard path, and it **reports** a drag without performing one: where the item may land, what the drop indicator looks like and how the data reorders all belong to the host.'
source: src/components/DragHandle.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- A native `<button type="button">`, named by the required `label`. The name gains ", picked up" while held.
- The keyboard instructions are the button's description (`aria-describedby`), so they are heard once on focus rather than repeated as part of the name. Override `instructions` to translate them.
- `grab` at rest, `grabbing` for the length of a pointer drag. The `grabbing` cursor is set on the document, so it holds wherever the pointer goes, and text selection is suppressed while dragging.
- `touch-action: none`, so a touch drag moves the item instead of scrolling the page.
- Focus is shown with the standard focus ring. A held item is outlined in the primary colour.

<!--@include: ./_shared.md-->
