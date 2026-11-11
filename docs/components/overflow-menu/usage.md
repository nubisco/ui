---
layout: nubisco
title: Overflow Menu
intro: '`NbOverflowMenu` is the "more actions" button: a ghost, icon-only `dots-three` trigger that opens a menu of the actions there was no room for, in a toolbar, a table row or a card header.'
source: src/components/OverflowMenu.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<preview>
  <NbOverflowMenu
    :items="[
      { id: 'rename', label: 'Rename' },
      { id: 'duplicate', label: 'Duplicate' },
      {
        id: 'archive',
        label: 'Archive',
        disabled: true,
        disabledReason: 'Shared files cannot be archived',
      },
      { id: 'delete', label: 'Delete', danger: true },
    ]"
  />
</preview>

```vue
<NbOverflowMenu :items="actions" @select="run" />
```

## When to use it

- For the actions that do not fit: past five in a toolbar, past three in a
  table row.
- Not for two actions. Fewer than three stay inline as icon buttons, each
  with a `label`: a menu of two costs a click and hides both.
- Not for the primary action. It stays on screen.

## Items or a slot

`items` takes the same objects as
[`NbActionGroup`](/components/action-group/usage), so a group's overflow and a
standalone menu are written the same way. `NbMenuItem`s in the default slot
are added after them, for a submenu or a divider.

## An action that does not apply

Keep it in the menu with `disabled` and a `disabledReason`, as you would on a
button. A button shows the reason as its tooltip. A menu row has nowhere to
hover on a touch screen, so it prints the reason under its label instead,
and the arrow keys still stop on it. The same item reads the same whether it
sits inline or has folded into the menu, which is what `NbActionGroup`,
`NbBatchActions` and the rows of `NbDataTable` rely on.

## Alignment

The menu is 160 to 288px wide and its rows match the trigger's height (up to
48px). `align="end"` (the default) lines the menu's right edge up with the
trigger's, which is right for a trigger at the end of a row or toolbar.
`align="start"` lines up the left edges. Either way the menu stays on
screen, and opens above the trigger when there is no room below.
