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

A disabled item with a `disabledReason` is not skipped: it takes focus like
any other item (`aria-disabled="true"`), Enter, Space and a click do
nothing, and the reason is its description (`aria-describedby`), so a
screen reader reads it when the item is reached. A disabled item without a
reason is skipped by the arrow keys and typeahead. Opening a submenu on hover leaves focus where it
is, so pointer users are not interrupted.

<!--@include: ./_shared.md-->
