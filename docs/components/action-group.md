---
layout: nubisco
title: Action Group
tabs: ['Usage', 'Accessibility', 'Api']
---

<doc-tab name="Usage">

`NbActionGroup` is a row of page actions that knows how to fit a phone. On a
desktop it renders exactly the buttons you would have placed by hand. On a
phone it keeps the one action that matters on screen as an icon and folds the
rest into a "more" menu, so a topbar with five labelled buttons stays usable at
360px instead of being clipped.

```vue
<script setup lang="ts">
import * as iconPlus from '@nubisco/ui/icons/plus'
import * as iconPencil from '@nubisco/ui/icons/pencil-simple'
import * as iconTrash from '@nubisco/ui/icons/trash'

const actions = [
  {
    id: 'add',
    label: 'Add item',
    icon: iconPlus,
    variant: 'primary',
    priority: 'primary',
    onSelect: addItem,
  },
  { id: 'edit', label: 'Edit space', icon: iconPencil, onSelect: edit },
  {
    id: 'delete',
    label: 'Delete space',
    icon: iconTrash,
    danger: true,
    onSelect: remove,
  },
]
</script>

<template>
  <NbActionGroup :items="actions" overflow="phone" />
</template>
```

## On a desktop nothing changes

The group's wrapper is `display: contents`, so the buttons are flex children of
whatever holds the group and take its gap. With `overflow="never"` (the
default), or on anything that is not a phone, the markup is the same `NbButton`s
with the same props, byte for byte, as buttons placed one by one. Adopting the
component is a refactor with no visual change.

## On a phone

With `overflow="phone"` and the phone layout active (`usePhoneLayout().phone`:
below 672px, or a touch phone held sideways):

- The first `phoneVisible` actions flagged `priority: 'primary'` stay on screen
  (the first ones in order when none is flagged). They render icon-only, and
  their label becomes the button's accessible name. An action with no icon keeps
  its label.
- A `dots-three` button opens an [`NbMenu`](/components/menu) holding the rest,
  in their reading order. `danger` actions are danger rows there.
- Anything in the `#menu` slot (extra `NbMenuItem`s) is added to the end of that
  menu. It renders only while the group is folded.

`overflow="always"` folds at every width. On a desktop the visible actions keep
their labels there.

## Icons are linked at build time

An icon reaches the bundle only when the build can see it. Item icons live in
script, so pass the imported glyph module (as above), or register the names you
use with `registerIcons`. See [What ships in your bundle](/bundling).

</doc-tab>

<doc-tab name="Accessibility">

## Accessibility

- Every action is a real `NbButton`. Folded to an icon, it keeps its label as
  `aria-label`, so a screen reader hears the same name a sighted user read on a
  desktop.
- The overflow trigger is named by `overflowLabel` ("More actions") and carries
  `aria-haspopup="menu"` and `aria-expanded`.
- The menu takes focus on its first row when it opens and hands it back to the
  trigger when it closes from the keyboard or after a choice.
- A disabled or loading action does nothing when chosen, from either its button
  or its menu row.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop            | Type                             | Default          | Description                                      |
| --------------- | -------------------------------- | ---------------- | ------------------------------------------------ |
| `items`         | `IActionGroupItem[]`             | required         | The actions, in reading order                    |
| `size`          | `TButtonSize`                    | `'sm'`           | Size of every action and of the overflow trigger |
| `overflow`      | `'never' \| 'phone' \| 'always'` | `'never'`        | When the actions fold into the overflow menu     |
| `overflowLabel` | `string`                         | `'More actions'` | Accessible name of the overflow trigger          |
| `phoneVisible`  | `number`                         | `1`              | How many actions stay on screen while folded     |

## IActionGroupItem

| Field      | Type                       | Description                                                  |
| ---------- | -------------------------- | ------------------------------------------------------------ |
| `id`       | `string`                   | Stable key, and the payload of `select`                      |
| `label`    | `string`                   | Button text, or the icon-only button's accessible name       |
| `icon`     | `TIconSource`              | Needed for the action to fold to icon-only                   |
| `variant`  | `TButtonVariant`           | Passed to `NbButton`. Defaults to `danger` when `danger` set |
| `outlined` | `boolean`                  | Passed to `NbButton`                                         |
| `disabled` | `boolean`                  | Passed to `NbButton` and the menu row                        |
| `loading`  | `boolean`                  | Passed to `NbButton`. A loading row is disabled in the menu  |
| `priority` | `'primary' \| 'secondary'` | `primary` actions are the ones a phone keeps on screen       |
| `danger`   | `boolean`                  | Destructive: a danger button and a danger menu row           |
| `onSelect` | `() => void`               | Runs when the action is chosen                               |

## Slots

| Slot   | Description                                                    |
| ------ | -------------------------------------------------------------- |
| `menu` | Extra `NbMenuItem`s appended to the overflow menu while folded |

## Events

| Event    | Payload      | Fired when                                      |
| -------- | ------------ | ----------------------------------------------- |
| `select` | `id: string` | An action was chosen, after its `onSelect` runs |

</doc-tab>
