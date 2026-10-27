---
layout: nubisco
title: Shell
intro: '`NbShell` is the top-level layout component for building application shells. It provides a three-column structure: a fixed sidebar, a body area (with topbar and scrollable main content), and an optional inspector panel.'
source: src/components/Shell.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

## Live demo

<preview>
  <div style="height: 360px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell>
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template #sidebar-nav>
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.12); border-radius: 8px;" />
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.12); border-radius: 8px;" />
      </template>
      <template #topbar-left>
        <strong>Dashboard</strong>
      </template>
      <template #topbar-right>
        <NbButton size="sm" variant="ghost" icon="settings" />
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">Main content area, scrollable when content overflows.</p>
    </NbShell>
  </div>
</preview>

## Fixedbar slot

The `#fixedbar` slot renders a non-scrolling bar between the topbar and the main content, useful for tabs, breadcrumbs, or filters. Like the notification slot, it is only rendered when content is provided.

The bar adapts common slot content so it composes cleanly with the chrome: line-variant `NbTabs` lose their own bottom rule and stretch to the bar's edge (the bar's border is the rule, and the active underline replaces it under the active tab), and bare `NbSelect` triggers lose their leading padding so their text sits on the same rail as the page content below.

<!--@include: ./_shared.md-->
