---
layout: nubisco
title: Batch Actions
intro: '`NbBatchActions` is the bar that appears while things are selected: how many, what can be done to all of them, and Cancel. Over a table toolbar it covers the strip edge to edge, in a free layout it floats at the foot.'
source: src/components/BatchActions.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<preview>
  <div style="position: relative; width: 100%; height: 48px;">
    <NbBatchActions
      :count="3"
      :items="[
        { id: 'export', label: 'Export', icon: 'export' },
        { id: 'delete', label: 'Delete', icon: 'trash' },
      ]"
    />
  </div>
</preview>

```vue
<NbBatchActions
  :count="selected.length"
  :items="batchActions"
  @cancel="selected = []"
/>
```

## Two places it sits

- `variant="overlay"` (the default) covers a toolbar strip. The host is the
  containing block (`position: relative`), and the bar fills it: its height
  is the strip's, so nothing below moves when selection starts.
  [`NbDataTable`](/components/data-table/usage) uses it for `#batch-actions`.
- `variant="floating"` is a pill at the foot of a free layout, where there is
  no strip to cover. [`NbBoard`](/components/board/usage) uses it.

## The rules it follows

- The count comes first, then the actions, then Cancel on the far right.
- The bar is as tall as the toolbar it replaces, and its buttons are too:
  it gives its `size` to every button inside it, slotted ones included.
- While it is up, the row actions rest. `NbDataTable` disables them, so a
  row cannot be acted on behind a selection.
- On a phone `items` fold into an overflow menu and Cancel becomes an `x`
  icon, so the bar stays one row.
