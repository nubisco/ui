---
layout: nubisco
title: Sidebar Collapse Toggle
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbSidebarCollapseToggle` is the control that collapses an expanded rail and expands a collapsed one. It is one `NbSidebarMenuItem`, so it renders as a labelled row when the rail is expanded and as an icon with a flyout label when it is collapsed, from the same element.

```vue
<script setup lang="ts">
import { useSidebarVariant } from '@nubisco/ui'

const nav = useSidebarVariant({ storageKey: 'prelo.sidebar' })
</script>

<template>
  <NbShell :sidebar-variant="nav.variant.value">
    <template #sidebar-bottom>
      <NbSidebarMenu>
        <NbSidebarCollapseToggle @toggle="nav.toggle" />
      </NbSidebarMenu>
      <NbUserMenu :user="user" trigger="identity" />
    </template>
  </NbShell>
</template>
```

## Why a component for one menu item

Products that let people collapse the rail each built this themselves, and each built it twice: an icon link for the collapsed rail and a menu row for the expanded one, kept in step by hand, with their own labels and icons. One product also reset the choice on every navigation. The toggle removes the duplication, and [useSidebarVariant](/composables/use-sidebar-variant) removes the rest: the state, and remembering it.

## It holds no state

The toggle reads the variant `NbShell` provides and emits `toggle`. It does not track whether the rail is open, so its label and icon cannot disagree with the rail it is in. Put the state in `useSidebarVariant`, or anywhere else that sets `NbShell`'s `sidebar-variant`.

## Where it goes

Inside an `NbSidebarMenu` in `#sidebar-bottom`, after the product's own bottom items (notifications, settings) and before the user menu. The [app frame](/patterns/app-frame#expanding-and-collapsing-the-rail) sets that order.

## Translations

The labels resolve through the host app's global catalogue first, then a built-in string for the active language, then English:

| Key                              | English          | Portuguese             |
| -------------------------------- | ---------------- | ---------------------- |
| `sidebarCollapseToggle.COLLAPSE` | Collapse sidebar | Recolher barra lateral |
| `sidebarCollapseToggle.EXPAND`   | Expand sidebar   | Expandir barra lateral |

Unlike `NbUserMenu`, it does not require `vue-i18n`. A product without it gets the English strings.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop            | Type     | Default            | Description                                                                 |
| --------------- | -------- | ------------------ | --------------------------------------------------------------------------- |
| `collapseLabel` | `string` | "Collapse sidebar" | Label while the rail is expanded.                                           |
| `expandLabel`   | `string` | "Expand sidebar"   | Label while the rail is collapsed, and the icon-only row's accessible name. |

## Events

| Event    | Payload | Description                                          |
| -------- | ------- | ---------------------------------------------------- |
| `toggle` | none    | The person asked to switch between the two variants. |

</doc-tab>
