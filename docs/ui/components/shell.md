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

## Bottom slot

The `#bottom` slot is an empty region pinned below the main content area. The shell does not provide any built-in controls here; it is simply a layout slot where you can place any component. A common pattern is to drop an `NbShellPanel` (or the legacy `NbBottomPanel`) inside it to get a resizable, collapsible panel with a header and toolbar. See the [Shell Panel](/ui/components/shell-panel) documentation for details on that component.

<preview>
  <div style="height: 480px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell style="height: 100%">
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template #topbar-left>
        <strong>Editor</strong>
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">Main workspace. The panel below is an NbShellPanel placed into the #bottom slot.</p>
      <template #bottom>
        <NbShellPanel v-model:size="panelSize" title="Console">
          <template #toolbar>
            <NbButton size="xxs" variant="ghost">Clear</NbButton>
          </template>
          <div style="padding: 0.75rem 1rem; font-family: var(--nb-font-mono, monospace); font-size: 0.8125rem; color: var(--nb-c-text-secondary, #666);">
            <div>> ready in 127ms</div>
            <div>> watching for file changes...</div>
          </div>
        </NbShellPanel>
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
      <NbShellPanel v-model:size="panelSize" title="Console">
        <template #toolbar>
          <NbButton size="xxs" variant="ghost" @click="clear">Clear</NbButton>
        </template>
        <pre>{{ logs }}</pre>
      </NbShellPanel>
    </template>
  </NbShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TShellPanelSize } from '@nubisco/ui'
const panelSize = ref<TShellPanelSize>('default')
</script>
```

## Outer menu

The `#outer-menu` slot renders a full-width menu bar above everything, spanning the sidebar, body, and inspector. It is ideal for application-level menu bars (File, Edit, View, etc.). The area is only rendered when the slot has content, and uses `overflow: visible` so dropdown menus can expand beyond the bar.

<preview>
  <div style="height: 360px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell>
      <template #outer-menu>
        <div style="display: flex; gap: 0; padding: 0 8px; font-size: 0.8125rem;">
          <button style="padding: 4px 10px; background: none; border: none; color: var(--nb-c-text); cursor: pointer;">File</button>
          <button style="padding: 4px 10px; background: none; border: none; color: var(--nb-c-text); cursor: pointer;">Edit</button>
          <button style="padding: 4px 10px; background: none; border: none; color: var(--nb-c-text); cursor: pointer;">View</button>
          <button style="padding: 4px 10px; background: none; border: none; color: var(--nb-c-text); cursor: pointer;">Help</button>
        </div>
      </template>
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template #sidebar-nav>
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.12); border-radius: 8px;" />
      </template>
      <template #topbar-left>
        <strong>Editor</strong>
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">The outer menu spans the full width above the sidebar and body.</p>
    </NbShell>
  </div>
</preview>

```vue
<template>
  <NbShell>
    <template #outer-menu>
      <NbMenuBar>
        <NbMenuBarItem label="File">
          <NbMenuItem label="New" shortcut="Ctrl+N" />
          <NbMenuItem label="Open" shortcut="Ctrl+O" />
          <NbMenuDivider />
          <NbMenuItem label="Save" shortcut="Ctrl+S" />
        </NbMenuBarItem>
        <NbMenuBarItem label="Edit">
          <NbMenuItem label="Undo" shortcut="Ctrl+Z" />
          <NbMenuItem label="Redo" shortcut="Ctrl+Shift+Z" />
        </NbMenuBarItem>
      </NbMenuBar>
    </template>
    <!-- ... other slots ... -->
  </NbShell>
</template>
```

## Inner menu

The `#inner-menu` slot renders a menu bar that spans the body and inspector columns but not the sidebar. This is useful when your menu should sit alongside the content area but not overlap the sidebar navigation. Like `#outer-menu`, it only renders when populated and uses `overflow: visible` for dropdown menus.

<preview>
  <div style="height: 360px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell>
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template #sidebar-nav>
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.12); border-radius: 8px;" />
      </template>
      <template #inner-menu>
        <div style="display: flex; gap: 0; padding: 0 8px; font-size: 0.8125rem;">
          <button style="padding: 4px 10px; background: none; border: none; color: var(--nb-c-text); cursor: pointer;">File</button>
          <button style="padding: 4px 10px; background: none; border: none; color: var(--nb-c-text); cursor: pointer;">Edit</button>
          <button style="padding: 4px 10px; background: none; border: none; color: var(--nb-c-text); cursor: pointer;">View</button>
        </div>
      </template>
      <template #topbar-left>
        <strong>Dashboard</strong>
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">The inner menu spans body + inspector, but not the sidebar.</p>
    </NbShell>
  </div>
</preview>

```vue
<template>
  <NbShell>
    <template #inner-menu>
      <NbMenuBar>
        <NbMenuBarItem label="File">
          <NbMenuItem label="New" />
          <NbMenuItem label="Open" />
        </NbMenuBarItem>
        <NbMenuBarItem label="View">
          <NbMenuItem label="Zoom In" />
          <NbMenuItem label="Zoom Out" />
        </NbMenuBarItem>
      </NbMenuBar>
    </template>
    <!-- ... other slots ... -->
  </NbShell>
</template>
```

## Outer menu vs Inner menu

Use `#outer-menu` when the menu should span the entire application width (including the sidebar column). Use `#inner-menu` when the menu should only span the content area to the right of the sidebar. Both slots can be used simultaneously.

```txt
 ┌──────────────────────────────────────────────────┐
 │  outer-menu                                      │
 ├────────┬─────────────────────────────────────────┤
 │        │  inner-menu                             │
 │        ├───────────────────────┬─────────────────┤
 │sidebar │  notification         │                 │
 │        │  topbar               │                 │
 │        │  fixedbar             │    inspector    │
 │        │  main content         │                 │
 │        │                       │                 │
 │        │  bottom               │                 │
 └────────┴───────────────────────┴─────────────────┘
```

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

## All slots in use

This example shows every slot populated at once, giving a complete picture of how the layout regions fit together. The shell itself is purely structural: it provides named regions, and you fill them with whatever components you need.

<preview>
  <div style="height: 540px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell :inspector-visible="kitchenInspector" style="height: 100%">
      <template #outer-menu>
        <div style="display: flex; gap: 0; padding: 0 8px; font-size: 0.8125rem;">
          <button style="padding: 4px 10px; background: none; border: none; color: var(--nb-c-text); cursor: pointer;">File</button>
          <button style="padding: 4px 10px; background: none; border: none; color: var(--nb-c-text); cursor: pointer;">Edit</button>
          <button style="padding: 4px 10px; background: none; border: none; color: var(--nb-c-text); cursor: pointer;">View</button>
        </div>
      </template>
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template #sidebar-nav>
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.12); border-radius: 8px;" />
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.12); border-radius: 8px;" />
      </template>
      <template #sidebar-bottom>
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.12); border-radius: 50%;" />
      </template>
      <template #inner-menu>
        <div style="display: flex; gap: 0; padding: 0 8px; font-size: 0.8125rem;">
          <button style="padding: 4px 10px; background: none; border: none; color: var(--nb-c-text); cursor: pointer;">Scene</button>
          <button style="padding: 4px 10px; background: none; border: none; color: var(--nb-c-text); cursor: pointer;">Assets</button>
        </div>
      </template>
      <template #notification>
        <div style="padding: 0.35rem 1rem; background: #fef3c7; color: #92400e; font-size: 0.8125rem; border-bottom: 1px solid #fde68a;">
          Unsaved changes.
        </div>
      </template>
      <template #topbar-left>
        <strong>Project</strong>
      </template>
      <template #topbar-right>
        <NbButton size="sm" variant="secondary" @click="kitchenInspector = !kitchenInspector">
          {{ kitchenInspector ? 'Close' : 'Open' }} Inspector
        </NbButton>
      </template>
      <template #fixedbar>
        <div style="display: flex; gap: 1rem; padding: 0.35rem 0;">
          <NbButton size="sm" variant="ghost">All</NbButton>
          <NbButton size="sm" variant="ghost">Meshes</NbButton>
          <NbButton size="sm" variant="ghost">Lights</NbButton>
        </div>
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">Main viewport area.</p>
      <template #bottom>
        <NbShellPanel v-model:size="kitchenPanelSize" title="Console">
          <div style="padding: 0.5rem 1rem; font-family: monospace; font-size: 0.75rem; color: var(--nb-c-text-secondary);">
            <div>> Build complete.</div>
          </div>
        </NbShellPanel>
      </template>
      <template #inspector>
        <div style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem;">Properties</h4>
          <p style="margin: 0; color: var(--nb-c-text-secondary, #666); font-size: 0.8125rem;">Position, rotation, scale...</p>
        </div>
      </template>
    </NbShell>
  </div>
</preview>

```vue
<template>
  <NbShell :inspector-visible="inspectorOpen">
    <template #outer-menu>
      <NbMenuBar>
        <NbMenuBarItem label="File"> ... </NbMenuBarItem>
        <NbMenuBarItem label="Edit"> ... </NbMenuBarItem>
      </NbMenuBar>
    </template>

    <template #sidebar-logo> <img src="/logo.svg" /> </template>
    <template #sidebar-nav> <NbSidebarLink icon="home" to="/" /> </template>
    <template #sidebar-bottom> <UserAvatar /> </template>

    <template #inner-menu>
      <NbMenuBar>
        <NbMenuBarItem label="Scene"> ... </NbMenuBarItem>
      </NbMenuBar>
    </template>

    <template #notification>
      <WarningBanner message="Unsaved changes." />
    </template>

    <template #topbar-left> <strong>Project</strong> </template>
    <template #topbar-right>
      <NbButton @click="inspectorOpen = !inspectorOpen">Inspector</NbButton>
    </template>

    <template #fixedbar>
      <NbButton size="sm" variant="ghost">All</NbButton>
      <NbButton size="sm" variant="ghost">Meshes</NbButton>
    </template>

    <Viewport />

    <template #bottom>
      <NbShellPanel v-model:size="panelSize" title="Console">
        <pre>{{ logs }}</pre>
      </NbShellPanel>
    </template>

    <template #inspector>
      <PropertyEditor :node="selected" />
    </template>
  </NbShell>
</template>
```

## Layout layering

The shell organizes its regions into a layering system that gives each area the correct stacking context. This matters when menus, tooltips, or dropdowns need to overflow their container without being clipped by adjacent regions.

```
 z-index
   200   ┌──────────────────────────────────────┐  outer-menu
         │  overflow: visible (menus expand)    │
   ---   ├────────┬─────────────────────────────┤
   150   │        │  inner-menu                 │  inner-menu
         │        │  overflow: visible          │
   ---   │        ├─────────────────────────────┤
   100   │sidebar │  notification               │  body + inspector
         │overflow│  topbar                     │
         │visible │  fixedbar                   │
         │        │  main (scrollable)          │
         │        │  bottom                     │
         └────────┴─────────────────────────────┘
```

- **`outer-menu` (z-index: 200)**: Sits on top of everything. Dropdown menus from this bar overlay the sidebar, body, and inspector without clipping.
- **`inner-menu` (z-index: 150)**: Above the body and inspector but below the outer menu. Dropdowns expand over the content row.
- **`sidebar` (z-index: 100)**: Uses `overflow: visible` so that tooltips on sidebar icons can extend beyond the sidebar edge into the body area.
- **Body and inspector**: No special z-index. Contained within the content row with `overflow: hidden` on the row itself to keep scrolling behavior predictable.

This layering is automatic. You do not need to set any z-index values yourself. The shell sets them so that interactive elements in higher regions always render above lower regions.

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

| Prop                | Type                                   | Default | Description                                                                                                 |
| ------------------- | -------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `inspectorVisible`  | `boolean`                              | `false` | Whether the inspector column is visible                                                                     |
| `inspectorExpanded` | `boolean`                              | `false` | When true the inspector takes ~50% of the viewport width instead of the default fixed width                 |
| `inspectorSize`     | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`  | Controls the width of the inspector panel (xs: 288px, sm: 360px, md: 560px, lg: 50vw, xl: 75vw)             |
| `mainPadding`       | `boolean`                              | `true`  | Whether the main content area has padding. Set to `false` for full-bleed content like viewports or canvases |

## Slots

| Slot             | Description                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `outer-menu`     | Full-width menu bar above everything (sidebar + body + inspector). Only rendered when populated. `overflow: visible`          |
| `sidebar-logo`   | Logo or brand mark displayed at the top of the sidebar                                                                        |
| `sidebar-nav`    | Primary navigation items in the sidebar                                                                                       |
| `sidebar-bottom` | Items pinned to the bottom of the sidebar (e.g. settings, user avatar)                                                        |
| `inner-menu`     | Menu bar spanning body + inspector but not the sidebar. Only rendered when populated. `overflow: visible`                     |
| `notification`   | Full-width area above the topbar for banners and alerts. Only rendered when the slot is provided                              |
| `menubar`        | Legacy menubar inside the body (does not span the inspector). Only rendered when populated                                    |
| `topbar-left`    | Left side of the topbar (e.g. page title, breadcrumbs)                                                                        |
| `topbar-right`   | Right side of the topbar (e.g. actions, user menu)                                                                            |
| `fixedbar`       | Non-scrolling bar between topbar and main content (e.g. tabs, filters). Only rendered when populated                          |
| `default`        | Main scrollable content area                                                                                                  |
| `bottom`         | Empty region pinned below the main content area. Place any component here (e.g. `NbShellPanel`). Only rendered when populated |
| `inspector`      | Content for the optional inspector side panel                                                                                 |

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
const kitchenInspector = ref(true)
const kitchenPanelSize = ref('default')
</script>
