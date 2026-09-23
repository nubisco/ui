---
layout: nubisco
title: Reorder List
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbReorderList` is a vertical list whose rows can be dragged into a new order, with a drop indicator and a keyboard path that does the same job. The model editor's field list, a block zone and moving media between folders all want this.

<preview>
  <div style="max-width: 28rem; width: 100%;">
    <NbReorderList
      v-model="reorderDemo"
      item-key="id"
      label="Fields"
      v-slot="{ item }"
    >
      {{ item.label }}
    </NbReorderList>
  </div>
</preview>

```vue
<script setup>
const fields = ref([
  { id: 'title', label: 'Title' },
  { id: 'slug', label: 'Slug' },
  { id: 'body', label: 'Body' },
])
</script>

<template>
  <NbReorderList
    v-model="fields"
    item-key="id"
    label="Fields"
    v-slot="{ item }"
  >
    {{ item.label }}
  </NbReorderList>
</template>
```

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

## Handles

By default a row drags from anywhere, which suits a row that is just a label. Set `handle` when rows contain their own controls, so dragging does not fight the buttons inside them.

<preview>
  <div style="max-width: 28rem; width: 100%;">
    <NbReorderList
      v-model="reorderHandleDemo"
      item-key="id"
      handle
      label="Blocks"
      v-slot="{ item }"
    >
      <span style="display: flex; align-items: center; gap: 0.5rem; width: 100%">
        <span style="flex: 1">{{ item.label }}</span>
        <NbButton size="sm" variant="ghost">Edit</NbButton>
      </span>
    </NbReorderList>
  </div>
</preview>

## Controlled, for orders that can fail

`v-model` writes the new order back immediately, which is right when the order lives in the client. When it lives on a server and the move can be rejected, bind `:model-value` instead and apply the change yourself once it is saved.

```vue
<NbReorderList
  :model-value="fields"
  item-key="id"
  @reorder="onReorder"
  v-slot="{ item }"
>
  {{ item.label }}
</NbReorderList>

<script setup>
async function onReorder({ from, to }) {
  const next = [...fields.value]
  next.splice(to, 0, ...next.splice(from, 1))
  const saved = await api.saveOrder(next)
  if (saved) fields.value = next // otherwise the list stays as it was
}
</script>
```

## Keys

`itemKey` needs to identify a row in a way that survives reordering, so it cannot be the index: the index is the thing that changes. Pass a property name, or a function for a compound key.

## Notes on the interaction

- **The dragged row stays put and dims** rather than following the pointer. A row moving under the cursor competes with the drop indicator, and the indicator is the part that says what will actually happen.
- **Pointer events, not HTML5 drag and drop.** Drag events cannot be styled consistently, do not fire on touch without a polyfill, and give no control over where the drop indicator sits.
- **A held row is dropped if focus leaves it.** A row still held after the user has tabbed away is a trap with nothing to cancel it.
- **The gap between rows opens while dragging**, from 4px to 12px, so the drop indicator is a bar sitting in a space rather than a hairline pinched between two borders. The indicator is centred in that gap, which is why the gap is a token the component owns rather than a margin on the rows.

## Styling

Rows are squared, like the rest of the library. The gap is `--nb-reorder-list-gap`; set it on the list to change the rhythm, and the drop indicator follows automatically because it is positioned against that same value.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop         | Type                                                       | Default | Description                                                  |
| ------------ | ---------------------------------------------------------- | ------- | ------------------------------------------------------------ |
| `modelValue` | `T[]`                                                      | `[]`    | The rows, in order.                                          |
| `itemKey`    | `string \| ((item: T, index: number) => string \| number)` | —       | Stable identity per row. Not the index.                      |
| `handle`     | `boolean`                                                  | `false` | Drag only from the handle, for rows with their own controls. |
| `disabled`   | `boolean`                                                  | `false` | Nothing can be moved. Rows still render and read normally.   |
| `label`      | `string`                                                   | `''`    | Accessible name for the list. Say what is being ordered.     |

## Events

| Event               | Payload                                                      | Description                                             |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| `update:modelValue` | `T[]`                                                        | The reordered array.                                    |
| `reorder`           | `{ from: number, to: number, via: 'pointer' \| 'keyboard' }` | Indices before and after the move, and how it was made. |

## Slots

| Slot      | Props             | Description                                                  |
| --------- | ----------------- | ------------------------------------------------------------ |
| `default` | `{ item, index }` | The row's content.                                           |
| `handle`  | `{ item, index }` | Replaces the grip mark. Only reachable when `handle` is set. |

</doc-tab>

<script setup>
import { ref } from 'vue'
const reorderDemo = ref([
  { id: 'title', label: 'Title' },
  { id: 'slug', label: 'Slug' },
  { id: 'body', label: 'Body' },
  { id: 'cover', label: 'Cover image' },
])
const reorderHandleDemo = ref([
  { id: 'hero', label: 'Hero' },
  { id: 'features', label: 'Feature grid' },
  { id: 'cta', label: 'Call to action' },
])
</script>
