---
layout: nubisco
title: Tree
intro: '`NbTree` and `NbTreeNode` provide a hierarchical tree view for navigating nested data structures like file systems, project explorers, or organizational charts.'
source: src/components/Tree.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

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

## Meta Slot

Use the `meta` slot for what a row **is** rather than what you can do with it: a status, a count, a date. Unlike `actions`, it is always visible, because a status that only appeared on hover would hide the thing a reader scans the tree for. When both are used, `meta` sits first and the actions follow it.

<preview>
  <NbTree>
    <NbTreeNode id="m1" label="Home" icon="file">
      <template #meta>
        <NbBadge variant="green" size="sm">Live</NbBadge>
      </template>
      <NbTreeNode id="m2" label="pricing" icon="file">
        <template #meta>
          <NbBadge variant="orange" size="sm">In review</NbBadge>
        </template>
      </NbTreeNode>
    </NbTreeNode>
  </NbTree>
</preview>

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
