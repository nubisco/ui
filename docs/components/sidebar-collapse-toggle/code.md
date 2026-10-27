---
layout: nubisco
title: Sidebar Collapse Toggle
intro: '`NbSidebarCollapseToggle` is the control that collapses an expanded rail and expands a collapsed one. It is one `NbSidebarMenuItem`, so it renders as a labelled row when the rail is expanded and as an icon with a flyout label when it is collapsed, from the same element.'
source: src/components/SidebarCollapseToggle.vue
tab: code
pageTabs: ['usage', 'code']
---

## Props

| Prop            | Type     | Default            | Description                                                                 |
| --------------- | -------- | ------------------ | --------------------------------------------------------------------------- |
| `collapseLabel` | `string` | "Collapse sidebar" | Label while the rail is expanded.                                           |
| `expandLabel`   | `string` | "Expand sidebar"   | Label while the rail is collapsed, and the icon-only row's accessible name. |

## Events

| Event    | Payload | Description                                          |
| -------- | ------- | ---------------------------------------------------- |
| `toggle` | none    | The person asked to switch between the two variants. |
