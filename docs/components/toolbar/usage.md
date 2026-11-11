---
layout: nubisco
title: Toolbar
intro: '`NbToolbar` is the strip of tools above a table, a list or a panel: a labelled `role="toolbar"` with one height that every button inside it takes, an optional flush layout with the primary action in the corner, and one tab stop that the arrow keys move along.'
source: src/components/Toolbar.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<script setup lang="ts">
import { ref } from 'vue'
const query = ref('')
</script>

<preview>
  <div style="width: 100%; background: var(--nb-c-surface);">
    <NbToolbar label="Invoice tools" flush>
      <template #start>
        <NbTextInput v-model="query" placeholder="Search invoices" />
      </template>
      <NbButton variant="ghost" icon="funnel" label="Filter" />
      <NbButton variant="ghost" icon="gear" label="Settings" />
      <NbOverflowMenu :items="[{ id: 'export', label: 'Export' }, { id: 'print', label: 'Print' }]" />
      <template #end>
        <NbButton variant="primary" icon="plus">Add invoice</NbButton>
      </template>
    </NbToolbar>
  </div>
</preview>

```vue
<NbToolbar label="Invoice tools" flush>
  <template #start>
    <!-- NbSearch (expandable) goes here. Any field fills the slot. -->
    <NbTextInput v-model="query" placeholder="Search invoices" />
  </template>
  <NbButton variant="ghost" icon="funnel" label="Filter" />
  <NbButton variant="ghost" icon="gear" label="Settings" />
  <NbOverflowMenu :items="moreActions" />
  <template #end>
    <NbButton variant="primary" icon="plus">Add invoice</NbButton>
  </template>
</NbToolbar>
```

## When to use it

Use a toolbar for the tools that act on one region: a table, a list, a
canvas, a panel. The page's own actions belong in
[`NbPageHeader`](/components/page-header/usage). A bar that floats over a
selection is [`NbFloatingToolbar`](/components/floating-toolbar/usage).
See [Toolbars and overflow](/patterns/toolbars) for the rules that decide
what goes in one.

## One height for the strip

`size` (`sm` 32px, `md` 40px, `lg` 48px, `xl` 64px) is handed to every
`NbButton` inside the toolbar that was not given a size, including the ones
inside an `NbActionGroup` or an `NbOverflowMenu`. Match it to the row the
toolbar sits on: a table's toolbar is as tall as its rows, up to 48px. A
button given its own size keeps it.

## Flush

`flush` is the data table look: no gaps, square corners, every button the
full height of the strip, and the `end` slot's primary sitting in the
corner. Without it the buttons keep their corners and an 8px gap, for a
toolbar inside a card or a panel body.

## The start slot

Whatever is in `#start` fills the width the tools leave, and moves to a line
of its own when that is too little. An expandable `NbSearch` goes there.
The examples use a plain `NbTextInput` in its place.

## Up to five, then overflow

Show at most five tools. Everything else goes into one
[`NbOverflowMenu`](/components/overflow-menu/usage) at the end of the tools,
before the primary. For a row of actions that should fold on its own as the
toolbar narrows, use an `NbActionGroup` with `overflow="auto"` inside it.
