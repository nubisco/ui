---
layout: nubisco
title: Toolbar
intro: '`NbToolbar` is the strip of tools above a table, a list or a panel: a labelled `role="toolbar"` with one height that every button inside it takes, an optional flush layout with the primary action in the corner, and one tab stop that the arrow keys move along.'
source: src/components/Toolbar.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Props

| Prop    | Type                           | Default  | Description                                                   |
| ------- | ------------------------------ | -------- | ------------------------------------------------------------- |
| `label` | `string`                       | required | The toolbar's accessible name                                 |
| `size`  | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'lg'`   | Height of the strip, given to every button without a size     |
| `flush` | `boolean`                      | `false`  | No gaps, square corners, buttons the full height of the strip |

## Slots

| Slot      | Description                                                         |
| --------- | ------------------------------------------------------------------- |
| `start`   | Grows to fill the width the tools leave: a search, a filter row     |
| `default` | The tools: ghost or icon-only buttons, an action group, an overflow |
| `end`     | The primary action, flush in the corner when `flush` is set         |

## Exposed

| Member    | Description                                     |
| --------- | ----------------------------------------------- |
| `focus()` | Moves focus into the toolbar, onto its tab stop |

## Sizing buttons from outside

The toolbar provides its size and `flush` through `NB_TOOLBAR`
(`src/components/Toolbar.context.ts`). `NbButton` reads it when it has no
`size` of its own. `NbMenu` resets it, so a button in a menu opened from a
toolbar is an ordinary button again.
