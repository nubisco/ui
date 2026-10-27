---
layout: nubisco
title: Board
intro: '`NbBoard` is a kanban-style board with columns, optional swim lanes, and drag-and-drop support. Card rendering is fully customizable via the `card` slot.'
source: src/components/Board.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

## Live demo

<preview>
  <NbBoard :columns="columns" :items="items" @move="onMove">
    <template #card="{ item }">
      <strong>{{ item.title }}</strong>
    </template>
  </NbBoard>
</preview>

## Drag and Drop

Drag and drop is built in. When a card is dropped somewhere new, in another cell or at a different position in its own column, the `move` event fires with the source and destination coordinates, the target index, and the ids of the neighbouring items. The component does not mutate `items` directly; update your data in the event handler.

`toIndex` counts positions in the destination cell with the moved item excluded, so it is the index the item should occupy after the move. `beforeItemId` and `afterItemId` name the items that end up directly above and below it (`null` at the edges), which is exactly what a fractional-position scheme needs.

During a drag operation:

- A drop line marks the position the card would land in, and the target cell highlights with a primary-tinted background and dashed outline.
- Cards show a grab cursor and lift with a subtle shadow on hover.

## On a Phone

There is nothing to opt into. On a phone layout (below 672px, or a phone held
sideways), wider screens being unchanged:

- Columns snap one at a time, each as wide as the board less 40px, so the edge
  of the next one shows. Set `--nb-board-phone-track` on the board to choose
  another width.
- Without lanes, each column scrolls on its own, so moving to the next column
  starts at its top. This needs the board to have a height, as a full-page
  board already does. Swimlanes keep one shared scroll.
- A lane's header keeps its label and count at the left edge as the columns
  scroll past.
- The batch bar is pinned along the foot of the screen in one row, clear of
  the home indicator, and the `batch-actions` slot receives `phone: true` so
  the actions can drop to icons.

<!--@include: ./_shared.md-->
