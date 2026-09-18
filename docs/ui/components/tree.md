---
layout: nubisco
title: Tree
tabs: ['Usage', 'Accessibility', 'Api']
---

<doc-tab name="Usage">

`NbTree` and `NbTreeNode` provide a hierarchical tree view for navigating nested data structures like file systems, project explorers, or organizational charts.

## Basic Usage

<preview>
  <NbTree v-model="selected">
    <NbTreeNode id="1" label="Documents" icon="folder">
      <NbTreeNode id="1.1" label="Resume.pdf" icon="file" />
      <NbTreeNode id="1.2" label="Cover Letter.docx" icon="file" />
    </NbTreeNode>
    <NbTreeNode id="2" label="Images" icon="folder">
      <NbTreeNode id="2.1" label="photo.png" icon="image" />
      <NbTreeNode id="2.2" label="logo.svg" icon="image" />
    </NbTreeNode>
    <NbTreeNode id="3" label="README.md" icon="file" />
  </NbTree>
</preview>

```vue
<template>
  <NbTree v-model="selected">
    <NbTreeNode id="1" label="Documents" icon="folder">
      <NbTreeNode id="1.1" label="Resume.pdf" icon="file" />
      <NbTreeNode id="1.2" label="Cover Letter.docx" icon="file" />
    </NbTreeNode>
    <NbTreeNode id="2" label="Images" icon="folder">
      <NbTreeNode id="2.1" label="photo.png" icon="image" />
    </NbTreeNode>
    <NbTreeNode id="3" label="README.md" icon="file" />
  </NbTree>
</template>

<script setup>
import { ref } from 'vue'
const selected = ref(null)
</script>
```

## Branch vs Leaf Nodes

Nodes with child `NbTreeNode` elements are **branches** -- they show a caret chevron and can be expanded/collapsed. Nodes without children are **leaves**.

<preview>
  <NbTree>
    <NbTreeNode id="branch" label="Branch node (has children)" icon="folder">
      <NbTreeNode id="leaf1" label="Leaf node 1" icon="file" />
      <NbTreeNode id="leaf2" label="Leaf node 2" icon="file" />
    </NbTreeNode>
    <NbTreeNode id="leaf3" label="Leaf node (no children)" icon="file" />
  </NbTree>
</preview>

## Compact Mode

Use the `compact` prop or `size="sm"` for denser tree views (24px row height instead of 32px).

<preview>
  <NbTree compact>
    <NbTreeNode id="1" label="src" icon="folder">
      <NbTreeNode id="2" label="components" icon="folder">
        <NbTreeNode id="3" label="Button.vue" icon="file" />
        <NbTreeNode id="4" label="Panel.vue" icon="file" />
      </NbTreeNode>
      <NbTreeNode id="5" label="main.ts" icon="file" />
    </NbTreeNode>
  </NbTree>
</preview>

## Drag and Drop

Enable `draggable` on the tree to allow nodes to be reordered via drag and drop. The tree emits a `drop` event with the source node, target node, and drop position (`before`, `after`, or `inside`).

```vue
<template>
  <NbTree v-model="selected" draggable @drop="onDrop">
    <NbTreeNode id="1" label="Documents" icon="folder">
      <NbTreeNode id="1.1" label="Resume.pdf" icon="file" />
      <NbTreeNode id="1.2" label="Cover Letter.docx" icon="file" />
    </NbTreeNode>
    <NbTreeNode id="2" label="Images" icon="folder">
      <NbTreeNode id="2.1" label="photo.png" icon="image" />
    </NbTreeNode>
    <NbTreeNode id="3" label="README.md" icon="file" />
  </NbTree>
</template>

<script setup>
import { ref } from 'vue'

const selected = ref(null)

function onDrop({ sourceId, targetId, position }) {
  console.log(`Move ${sourceId} ${position} ${targetId}`)
  // Reorder your data model here
}
</script>
```

Visual indicators during drag:

- **Before/After**: A colored line appears at the top or bottom edge of the target row.
- **Inside** (any node that has not opted out with `droppable`): The target row highlights with a tinted background and border, indicating the dragged node will become a child.
- The dragged node fades to 40% opacity while in flight.

Individual nodes can opt out of dragging by setting `:draggable="false"`, or you can enable it per-node instead of globally.

### Dropping onto a leaf

Every node takes a drop in its middle by default, including a node with no children, which is how a leaf becomes a parent. Set `:droppable="false"` on a node that should never take children:

```vue
<NbTree draggable @drop="onDrop">
  <NbTreeNode
    v-for="page in pages"
    :id="page.id"
    :key="page.id"
    :label="page.title"
  >
    <NbTreeNode
      v-for="child in page.children"
      :id="child.id"
      :key="child.id"
      :label="child.title"
    />
  </NbTreeNode>
  <NbTreeNode id="readme" label="Cannot take children" :droppable="false" />
</NbTree>
```

A node is a branch when its default slot renders at least one child, checked on every render. A slot that renders nothing (an empty `v-for`, as for `page` above before it has children) leaves a plain leaf: no caret, no toggle on click, and no `aria-expanded`. When the first child arrives the caret appears without the node remounting. For children loaded only on expand, set `expandable` to show the caret before they exist.

## Actions Slot

Use the `actions` slot on `NbTreeNode` to render action buttons or badges on the right side. Actions are visible on hover and when the node is selected.

<preview>
  <NbTree>
    <NbTreeNode id="1" label="Project Files" icon="folder">
      <template #actions>
        <NbLabel size="sm" muted>3 items</NbLabel>
      </template>
      <NbTreeNode id="2" label="index.ts" icon="file" />
      <NbTreeNode id="3" label="styles.css" icon="file" />
    </NbTreeNode>
  </NbTree>
</preview>

## Custom Label Slot

Use the `label` slot to render custom content (e.g., inline rename inputs).

```vue
<NbTreeNode id="1" label="Editable">
  <template #label>
    <input v-if="renaming" v-model="name" @blur="save" />
    <span v-else>{{ name }}</span>
  </template>
</NbTreeNode>
```

## Deep Nesting

Trees support unlimited nesting depth. Indentation increases by 16px per level.

<preview>
  <NbTree compact>
    <NbTreeNode id="1" label="Level 0" icon="folder">
      <NbTreeNode id="2" label="Level 1" icon="folder">
        <NbTreeNode id="3" label="Level 2" icon="folder">
          <NbTreeNode id="4" label="Level 3" icon="file" />
        </NbTreeNode>
      </NbTreeNode>
    </NbTreeNode>
  </NbTree>
</preview>

## Programmatic Control

Use `ref` to access `expandIds()` and `collapseAll()` methods.

```vue
<template>
  <NbButton @click="treeRef.collapseAll()">Collapse All</NbButton>
  <NbTree ref="treeRef">...</NbTree>
</template>

<script setup>
const treeRef = ref()
</script>
```

</doc-tab>

<doc-tab name="Accessibility">

## Keyboard Navigation

| Key           | Action                                         |
| ------------- | ---------------------------------------------- |
| `Arrow Down`  | Move focus to next visible node                |
| `Arrow Up`    | Move focus to previous visible node            |
| `Arrow Right` | Expand a collapsed branch; no effect on leaves |
| `Arrow Left`  | Collapse an expanded branch                    |
| `Enter`       | Select the focused node                        |
| `Home`        | Move focus to the first node                   |
| `End`         | Move focus to the last visible node            |
| `F2`          | Emits `dblclick` event (for rename workflows)  |

## ARIA Roles

- `NbTree` renders `<ul role="tree">`
- `NbTreeNode` renders `<li role="treeitem">`
- Branch nodes include `aria-expanded="true|false"`
- Selected nodes include `aria-selected="true"`
- Disabled nodes include `aria-disabled="true"`
- Draggable nodes include `aria-grabbed="true|false"` during drag
- Child node lists render as `<ul role="group">`

## Focus Management

Nodes are focusable via `tabindex="-1"`. Arrow key navigation managed by the tree container. Focus ring uses the primary color via inset box-shadow.

</doc-tab>

<doc-tab name="Api">

## NbTree Props

| Prop         | Type             | Default | Description                       |
| ------------ | ---------------- | ------- | --------------------------------- |
| `modelValue` | `string \| null` | `null`  | Selected node ID (v-model)        |
| `compact`    | `boolean`        | `false` | Compact 24px rows                 |
| `size`       | `'sm' \| 'md'`   | `'md'`  | Size variant (`sm` = compact)     |
| `draggable`  | `boolean`        | `false` | Enable drag and drop on all nodes |

## NbTree Events

| Event               | Payload           | Description                      |
| ------------------- | ----------------- | -------------------------------- |
| `update:modelValue` | `string`          | Selected node changed            |
| `select`            | `string`          | Node was selected                |
| `toggle`            | `string, boolean` | Node was expanded/collapsed      |
| `drop`              | `ITreeDropEvent`  | Node was dropped (drag and drop) |

## ITreeDropEvent

| Property   | Type                              | Description                  |
| ---------- | --------------------------------- | ---------------------------- |
| `sourceId` | `string`                          | ID of the dragged node       |
| `targetId` | `string`                          | ID of the drop target node   |
| `position` | `'before' \| 'after' \| 'inside'` | Where relative to the target |

## NbTree Methods (via ref)

| Method                     | Description           |
| -------------------------- | --------------------- |
| `expandIds(ids: string[])` | Expand specific nodes |
| `collapseAll()`            | Collapse all nodes    |

## NbTreeNode Props

| Prop         | Type              | Default     | Description                                                                                       |
| ------------ | ----------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `id`         | `string`          | required    | Unique node identifier                                                                            |
| `label`      | `string`          | required    | Display text                                                                                      |
| `icon`       | `string`          | `undefined` | Icon name (NbIcon)                                                                                |
| `disabled`   | `boolean`         | `false`     | Disable interaction                                                                               |
| `depth`      | `number \| null`  | `null`      | Nesting depth (auto-computed, 16px per level)                                                     |
| `draggable`  | `boolean \| null` | `null`      | Override tree-level draggable for this node                                                       |
| `expandable` | `boolean \| null` | `null`      | Show the caret. `null` decides from whether the slot renders children                             |
| `droppable`  | `boolean \| null` | `null`      | Allow a drop inside, making the dragged node a child. Every node allows one unless set to `false` |

## NbTreeNode Slots

| Slot      | Description                                      |
| --------- | ------------------------------------------------ |
| `default` | Child NbTreeNode elements (makes this a branch)  |
| `label`   | Custom label content (e.g., inline rename input) |
| `actions` | Right-side content (visible on hover/selected)   |

## NbTreeNode Events

| Event         | Payload              | Description               |
| ------------- | -------------------- | ------------------------- |
| `select`      | `string`             | Node was clicked          |
| `toggle`      | `string, boolean`    | Branch expanded/collapsed |
| `contextmenu` | `MouseEvent, string` | Right-click on node       |
| `dblclick`    | `string`             | Double-click or F2        |

</doc-tab>
