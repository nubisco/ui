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
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">Main content area, scrollable when content overflows.</p>
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

## Contributing controls from a view

The shell is declared once, at the root of the application. The controls that belong in it (a page title, a Save button, a filter chip) belong to the view the router just mounted, which is several levels below. Getting one into the other is the single most common thing our applications do with this component, and before `useShellSlot` every one of them solved it privately: eight of our twelve products put a hand-picked DOM id on a shell region and teleported into it by selector. `#cms-topbar`, `#nks-topbar-right`, `#verba-topbar`, `#ob-topbar-left`, `#nba-topbar-left`, `#tally-topbar`, `#page-actions`. Eight contracts, none of them compatible, and one of them shipped a live bug because a view queried for its target before the shell had rendered it.

`useShellSlot` is the supported contract. The view names a region, not an element, and gets back an outlet to render into.

```vue
<script setup lang="ts">
import { useShellSlot } from '@nubisco/ui'

const topbar = useShellSlot('topbar-right')
const dirty = ref(false)
</script>

<template>
  <component :is="topbar.Outlet">
    <NbButton size="sm" :disabled="!dirty" @click="save">Save</NbButton>
  </component>

  <article>...</article>
</template>
```

The button renders inside the shell's topbar, but it is still this view's button: the outlet teleports the nodes, it does not re-create them, so `dirty`, the click handler and any component state inside are the view's own and update from here.

Regions you can claim: `outer-menu`, `inner-menu`, `notification`, `topbar-left`, `topbar-right`, `fixedbar`, `bottom`, `inspector`. The sidebar is deliberately not among them, because navigation is a property of the application rather than of the page currently open in it.

### It solves the ordering problem

A view's `onMounted` runs before its ancestors'. A view that looks for its target on mount therefore looks too early, and if the region is conditional (the topbar only exists when it has content) the element may not exist at all yet. That is the failure the DOM-id approach kept re-deriving, patched in one product with a `setTimeout`.

Nothing here needs a timer. `topbar.target` is reactive: it is `null` on the first tick and becomes the element when the shell mounts the region, and the outlet renders when it does. In the other direction, registering a contribution is what makes the region exist, so a shell with no static topbar slots grows a topbar the moment a view claims one, and loses it again when that view unmounts.

### It solves the two-views problem

During a route transition the arriving view is created before the leaving one is torn down, so for a frame or two both hold the region. Left alone that is two page titles, or two Save buttons, one of which no longer does anything.

By default a contribution is exclusive (`claim: 'last'`): the most recently registered one renders and the others stand down without unmounting. The arriving view takes the topbar on the same tick it registers, so there is no doubled frame. It is reversible, too, which is what makes a contribution from a dialog or a nested route behave: when the newer contributor goes away, the earlier one takes its region back.

When contributions really are additive, opt in per contributor:

```ts
// A background-sync chip that should sit alongside whatever the page put here,
// not replace it. `order` sorts contributions in the region; lower is first.
const status = useShellSlot('topbar-right', { claim: 'all', order: -10 })
```

Teleports append in mount order, which for concurrently mounted views is whatever order the router created them in. So under `claim: 'all'` the outlet wraps its content in a flex box carrying a CSS `order`, and that wrapper is what makes the sort real. The default exclusive claim adds no wrapper: its content lands in the region bare.

CSS `order` sorts flex and grid children and nothing else, and three of the eight regions (`outer-menu`, `inner-menu`, `notification`) are block containers by design: what goes in them is your markup and its layout is yours. So while a shared contribution is registered, and only then, the shell switches exactly those three to a column flex container (`display: flex; flex-direction: column`, which is what `align-items: stretch` makes indistinguishable from block stacking for full-width children). The class is `nb-shell__region--ordered`, it goes away when the last shared contribution does, and a product that has never called `useShellSlot` keeps the block layout it has always had. If your `outer-menu` lays its children out horizontally with `display: inline-block` rather than with a flex container of your own, put a flex container of your own there before you use `claim: 'all'` in it.

### It survives `<KeepAlive>`

`<router-view v-slot="{ Component }"><KeepAlive><component :is="Component" /></KeepAlive></router-view>` is the standard way to keep a list's scroll position across a detail visit, and it is the one lifecycle that reports nothing: a deactivated route component is moved to an off-document container and left alive, so neither `onUnmounted` nor `onScopeDispose` runs. Because a teleported subtree does not live in its own component's DOM, KeepAlive has nothing to move either.

The composable handles it explicitly. A cached view releases its region when it is deactivated and takes it back, as the newest claimant, when it is activated. So a cached page's Save button is not left live and clickable in the topbar of the page that replaced it, and a topbar that exists only because of that contribution closes again.

### Outside a shell it does nothing

A view that contributes is still a view. Mounted without an `NbShell` ancestor (a unit test, a print route, a page embedded in something else) the composable is inert: `ready` stays `false`, the outlet renders nothing, and there is no warning and no throw. Nothing to branch on.

### What you get back

| Property | Type                              | Notes                                                                                         |
| -------- | --------------------------------- | --------------------------------------------------------------------------------------------- |
| `Outlet` | Component                         | Renders its default slot into the region. `<component :is="topbar.Outlet">…</component>`      |
| `target` | `ShallowRef<HTMLElement \| null>` | The live host element. `null` until the shell has mounted the region                          |
| `ready`  | `ComputedRef<boolean>`            | `target` exists                                                                               |
| `active` | `ComputedRef<boolean>`            | This contribution is the one rendering. Read it to skip expensive work, not to guard `Outlet` |
| `name`   | `TShellSlotName`                  | The region claimed                                                                            |
| `id`     | `number`                          | This contribution's identity. For debugging                                                   |

See [`useShellSlot`](/ui/composables/use-shell-slot) for the full reference.

### Migrating from a DOM id

If you are on the old pattern, the change is mechanical and can be done one view at a time. The shell keeps rendering the id you put in the slot until you remove it.

```vue
<!-- Before: the shell declares a target the view has to know the name of. -->
<NbShell>
  <template #topbar-right><div id="app-topbar" /></template>
</NbShell>

<!-- In the view -->
<Teleport v-if="mounted" to="#app-topbar">
  <NbButton @click="save">Save</NbButton>
</Teleport>
```

```vue
<!-- After: the shell declares nothing, the view names a region. -->
<NbShell />

<!-- In the view -->
<component :is="topbar.Outlet">
  <NbButton @click="save">Save</NbButton>
</component>
```

Delete the `mounted` flag with it: it existed to work around the ordering problem, and there is nothing left for it to guard.

## When the topbar is rendered

The topbar used to render unconditionally, which meant an application with no topbar content still got a 50px strip and a border line under the header. Four of our products hid it from the outside, one with the only `:deep()` override in its entire codebase, one with a comment explaining that its selector was doubled to out-specify a scoped rule inside the built `ui.css`.

The check now lives in the component, where the slots are: the topbar renders when `topbar-left` or `topbar-right` has content, or when a view has claimed one of them with `useShellSlot`. If neither, there is no topbar in the DOM and nothing to hide.

Both halves stay in the DOM whenever the bar itself does, even when only one is filled. The left half is the flex spacer that keeps the right half against the right edge, so an application passing only `topbar-right` sees exactly what it saw before.

::: warning One of two changes of default behaviour in this release
`topbar` defaults to `'auto'`, and the shell rendered the strip unconditionally before this prop existed. Any layout that measured against the reserved 50px, or that positioned something against the topbar's bottom border while passing neither topbar slot, will see it move. `topbar="always"` is the exact previous behaviour and is the one-line fix. Every other consumer, including all four applications that were hiding the empty bar from the outside, gets the same pixels with less CSS.

The other default change is `collapse-at`, which is new and defaults to `'md'`: below 672px the frame now becomes single-column, where before it kept squeezing three columns. Its opt-out is `collapse-at="none"`. See [A layout change below 672px](#what-the-drawer-does-for-you) and [Small viewports and zoom](#small-viewports-and-zoom).

Two behavioural defaults changing at once, on the component every product mounts at its root, is more than we would normally ship together. They are here together because they are the same finding: the frame was deciding layout without looking at what it had been given. Both opt-outs are one attribute, and neither touches anything above 672px except the empty-topbar case above.
:::

Two escape hatches, for the layouts where presence is not the shell's to infer:

```vue
<!-- Reserve the bar's height even while it is empty. -->
<NbShell topbar="always" />

<!-- Never render it, whatever the slots say: a full-bleed route inside an
     application whose shell is declared once, further up. -->
<NbShell topbar="never" />
```

`topbar="never"` has one exception and one consequence.

The exception: below `collapse-at`, a shell that has a sidebar renders the bar anyway, because the bar carries the drawer toggle and a frame with no route back to its own navigation is worse than a frame with a strip the route did not ask for.

The consequence: a view that contributes to `topbar-left` or `topbar-right` with `useShellSlot()` while the bar is suppressed has nowhere to teleport to. The host element never mounts, so `ready` stays false and the contribution is silently dropped, which is the right runtime behaviour (a view must stay usable wherever it is mounted) but a confusing thing to debug. The shell warns about exactly that pairing in development.

One case the slot check cannot see: `<template #topbar-left><RouterView name="topbar" /></template>`. A component in a slot counts as content, because whether it renders anything is only known after it has rendered, so the bar appears on every route including the ones registering no `topbar` view. A CSS rule catches that case (both halves genuinely empty in the DOM), but the better fix is to stop passing a router view here and let the views contribute instead, which is what `useShellSlot` is for.

## Verbose sidebar

By default the sidebar is a narrow 56px icon rail filled with `NbSidebarLink` components. For navigation-heavy applications (admin consoles, multi-module SaaS) that need labels, section grouping and multi-level submenus, set `sidebar-variant="verbose"`. The sidebar widens to 240px and its children switch to full-width rows.

The verbose variant is fully backwards compatible: the prop defaults to `'compact'`, so existing applications keep their current rail without changes.

Use `NbSidebarMenu` as the container and `NbSidebarMenuItem` for rows. Wrap related items in `NbSidebarMenuGroup` to add a labelled (optionally collapsible) section. Sub-items are nested by placing `NbSidebarMenuItem` instances inside another item's default slot, recursively, to any depth.

<preview>
  <div style="height: 480px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell sidebar-variant="verbose" style="height: 100%">
      <template #sidebar-logo>
        <NbSidebarBrand icon="shield-check" title="Product Name" subtitle="Workspace" />
      </template>
      <template #sidebar-nav>
        <NbSidebarMenu>
          <NbSidebarMenuItem icon="house" label="Dashboard" to="/" active />
          <NbSidebarMenuItem icon="package" label="Products" default-expanded>
            <NbSidebarMenuItem label="Catalog" to="/products/catalog" />
            <NbSidebarMenuItem label="Inventory" to="/products/inventory" />
            <NbSidebarMenuItem label="Categories" to="/products/categories" />
            <NbSidebarMenuItem label="Suppliers" to="/products/suppliers" />
          </NbSidebarMenuItem>
          <NbSidebarMenuItem icon="file-text" label="Orders" to="/orders" badge="42" />
          <NbSidebarMenuItem icon="sparkle" label="Insights" to="/insights" badge="AI" badge-variant="accent" />
          <NbSidebarMenuItem icon="users" label="Customers" to="/customers" />
          <NbSidebarMenuGroup label="Workspace" collapsible>
            <NbSidebarMenuItem icon="chart-line" label="Reports" to="/reports" badge="3" badge-variant="success" />
            <NbSidebarMenuItem icon="chat-circle" label="Messages" to="/messages" />
            <NbSidebarMenuItem icon="bell" label="Notifications" to="/notifications" />
          </NbSidebarMenuGroup>
          <NbSidebarMenuGroup label="Account">
            <NbSidebarMenuItem icon="gear" label="Settings" to="/settings" />
            <NbSidebarMenuItem icon="credit-card" label="Billing" to="/billing" />
          </NbSidebarMenuGroup>
        </NbSidebarMenu>
      </template>
      <template #topbar-left>
        <strong>Dashboard</strong>
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">
        A verbose sidebar with grouping, badges and a nested submenu. Click "Products" to collapse, click the "Workspace" heading to collapse that group.
      </p>
    </NbShell>
  </div>
</preview>

```vue
<template>
  <NbShell sidebar-variant="verbose">
    <template #sidebar-logo>
      <NbSidebarBrand
        icon="shield-check"
        title="Product Name"
        subtitle="Workspace"
      />
    </template>
    <template #sidebar-nav>
      <NbSidebarMenu>
        <NbSidebarMenuItem icon="house" label="Dashboard" to="/" active />

        <NbSidebarMenuItem icon="package" label="Products">
          <NbSidebarMenuItem label="Catalog" to="/products/catalog" />
          <NbSidebarMenuItem label="Inventory" to="/products/inventory" />
          <NbSidebarMenuItem label="Categories" to="/products/categories" />
        </NbSidebarMenuItem>

        <NbSidebarMenuItem
          icon="file-text"
          label="Orders"
          to="/orders"
          badge="42"
        />
        <NbSidebarMenuItem
          icon="sparkle"
          label="Insights"
          to="/insights"
          badge="AI"
          badge-variant="accent"
        />
        <NbSidebarMenuItem icon="users" label="Customers" to="/customers" />

        <NbSidebarMenuGroup label="Workspace" collapsible>
          <NbSidebarMenuItem
            icon="chart-line"
            label="Reports"
            to="/reports"
            badge="3"
            badge-variant="success"
          />
          <NbSidebarMenuItem
            icon="chat-circle"
            label="Messages"
            to="/messages"
          />
        </NbSidebarMenuGroup>

        <NbSidebarMenuGroup label="Account">
          <NbSidebarMenuItem icon="gear" label="Settings" to="/settings" />
        </NbSidebarMenuGroup>
      </NbSidebarMenu>
    </template>

    <template #topbar-left><strong>Dashboard</strong></template>
    <p>Main content area.</p>
  </NbShell>
</template>
```

### Navigation

`NbSidebarMenuItem` adapts how it renders to your routing setup:

- **With vue-router** (the app called `app.use(router)`): pass `to` and the row renders as a `<RouterLink>`. `to` accepts anything valid for RouterLink, either a string path (`to="/orders"`) or a location object (`:to="{ name: 'orders' }"`). Client-side navigation and the router's active class work as usual.
- **Without vue-router**: a string `to` (or `href`) renders a plain `<a>`; use `href` for external links. An object `to` has no meaning without a router, so the row gracefully falls back to a `<button>` that emits `click` (no broken anchor is produced).
- **Items with sub-items** never navigate. In verbose mode the row is a `<button>` that toggles the submenu; in compact mode it opens the hover flyout. Any `to`/`href` on a parent item is ignored.

Mark the current route with `active`. Listen for `@click` to drive navigation manually when you are not using `to`.

```vue
<!-- router-driven -->
<NbSidebarMenuItem icon="file-text" label="Orders" :to="{ name: 'orders' }" />
<!-- plain href -->
<NbSidebarMenuItem icon="book" label="Docs" href="https://example.com/docs" />
<!-- manual handling -->
<NbSidebarMenuItem icon="gear" label="Settings" @click="openSettings" />
```

### Switching between compact and verbose at runtime

`sidebarVariant` is a regular prop, so toggling between modes is just a state change. Because the same `NbSidebarMenu` / `NbSidebarMenuItem` / `NbSidebarMenuGroup` tree adapts to either variant, the application data model does not change.

In compact mode:

- `NbSidebarBrand` renders only its icon (title and subtitle are hidden).
- `NbSidebarMenuItem` collapses to a 40×40 icon button. Hovering reveals a flyout with the label, badge, and any child items.
- `NbSidebarMenuGroup` becomes a thin separator (the group label is dropped visually but kept for screen readers).
- Badges with a `badgeVariant` become a small coloured dot in the icon's corner.

```vue
<template>
  <NbShell :sidebar-variant="collapsed ? 'compact' : 'verbose'">
    <template #sidebar-logo>
      <NbSidebarBrand
        icon="shield-check"
        title="Product"
        subtitle="Workspace"
      />
    </template>
    <template #sidebar-nav>
      <NbSidebarMenu>
        <!-- same tree, both modes render correctly -->
        <NbSidebarMenuItem icon="house" label="Dashboard" to="/" active />
        <NbSidebarMenuItem icon="package" label="Products">
          <NbSidebarMenuItem label="Catalog" to="/products/catalog" />
          <NbSidebarMenuItem label="Inventory" to="/products/inventory" />
        </NbSidebarMenuItem>
      </NbSidebarMenu>
    </template>
    <template #topbar-right>
      <NbButton size="sm" variant="ghost" @click="collapsed = !collapsed">
        {{ collapsed ? 'Expand' : 'Collapse' }} sidebar
      </NbButton>
    </template>
  </NbShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const collapsed = ref(false)
</script>
```

Persist `collapsed` in `localStorage` (or compute it from `window.matchMedia`) to make the choice survive reloads and adapt to viewport changes.

### Brand block (logo + title)

In the verbose variant, the `#sidebar-logo` slot has room for more than just a mark. Use `NbSidebarBrand` to render an icon, a primary title, and an optional subtitle on a second line (useful for "Product Name / Workspace", "Acme / Production", etc.). For a fully custom mark, use the component's `#icon` slot:

```vue
<template #sidebar-logo>
  <NbSidebarBrand title="Acme" subtitle="Production">
    <template #icon>
      <img src="/brand/acme-mark.svg" alt="" width="24" height="24" />
    </template>
  </NbSidebarBrand>
</template>
```

### Badge variants

`NbSidebarMenuItem` accepts a `badge` (string or number) plus an optional `badge-variant`:

| Variant             | When to use                               |
| ------------------- | ----------------------------------------- |
| `neutral` (default) | Counts and quiet status (unread, pending) |
| `accent`            | Feature flags: "AI", "BETA", "NEW", "PRO" |
| `success`           | Healthy state or positive count           |
| `warning`           | Attention needed but not urgent           |
| `danger`            | Errors or required action                 |

### Registering custom icons

The library ships with the Phosphor icon set baked in at build time. Applications often need extra icons (a brand logo, domain-specific glyphs) without forking the library. Register them at app bootstrap with `registerIcons`:

```ts
import { createApp } from 'vue'
import NubiscoUI, { registerIcons } from '@nubisco/ui'
import App from './App.vue'
import BrandShield from './icons/BrandShield.vue'
import WorkflowNode from './icons/WorkflowNode.vue'

const app = createApp(App)
app.use(NubiscoUI)

registerIcons({
  'brand-shield': BrandShield,
  'workflow-node': WorkflowNode,
})

app.mount('#app')
```

After registration, the names work anywhere `NbIcon` (or any component that takes an `icon` prop, including `NbSidebarBrand` and `NbSidebarMenuItem`) is used:

```vue
<NbSidebarBrand icon="brand-shield" title="..." />
<NbSidebarMenuItem icon="workflow-node" label="..." />
```

Custom icons take precedence over the bundled catalog, so an app can override a built-in by registering the same name. To supply per-weight variants, pass an object instead of a single component:

```ts
registerIcons({
  'brand-shield': {
    regular: BrandShieldRegular,
    bold: BrandShieldBold,
    fill: BrandShieldFill,
  },
})
```

### Choosing the variant

| Use the compact variant when…                            | Use the verbose variant when…                                |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| Top-level navigation is short (≤ 8 destinations)         | Navigation has many destinations or natural groupings        |
| Screen real estate matters more than discoverability     | Discoverability matters more than horizontal space           |
| Users learn the icons quickly (developer tools, editors) | Users are domain-focused and prefer labels (LOB apps, admin) |
| Mobile/tablet form factors dominate                      | Desktop-first dashboards                                     |

Both variants share the same CSS variables for theming (`--nb-shell-sidebar-bg`, `--nb-shell-sidebar-link-*`), so the brand stays consistent.

## Notification slot

Use the `#notification` slot to show important banners above the topbar. The area is only rendered when the slot is provided, so there is zero overhead when unused.

<preview>
  <div style="height: 360px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell>
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template v-if="showNotification" #notification>
        <NbBanner status="warning" flush dismissible title="Your trial expires in 3 days" @dismiss="showNotification = false">
          <template #action>
            <NbButton size="sm" variant="ghost">Upgrade now</NbButton>
          </template>
        </NbBanner>
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
      <NbBanner
        status="warning"
        flush
        dismissible
        title="Your trial expires in 3 days"
      >
        <template #action>
          <NbButton size="sm" variant="ghost" @click="upgrade"
            >Upgrade now</NbButton
          >
        </template>
      </NbBanner>
    </template>
    <!-- ... other slots ... -->
  </NbShell>
</template>
```

Use [`NbBanner`](/ui/components/banner) here rather than a hand-rolled div: `flush` is the prop that makes it meet both edges of the notification area. Reach for `variant="callout"` when the message is a standing fact rather than the outcome of an action, and it loses its close button, because dismissing it would not make it untrue.

## Fixedbar slot

The `#fixedbar` slot renders a non-scrolling bar between the topbar and the main content, useful for tabs, breadcrumbs, or filters. Like the notification slot, it is only rendered when content is provided.

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

### Resizable inspector

Set `resizable` to let the user widen the inspector from its **left edge**, clamped between 288px (the floor, which is the `xs` width) and the ceiling, which is half the current viewport but never less than the floor.

`resizable` works on its own. The shell keeps the chosen width when you do not bind one, and emits `update:inspectorWidth` either way, so you can listen without owning the state. Bind `v-model:inspector-width` when you want to persist it (`null` = the size default); binding it makes the width yours, and the shell then renders exactly what you give it.

The handle is a control, not a drag target. It is a `separator` with a value, so it is reachable by keyboard and announced with its bounds:

| Input                                | Effect                               |
| ------------------------------------ | ------------------------------------ |
| Drag (mouse, pen, touch)             | Track the pointer                    |
| <kbd>←</kbd> / <kbd>→</kbd>          | Widen / narrow by 16px               |
| <kbd>Shift</kbd> + arrow             | Widen / narrow by 64px               |
| <kbd>Home</kbd> / <kbd>End</kbd>     | The floor / the ceiling              |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | Reset to the `inspectorSize` default |
| Double-click                         | Reset to the `inspectorSize` default |

The upper clamp is live. It is recomputed when the window resizes, and `--nb-shell-inspector-max-width` applies the same ceiling in CSS to the fixed `inspectorSize` presets too, which never pass through the resize code at all. So a 700px width persisted on a wide monitor renders at 400px in an 800px window instead of squeezing the body to 100px, and an `md` (560px) inspector does not take two thirds of a laptop screen. `lg`, `xl` and `inspector-expanded` are already viewport-relative and opt out of the ceiling; set the token to `none` to opt out anywhere else.

The ceiling token is `max(288px, 50vw)`, not a bare `50vw`, and the `max()` is load-bearing: half a 560px window is 280px, below the floor the handle clamps and announces, so a bare `50vw` made the announced value, the clamped value and the rendered width three different numbers on a narrow screen. With the floor in the ceiling they agree, and <kbd>Home</kbd> and <kbd>End</kbd> meet on the same width, which is the honest answer when there is no room to resize into.

Below `collapseAt` there is no handle at all: the inspector is a full-screen sheet there, so its width is the window's and there is nothing to negotiate. See [Small viewports and zoom](#small-viewports-and-zoom).

The handle always announces the width the element is actually rendering, including before anyone has dragged it: with `inspector-size="md"` and nothing bound, `aria-valuenow` is `560`. A focusable `separator` with no value is an ARIA violation, and "nobody has dragged yet" is the state every consumer starts in.

<preview>
  <div style="height: 360px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell resizable :inspector-visible="true" inspector-size="xs" v-model:inspector-width="inspectorWidth">
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template #topbar-left>
        <strong>Layers</strong>
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary, #666);">Drag the inspector's left edge to resize it. Double-click the handle to reset. Width: {{ inspectorWidth ? inspectorWidth + 'px' : 'default (xs)' }}.</p>
      <template #inspector>
        <div style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem;">Properties</h4>
          <p style="margin: 0; color: var(--nb-c-text-secondary, #666); font-size: 0.875rem;">Grab my left edge and drag.</p>
        </div>
      </template>
    </NbShell>
  </div>
</preview>

```vue
<template>
  <NbShell
    resizable
    :inspector-visible="true"
    inspector-size="xs"
    v-model:inspector-width="inspectorWidth"
  >
    <template #inspector>
      <div class="detail-view">Drag my left edge to resize.</div>
    </template>
    <p>Main content.</p>
  </NbShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// null = use the inspector-size default. Persist this value (e.g. in app
// settings) to remember the user's chosen width across sessions.
const inspectorWidth = ref<number | null>(null)
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
        <NbBanner status="warning" variant="callout" flush title="Unsaved changes" />
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

## Small viewports and zoom

The frame is `height: 100dvh; overflow: hidden`, which is what makes the regions scroll independently. It also means a column that does not fit has nowhere to go: there is no page scroll to escape into.

Do the arithmetic on a phone. A verbose sidebar is 240px. An open inspector is at least 288px, because 288 is the floor. On a 320px-wide screen that is 528px of chrome and a body of **minus 208px**. The same sum on a 1280px laptop at 200% browser zoom, where the viewport is 640 CSS pixels wide, leaves 112px for the page: zoom shrinks the viewport in CSS pixels exactly as a narrower screen does, which is what makes this [WCAG 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) and not only a phone problem.

Below `collapseAt` (default `md`, 672px) the frame stops being three columns:

| Region    | Above the breakpoint        | Below it                                                                               |
| --------- | --------------------------- | -------------------------------------------------------------------------------------- |
| Sidebar   | A permanent column          | An overlay drawer, out of the flow, `inert` while closed, behind a toggle button       |
| Inspector | A column beside the body    | A full-screen sheet over the content row, topbar included, with its own dismiss button |
| Topbar    | Present when it has content | Forced on while there is a sidebar, because it carries the toggle                      |
| Body      | Whatever is left            | The whole width, always                                                                |
| Padding   | 24px chrome, 24px/28px main | 16px chrome, 16px main, and 12px main below 480px                                      |

Nothing to configure. A shell that renders on a desktop today renders on a phone with the same markup:

```vue
<!-- Collapses below 672px. Nothing else to do. -->
<NbShell>
  <template #sidebar-nav>…</template>
</NbShell>

<!-- A verbose rail plus a usually-open inspector needs the room sooner. -->
<NbShell collapse-at="lg" sidebar-variant="verbose" />

<!-- Never collapse: a frame that is only ever shown on a desktop, an
     installed build, a control room display. This is the pre-3.3 layout. -->
<NbShell collapse-at="none" />
```

Bind the drawer only if the application needs to open it from somewhere else (a command palette entry, a route guard closing it on navigation):

```vue
<template>
  <NbShell v-model:sidebar-open="navOpen">
    <template #sidebar-nav>…</template>
  </NbShell>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const navOpen = ref(false)
// Close the drawer on navigation. The shell already closes it when the
// viewport grows past the breakpoint.
watch(useRoute(), () => (navOpen.value = false))
</script>
```

### What the drawer does for you

- The toggle is a real `<button>` with `aria-expanded` and `aria-controls` pointing at the `<nav>`. Its label is `nav-toggle-label`, defaulting to `Navigation`: the button names the thing and `aria-expanded` says the state, so you do not have to translate "Open" and "Close" separately.
- A **closed drawer is `inert` and `aria-hidden`**, not merely translated off screen. An off-screen nav that keeps its tab stops is the classic hidden-focus bug: you tab into links you cannot see.
- Opening it moves focus to the first link in the rail. Closing it puts focus back on the toggle, so focus is never left on an element that has just gone inert.
- <kbd>Esc</kbd> closes it, and only when it is open: the event keeps travelling otherwise, so a dialog or a menu inside the page still gets its own Escape.
- Clicking the scrim closes it.
- Growing the window past the breakpoint closes it and emits `update:sidebarOpen`, so a persisted flag cannot go stale while the sidebar is a column again.
- The drawer's slide is suppressed under `prefers-reduced-motion: reduce`.

::: warning A layout change below 672px, and the second default change in this release
Above 672px nothing moves. Below it, a product that had tuned its own mobile layout around the squeezed three-column frame (an override that hid the rail, a media query of its own that narrowed the inspector) will now find the shell doing it too. `collapse-at="none"` restores the previous behaviour exactly, and is the one-line fix while you delete your override.

This is the second default-behaviour change in the release, alongside `topbar="auto"` above. Both are opt-out with a single attribute, and this page flags each of them where it describes them.
:::

### The inspector sheet, and the way out of it

Below `collapse-at` the inspector stops being a column and becomes a sheet. The sheet covers the whole content row, and the content row contains the body, which contains the topbar. **So the sheet covers the topbar too**, including the drawer toggle and anything a product put in `topbar-right`. That is on purpose: a 320px sheet with a strip of unrelated chrome above it is not a sheet. But it means the frame has covered every control a product might have used to close the inspector, so the frame has to supply the way out itself:

- The sheet renders **its own dismiss button**, top right, only in this state. It never appears next to your own close button on the desktop column. Its accessible name is `inspector-close-label`, defaulting to `Close inspector`.
- <kbd>Esc</kbd> closes the sheet. If the navigation drawer is also open, Escape closes the drawer first: topmost wins, and a second Escape gets the sheet.
- The **body is `inert` and `aria-hidden`** while the sheet is up, so Tab cannot walk into the page underneath and a screen reader does not read a page the user cannot see. This is also why the dismiss button has to exist: the drawer toggle is inside the body.
- Focus moves to the dismiss button when the sheet opens and returns to whatever opened it when it closes, the same contract the drawer has.

Closing emits `update:inspectorVisible`, so `v-model:inspector-visible` is all you need:

```vue
<NbShell v-model:inspector-visible="showDetails">
  <template #inspector><PropertiesPanel /></template>
</NbShell>
```

If you pass `:inspector-visible="true"` with nothing listening for the update, the shell still hides the sheet locally rather than leaving you trapped behind it. That override is scoped to the overlay and clears itself the moment you set the prop true again or the window grows past the breakpoint, so it can never desync your desktop column.

### The cost of the breakpoint

The breakpoint is evaluated in script, from `window.innerWidth`, and published as a class on the frame rather than being written as a media query. That is deliberate: `inert`, `aria-expanded` and the existence of the toggle button can only be set by script, and a media query would put the decision in two places that could disagree about which layout is on screen. The consequence is that a server-rendered first paint is the desktop layout until hydration, and that the pixel values live in the component next to the rest of the scale in `styles/variables/_breakpoints.scss` rather than in a custom property (a media query cannot read one anyway).

Reading the viewport in script does not mean re-rendering the frame on every resize event, though, and this is the component that would hurt: it is mounted once, at the root, so a render of it is a render of the whole application. Two things read the width, and they are tracked separately:

| Reader                                                | Update rate                                               | When it is attached    |
| ----------------------------------------------------- | --------------------------------------------------------- | ---------------------- |
| The collapse threshold (a boolean)                    | Latched: written only on the event where the answer flips | Always                 |
| The resize handle's `aria-valuenow` / `aria-valuemax` | Coalesced to one write per animation frame                | Only while `resizable` |

So dragging a window from 1200px to 900px costs zero renders for the majority of consumers, who do not pass `resizable`, and one render per painted frame for the rest, instead of one per event for everybody.

## Layout layering

The shell organizes its regions into a layering system that gives each area the correct stacking context. This matters when menus, tooltips, or dropdowns need to overflow their container without being clipped by adjacent regions.

```text
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
- **`sidebar` (z-index: 100)**: The rail itself is `overflow: visible`, but its scrolling nav region (`.nb-shell__sidebar-nav`) is `overflow-y: auto; overflow-x: hidden`, so a tooltip drawn inside a sidebar item **is** clipped by the rail. That is why `NbSidebarLink`'s tooltip, and anything else that has to escape the rail, is teleported to `<body>` rather than relying on the sidebar's own overflow. If you build a flyout for a sidebar item, teleport it.
- **Body and inspector**: No special z-index. Contained within the content row with `overflow: hidden` on the row itself to keep scrolling behavior predictable.

This layering is automatic. You do not need to set any z-index values yourself. The shell sets them so that interactive elements in higher regions always render above lower regions.

## Surface depth

The shell owns two depths. Its chrome (topbar, menu strips, fixedbar and the body behind them) is layer 1. The main region is the **page ground** and paints layer 0, so the first surface a page puts into it lands on layer 1 and nesting counts up from there.

```vue
<NbShell>
  <!-- main: layer 0 -->
  <NbPanel>
    <!-- layer 1 -->
    <NbPanel />
    <!-- layer 2 -->
  </NbPanel>
</NbShell>
```

Surfaces in the chrome slots keep counting from the chrome: an `NbPanel` in `topbar-right` sits on layer-1 chrome and paints layer 2. See [Layers](/theming#layers) for the full model.

## Theming the chrome

Every rule that paints the shell frame reads a token. Set them on `:root` (or on `.nb-shell`, or on any ancestor of the shell) and the chrome retints. There is no need to write a selector that beats ours, which was the state of things before these tokens existed: the values were `var(--nb-c-surface)` and `var(--nb-c-border)` written directly into scoped rules, so an application that wanted a dark topbar had to out-specify a `[data-v-…]` selector inside a built stylesheet. One of our products carries a comment explaining that its class is doubled for exactly that reason. Deleting that comment is the point of this section.

The tokens come in three levels, so you override at the level you actually mean.

```css
/* 1. The frame ground, behind every region. */
:root {
  --nb-shell-bg: var(--nb-c-surface-raised);
}

/* 2. Every chrome strip at once: topbar, fixedbar, menu bars, body. */
:root {
  --nb-shell-chrome-bg: var(--nb-c-layer-0);
  --nb-shell-chrome-color: var(--nb-c-text);
  --nb-shell-chrome-border: 1px solid var(--nb-c-border);
  --nb-shell-chrome-padding-x: calc(var(--nb-base-unit) * 3);
}

/* 3. One region, where it should differ from the rest. */
:root {
  --nb-shell-topbar-bg: var(--nb-c-primary);
  --nb-shell-topbar-color: var(--nb-c-primary-a11y);
  --nb-shell-topbar-border: none;
}
```

Each per-region token defaults to its chrome-level counterpart, and every chrome-level token defaults to a semantic colour token. Two consequences worth knowing:

- **The defaults are the old pixels.** Everything resolves to what the scoped rules used to hard-code, so adopting the tokens changes nothing until you set one.
- **Dark mode is already handled.** A `var()` resolves where it is used, not where it is declared, so `--nb-shell-chrome-bg: var(--nb-c-surface)` picks up the dark value inside `.dark` with no second declaration. If you override a token with a **literal colour**, you have opted out of that and owe both themes a value:

```css
:root {
  --nb-shell-topbar-bg: #ffffff;
}
.dark {
  --nb-shell-topbar-bg: #16161f;
}
```

Prefer a semantic token or a `color-mix()` against one, which is how the sidebar's own defaults are built (a near-black tint of `--nb-c-primary`, so rebranding the primary colour retints the rail rather than stranding it).

The full list is in the [API tab](#api).

## Accessibility

The shell is the application frame, so it owns the parts of the accessibility story that are structural: the landmarks, the way into the content, and whether a region that is not visible is still reachable.

### Landmarks, named by default

The sidebar renders as `<nav>`, the main region as `<main>` and the inspector as `<aside>` (a complementary landmark). Two of those get a default accessible name, because an unnamed landmark is indistinguishable from another of the same type in a landmark list:

| Element   | Name comes from   | Default     |
| --------- | ----------------- | ----------- |
| `<nav>`   | `sidebar-label`   | `Primary`   |
| `<aside>` | `inspector-label` | `Inspector` |

Set them when the words are wrong for your product (`inspector-label="Properties"`), or when your application is localised. If you also put a `<nav>` in `outer-menu` or `inner-menu`, name that one yourself: it is your markup, not ours. And do not nest another `<main>` in the default slot.

### Skip link

The shell renders one, as its first focusable element, pointing at the `<main>` it renders. It is off-screen until it takes focus and comes back into the top-left corner of the frame when it does.

This is the shell's job rather than yours because the shell is the only thing that knows where `<main>` is. Every application that hand-rolled a skip link had to invent an id for a region it does not render, and wrap its own content in a div to have something to attach it to.

```vue
<!-- Nothing to do: the link is already there. -->
<NbShell>…</NbShell>

<!-- Localised. -->
<NbShell skip-to-content-label="Saltar al contenido" />

<!-- The main region gets a known id, for a router scroll behaviour
     or an aria-controls elsewhere in the app. -->
<NbShell main-id="app-main" />

<!-- Off, for an application that already ships its own. -->
<NbShell :skip-to-content="false" />
```

`<main>` carries `tabindex="-1"` so following the link moves focus rather than only scrolling, and the shell calls `focus()` on click as well, which is what keeps it working under a router that intercepts in-page anchors.

### The closed inspector is inert

The inspector column stays in the DOM at zero width when `inspector-visible` is false, because that is what lets it animate open and what gives a contributed panel somewhere to live before it is shown. While it is closed the shell puts `inert` and `aria-hidden` on it, so its controls are neither tabbable nor announced.

That matters more now than it used to: `inspector` is a `useShellSlot` region, so a view can teleport a whole panel into a column the application has not opened. You do not need to guard the content with `v-if`, and you do not need to unmount your inspector view on close.

### The navigation drawer

Below `collapse-at` the sidebar is an overlay. Closed, it is `inert` and `aria-hidden`, so it is neither tabbable nor announced; open, focus moves into it and <kbd>Esc</kbd> or the scrim closes it and returns focus to the toggle. The toggle is a `<button type="button">` with `aria-expanded` and `aria-controls`. See [Small viewports and zoom](#small-viewports-and-zoom) for the whole behaviour.

The drawer is not a focus trap. It is a navigation region, not a dialog: tabbing past the last link continues into the page behind it, which is the behaviour a disclosure has, and the scrim is decoration rather than a modal barrier.

### The inspector sheet is a covering overlay, so the body goes inert

Below `collapse-at` the inspector covers the content row, topbar included. While it does, `.nb-shell__body` carries both `inert` and `aria-hidden`, so Tab cannot reach the page under the sheet and a screen reader does not read it. The sheet renders its own `<button>` to close (named by `inspector-close-label`), <kbd>Esc</kbd> closes it, focus moves to that button when the sheet opens and returns to the opener when it closes.

The dismiss button is not decoration: because the body is inert, and because the body is where the drawer toggle and `topbar-right` live, it is the only control the frame can guarantee is reachable. Above the breakpoint none of this applies and none of it renders.

### Panel size controls

`NbShellPanel`'s default minimize / default / maximize buttons are `type="button"` (they are commonly inside a form in an inspector), carry `aria-pressed` for the active size, sit in a named `role="group"`, and their glyphs are `aria-hidden`. Replacing the `controls` slot replaces all of that, so name your own buttons.

### Motion

Three things in the shell move: the inspector's width when it opens, the navigation drawer sliding in at collapsed widths, and the skip link sliding into the corner. All three are suppressed under `prefers-reduced-motion: reduce`, along with the resize handle's highlight and `NbShellPanel`'s header fades. The states are still reached, only instantly.

Anything you animate inside a slot is yours to gate. `useReducedMotion`, exported from `@nubisco/ui`, reads the preference reactively if you need it in script rather than in CSS.

### Contributions and focus

Contributions teleport, so contributed controls move in the DOM but keep their component identity: focus survives the move, and it survives the shell re-rendering around them. What teleporting does not do is reorder the tab sequence to match what you see. Under `claim: 'all'` the `order` option sorts contributions visually with CSS `order`; tab order stays registration order. See the [composable's own accessibility note](/ui/composables/use-shell-slot#accessibility).

</doc-tab>

<doc-tab name="Api">

## Props

| Prop                  | Type                                   | Default             | Description                                                                                                                                                                                                                                           |
| --------------------- | -------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inspectorVisible`    | `boolean`                              | `false`             | Whether the inspector column is visible                                                                                                                                                                                                               |
| `inspectorExpanded`   | `boolean`                              | `false`             | When true the inspector takes ~50% of the viewport width instead of the default fixed width                                                                                                                                                           |
| `inspectorSize`       | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`              | Controls the width of the inspector panel (xs: 288px, sm: 360px, md: 560px, lg: 50vw, xl: 75vw)                                                                                                                                                       |
| `resizable`           | `boolean`                              | `false`             | Let the user resize the inspector from its left edge, by pointer or by keyboard, clamped between 288px and 50% of the current viewport (re-clamped on window resize). Enter or double-click resets. Pair with `v-model:inspector-width` to persist it |
| `inspectorWidth`      | `number \| null`                       | `null`              | v-model (`v-model:inspector-width`) for the user-chosen width in px when `resizable` is on. `null` means "use `inspectorSize`". Emits `update:inspectorWidth` on drag, on arrow-key resize and on reset; the consumer owns persistence                |
| `mainPadding`         | `boolean`                              | `true`              | Whether the main content area has padding. Set to `false` for full-bleed content like viewports or canvases                                                                                                                                           |
| `sidebarVariant`      | `'compact' \| 'verbose'`               | `'compact'`         | Sidebar presentation mode. `'compact'` keeps the legacy 56px icon rail (use with `NbSidebarLink`). `'verbose'` widens the sidebar to 240px for grouped, multi-level navigation (use with `NbSidebarMenu`, `NbSidebarMenuGroup`, `NbSidebarMenuItem`)  |
| `topbar`              | `'auto' \| 'always' \| 'never'`        | `'auto'`            | When the topbar strip is rendered. `'auto'` renders it only when `topbar-left` or `topbar-right` has content or a view has claimed one with `useShellSlot()`. `'always'` reserves it even while empty. `'never'` suppresses it whatever the slots say |
| `skipToContent`       | `boolean`                              | `true`              | Render the "skip to content" link as the shell's first focusable element. Set `false` only if your application already ships one                                                                                                                      |
| `skipToContentLabel`  | `string`                               | `'Skip to content'` | Label for the skip link                                                                                                                                                                                                                               |
| `mainId`              | `string`                               | auto                | The `id` on `<main>`, and the skip link's target. Defaults to a per-instance stable id, so two shells on a page do not collide                                                                                                                        |
| `sidebarLabel`        | `string`                               | `'Primary'`         | Accessible name for the sidebar `<nav>` landmark                                                                                                                                                                                                      |
| `inspectorLabel`      | `string`                               | `'Inspector'`       | Accessible name for the inspector `<aside>` landmark. The resize handle's own name is built from it (`Resize {inspectorLabel}`), so `inspector-label="Properties"` gives a handle named "Resize Properties"                                           |
| `collapseAt`          | `'md' \| 'lg' \| 'none'`               | `'md'`              | The viewport width below which the sidebar becomes an overlay drawer and the inspector a full-screen sheet. `'md'` is 672px, `'lg'` is 1056px, `'none'` never collapses                                                                               |
| `sidebarOpen`         | `boolean`                              | uncontrolled        | Optional `v-model:sidebar-open` for the drawer at collapsed widths. Omit it and the shell owns the state; pass it and the shell only emits. Ignored above `collapseAt`                                                                                |
| `navToggleLabel`      | `string`                               | `'Navigation'`      | Accessible name for the drawer toggle button. It carries `aria-expanded`, so the label names the thing, not the action                                                                                                                                |
| `inspectorCloseLabel` | `string`                               | `'Close inspector'` | Accessible name for the dismiss button on the inspector sheet. The button is rendered only below `collapseAt`, where the sheet covers the topbar                                                                                                      |

`inspectorVisible`, `inspectorWidth` and `sidebarOpen` are each **controlled or uncontrolled**: pass the prop and your application owns the state, leave it out and the shell owns it. Either way the matching `update:` event is emitted, so you can listen without binding.

::: warning A conditional binding is not a control
`<NbShell :sidebar-open="isMobile ? open : undefined">` puts the key on the vnode while binding nothing. The shell treats a key whose value is `undefined` **at setup** as uncontrolled and keeps the state itself, so the toggle still works. If a real value arrives later, the shell follows it, so the binding is not merely ignored either. What it will not do is switch owner mid-life: ownership is decided once, because a piece of state whose owner changes is worse than either owner.
:::

## Events

| Event                     | Payload          | When                                                                                                                                |
| ------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `update:sidebarOpen`      | `boolean`        | The drawer toggle, the scrim, <kbd>Esc</kbd>, or the window growing past `collapseAt` while the drawer was open                     |
| `update:inspectorVisible` | `boolean`        | The sheet's dismiss button or <kbd>Esc</kbd> below `collapseAt`. The shell never opens the inspector on its own                     |
| `update:inspectorWidth`   | `number \| null` | Dragging the resize handle, the arrow keys on it, or a reset (<kbd>Enter</kbd>, <kbd>Space</kbd>, double-click), which emits `null` |

## Exposed handles

The frame is the component most likely to be driven from outside: a command palette that focuses the page, a shortcut that opens the navigation, a route guard that closes the inspector before leaving. `ref` on `<NbShell>` gives you:

| Name                     | Type                  | What it is                                                           |
| ------------------------ | --------------------- | -------------------------------------------------------------------- |
| `mainEl`                 | `HTMLElement \| null` | The `<main>` element, for scrolling or measuring the page ground     |
| `sidebarEl`              | `HTMLElement \| null` | The sidebar `<nav>`, or `null` when no sidebar slot has content      |
| `inspectorEl`            | `HTMLElement \| null` | The inspector `<aside>`. Always present: it animates from zero width |
| `focusMain()`            | `() => void`          | Moves focus to the main region, exactly as the skip link does        |
| `setSidebarOpen(open)`   | `(boolean) => void`   | Opens or closes the drawer and emits. No-op above `collapseAt`       |
| `setInspectorVisible(v)` | `(boolean) => void`   | Shows or hides the inspector and emits                               |

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
| `topbar-left`    | Left side of the topbar (e.g. page title, breadcrumbs). The topbar is rendered only when this or `topbar-right` is populated  |
| `topbar-right`   | Right side of the topbar (e.g. actions, user menu)                                                                            |
| `fixedbar`       | Non-scrolling bar between topbar and main content (e.g. tabs, filters). Only rendered when populated                          |
| `default`        | Main scrollable content area                                                                                                  |
| `bottom`         | Empty region pinned below the main content area. Place any component here (e.g. `NbShellPanel`). Only rendered when populated |
| `inspector`      | Content for the optional inspector side panel                                                                                 |

Eight of these regions can also be filled from a view with [`useShellSlot`](/ui/composables/use-shell-slot): `outer-menu`, `inner-menu`, `notification`, `topbar-left`, `topbar-right`, `fixedbar`, `bottom` and `inspector`. A contribution renders into the same element as the slot and counts as content for the "only rendered when populated" rules above. The three `sidebar-*` slots, the legacy `menubar` and the `default` slot are not contributable.

## CSS Custom Properties

All of these are declared at `:root`, so an application overrides them there without competing with the component's scoped styles.

### Frame and chrome

| Variable                      | Default                         | Description                                                             |
| ----------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `--nb-shell-bg`               | `var(--nb-c-surface-raised)`    | The frame ground, visible behind and between regions                    |
| `--nb-shell-chrome-bg`        | `var(--nb-c-surface)`           | Fallback background for every chrome strip                              |
| `--nb-shell-chrome-color`     | `var(--nb-c-text)`              | Fallback text colour for every chrome strip                             |
| `--nb-shell-chrome-border`    | `1px solid var(--nb-c-border)`  | Fallback separator, as a full `border` shorthand (set `none` to remove) |
| `--nb-shell-chrome-padding-x` | `calc(var(--nb-base-unit) * 3)` | Horizontal padding of the topbar and the fixedbar                       |
| `--nb-shell-body-bg`          | `var(--nb-shell-chrome-bg)`     | Background of the body column that holds the topbar and main            |
| `--nb-shell-main-bg`          | `var(--nb-c-surface)`           | Background of the scrolling main region (the page ground)               |

### Per region

| Variable                     | Default                            | Description                                         |
| ---------------------------- | ---------------------------------- | --------------------------------------------------- |
| `--nb-shell-topbar-bg`       | `var(--nb-shell-chrome-bg)`        | Topbar background                                   |
| `--nb-shell-topbar-color`    | `var(--nb-shell-chrome-color)`     | Topbar text colour                                  |
| `--nb-shell-topbar-border`   | `var(--nb-shell-chrome-border)`    | Topbar bottom border                                |
| `--nb-shell-topbar-height`   | `calc(var(--nb-base-unit) * 6.25)` | Topbar height (50px)                                |
| `--nb-shell-fixedbar-bg`     | `var(--nb-shell-chrome-bg)`        | Fixedbar background                                 |
| `--nb-shell-fixedbar-color`  | `var(--nb-shell-chrome-color)`     | Fixedbar text colour                                |
| `--nb-shell-fixedbar-border` | `var(--nb-shell-chrome-border)`    | Fixedbar bottom border                              |
| `--nb-shell-menu-bg`         | `var(--nb-shell-chrome-bg)`        | Background of `outer-menu`, `inner-menu`, `menubar` |
| `--nb-shell-menu-color`      | `var(--nb-shell-chrome-color)`     | Text colour of the same three strips                |
| `--nb-shell-menu-border`     | `var(--nb-shell-chrome-border)`    | Bottom border of the same three strips              |

### Sidebar and inspector

| Variable                               | Default                                                          | Description                                                                                                                                                                                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--nb-shell-sidebar-bg`                | `color-mix(in srgb, var(--nb-c-primary) 20%, var(--nb-c-black))` | Sidebar background                                                                                                                                                                                                                                            |
| `--nb-shell-sidebar-width`             | `calc(var(--nb-base-unit) * 7)` (56px)                           | Sidebar width in the compact variant                                                                                                                                                                                                                          |
| `--nb-shell-sidebar-width-verbose`     | `calc(var(--nb-base-unit) * 30)` (240px)                         | Sidebar width in the verbose variant. Widen it for long navigation labels                                                                                                                                                                                     |
| `--nb-shell-scrim-bg`                  | `color-mix(in srgb, var(--nb-c-black) 45%, transparent)`         | The dimmer behind the navigation drawer at collapsed widths                                                                                                                                                                                                   |
| `--nb-shell-sidebar-link-color`        | 55% white                                                        | Sidebar link colour at rest                                                                                                                                                                                                                                   |
| `--nb-shell-sidebar-link-hover-bg`     | 8% white                                                         | Sidebar link hover background                                                                                                                                                                                                                                 |
| `--nb-shell-sidebar-link-hover-color`  | 90% white                                                        | Sidebar link hover colour                                                                                                                                                                                                                                     |
| `--nb-shell-sidebar-link-active-bg`    | 25% `--nb-c-primary`                                             | Sidebar link active background                                                                                                                                                                                                                                |
| `--nb-shell-sidebar-link-active-color` | 60% `--nb-c-primary` mixed into white                            | Sidebar link active colour                                                                                                                                                                                                                                    |
| `--nb-shell-inspector-width`           | `calc(var(--nb-base-unit) * 70)` (560px)                         | Inspector panel width. **Not settable at `:root`**: it is re-declared on the inspector element itself, once per `inspectorSize`, so an inherited value never reaches it. Width comes from `inspectorSize`, or from `resizable` with `v-model:inspector-width` |
| `--nb-shell-inspector-expanded-width`  | `50vw`                                                           | Inspector width when expanded                                                                                                                                                                                                                                 |
| `--nb-shell-inspector-max-width`       | `max(calc(var(--nb-base-unit) * 36), 50vw)`                      | Ceiling on a visible inspector's width, whatever set it. Never below the 288px resize floor, so the announced and rendered widths cannot disagree. Set `none` to opt out. `lg`, `xl` and `inspector-expanded` opt out already                                 |
| `--nb-shell-inspector-border`          | `1px solid var(--nb-c-border)`                                   | Inspector left border                                                                                                                                                                                                                                         |
| `--nb-shell-inspector-bg`              | `var(--nb-c-surface)`                                            | Inspector background                                                                                                                                                                                                                                          |
| `--nb-shell-inspector-resize-color`    | `var(--nb-c-primary)`                                            | The grab-line on the resize handle                                                                                                                                                                                                                            |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const showNotification = ref(true)
const inspectorOpen = ref(false)
const inspectorExpanded = ref(false)
const inspectorWidth = ref<number | null>(null)
const panelSize = ref('default')
const kitchenInspector = ref(true)
const kitchenPanelSize = ref('default')
</script>
