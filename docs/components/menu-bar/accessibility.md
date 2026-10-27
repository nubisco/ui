---
layout: nubisco
title: Menu Bar
intro: '`NbMenuBar` provides a horizontal menu bar (File, Edit, View) commonly found in desktop applications. It works seamlessly both standalone and inside `NbShell`.'
source: src/components/MenuBar.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Keyboard navigation

| Key               | Action                                                  |
| ----------------- | ------------------------------------------------------- |
| `ArrowRight`      | Focus next trigger (and switch menu if one is open)     |
| `ArrowLeft`       | Focus previous trigger (and switch menu if one is open) |
| `Enter` / `Space` | Open/close the focused trigger's menu                   |
| `ArrowDown`       | Navigate within the open menu                           |
| `Escape`          | Close the active menu                                   |

<!--@include: ./_shared.md-->
