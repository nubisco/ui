---
layout: nubisco
title: Drag Handle
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbDragHandle` is the six-dot grip you press to move a block, a table row or a table column. It is a real button with a name, a visible focus ring and a keyboard path, and it **reports** a drag without performing one: where the item may land, what the drop indicator looks like and how the data reorders all belong to the host.

Use it when the reorder logic is yours, as in a document editor or a data table. For a plain vertical list, [`NbReorderList`](/ui/components/reorder-list) already owns the whole job.

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

## Native drag and drop

Editors built on ProseMirror move blocks with the browser's own drag and drop, and need to fill `dataTransfer` themselves. Set `native` and the handle becomes `draggable` and forwards the `DragEvent` on `drag-start`:

```vue
<NbDragHandle
  native
  :label="`Move ${block.label}`"
  @drag-start="({ event }) => startBlockDrag(event as DragEvent)"
/>
```

The keyboard path is the same in both modes.

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

## Accessibility

- A native `<button type="button">`, named by the required `label`. The name gains ", picked up" while held.
- The keyboard instructions are the button's description (`aria-describedby`), so they are heard once on focus rather than repeated as part of the name. Override `instructions` to translate them.
- `grab` at rest, `grabbing` for the length of a pointer drag. The `grabbing` cursor is set on the document, so it holds wherever the pointer goes, and text selection is suppressed while dragging.
- `touch-action: none`, so a touch drag moves the item instead of scrolling the page.
- Focus is shown with the standard focus ring. A held item is outlined in the primary colour.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop           | Type                                   | Default               | Description                                                 |
| -------------- | -------------------------------------- | --------------------- | ----------------------------------------------------------- |
| `label`        | `string`                               | (required)            | Accessible name. Name the thing being moved.                |
| `axis`         | `'vertical' \| 'horizontal' \| 'both'` | `'vertical'`          | Glyph and arrow keys.                                       |
| `size`         | `number`                               | `16`                  | Glyph size in pixels.                                       |
| `threshold`    | `number`                               | `4`                   | Pixels a pointer must travel before a press becomes a drag. |
| `native`       | `boolean`                              | `false`               | Use HTML drag and drop and forward the `DragEvent`.         |
| `instructions` | `string`                               | English keyboard help | Description read on focus.                                  |
| `announcement` | `string`                               | `''`                  | Contents of the polite live region.                         |
| `disabled`     | `boolean`                              | `false`               | Renders the handle inert and cancels a drag in progress.    |

## Events

| Event         | Payload            | Description                                                |
| ------------- | ------------------ | ---------------------------------------------------------- |
| `drag-start`  | `IDragHandleEvent` | A drag began.                                              |
| `drag-move`   | `IDragHandleEvent` | The pointer moved, or an arrow key was pressed while held. |
| `drag-end`    | `IDragHandleEvent` | The item was dropped.                                      |
| `drag-cancel` | `IDragHandleEvent` | The drag was abandoned. Undo any preview.                  |

```ts
interface IDragHandleEvent {
  via: 'pointer' | 'keyboard' | 'native'
  clientX?: number
  clientY?: number
  deltaX: number
  deltaY: number
  direction?: 'up' | 'down' | 'left' | 'right'
  event: Event
}
```

## Exposed

| Member     | Type                             | Description                              |
| ---------- | -------------------------------- | ---------------------------------------- |
| `cancel`   | `() => void`                     | Cancels a pointer or keyboard drag.      |
| `dragging` | `Ref<boolean>`                   | A pointer or native drag is in progress. |
| `grabbed`  | `Ref<boolean>`                   | A keyboard user is holding the item.     |
| `el`       | `Ref<HTMLButtonElement \| null>` | The button.                              |

## Tokens used

| Token                                | Applied to                         |
| ------------------------------------ | ---------------------------------- |
| `--nb-c-text-subtle` / `--nb-c-text` | Glyph at rest / on hover and focus |
| `--nb-c-surface-hover`               | Hover background                   |
| `--nb-c-primary`                     | Held outline and glyph             |
| `--nb-c-focus-ring`                  | Focus outline                      |
| `--nb-c-component-disabled`          | Disabled glyph                     |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const blocks = ref([
  { id: 'intro', label: 'Introduction' },
  { id: 'setup', label: 'Setup' },
  { id: 'usage', label: 'Usage' },
])
const announcement = ref('')

function onMove(index: number, event: { via: string; direction?: string }) {
  if (event.via !== 'keyboard') return
  const to = event.direction === 'up' ? index - 1 : event.direction === 'down' ? index + 1 : index
  if (to < 0 || to >= blocks.value.length || to === index) return
  const next = [...blocks.value]
  const [moved] = next.splice(index, 1)
  next.splice(to, 0, moved)
  blocks.value = next
  announcement.value = `${moved.label} moved to position ${to + 1} of ${next.length}`
}
</script>
