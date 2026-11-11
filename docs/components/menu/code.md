---
layout: nubisco
title: Menu
intro: '`NbMenu` is a floating menu container for actions and options. It follows the [Carbon Design System menu pattern](https://carbondesignsystem.com/components/menu/usage/) with full keyboard navigation, submenus, selectable items, danger items, and dividers.'
source: src/components/Menu.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Basic menu

<preview>
  <NbButton ref="basicTrigger" @click="openBasicMenu">Actions</NbButton>
  <NbMenu ref="basicMenu" v-model:open="basicOpen" @close="basicOpen = false">
    <NbMenuItem label="Cut" shortcut="Cmd+X" @select="basicOpen = false" />
    <NbMenuItem label="Copy" shortcut="Cmd+C" @select="basicOpen = false" />
    <NbMenuItem label="Paste" shortcut="Cmd+V" @select="basicOpen = false" />
  </NbMenu>
</preview>

```vue
<template>
  <NbButton ref="trigger" @click="toggleMenu">Actions</NbButton>
  <NbMenu ref="menu" v-model:open="menuOpen">
    <NbMenuItem label="Cut" shortcut="Cmd+X" @select="onCut" />
    <NbMenuItem label="Copy" shortcut="Cmd+C" @select="onCopy" />
    <NbMenuItem label="Paste" shortcut="Cmd+V" @select="onPaste" />
  </NbMenu>
</template>

<script setup>
import { ref } from 'vue'

const trigger = ref(null)
const menu = ref(null)
const menuOpen = ref(false)

function toggleMenu() {
  if (menuOpen.value) {
    menuOpen.value = false
  } else {
    const rect = trigger.value.$el.getBoundingClientRect()
    menu.value.setPosition(rect)
    menuOpen.value = true
  }
}
</script>
```

## Submenus

Use `NbSubmenu` to nest menus. The submenu opens on hover, on click, or from the keyboard with `ArrowRight`, `Enter` or `Space`, which also moves focus to its first item. It closes on mouse-leave, or with `ArrowLeft` or `Escape`, which hand focus back to the trigger.

<preview>
  <NbButton ref="subTrigger" @click="openSubMenu">File</NbButton>
  <NbMenu ref="subMenu" v-model:open="subOpen" @close="subOpen = false">
    <NbMenuItem label="New File" shortcut="Cmd+N" @select="subOpen = false" />
    <NbSubmenu label="Open Recent">
      <NbMenuItem label="project.json" @select="subOpen = false" />
      <NbMenuItem label="readme.md" @select="subOpen = false" />
      <NbMenuItem label="index.ts" @select="subOpen = false" />
    </NbSubmenu>
    <NbMenuDivider />
    <NbMenuItem label="Save" shortcut="Cmd+S" @select="subOpen = false" />
  </NbMenu>
</preview>

```vue
<NbMenu v-model:open="open">
  <NbMenuItem label="New File" shortcut="Cmd+N" />
  <NbSubmenu label="Open Recent">
    <NbMenuItem label="project.json" />
    <NbMenuItem label="readme.md" />
    <NbMenuItem label="index.ts" />
  </NbSubmenu>
  <NbMenuDivider />
  <NbMenuItem label="Save" shortcut="Cmd+S" />
</NbMenu>
```

## A form in a menu

A menu can hold fields instead of items: a filter panel, or a quick edit opened from a placeholder. `NbSelect` and `NbDatePicker` draw their list and calendar outside the menu, and the menu knows they belong to it, so picking an option or a day does not count as a press outside and does not close it. Escape closes the menu from any field in it. When a field's list or calendar is open, the first Escape closes only that.

```vue
<template>
  <NbMenu ref="menu" v-model:open="open">
    <NbSelect id="goal" v-model="goal" :options="goals" />
  </NbMenu>
</template>
```

## NbMenu

### Props

| Prop       | Type                           | Default | Description              |
| ---------- | ------------------------------ | ------- | ------------------------ |
| `open`     | `boolean`                      | `false` | Controls menu visibility |
| `size`     | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'`  | Item height preset       |
| `minWidth` | `number`                       | `160`   | Minimum width in px      |
| `maxWidth` | `number`                       | `288`   | Maximum width in px      |

### Events

| Event         | Payload   | Description                             |
| ------------- | --------- | --------------------------------------- |
| `close`       | none      | Emitted when the menu requests to close |
| `update:open` | `boolean` | For v-model:open binding                |

### Exposed methods

| Method          | Signature                                      | Description                           |
| --------------- | ---------------------------------------------- | ------------------------------------- |
| `setPosition`   | `(rect: { top, left, bottom, width }) => void` | Position menu below a trigger element |
| `setPositionXY` | `(x: number, y: number) => void`               | Position menu at specific coordinates |
| `close`         | `() => void`                                   | Close the menu programmatically       |

## NbMenuItem

### Props

| Prop             | Type             | Default     | Description                                                                                                                            |
| ---------------- | ---------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `label`          | `string`         | required    | Display text                                                                                                                           |
| `icon`           | `string`         | `undefined` | Phosphor icon name                                                                                                                     |
| `picture`        | `string \| null` | `undefined` | A picture in the icon's place, as a 16px `NbAvatar`. `null` draws the label's initials                                                 |
| `shortcut`       | `string`         | `undefined` | Keyboard shortcut display text                                                                                                         |
| `disabled`       | `boolean`        | `false`     | Disables the item                                                                                                                      |
| `disabledReason` | `string`         | `undefined` | Why the item is disabled: a muted second line, its `aria-describedby`, and the arrow keys still stop on it. Read only while `disabled` |
| `danger`         | `boolean`        | `false`     | Destructive action styling                                                                                                             |
| `selectable`     | `boolean`        | `false`     | Checkbox-style toggle                                                                                                                  |
| `selected`       | `boolean`        | `false`     | Whether selectable item is checked                                                                                                     |
| `radioGroup`     | `string`         | `undefined` | Radio group name                                                                                                                       |

### Events

| Event    | Payload | Description                        |
| -------- | ------- | ---------------------------------- |
| `select` | none    | Emitted when the item is activated |

### Slots

| Slot       | Description                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `leading`  | Replaces what leads the label (the picture or the icon), for anything the two props cannot say |
| `trailing` | After the shortcut: a badge, a count, a secondary control                                      |

## NbMenuDivider

No props. Renders a horizontal separator.

## NbSubmenu

### Props

| Prop             | Type      | Default     | Description                                                                                      |
| ---------------- | --------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `label`          | `string`  | required    | Trigger label                                                                                    |
| `icon`           | `string`  | `undefined` | Phosphor icon name                                                                               |
| `disabled`       | `boolean` | `false`     | Disables the submenu trigger                                                                     |
| `disabledReason` | `string`  | `undefined` | Why the submenu is unavailable, as on `NbMenuItem`. It does not open. Read only while `disabled` |

### Slots

| Slot    | Description                           |
| ------- | ------------------------------------- |
| default | NbMenuItem and NbMenuDivider children |

<!--@include: ./_shared.md-->
