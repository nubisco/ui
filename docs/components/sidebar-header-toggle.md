---
layout: nubisco
title: Sidebar Header Toggle
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbSidebarHeaderToggle` collapses and expands the rail from the top of the sidebar, beside the brand, instead of from a row at the bottom. It goes in `NbShell`'s `sidebar-header-action` slot, which is opt-in: a shell that leaves the slot empty renders exactly as it did before, so [NbSidebarCollapseToggle](/components/sidebar-collapse-toggle) in `#sidebar-bottom` stays the default.

## Try it

Pick a position and a compact behaviour, then use the toggle itself to collapse and expand the rail. Shrink the browser window below 672px to see the drawer layout.

<preview dir="col" :props="headerProps" v-slot="{ resultingProps }">
  <DemoFrame :height="380">
    <NbShell
      :sidebar-variant="variant"
      :sidebar-header-action-position="resultingProps.position === 'none' ? 'end' : resultingProps.position"
      :sidebar-header-action-compact="resultingProps.compact"
      topbar="always"
      style="height: 100%"
    >
      <template #sidebar-logo>
        <NbSidebarBrand icon="shield-check" title="Openbridge" subtitle="Fleet" />
      </template>
      <template v-if="resultingProps.position !== 'none'" #sidebar-header-action>
        <NbSidebarHeaderToggle @toggle="toggle" />
      </template>
      <template #sidebar-nav>
        <NbSidebarMenu>
          <NbSidebarMenuItem icon="house" label="Home" href="#try-it" active />
          <NbSidebarMenuItem icon="pulse" label="Activity" href="#try-it" />
          <NbSidebarMenuItem icon="target" label="Goals" href="#try-it" />
          <NbSidebarMenuItem icon="book-open" label="Docs" href="#try-it" />
        </NbSidebarMenu>
      </template>
      <template #sidebar-bottom>
        <NbSidebarMenu>
          <NbSidebarMenuItem icon="bell" label="Notifications" href="#try-it" />
          <NbSidebarMenuItem icon="gear" label="Settings" href="#try-it" />
          <NbSidebarCollapseToggle v-if="resultingProps.position === 'none'" @toggle="toggle" />
        </NbSidebarMenu>
      </template>
      <template #topbar-left>
        <strong>Home</strong>
      </template>
      <p style="margin: 0">The rail is <strong>{{ variant === 'compact' ? 'collapsed' : 'expanded' }}</strong>.</p>
    </NbShell>
  </DemoFrame>
</preview>

## Usage

```vue
<script setup lang="ts">
import { useSidebarVariant } from '@nubisco/ui'

const nav = useSidebarVariant({ storageKey: 'product.sidebar' })
</script>

<template>
  <NbShell
    :sidebar-variant="nav.variant.value"
    sidebar-header-action-position="start"
    sidebar-header-action-compact="swap"
  >
    <template #sidebar-logo>
      <NbSidebarBrand icon="shield-check" title="Openbridge" subtitle="Fleet" />
    </template>
    <template #sidebar-header-action>
      <NbSidebarHeaderToggle @toggle="nav.toggle" />
    </template>
    <!-- #sidebar-nav, #sidebar-bottom as before, minus NbSidebarCollapseToggle -->
  </NbShell>
</template>
```

Use one toggle or the other, not both. They share the `useSidebarVariant` state and the `sidebarCollapseToggle.*` translation keys, so switching a product between them touches nothing else.

## Positions

| Position | Expanded rail                                                | Collapsed rail                       |
| -------- | ------------------------------------------------------------ | ------------------------------------ |
| `end`    | Brand, then the toggle at the far edge                       | Set by `sidebarHeaderActionCompact`  |
| `start`  | Toggle first, then the brand, as a top bar would             | Set by `sidebarHeaderActionCompact`  |
| `edge`   | A small round tab on the rail's border, level with the brand | The same tab, pointing the other way |

## The collapsed rail

The 56px rail has no room for the brand and the toggle side by side, so `sidebarHeaderActionCompact` picks how they share it:

- **`stack`**: both, one above the other. With `start` the toggle is on top, with `end` it is below.
- **`swap`**: the brand, which turns into the toggle under the pointer or keyboard focus. On a screen without hover it behaves as `replace`, since a control that only appears on hover would be out of reach.
- **`replace`**: the toggle alone, in the brand's place.

## On phones

Below `collapseAt` the rail becomes a drawer opened from the topbar's nav button, and the header action is not rendered at all. The nav button is already the control there, and a drawer has no compact form to collapse into.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop            | Type          | Default            | Description                                                                |
| --------------- | ------------- | ------------------ | -------------------------------------------------------------------------- |
| `collapseLabel` | `string`      | "Collapse sidebar" | Accessible name and tooltip while the rail is expanded.                    |
| `expandLabel`   | `string`      | "Expand sidebar"   | Accessible name and tooltip while the rail is collapsed.                   |
| `icon`          | `TIconSource` | see description    | Panel outline for `end` and `start`, a direction caret for the `edge` tab. |

## Events

| Event    | Payload | Description                                          |
| -------- | ------- | ---------------------------------------------------- |
| `toggle` | none    | The person asked to switch between the two variants. |

## NbShell additions

| Prop / slot                   | Type                             | Default   | Description                                                              |
| ----------------------------- | -------------------------------- | --------- | ------------------------------------------------------------------------ |
| `#sidebar-header-action`      | slot                             |           | Opt-in. Renders beside `#sidebar-logo` only when it has content.         |
| `sidebarHeaderActionPosition` | `'end' \| 'start' \| 'edge'`     | `'end'`   | Where the slot sits relative to the brand.                               |
| `sidebarHeaderActionCompact`  | `'stack' \| 'swap' \| 'replace'` | `'stack'` | How the slot and the brand share the collapsed rail. Ignored for `edge`. |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
import type { PreviewPropDef } from '../.vitepress/theme/components/Preview.d'
import DemoFrame from '../shared/DemoFrame.vue'

const variant = ref<'compact' | 'verbose'>('verbose')
const toggle = () => {
  variant.value = variant.value === 'compact' ? 'verbose' : 'compact'
}

const headerProps: PreviewPropDef[] = [
  {
    name: 'position',
    label: 'Position',
    type: 'single',
    default: 'start',
    options: [
      { value: 'none', label: 'none (bottom row, today)' },
      { value: 'start', label: 'start' },
      { value: 'end', label: 'end' },
      { value: 'edge', label: 'edge' },
    ],
  },
  {
    name: 'compact',
    label: 'Collapsed rail',
    type: 'single',
    default: 'swap',
    options: [
      { value: 'stack', label: 'stack' },
      { value: 'swap', label: 'swap' },
      { value: 'replace', label: 'replace' },
    ],
  },
]
</script>
