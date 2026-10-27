---
layout: nubisco
title: Drag Handle
intro: '`NbDragHandle` is the six-dot grip you press to move a block, a table row or a table column. It is a real button with a name, a visible focus ring and a keyboard path, and it **reports** a drag without performing one: where the item may land, what the drop indicator looks like and how the data reorders all belong to the host.'
source: src/components/DragHandle.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

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

<!--@include: ./_shared.md-->
