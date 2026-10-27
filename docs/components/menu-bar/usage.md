---
layout: nubisco
title: Menu Bar
intro: '`NbMenuBar` provides a horizontal menu bar (File, Edit, View) commonly found in desktop applications. It works seamlessly both standalone and inside `NbShell`.'
source: src/components/MenuBar.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

The menu bar is composed of `NbMenuBar` (the container) and `NbMenuBarItem` (each top-level trigger with its associated dropdown).

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

<!--@include: ./_shared.md-->
