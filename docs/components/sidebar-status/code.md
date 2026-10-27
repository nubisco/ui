---
layout: nubisco
title: Sidebar Status
intro: "`NbSidebarStatus` is a one-line, read-only status at the bottom of the rail, for something only one product has: a daemon it talks to, a sync, a paired device. It goes **last**, under the user menu, so the rows every product shares (documentation, notifications, settings, the person) stay in the same place everywhere and the product's own signal sits apart from them."
source: src/components/SidebarStatus.vue
tab: code
pageTabs: ['usage', 'code']
---

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

## Props

| Prop     | Type                                              | Default     | Description                                                       |
| -------- | ------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| `label`  | `string`                                          |             | What the status says. Visible expanded, a tooltip when collapsed. |
| `status` | `'success' \| 'warning' \| 'danger' \| 'neutral'` | `'neutral'` | The colour of the dot.                                            |

It renders with `role="status"`, so a change of label is announced.

<!--@include: ./_shared.md-->
