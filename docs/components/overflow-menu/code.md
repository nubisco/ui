---
layout: nubisco
title: Overflow Menu
intro: '`NbOverflowMenu` is the "more actions" button: a ghost, icon-only `dots-three` trigger that opens a menu of the actions there was no room for, in a toolbar, a table row or a card header.'
source: src/components/OverflowMenu.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Props

| Prop              | Type                 | Default                | Description                                       |
| ----------------- | -------------------- | ---------------------- | ------------------------------------------------- |
| `items`           | `IActionGroupItem[]` | `[]`                   | The actions, in reading order                     |
| `label`           | `string`             | `'More actions'`       | The trigger's accessible name and tooltip         |
| `icon`            | `TIconSource`        | `dots-three`           | The trigger's icon                                |
| `size`            | `TButtonSize`        | the toolbar's, or `md` | The trigger's size. The rows match it, up to `lg` |
| `align`           | `'start' \| 'end'`   | `'end'`                | Which edge of the trigger the menu lines up with  |
| `disabled`        | `boolean`            | `false`                | Disables the trigger                              |
| `tooltipPosition` | `string`             | `'bottom'`             | Where the trigger's tooltip opens                 |

`label` defaults to the string catalogue's `overflowMenuLabel`.

## Slots

| Slot      | Description                        |
| --------- | ---------------------------------- |
| `default` | Extra `NbMenuItem`s, after `items` |

## Events

| Event         | Payload         | Fired when                                    |
| ------------- | --------------- | --------------------------------------------- |
| `select`      | `id: string`    | An item was chosen, after its `onSelect` runs |
| `update:open` | `open: boolean` | The menu opened or closed                     |

## Exposed

`open()`, `close()` and `isOpen`.
