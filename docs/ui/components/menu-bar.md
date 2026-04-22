---
layout: nubisco
title: Menu Bar
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbMenuBar` provides a horizontal menu bar (File, Edit, View) commonly found in desktop applications. It works seamlessly both standalone and inside `NbShell`.

The menu bar is composed of `NbMenuBar` (the container) and `NbMenuBarItem` (each top-level trigger with its associated dropdown).

## Basic usage

<preview>
  <div style="border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbMenuBar>
      <NbMenuBarItem label="File">
        <NbMenuItem label="New File" shortcut="Cmd+N" />
        <NbMenuItem label="Open" shortcut="Cmd+O" />
        <NbSubmenu label="Open Recent">
          <NbMenuItem label="project.json" />
          <NbMenuItem label="readme.md" />
          <NbMenuItem label="index.ts" />
        </NbSubmenu>
        <NbMenuDivider />
        <NbMenuItem label="Save" shortcut="Cmd+S" />
        <NbMenuItem label="Save As..." shortcut="Cmd+Shift+S" />
      </NbMenuBarItem>
      <NbMenuBarItem label="Edit">
        <NbMenuItem label="Undo" shortcut="Cmd+Z" />
        <NbMenuItem label="Redo" shortcut="Cmd+Shift+Z" />
        <NbMenuDivider />
        <NbMenuItem icon="scissors" label="Cut" shortcut="Cmd+X" />
        <NbMenuItem icon="copy" label="Copy" shortcut="Cmd+C" />
        <NbMenuItem icon="clipboard" label="Paste" shortcut="Cmd+V" />
      </NbMenuBarItem>
      <NbMenuBarItem label="View">
        <NbMenuItem selectable :selected="showSidebar" label="Sidebar" @select="showSidebar = !showSidebar" />
        <NbMenuItem selectable :selected="showInspector" label="Inspector" @select="showInspector = !showInspector" />
        <NbMenuDivider />
        <NbMenuItem label="Zoom In" shortcut="Cmd+=" />
        <NbMenuItem label="Zoom Out" shortcut="Cmd+-" />
      </NbMenuBarItem>
      <NbMenuBarItem label="Help">
        <NbMenuItem label="Documentation" icon="book-open" />
        <NbMenuItem label="Release Notes" icon="newspaper" />
        <NbMenuDivider />
        <NbMenuItem label="About" />
      </NbMenuBarItem>
    </NbMenuBar>
  </div>
</preview>

```vue
<template>
  <NbMenuBar>
    <NbMenuBarItem label="File">
      <NbMenuItem label="New File" shortcut="Cmd+N" @select="newFile" />
      <NbMenuItem label="Open" shortcut="Cmd+O" @select="openFile" />
      <NbSubmenu label="Open Recent">
        <NbMenuItem label="project.json" />
        <NbMenuItem label="readme.md" />
      </NbSubmenu>
      <NbMenuDivider />
      <NbMenuItem label="Save" shortcut="Cmd+S" @select="save" />
    </NbMenuBarItem>

    <NbMenuBarItem label="Edit">
      <NbMenuItem label="Undo" shortcut="Cmd+Z" />
      <NbMenuItem label="Redo" shortcut="Cmd+Shift+Z" />
      <NbMenuDivider />
      <NbMenuItem icon="scissors" label="Cut" shortcut="Cmd+X" />
      <NbMenuItem icon="copy" label="Copy" shortcut="Cmd+C" />
      <NbMenuItem icon="clipboard" label="Paste" shortcut="Cmd+V" />
    </NbMenuBarItem>

    <NbMenuBarItem label="View">
      <NbMenuItem
        selectable
        :selected="sidebar"
        label="Sidebar"
        @select="sidebar = !sidebar"
      />
      <NbMenuItem
        selectable
        :selected="inspector"
        label="Inspector"
        @select="inspector = !inspector"
      />
    </NbMenuBarItem>
  </NbMenuBar>
</template>
```

## Inside NbShell

`NbShell` provides a dedicated `#menubar` slot that renders the menu bar between the notification area and the topbar. This is the recommended placement for application menu bars.

<preview>
  <div style="height: 360px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell>
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template #sidebar-nav>
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.12); border-radius: 8px;" />
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.12); border-radius: 8px;" />
      </template>
      <template #menubar>
        <NbMenuBar>
          <NbMenuBarItem label="File">
            <NbMenuItem label="New" shortcut="Cmd+N" />
            <NbMenuItem label="Open" shortcut="Cmd+O" />
            <NbMenuDivider />
            <NbMenuItem label="Save" shortcut="Cmd+S" />
          </NbMenuBarItem>
          <NbMenuBarItem label="Edit">
            <NbMenuItem label="Undo" shortcut="Cmd+Z" />
            <NbMenuItem label="Redo" shortcut="Cmd+Shift+Z" />
          </NbMenuBarItem>
          <NbMenuBarItem label="View">
            <NbMenuItem label="Zoom In" shortcut="Cmd+=" />
            <NbMenuItem label="Zoom Out" shortcut="Cmd+-" />
          </NbMenuBarItem>
        </NbMenuBar>
      </template>
      <template #topbar-left>
        <strong>My Application</strong>
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">The menu bar sits between the notification slot and the topbar.</p>
    </NbShell>
  </div>
</preview>

```vue
<template>
  <NbShell>
    <template #menubar>
      <NbMenuBar>
        <NbMenuBarItem label="File">
          <NbMenuItem label="New" shortcut="Cmd+N" />
          <NbMenuItem label="Open" shortcut="Cmd+O" />
          <NbMenuDivider />
          <NbMenuItem label="Save" shortcut="Cmd+S" />
        </NbMenuBarItem>
        <NbMenuBarItem label="Edit">
          <NbMenuItem label="Undo" shortcut="Cmd+Z" />
          <NbMenuItem label="Redo" shortcut="Cmd+Shift+Z" />
        </NbMenuBarItem>
      </NbMenuBar>
    </template>

    <template #topbar-left>
      <h1>My Application</h1>
    </template>

    <p>Main content area</p>
  </NbShell>
</template>
```

## With danger items

Menu items with destructive actions should use the `danger` prop and be separated by a divider.

<preview>
  <div style="border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbMenuBar>
      <NbMenuBarItem label="File">
        <NbMenuItem label="New" shortcut="Cmd+N" />
        <NbMenuItem label="Save" shortcut="Cmd+S" />
        <NbMenuDivider />
        <NbMenuItem danger label="Delete Project" icon="trash" />
      </NbMenuBarItem>
    </NbMenuBar>
  </div>
</preview>

## Interaction behavior

The menu bar follows standard desktop menu bar conventions:

- **Click** a trigger to open its menu. Click again to close.
- **Hover** over adjacent triggers while a menu is open to switch between menus instantly.
- **ArrowLeft / ArrowRight** cycles between top-level triggers.
- **Escape** closes the active menu and returns focus to its trigger.

## Keyboard navigation

| Key               | Action                                                  |
| ----------------- | ------------------------------------------------------- |
| `ArrowRight`      | Focus next trigger (and switch menu if one is open)     |
| `ArrowLeft`       | Focus previous trigger (and switch menu if one is open) |
| `Enter` / `Space` | Open/close the focused trigger's menu                   |
| `ArrowDown`       | Navigate within the open menu                           |
| `Escape`          | Close the active menu                                   |

</doc-tab>

<doc-tab name="Api">

## NbMenuBar

### Props

| Prop       | Type     | Default     | Description                  |
| ---------- | -------- | ----------- | ---------------------------- |
| `maxWidth` | `string` | `undefined` | Optional max-width CSS value |

### Slots

| Slot    | Description              |
| ------- | ------------------------ |
| default | `NbMenuBarItem` children |

## NbMenuBarItem

### Props

| Prop       | Type                           | Default  | Description              |
| ---------- | ------------------------------ | -------- | ------------------------ |
| `label`    | `string`                       | required | Trigger button label     |
| `size`     | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'`   | Menu item size           |
| `minWidth` | `number`                       | `160`    | Menu minimum width in px |
| `maxWidth` | `number`                       | `288`    | Menu maximum width in px |

### Slots

| Slot      | Description                                                    |
| --------- | -------------------------------------------------------------- |
| `trigger` | Custom trigger content (default renders the `label` text)      |
| default   | NbMenuItem, NbMenuDivider, NbSubmenu children for the dropdown |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const showSidebar = ref(true)
const showInspector = ref(false)
</script>
