---
layout: nubisco
title: Sidebar Header Toggle
intro: "`NbSidebarHeaderToggle` collapses and expands the rail from the top of the sidebar, beside the brand, instead of from a row at the bottom. It goes in `NbShell`'s `sidebar-header-action` slot, which is opt-in: a shell that leaves the slot empty renders exactly as it did before, so [NbSidebarCollapseToggle](/components/sidebar-collapse-toggle/usage) in `#sidebar-bottom` stays the default."
source: src/components/SidebarHeaderToggle.vue
tab: usage
pageTabs: ['usage', 'code']
---

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

Below `collapseAt` the rail becomes a drawer opened from the topbar's nav button, and the header action is not rendered at all. The nav button is already the control there, and a drawer has no compact form to collapse into. The drawer also always shows labels: someone who collapsed the rail on a desktop gets the full menu on their phone, while their saved choice is left alone for the next desktop visit.

<!--@include: ./_shared.md-->
