---
layout: nubisco
title: Drag Handle
intro: '`NbDragHandle` is the six-dot grip you press to move a block, a table row or a table column. It is a real button with a name, a visible focus ring and a keyboard path, and it **reports** a drag without performing one: where the item may land, what the drop indicator looks like and how the data reorders all belong to the host.'
source: src/components/DragHandle.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

Use it when the reorder logic is yours, as in a document editor or a data table. For a plain vertical list, [`NbReorderList`](/components/reorder-list/usage) already owns the whole job.

<preview>
  <div style="max-width: 28rem; width: 100%; display: flex; flex-direction: column; gap: 8px">
    <div
      v-for="(block, index) in blocks"
      :key="block.id"
      style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--nb-c-border); border-radius: var(--nb-radius-md); background: var(--nb-c-surface)"
    >
      <NbDragHandle
        :label="`Move ${block.label}`"
        :announcement="announcement"
        @drag-move="onMove(index, $event)"
        @drag-end="announcement = `${block.label} dropped`"
      />
      <span>{{ block.label }}</span>
    </div>
  </div>
</preview>

Tab to a handle, press <kbd>Space</kbd>, move with the arrow keys, and press <kbd>Space</kbd> again to drop.

```vue
<template>
  <div v-for="(block, index) in blocks" :key="block.id" class="block">
    <NbDragHandle
      :label="`Move ${block.label}`"
      :announcement="announcement"
      @drag-start="onStart(index, $event)"
      @drag-move="onMove(index, $event)"
      @drag-end="onDrop"
      @drag-cancel="onCancel"
    />
    {{ block.label }}
  </div>
</template>
```

## The drag lifecycle

Every way of dragging reports the same four events, each with an `IDragHandleEvent` whose `via` says what drove it.

| Event         | Pointer                              | Keyboard                                           | Native (`native`)        |
| ------------- | ------------------------------------ | -------------------------------------------------- | ------------------------ |
| `drag-start`  | Pointer travelled past `threshold`   | <kbd>Space</kbd> or <kbd>Enter</kbd>               | `dragstart`              |
| `drag-move`   | Every pointer move                   | Each arrow key along `axis`                        | (use your drop target)   |
| `drag-end`    | Pointer released                     | <kbd>Space</kbd> / <kbd>Enter</kbd>, or focus left | `dragend` with a drop    |
| `drag-cancel` | <kbd>Escape</kbd> or `pointercancel` | <kbd>Escape</kbd>                                  | `dragend` without a drop |

For a pointer, `deltaX` and `deltaY` are pixels from where the press started, and `clientX` / `clientY` are the pointer. For the keyboard they count arrow-key **steps** since pick-up, and `direction` names the step just taken. A host that reorders live can act on `direction`. One that previews and commits on drop can use the deltas.

A press that never travels past `threshold` stays a plain click, so a handle can also open a block menu on click. A press that did become a drag does not also fire `click`.

## Axis

`axis` picks the glyph and the arrow keys. A handle for a row or a block uses `vertical` (the default), a column handle uses `horizontal`, and a free-floating item uses `both`.

<preview dir="row">
  <NbDragHandle label="Move row" />
  <NbDragHandle label="Move column" axis="horizontal" />
  <NbDragHandle label="Move item" disabled />
</preview>

## Announcing moves

A keyboard user does not see the item travel. The handle cannot know the new position, because it does not own the reorder, so it gives you a polite live region instead: set `announcement` after each move (`"Introduction moved to position 3 of 5"`) and it is read out.

## Hosts that move DOM nodes

A browser drops focus from a node when that node is moved, which is exactly what a keyed list does when the host reorders on `drag-move`. The handle recognises that blur (focus went nowhere and nothing was clicked) and takes focus back, so the item stays held. A blur to another control, or a click elsewhere, drops the item, the same as `NbReorderList`.

<!--@include: ./_shared.md-->
