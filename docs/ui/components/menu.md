---
layout: nubisco
title: Menu
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbMenu` is a floating menu container for actions and options. It follows the [Carbon Design System menu pattern](https://carbondesignsystem.com/components/menu/usage/) with full keyboard navigation, submenus, selectable items, danger items, and dividers.

The menu system is composed of several components that work together: `NbMenu`, `NbMenuItem`, `NbMenuDivider`, and `NbSubmenu`.

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

## Dividers

Use `NbMenuDivider` to separate groups of related actions.

<preview>
  <NbButton ref="dividerTrigger" @click="openDividerMenu">Edit</NbButton>
  <NbMenu ref="dividerMenu" v-model:open="dividerOpen" @close="dividerOpen = false">
    <NbMenuItem label="Undo" shortcut="Cmd+Z" @select="dividerOpen = false" />
    <NbMenuItem label="Redo" shortcut="Cmd+Shift+Z" @select="dividerOpen = false" />
    <NbMenuDivider />
    <NbMenuItem label="Cut" shortcut="Cmd+X" @select="dividerOpen = false" />
    <NbMenuItem label="Copy" shortcut="Cmd+C" @select="dividerOpen = false" />
    <NbMenuItem label="Paste" shortcut="Cmd+V" @select="dividerOpen = false" />
  </NbMenu>
</preview>

## Icons

Menu items support an optional leading icon via the `icon` prop (any Phosphor icon name).

<preview>
  <NbButton ref="iconTrigger" @click="openIconMenu">Clipboard</NbButton>
  <NbMenu ref="iconMenu" v-model:open="iconOpen" @close="iconOpen = false">
    <NbMenuItem icon="scissors" label="Cut" shortcut="Cmd+X" @select="iconOpen = false" />
    <NbMenuItem icon="copy" label="Copy" shortcut="Cmd+C" @select="iconOpen = false" />
    <NbMenuItem icon="clipboard" label="Paste" shortcut="Cmd+V" @select="iconOpen = false" />
  </NbMenu>
</preview>

## Selectable items

Set `selectable` on a menu item to render it as a checkbox-style toggle with a checkmark indicator.

<preview>
  <NbButton ref="checkTrigger" @click="openCheckMenu">View Options</NbButton>
  <NbMenu ref="checkMenu" v-model:open="checkOpen" @close="checkOpen = false">
    <NbMenuItem selectable :selected="showGrid" label="Show Grid" @select="showGrid = !showGrid" />
    <NbMenuItem selectable :selected="showRulers" label="Show Rulers" @select="showRulers = !showRulers" />
    <NbMenuItem selectable :selected="showGuides" label="Show Guides" @select="showGuides = !showGuides" />
  </NbMenu>
</preview>

## Radio groups

Use the `radioGroup` prop to create mutually exclusive selections within a named group.

<preview>
  <NbButton ref="radioTrigger" @click="openRadioMenu">Sort</NbButton>
  <NbMenu ref="radioMenu" v-model:open="radioOpen" @close="radioOpen = false">
    <NbMenuItem radioGroup="sort" :selected="sortBy === 'name'" label="Sort by Name" @select="sortBy = 'name'" />
    <NbMenuItem radioGroup="sort" :selected="sortBy === 'date'" label="Sort by Date" @select="sortBy = 'date'" />
    <NbMenuItem radioGroup="sort" :selected="sortBy === 'size'" label="Sort by Size" @select="sortBy = 'size'" />
  </NbMenu>
</preview>

## Danger items

The `danger` prop renders an item with destructive styling (red text, red hover background).

<preview>
  <NbButton ref="dangerTrigger" @click="openDangerMenu">More</NbButton>
  <NbMenu ref="dangerMenu" v-model:open="dangerOpen" @close="dangerOpen = false">
    <NbMenuItem label="Rename" @select="dangerOpen = false" />
    <NbMenuItem label="Duplicate" @select="dangerOpen = false" />
    <NbMenuDivider />
    <NbMenuItem danger label="Delete" icon="trash" @select="dangerOpen = false" />
  </NbMenu>
</preview>

## Disabled items

Disabled items are visually muted and cannot be activated.

<preview>
  <NbButton ref="disabledTrigger" @click="openDisabledMenu">Edit</NbButton>
  <NbMenu ref="disabledMenu" v-model:open="disabledOpen" @close="disabledOpen = false">
    <NbMenuItem label="Copy" @select="disabledOpen = false" />
    <NbMenuItem label="Paste" disabled />
    <NbMenuItem label="Select All" @select="disabledOpen = false" />
  </NbMenu>
</preview>

## Submenus

Use `NbSubmenu` to nest menus. The submenu opens on hover or arrow-right, and closes on mouse-leave or arrow-left.

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

## Sizes

Menus support four item sizes: `xs` (24px), `sm` (32px), `md` (40px, default), and `lg` (48px).

<preview>
  <NbGrid dir="row" gap="sm">
    <NbButton ref="xsTrigger" size="sm" @click="openSizeMenu('xs')">XS</NbButton>
    <NbButton ref="smTrigger" size="sm" @click="openSizeMenu('sm')">SM</NbButton>
    <NbButton ref="mdTrigger" size="sm" @click="openSizeMenu('md')">MD</NbButton>
    <NbButton ref="lgTrigger" size="sm" @click="openSizeMenu('lg')">LG</NbButton>
  </NbGrid>
  <NbMenu ref="sizeMenu" v-model:open="sizeOpen" :size="currentSize" @close="sizeOpen = false">
    <NbMenuItem label="Option A" @select="sizeOpen = false" />
    <NbMenuItem label="Option B" @select="sizeOpen = false" />
    <NbMenuItem label="Option C" @select="sizeOpen = false" />
  </NbMenu>
</preview>

## Keyboard navigation

| Key               | Action                |
| ----------------- | --------------------- |
| `ArrowDown`       | Move to next item     |
| `ArrowUp`         | Move to previous item |
| `Enter` / `Space` | Activate item         |
| `ArrowRight`      | Open submenu          |
| `ArrowLeft`       | Close submenu         |
| `Escape`          | Close menu            |

</doc-tab>

<doc-tab name="Api">

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

| Prop         | Type      | Default     | Description                        |
| ------------ | --------- | ----------- | ---------------------------------- |
| `label`      | `string`  | required    | Display text                       |
| `icon`       | `string`  | `undefined` | Phosphor icon name                 |
| `shortcut`   | `string`  | `undefined` | Keyboard shortcut display text     |
| `disabled`   | `boolean` | `false`     | Disables the item                  |
| `danger`     | `boolean` | `false`     | Destructive action styling         |
| `selectable` | `boolean` | `false`     | Checkbox-style toggle              |
| `selected`   | `boolean` | `false`     | Whether selectable item is checked |
| `radioGroup` | `string`  | `undefined` | Radio group name                   |

### Events

| Event    | Payload | Description                        |
| -------- | ------- | ---------------------------------- |
| `select` | none    | Emitted when the item is activated |

## NbMenuDivider

No props. Renders a horizontal separator.

## NbSubmenu

### Props

| Prop       | Type      | Default     | Description                  |
| ---------- | --------- | ----------- | ---------------------------- |
| `label`    | `string`  | required    | Trigger label                |
| `icon`     | `string`  | `undefined` | Phosphor icon name           |
| `disabled` | `boolean` | `false`     | Disables the submenu trigger |

### Slots

| Slot    | Description                           |
| ------- | ------------------------------------- |
| default | NbMenuItem and NbMenuDivider children |

</doc-tab>

<script setup lang="ts">
import { ref, type Ref } from 'vue'

// Basic menu
const basicTrigger = ref(null) as Ref<any>
const basicMenu = ref(null) as Ref<any>
const basicOpen = ref(false)

function openBasicMenu() {
  if (basicOpen.value) { basicOpen.value = false; return }
  const rect = (basicTrigger.value?.$el ?? basicTrigger.value)?.getBoundingClientRect()
  if (rect) basicMenu.value?.setPosition(rect)
  basicOpen.value = true
}

// Divider menu
const dividerTrigger = ref(null) as Ref<any>
const dividerMenu = ref(null) as Ref<any>
const dividerOpen = ref(false)

function openDividerMenu() {
  if (dividerOpen.value) { dividerOpen.value = false; return }
  const rect = (dividerTrigger.value?.$el ?? dividerTrigger.value)?.getBoundingClientRect()
  if (rect) dividerMenu.value?.setPosition(rect)
  dividerOpen.value = true
}

// Icon menu
const iconTrigger = ref(null) as Ref<any>
const iconMenu = ref(null) as Ref<any>
const iconOpen = ref(false)

function openIconMenu() {
  if (iconOpen.value) { iconOpen.value = false; return }
  const rect = (iconTrigger.value?.$el ?? iconTrigger.value)?.getBoundingClientRect()
  if (rect) iconMenu.value?.setPosition(rect)
  iconOpen.value = true
}

// Selectable menu
const checkTrigger = ref(null) as Ref<any>
const checkMenu = ref(null) as Ref<any>
const checkOpen = ref(false)
const showGrid = ref(true)
const showRulers = ref(false)
const showGuides = ref(true)

function openCheckMenu() {
  if (checkOpen.value) { checkOpen.value = false; return }
  const rect = (checkTrigger.value?.$el ?? checkTrigger.value)?.getBoundingClientRect()
  if (rect) checkMenu.value?.setPosition(rect)
  checkOpen.value = true
}

// Radio menu
const radioTrigger = ref(null) as Ref<any>
const radioMenu = ref(null) as Ref<any>
const radioOpen = ref(false)
const sortBy = ref('name')

function openRadioMenu() {
  if (radioOpen.value) { radioOpen.value = false; return }
  const rect = (radioTrigger.value?.$el ?? radioTrigger.value)?.getBoundingClientRect()
  if (rect) radioMenu.value?.setPosition(rect)
  radioOpen.value = true
}

// Danger menu
const dangerTrigger = ref(null) as Ref<any>
const dangerMenu = ref(null) as Ref<any>
const dangerOpen = ref(false)

function openDangerMenu() {
  if (dangerOpen.value) { dangerOpen.value = false; return }
  const rect = (dangerTrigger.value?.$el ?? dangerTrigger.value)?.getBoundingClientRect()
  if (rect) dangerMenu.value?.setPosition(rect)
  dangerOpen.value = true
}

// Disabled menu
const disabledTrigger = ref(null) as Ref<any>
const disabledMenu = ref(null) as Ref<any>
const disabledOpen = ref(false)

function openDisabledMenu() {
  if (disabledOpen.value) { disabledOpen.value = false; return }
  const rect = (disabledTrigger.value?.$el ?? disabledTrigger.value)?.getBoundingClientRect()
  if (rect) disabledMenu.value?.setPosition(rect)
  disabledOpen.value = true
}

// Submenu
const subTrigger = ref(null) as Ref<any>
const subMenu = ref(null) as Ref<any>
const subOpen = ref(false)

function openSubMenu() {
  if (subOpen.value) { subOpen.value = false; return }
  const rect = (subTrigger.value?.$el ?? subTrigger.value)?.getBoundingClientRect()
  if (rect) subMenu.value?.setPosition(rect)
  subOpen.value = true
}

// Size menu
const xsTrigger = ref(null) as Ref<any>
const smTrigger = ref(null) as Ref<any>
const mdTrigger = ref(null) as Ref<any>
const lgTrigger = ref(null) as Ref<any>
const sizeMenu = ref(null) as Ref<any>
const sizeOpen = ref(false)
const currentSize = ref<'xs' | 'sm' | 'md' | 'lg'>('md')

const sizeTriggerMap: Record<string, Ref<any>> = { xs: xsTrigger, sm: smTrigger, md: mdTrigger, lg: lgTrigger }

function openSizeMenu(size: 'xs' | 'sm' | 'md' | 'lg') {
  if (sizeOpen.value) { sizeOpen.value = false; return }
  currentSize.value = size
  const triggerRef = sizeTriggerMap[size]
  const rect = (triggerRef.value?.$el ?? triggerRef.value)?.getBoundingClientRect()
  if (rect) sizeMenu.value?.setPosition(rect)
  sizeOpen.value = true
}
</script>
