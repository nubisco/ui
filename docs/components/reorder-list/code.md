---
layout: nubisco
title: Reorder List
intro: "`NbReorderList` is a vertical list whose rows can be dragged into a new order, with a drop indicator and a keyboard path that does the same job. The model editor's field list, a block zone and moving media between folders all want this."
source: src/components/ReorderList.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

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

<!--@include: ./_shared.md-->
