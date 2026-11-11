---
layout: nubisco
title: Batch Actions
intro: '`NbBatchActions` is the bar that appears while things are selected: how many, what can be done to all of them, and Cancel. Over a table toolbar it covers the strip edge to edge, in a free layout it floats at the foot.'
source: src/components/BatchActions.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Props

| Prop          | Type                           | Default                     | Description                                |
| ------------- | ------------------------------ | --------------------------- | ------------------------------------------ |
| `count`       | `number`                       | required                    | How many things are selected               |
| `items`       | `IActionGroupItem[]`           | `[]`                        | The actions. Folded into a menu on a phone |
| `variant`     | `'overlay' \| 'floating'`      | `'overlay'`                 | Over a toolbar strip, or a floating pill   |
| `size`        | `'sm' \| 'md' \| 'lg' \| 'xl'` | `lg` overlay, `sm` floating | The bar's buttons' size                    |
| `cancelLabel` | `string`                       | `'Cancel'`                  | The cancel button's text                   |
| `label`       | `string`                       | `'Batch actions'`           | The region's accessible name               |

`cancelLabel` and `label` default to the catalogue's `batchActionsCancel`
and `batchActionsLabel`.

## Slots

| Slot      | Props                | Description                        |
| --------- | -------------------- | ---------------------------------- |
| `default` | `{ phone: boolean }` | Actions of your own, after `items` |

## Events

| Event    | Payload      | Fired when                      |
| -------- | ------------ | ------------------------------- |
| `cancel` | none         | Cancel was pressed              |
| `select` | `id: string` | An item from `items` was chosen |
