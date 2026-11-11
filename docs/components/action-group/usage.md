---
layout: nubisco
title: Action Group
intro: '`NbActionGroup` is a row of page actions that knows how to fit a phone. On a desktop it renders exactly the buttons you would have placed by hand. On a phone it keeps the one action that matters on screen as an icon and folds the rest into a "more" menu, so a topbar with five labelled buttons stays usable at 360px instead of being clipped.'
source: src/components/ActionGroup.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

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

With `overflow="never"` (the default), or on anything that is not a phone, the
group renders the same `NbButton`s with the same props as buttons placed one by
one, in a row with the library's 8px between them. Inside an
[`NbToolbar`](/components/toolbar/usage) the wrapper steps aside
(`display: contents`): the buttons are the toolbar's own children, take its
gap (none when it is flush) and its height, and join its arrow-key focus.

## On a phone

With `overflow="phone"` and the phone layout active (`usePhoneLayout().phone`:
below 672px, or a touch phone held sideways):

- The first `phoneVisible` actions flagged `priority: 'primary'` stay on screen
  (the first ones in order when none is flagged). They render icon-only, and
  their label becomes the button's accessible name. An action with no icon keeps
  its label.
- A `dots-three` [`NbOverflowMenu`](/components/overflow-menu/usage) holds the rest,
  in their reading order. `danger` actions are danger rows there.
- Anything in the `#menu` slot (extra `NbMenuItem`s) is added to the end of that
  menu. It renders only while the group is folded.

`overflow="always"` folds at every width. On a desktop the visible actions keep
their labels there.

## Folding by width

`overflow="auto"` folds by the room the group has, not by the viewport. As many
actions as fit stay on screen, in reading order, and the rest move into the
overflow menu. Each button's width is read once, while every action is on
screen, and a resize only refits against those widths. Use it in a toolbar or
a panel header whose width changes with the page. On a phone it behaves as
`"phone"`.

## Icon-only actions

An item with `iconOnly: true` (and an `icon`) is an icon button at every width.
Its `label` becomes the button's `label`: its accessible name and its tooltip.
A disabled one with a `disabledReason` passes it to `NbButton`: the button
stays focusable (`aria-disabled`), cannot be pressed, and shows the reason in
its tooltip under the label, so an action that does not apply stays where it
is and still explains itself, to the keyboard too. `pressed` draws the button's
pressed state, for a toggle.

## Icons are linked at build time

An icon reaches the bundle only when the build can see it. Item icons live in
script, so pass the imported glyph module (as above), or register the names you
use with `registerIcons`. See [What ships in your bundle](/bundling).
