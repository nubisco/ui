---
layout: nubisco
title: Sidebar Status
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbSidebarStatus` is a one-line, read-only status at the bottom of the rail, for something only one product has: a daemon it talks to, a sync, a paired device. It goes **last**, under the user menu, so the rows every product shares (documentation, notifications, settings, the person) stay in the same place everywhere and the product's own signal sits apart from them.

Expanded, it lines up with the menu rows above it: the dot where their icons are, the words where their labels are. Collapsed, it is the dot alone, and the label moves into a tooltip and stays the accessible name.

## Try it

<preview dir="col" :props="statusProps" v-slot="{ resultingProps }">
  <DemoFrame :height="320">
    <NbShell :sidebar-variant="variant" sidebar-header-action-position="start" sidebar-header-action-compact="swap" topbar="always" style="height: 100%">
      <template #sidebar-logo>
        <NbSidebarBrand icon="plugs-connected" title="Bridge" />
      </template>
      <template #sidebar-header-action>
        <NbSidebarHeaderToggle @toggle="toggle" />
      </template>
      <template #sidebar-nav>
        <NbSidebarMenu>
          <NbSidebarMenuItem icon="house" label="Dashboard" href="#try-it" active />
          <NbSidebarMenuItem icon="puzzle-piece" label="Plugins" href="#try-it" />
        </NbSidebarMenu>
      </template>
      <template #sidebar-bottom>
        <NbSidebarMenu>
          <NbSidebarMenuItem icon="book" label="Documentation" href="#try-it" />
          <NbSidebarMenuItem icon="bell" label="Notifications" href="#try-it" :badge="3" badge-variant="danger" />
        </NbSidebarMenu>
        <NbSidebarStatus :label="resultingProps.label" :status="resultingProps.status" />
      </template>
      <template #topbar-left><strong>Dashboard</strong></template>
      <p style="margin: 0">Collapse the rail to see the dot alone, and the count on the bell.</p>
    </NbShell>
  </DemoFrame>
</preview>

## Usage

```vue
<template #sidebar-bottom>
  <NbSidebarMenu>
    <NbSidebarMenuItem icon="book" label="Documentation" :href="docsUrl" />
  </NbSidebarMenu>
  <NbUserMenu :user="user" trigger="identity" />
  <NbSidebarStatus
    :label="connected ? 'Daemon connected' : 'Daemon disconnected'"
    :status="connected ? 'success' : 'danger'"
  />
</template>
```

It shows a state, it is not a control. If the person can act on it (reconnect, retry), put that action on the page the status is about, not on the dot.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop     | Type                                              | Default     | Description                                                       |
| -------- | ------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| `label`  | `string`                                          |             | What the status says. Visible expanded, a tooltip when collapsed. |
| `status` | `'success' \| 'warning' \| 'danger' \| 'neutral'` | `'neutral'` | The colour of the dot.                                            |

It renders with `role="status"`, so a change of label is announced.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
import type { PreviewPropDef } from '../.vitepress/theme/components/Preview.d'
import DemoFrame from '../shared/DemoFrame.vue'

const variant = ref<'compact' | 'verbose'>('verbose')
const toggle = () => {
  variant.value = variant.value === 'compact' ? 'verbose' : 'compact'
}

const statusProps: PreviewPropDef[] = [
  { name: 'label', label: 'Label', type: 'string', default: 'Daemon connected' },
  {
    name: 'status',
    label: 'Status',
    type: 'single',
    default: 'success',
    options: [
      { value: 'success', label: 'success' },
      { value: 'warning', label: 'warning' },
      { value: 'danger', label: 'danger' },
      { value: 'neutral', label: 'neutral' },
    ],
  },
]
</script>
