---
layout: nubisco
title: Menu
intro: '`NbMenu` is a floating menu container for actions and options. It follows the [Carbon Design System menu pattern](https://carbondesignsystem.com/components/menu/usage/) with full keyboard navigation, submenus, selectable items, danger items, and dividers.'
source: src/components/Menu.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Keyboard navigation

| Key                              | Action                                                          |
| -------------------------------- | --------------------------------------------------------------- |
| `ArrowDown`                      | Move to next item                                               |
| `ArrowUp`                        | Move to previous item                                           |
| `Enter` / `Space`                | Activate item                                                   |
| `ArrowRight` / `Enter` / `Space` | On a submenu trigger: open the submenu and focus its first item |
| `ArrowLeft` / `Escape` (submenu) | Close the submenu and return focus to its trigger               |
| `Escape` (top level)             | Close menu                                                      |
| `Tab`                            | Close the menu, from any level                                  |

Disabled items are skipped. Opening a submenu on hover leaves focus where it
is, so pointer users are not interrupted.

<!--@include: ./_shared.md-->
