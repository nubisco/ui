---
layout: nubisco
title: Command Palette
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbCommandPalette` is a VS Code-style overlay for discovering and executing application commands. Any component in the tree can register commands, and users invoke them via a keyboard shortcut or programmatic API.

## Live demo

Click the button below to open the command palette. It has been pre-loaded with sample commands. Press **Escape** to dismiss it, or click on any command to execute it.

<preview>
  <NbGrid dir="row" gap="sm" align="center">
    <NbButton @click="palette.open()">Open Command Palette</NbButton>
    <NbButton variant="secondary" @click="palette.open('save')">Open with "save" pre-filled</NbButton>
  </NbGrid>
  <NbCommandPalette open-shortcut="Ctrl+Shift+k" placeholder="Search commands..." />
</preview>

::: tip
This documentation site uses **Ctrl+Shift+K** instead of the default Cmd+K to avoid conflicting with VitePress's own search shortcut. In your application you can configure any shortcut via the `openShortcut` prop.
:::

## Setup

Install the `NbCommandPalettePlugin` to enable the `useCommandPalette` composable throughout your app.

```ts
import { createApp } from 'vue'
import { NbCommandPalettePlugin } from '@nubisco/ui'
import App from './App.vue'

const app = createApp(App)
app.use(NbCommandPalettePlugin)
app.mount('#app')
```

Then place the `NbCommandPalette` component once at the root of your application (typically in `App.vue`).

```vue
<template>
  <NbShell>
    <!-- your app content -->
  </NbShell>
  <NbCommandPalette />
</template>
```

## Registering commands

Use the `useCommandPalette` composable from any component to register commands.

```vue
<script setup>
import { useCommandPalette } from '@nubisco/ui'

const palette = useCommandPalette()

palette.register({
  id: 'file.save',
  label: 'Save File',
  icon: 'floppy-disk',
  namespace: 'File',
  shortcut: 'Cmd+S',
  handler: () => saveFile(),
})

palette.register({
  id: 'file.new',
  label: 'New File',
  icon: 'file-plus',
  namespace: 'File',
  shortcut: 'Cmd+N',
  handler: () => newFile(),
})

palette.register({
  id: 'edit.find',
  label: 'Find in Files',
  icon: 'magnifying-glass',
  namespace: 'Edit',
  shortcut: 'Cmd+Shift+F',
  handler: () => openSearch(),
})
</script>
```

## Batch registration

Register many commands at once with `registerMany`.

```ts
palette.registerMany([
  {
    id: 'view.sidebar',
    label: 'Toggle Sidebar',
    namespace: 'View',
    handler: toggleSidebar,
  },
  {
    id: 'view.inspector',
    label: 'Toggle Inspector',
    namespace: 'View',
    handler: toggleInspector,
  },
  {
    id: 'view.fullscreen',
    label: 'Toggle Fullscreen',
    namespace: 'View',
    handler: toggleFullscreen,
  },
])
```

## Context-aware commands

Commands with a `context` property only appear when that context is active. Use `setContext` to activate a context.

```ts
// Only visible when the editor context is active
palette.register({
  id: 'editor.format',
  label: 'Format Document',
  namespace: 'Editor',
  context: 'editor',
  handler: () => formatDocument(),
})

// Activate when user enters the editor
palette.setContext('editor')

// Clear context when user leaves
palette.setContext(undefined)
```

## Opening programmatically

```ts
// Open with empty search
palette.open()

// Open with a pre-filled filter
palette.open('save')
```

## Configurable shortcut

The keyboard shortcut is fully configurable via the `openShortcut` prop. The value is a `+`-separated string of modifiers and a key.

Supported modifiers: `Meta`, `Cmd`, `Ctrl`, `Control`, `Shift`, `Alt`.

```vue
<!-- Default: Meta+K (Cmd+K on Mac) -->
<NbCommandPalette />

<!-- VS Code style -->
<NbCommandPalette open-shortcut="Ctrl+Shift+p" />

<!-- Custom -->
<NbCommandPalette open-shortcut="Alt+Space" />
```

## Keyboard navigation

| Key                   | Action                       |
| --------------------- | ---------------------------- |
| Configurable shortcut | Open/close the palette       |
| `ArrowDown`           | Highlight next result        |
| `ArrowUp`             | Highlight previous result    |
| `Enter`               | Execute highlighted command  |
| `Escape`              | Always dismisses the palette |

## Search behavior

The command palette uses fuzzy matching with weighted scoring:

1. **Exact prefix** matches score highest
2. **Word boundary** matches (start of a word) score next
3. **Substring** matches score proportionally
4. **Fuzzy** character-by-character matches score lowest

The search matches against the command label, namespace, and optional keywords.

</doc-tab>

<doc-tab name="Api">

## NbCommandPalette

### Props

| Prop           | Type     | Default                | Description                                      |
| -------------- | -------- | ---------------------- | ------------------------------------------------ |
| `openShortcut` | `string` | `'Meta+k'`             | Keyboard shortcut string (e.g. `'Ctrl+Shift+p'`) |
| `placeholder`  | `string` | `'Search commands...'` | Search input placeholder                         |
| `maxResults`   | `number` | `50`                   | Maximum results to display                       |

## ICommand

The shape of a command object passed to `register()`.

| Property    | Type                          | Required | Description                           |
| ----------- | ----------------------------- | -------- | ------------------------------------- |
| `id`        | `string`                      | yes      | Unique identifier                     |
| `label`     | `string`                      | yes      | Display label                         |
| `icon`      | `string`                      | no       | Phosphor icon name                    |
| `namespace` | `string`                      | no       | Grouping label (e.g. "File", "Edit")  |
| `shortcut`  | `string`                      | no       | Shortcut display text                 |
| `handler`   | `() => void \| Promise<void>` | yes      | Function to execute                   |
| `context`   | `string`                      | no       | Only show when this context is active |
| `keywords`  | `string[]`                    | no       | Additional search terms               |

## useCommandPalette()

Returns the palette state object. Requires `NbCommandPalettePlugin` to be installed.

| Method         | Signature                                | Description                                         |
| -------------- | ---------------------------------------- | --------------------------------------------------- |
| `register`     | `(command: ICommand) => void`            | Register a single command                           |
| `registerMany` | `(commands: ICommand[]) => void`         | Register multiple commands                          |
| `unregister`   | `(id: string) => void`                   | Remove a command by ID                              |
| `open`         | `(filter?: string) => void`              | Open the palette, optionally pre-filling the search |
| `close`        | `() => void`                             | Close the palette                                   |
| `setContext`   | `(context: string \| undefined) => void` | Set the active context for filtering                |

| Property        | Type                    | Description                             |
| --------------- | ----------------------- | --------------------------------------- |
| `commands`      | `Map<string, ICommand>` | Reactive map of all registered commands |
| `isOpen`        | `boolean`               | Whether the palette is open             |
| `activeContext` | `string \| undefined`   | Currently active context                |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
import { useCommandPalette } from '../../../src'

const palette = useCommandPalette()
const lastExecuted = ref('')

function showAction(name: string) {
  lastExecuted.value = name
}

// Register sample commands for the demo
palette.registerMany([
  {
    id: 'demo.file.new',
    label: 'New File',
    icon: 'file-plus',
    namespace: 'File',
    shortcut: 'Cmd+N',
    handler: () => showAction('New File'),
  },
  {
    id: 'demo.file.open',
    label: 'Open File',
    icon: 'folder-open',
    namespace: 'File',
    shortcut: 'Cmd+O',
    handler: () => showAction('Open File'),
  },
  {
    id: 'demo.file.save',
    label: 'Save',
    icon: 'floppy-disk',
    namespace: 'File',
    shortcut: 'Cmd+S',
    handler: () => showAction('Save'),
  },
  {
    id: 'demo.file.saveas',
    label: 'Save As...',
    icon: 'floppy-disk',
    namespace: 'File',
    shortcut: 'Cmd+Shift+S',
    handler: () => showAction('Save As'),
  },
  {
    id: 'demo.edit.undo',
    label: 'Undo',
    icon: 'arrow-counter-clockwise',
    namespace: 'Edit',
    shortcut: 'Cmd+Z',
    handler: () => showAction('Undo'),
  },
  {
    id: 'demo.edit.redo',
    label: 'Redo',
    icon: 'arrow-clockwise',
    namespace: 'Edit',
    shortcut: 'Cmd+Shift+Z',
    handler: () => showAction('Redo'),
  },
  {
    id: 'demo.edit.find',
    label: 'Find in Files',
    icon: 'magnifying-glass',
    namespace: 'Edit',
    shortcut: 'Cmd+Shift+F',
    handler: () => showAction('Find in Files'),
  },
  {
    id: 'demo.edit.replace',
    label: 'Find and Replace',
    icon: 'swap',
    namespace: 'Edit',
    shortcut: 'Cmd+H',
    handler: () => showAction('Find and Replace'),
  },
  {
    id: 'demo.view.sidebar',
    label: 'Toggle Sidebar',
    icon: 'sidebar',
    namespace: 'View',
    shortcut: 'Cmd+B',
    handler: () => showAction('Toggle Sidebar'),
  },
  {
    id: 'demo.view.terminal',
    label: 'Toggle Terminal',
    icon: 'terminal',
    namespace: 'View',
    shortcut: 'Cmd+`',
    handler: () => showAction('Toggle Terminal'),
  },
  {
    id: 'demo.view.zoom-in',
    label: 'Zoom In',
    icon: 'magnifying-glass-plus',
    namespace: 'View',
    shortcut: 'Cmd+=',
    handler: () => showAction('Zoom In'),
  },
  {
    id: 'demo.view.zoom-out',
    label: 'Zoom Out',
    icon: 'magnifying-glass-minus',
    namespace: 'View',
    shortcut: 'Cmd+-',
    handler: () => showAction('Zoom Out'),
  },
  {
    id: 'demo.help.docs',
    label: 'Open Documentation',
    icon: 'book-open',
    namespace: 'Help',
    handler: () => showAction('Open Documentation'),
    keywords: ['manual', 'guide', 'reference'],
  },
  {
    id: 'demo.help.about',
    label: 'About',
    icon: 'info',
    namespace: 'Help',
    handler: () => showAction('About'),
  },
])
</script>
