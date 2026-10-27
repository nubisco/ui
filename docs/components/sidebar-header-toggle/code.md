---
layout: nubisco
title: Sidebar Header Toggle
intro: "`NbSidebarHeaderToggle` collapses and expands the rail from the top of the sidebar, beside the brand, instead of from a row at the bottom. It goes in `NbShell`'s `sidebar-header-action` slot, which is opt-in: a shell that leaves the slot empty renders exactly as it did before, so [NbSidebarCollapseToggle](/components/sidebar-collapse-toggle/usage) in `#sidebar-bottom` stays the default."
source: src/components/SidebarHeaderToggle.vue
tab: code
pageTabs: ['usage', 'code']
---

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

<!--@include: ./_shared.md-->
