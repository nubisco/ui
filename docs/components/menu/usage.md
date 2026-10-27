---
layout: nubisco
title: Menu
intro: '`NbMenu` is a floating menu container for actions and options. It follows the [Carbon Design System menu pattern](https://carbondesignsystem.com/components/menu/usage/) with full keyboard navigation, submenus, selectable items, danger items, and dividers.'
source: src/components/Menu.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

The menu system is composed of several components that work together: `NbMenu`, `NbMenuItem`, `NbMenuDivider`, and `NbSubmenu`.

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

<!--@include: ./_shared.md-->
