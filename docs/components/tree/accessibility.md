---
layout: nubisco
title: Tree
intro: '`NbTree` and `NbTreeNode` provide a hierarchical tree view for navigating nested data structures like file systems, project explorers, or organizational charts.'
source: src/components/Tree.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

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
