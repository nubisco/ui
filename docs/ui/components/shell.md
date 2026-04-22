---
layout: nubisco
title: Shell
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbShell` is the top-level layout component for building application shells. It provides a three-column structure: a fixed sidebar, a body area (with topbar and scrollable main content), and an optional inspector panel.

## Basic Usage

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
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">Main content area — scrollable when content overflows.</p>
    </NbShell>
  </div>
</preview>

```vue
<template>
  <NbShell>
    <template #sidebar-logo>
      <img src="/logo.svg" alt="Logo" />
    </template>
    <template #sidebar-nav>
      <NbSidebarLink icon="home" to="/" />
      <NbSidebarLink icon="chart" to="/analytics" />
    </template>
    <template #topbar-left>
      <strong>Dashboard</strong>
    </template>
    <template #topbar-right>
      <NbButton size="sm" variant="ghost" icon="settings" />
    </template>
    <p>Main content area.</p>
  </NbShell>
</template>
```

## Notification slot

Use the `#notification` slot to show important banners above the topbar. The area is only rendered when the slot is provided, so there is zero overhead when unused.

<preview>
  <div style="height: 360px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell>
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template v-if="showNotification" #notification>
        <div style="padding: 0.5rem 1rem; background: #fef3c7; color: #92400e; font-size: 0.875rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #fde68a;">
          <span>Your trial expires in 3 days. <a href="#" style="color: #92400e; font-weight: 600;">Upgrade now</a></span>
          <NbButton size="xxs" variant="ghost" icon="close" @click="showNotification = false" />
        </div>
      </template>
      <template #topbar-left>
        <strong>Dashboard</strong>
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">The notification banner appears above the topbar.</p>
      <NbButton v-if="!showNotification" size="sm" variant="secondary" @click="showNotification = true" style="margin-top: 1rem; align-self: flex-start;">Show notification</NbButton>
    </NbShell>
  </div>
</preview>

```vue
<template>
  <NbShell>
    <template #notification>
      <div class="trial-banner">
        Your trial expires in 3 days.
        <a href="/billing">Upgrade now</a>
        <NbButton size="xxs" variant="ghost" icon="close" @click="dismiss" />
      </div>
    </template>
    <!-- ... other slots ... -->
  </NbShell>
</template>
```

## Fixedbar slot

The `#fixedbar` slot renders a non-scrolling bar between the topbar and the main content — useful for tabs, breadcrumbs, or filters. Like the notification slot, it is only rendered when content is provided.

<preview>
  <div style="height: 360px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell>
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template #topbar-left>
        <strong>Products</strong>
      </template>
      <template #fixedbar>
        <div style="display: flex; gap: 1rem; padding: 0.5rem 0;">
          <NbButton size="sm" variant="ghost">All</NbButton>
          <NbButton size="sm" variant="ghost">Active</NbButton>
          <NbButton size="sm" variant="ghost">Archived</NbButton>
        </div>
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">Content below the fixed tab bar.</p>
    </NbShell>
  </div>
</preview>

```vue
<template>
  <NbShell>
    <template #topbar-left>
      <strong>Products</strong>
    </template>
    <template #fixedbar>
      <NbButton size="sm" variant="ghost">All</NbButton>
      <NbButton size="sm" variant="ghost">Active</NbButton>
      <NbButton size="sm" variant="ghost">Archived</NbButton>
    </template>
    <p>Content below the fixed tab bar.</p>
  </NbShell>
</template>
```

## Bottom panel

The `#bottom` slot renders a panel pinned to the bottom of the body, between the main content and the browser edge — useful for IDE-like interfaces that need a debug console, logs, a terminal, or a secondary workspace. Like the notification and fixedbar slots, it is only rendered when populated.

Pair it with `NbBottomPanel`, a companion component that provides a header with a title, a toolbar slot, and four size states (`collapsed`, `default`, `half`, `full`). The size can be controlled via `v-model:size`.

<preview>
  <div style="height: 480px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell style="height: 100%">
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template #topbar-left>
        <strong>Editor</strong>
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">Main workspace. Use the icon buttons at the right edge of the panel header to switch between collapsed, default, half and full sizes.</p>
      <template #bottom>
        <NbBottomPanel v-model:size="panelSize" title="Console">
          <template #toolbar>
            <NbButton size="xxs" variant="ghost">Clear</NbButton>
          </template>
          <div style="padding: 0.75rem 1rem; font-family: var(--nb-font-mono, monospace); font-size: 0.8125rem; color: var(--nb-c-text-secondary, #666);">
            <div>› ready in 127ms</div>
            <div>› watching for file changes…</div>
          </div>
        </NbBottomPanel>
      </template>
    </NbShell>
  </div>
</preview>

```vue
<template>
  <NbShell>
    <template #topbar-left>
      <strong>Editor</strong>
    </template>
    <p>Main workspace.</p>
    <template #bottom>
      <NbBottomPanel v-model:size="panelSize" title="Console">
        <template #toolbar>
          <NbButton size="xxs" variant="ghost" @click="clear">Clear</NbButton>
        </template>
        <pre>{{ logs }}</pre>
      </NbBottomPanel>
    </template>
  </NbShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TBottomPanelSize } from '@nubisco/ui'
const panelSize = ref<TBottomPanelSize>('default')
</script>
```

### NbBottomPanel props

| Prop    | Type                                           | Default     | Description                                  |
| ------- | ---------------------------------------------- | ----------- | -------------------------------------------- |
| `size`  | `'collapsed' \| 'default' \| 'half' \| 'full'` | `'default'` | Current panel size. Supports `v-model:size`. |
| `title` | `string`                                       | `''`        | Label shown in the header.                   |

### NbBottomPanel events

| Event         | Payload            | Description                                 |
| ------------- | ------------------ | ------------------------------------------- |
| `update:size` | `TBottomPanelSize` | Emitted when the user clicks a size button. |

### NbBottomPanel slots

| Slot      | Description                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| `default` | Panel body. Hidden while `size === 'collapsed'` — only the header remains visible.              |
| `title`   | Custom title content. Replaces the plain text rendered by the `title` prop when both are given. |
| `toolbar` | Center slot for actions like filter toggles or clear buttons.                                   |

### Sizes

| Size        | Height                       | Notes                                                                          |
| ----------- | ---------------------------- | ------------------------------------------------------------------------------ |
| `collapsed` | Header only (`28px`)         | Body is unmounted — cheap to toggle frequently.                                |
| `default`   | `30vh` (min `80px`)          | Typical starting size.                                                         |
| `half`      | `50vh`                       | Roughly half of the body height.                                               |
| `full`      | Remaining body height (flex) | The main content area is hidden and the panel fills the body below the topbar. |

## Inspector panel

The inspector is an optional third column controlled by the `inspectorVisible` and `inspectorExpanded` props. It animates in from the right and is typically used for detail views or editing side panels.

<preview>
  <div style="height: 360px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell :inspector-visible="inspectorOpen" :inspector-expanded="inspectorExpanded">
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template #topbar-left>
        <strong>Orders</strong>
      </template>
      <template #topbar-right>
        <NbButton size="sm" variant="secondary" @click="inspectorOpen = !inspectorOpen">
          {{ inspectorOpen ? 'Close' : 'Open' }} Inspector
        </NbButton>
        <NbButton v-if="inspectorOpen" size="sm" variant="ghost" @click="inspectorExpanded = !inspectorExpanded">
          {{ inspectorExpanded ? 'Collapse' : 'Expand' }}
        </NbButton>
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">Click the button in the topbar to toggle the inspector.</p>
      <template #inspector>
        <div style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem;">Order #1042</h4>
          <p style="margin: 0; color: var(--nb-c-text-secondary, #666); font-size: 0.875rem;">Inspector panel content.</p>
        </div>
      </template>
    </NbShell>
  </div>
</preview>

```vue
<template>
  <NbShell :inspector-visible="open" :inspector-expanded="expanded">
    <template #topbar-right>
      <NbButton @click="open = !open">Toggle Inspector</NbButton>
    </template>
    <template #inspector>
      <div class="detail-view">
        <h4>Order #1042</h4>
        <p>Inspector content here.</p>
      </div>
    </template>
    <p>Main content.</p>
  </NbShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const open = ref(false)
const expanded = ref(false)
</script>
```

## Theming

`NbShell` exposes CSS custom properties you can override on the `.nb-shell` selector to theme per-application:

```css
.nb-shell {
  --nb-shell-sidebar-bg: #1a1a2e;
  --nb-shell-sidebar-width: 56px;
  --nb-shell-topbar-height: calc(var(--nb-base-unit) * 6.25);
  --nb-shell-inspector-width: 560px;
  --nb-shell-inspector-expanded-width: 50vw;
  --nb-shell-inspector-border: 1px solid #e8e8f0;
  --nb-shell-inspector-bg: var(--nb-c-surface, #fff);
}
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop                | Type      | Default | Description                                                                                 |
| ------------------- | --------- | ------- | ------------------------------------------------------------------------------------------- |
| `inspectorVisible`  | `boolean` | `false` | Whether the inspector column is visible                                                     |
| `inspectorExpanded` | `boolean` | `false` | When true the inspector takes ~50% of the viewport width instead of the default fixed width |

## Slots

| Slot             | Description                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `sidebar-logo`   | Logo or brand mark displayed at the top of the sidebar                                               |
| `sidebar-nav`    | Primary navigation items in the sidebar                                                              |
| `sidebar-bottom` | Items pinned to the bottom of the sidebar (e.g. settings, user avatar)                               |
| `notification`   | Full-width area above the topbar for banners and alerts. Only rendered when the slot is provided     |
| `topbar-left`    | Left side of the topbar (e.g. page title, breadcrumbs)                                               |
| `topbar-right`   | Right side of the topbar (e.g. actions, user menu)                                                   |
| `fixedbar`       | Non-scrolling bar between topbar and main content (e.g. tabs, filters). Only rendered when populated |
| `default`        | Main scrollable content area                                                                         |
| `bottom`         | Panel pinned to the bottom of the body (typically an `NbBottomPanel`). Only rendered when populated  |
| `inspector`      | Content for the optional inspector side panel                                                        |

## CSS Custom Properties

| Variable                              | Default                            | Description                   |
| ------------------------------------- | ---------------------------------- | ----------------------------- |
| `--nb-shell-sidebar-bg`               | `#1a1a2e`                          | Sidebar background color      |
| `--nb-shell-sidebar-width`            | `56px`                             | Sidebar width                 |
| `--nb-shell-topbar-height`            | `calc(var(--nb-base-unit) * 6.25)` | Topbar height                 |
| `--nb-shell-inspector-width`          | `560px`                            | Inspector panel width         |
| `--nb-shell-inspector-expanded-width` | `50vw`                             | Inspector width when expanded |
| `--nb-shell-inspector-border`         | `1px solid #e8e8f0`                | Inspector left border         |
| `--nb-shell-inspector-bg`             | `var(--nb-c-surface, #fff)`        | Inspector background color    |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const showNotification = ref(true)
const inspectorOpen = ref(false)
const inspectorExpanded = ref(false)
const panelSize = ref('default')
</script>
