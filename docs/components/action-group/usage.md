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
- A `dots-three` button opens an [`NbMenu`](/components/menu/usage) holding the rest,
  in their reading order. `danger` actions are danger rows there.
- Anything in the `#menu` slot (extra `NbMenuItem`s) is added to the end of that
  menu. It renders only while the group is folded.

`overflow="always"` folds at every width. On a desktop the visible actions keep
their labels there.

## Icons are linked at build time

An icon reaches the bundle only when the build can see it. Item icons live in
script, so pass the imported glyph module (as above), or register the names you
use with `registerIcons`. See [What ships in your bundle](/bundling).
