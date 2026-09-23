---
layout: nubisco
title: useContextMenu
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`useContextMenu` is a composable that manages context menu state. It pairs with `NbMenu` to render a floating menu at the cursor position on right-click.

## Basic usage

```vue
<template>
  <div @contextmenu="ctx.onContextMenu" class="canvas">
    Right-click anywhere in this area
  </div>

  <NbMenu ref="menu" v-model:open="ctx.isOpen" @close="ctx.close()">
    <NbMenuItem label="Inspect Element" icon="magnifying-glass" />
    <NbMenuItem label="Copy" icon="copy" shortcut="Cmd+C" />
    <NbMenuDivider />
    <NbMenuItem danger label="Delete" icon="trash" />
  </NbMenu>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useContextMenu } from '@nubisco/ui'

const ctx = useContextMenu()
const menu = ref(null)

watch(
  () => ctx.position.value,
  (pos) => {
    menu.value?.setPositionXY(pos.x, pos.y)
  },
)
</script>
```

## With the directive

You can also use the `v-nb-context-menu` directive for a more declarative approach.

```vue
<template>
  <div v-nb-context-menu="onRightClick">Right-click me</div>

  <NbMenu ref="menu" v-model:open="ctx.isOpen" @close="ctx.close()">
    <NbMenuItem label="Option A" />
    <NbMenuItem label="Option B" />
  </NbMenu>
</template>

<script setup>
import { ref } from 'vue'
import { useContextMenu } from '@nubisco/ui'

const ctx = useContextMenu()
const menu = ref(null)

function onRightClick({ x, y }) {
  menu.value?.setPositionXY(x, y)
  ctx.open(x, y)
}
</script>
```

</doc-tab>

<doc-tab name="Api">

## Return value

| Property        | Type                             | Description                       |
| --------------- | -------------------------------- | --------------------------------- |
| `isOpen`        | `Ref<boolean>`                   | Whether the context menu is open  |
| `position`      | `Ref<{ x: number, y: number }>`  | Current cursor position           |
| `onContextMenu` | `(e: MouseEvent) => void`        | Handler to bind on `@contextmenu` |
| `open`          | `(x: number, y: number) => void` | Open at specific coordinates      |
| `close`         | `() => void`                     | Close the context menu            |

</doc-tab>
