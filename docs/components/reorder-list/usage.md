---
layout: nubisco
title: Reorder List
intro: "`NbReorderList` is a vertical list whose rows can be dragged into a new order, with a drop indicator and a keyboard path that does the same job. The model editor's field list, a block zone and moving media between folders all want this."
source: src/components/ReorderList.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

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

## Keys

`itemKey` needs to identify a row in a way that survives reordering, so it cannot be the index: the index is the thing that changes. Pass a property name, or a function for a compound key.

## Notes on the interaction

- **The dragged row stays put and dims** rather than following the pointer. A row moving under the cursor competes with the drop indicator, and the indicator is the part that says what will actually happen.
- **Pointer events, not HTML5 drag and drop.** Drag events cannot be styled consistently, do not fire on touch without a polyfill, and give no control over where the drop indicator sits.
- **A held row is dropped if focus leaves it.** A row still held after the user has tabbed away is a trap with nothing to cancel it.
- **On a touch screen the grip is the handle.** A finger on the row body scrolls the page, as it should, and a finger on the grip drags. The grip opts out of panning (`touch-action: none`), holds on to the pointer for the whole drag, and takes taps in a 44px box on a phone touch screen.
- **A drag the browser cancels moves nothing.** When a scroll, a system gesture or a lost focus takes the pointer away, the row is put down where it was and the list forgets the drag, so a later tap elsewhere cannot drop it somewhere random.
- **The gap between rows opens while dragging**, from 4px to 12px, so the drop indicator is a bar sitting in a space rather than a hairline pinched between two borders. The indicator is centred in that gap, which is why the gap is a token the component owns rather than a margin on the rows.

## Styling

Each row is a surface and takes part in the [layer system](/theming#layers) the way `NbPanel` and `NbCard` do: rows paint one step above wherever the list sits, so layer 1 in a shell's main region and layer 2 inside a panel, and anything inside a row counts one deeper. Do not name a layer for them. Pin one with `class="nb-layer-N"` on the list only when you are resetting depth, not counting it.

Rows follow the panel corner. The gap is `--nb-reorder-list-gap`; set it on the list to change the rhythm, and the drop indicator follows automatically because it is positioned against that same value.

<!--@include: ./_shared.md-->
