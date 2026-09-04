---
layout: nubisco
title: Shell Panel
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbShellPanel` is a self-contained, collapsible panel that negotiates space with its siblings via flexbox. Each panel renders with its own border, background, and a small gap around it, so that stacked panels look visually detached from one another and from their container (similar to panels in Unity or Unreal Engine).

Panels are layer-aware. They paint `--nb-c-surface` and `--nb-c-border`, and they derive their depth from nesting: a panel in a shell's main region takes layer 1, because that region is the page ground, and a panel inside another surface goes one deeper again, clamped at layer 3. Placing them inside a `.nb-layer-{0-3}` container still pins the whole subtree to that layer and restarts the count from there.

## Basic usage

A single panel in a flex container grows to fill whatever space is available.

<preview>
  <div class="nb-layer-0" style="height: 300px; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
    <NbShellPanel v-model:size="basicSize" title="Output">
      <div style="padding: 0.75rem 1rem; font-family: var(--nb-font-mono, monospace); font-size: 0.8125rem; color: var(--nb-c-text-secondary, #666);">
        <div>Build succeeded in 2.3s</div>
        <div>42 modules compiled</div>
      </div>
    </NbShellPanel>
  </div>
</preview>

```vue
<template>
  <NbShellPanel v-model:size="size" title="Output">
    <pre>{{ buildLog }}</pre>
  </NbShellPanel>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TShellPanelSize } from '@nubisco/ui'
const size = ref<TShellPanelSize>('default')
</script>
```

## Stacking panels

When you stack multiple panels in the same flex container, they share space equally in `default` mode. Click the maximize button on one panel and watch the other collapse to its header. Click the default button on either panel and both restore to equal sharing.

<preview>
  <div class="nb-layer-0" style="height: 400px; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
    <NbShellPanel v-model:size="stackASize" title="Console">
      <div style="padding: 0.75rem 1rem; font-family: var(--nb-font-mono, monospace); font-size: 0.8125rem; color: var(--nb-c-text-secondary, #666);">
        <div>> ready in 127ms</div>
        <div>> watching for file changes...</div>
      </div>
    </NbShellPanel>
    <NbShellPanel v-model:size="stackBSize" title="Problems">
      <div style="padding: 0.75rem 1rem; font-family: var(--nb-font-mono, monospace); font-size: 0.8125rem; color: var(--nb-c-text-secondary, #666);">
        <div>src/App.vue:12 - warning: unused variable 'count'</div>
        <div>src/utils.ts:44 - error: missing return type</div>
      </div>
    </NbShellPanel>
  </div>
</preview>

```vue
<template>
  <div style="display: flex; flex-direction: column; height: 100%;">
    <NbShellPanel v-model:size="consoleSize" title="Console">
      <pre>{{ logs }}</pre>
    </NbShellPanel>
    <NbShellPanel v-model:size="problemsSize" title="Problems">
      <DiagnosticList :items="problems" />
    </NbShellPanel>
  </div>
</template>
```

## Toolbar slot

Use the `#toolbar` slot to add actions to the center of the panel header.

<preview>
  <div class="nb-layer-0" style="height: 240px; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
    <NbShellPanel v-model:size="toolbarSize" title="Terminal">
      <template #toolbar>
        <NbButton size="xxs" variant="ghost">Clear</NbButton>
        <NbButton size="xxs" variant="ghost" icon="plus" />
      </template>
      <div style="padding: 0.75rem 1rem; font-family: var(--nb-font-mono, monospace); font-size: 0.8125rem; color: var(--nb-c-text-secondary, #666);">
        <div>$ npm run build</div>
        <div>Done in 1.8s</div>
      </div>
    </NbShellPanel>
  </div>
</preview>

```vue
<NbShellPanel v-model:size="size" title="Terminal">
  <template #toolbar>
    <NbButton size="xxs" variant="ghost" @click="clear">Clear</NbButton>
    <NbButton size="xxs" variant="ghost" icon="plus" @click="newTab" />
  </template>
  <pre>{{ output }}</pre>
</NbShellPanel>
```

## Custom controls

Override the default size buttons by using the `#controls` slot. This lets you provide your own resize logic or entirely different header actions.

```vue
<NbShellPanel title="Preview">
  <template #controls>
    <NbButton size="xxs" variant="ghost" icon="close" @click="hide" />
  </template>
  <iframe src="/preview" />
</NbShellPanel>
```

## Layer integration

Panels use `--nb-c-surface` and `--nb-c-border` for their background and border, resolved from the layer they derive. Pinning the container to a layer overrides that derivation and the panels contrast against it.

<preview>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; height: 300px;">
    <div class="nb-layer-0" style="border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
      <NbShellPanel title="Layer 0 context" size="default">
        <div style="padding: 0.5rem; font-size: 0.75rem; color: var(--nb-c-text-secondary);">Panel on layer 0</div>
      </NbShellPanel>
    </div>
    <div class="nb-layer-2" style="border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
      <NbShellPanel title="Layer 2 context" size="default">
        <div style="padding: 0.5rem; font-size: 0.75rem; color: var(--nb-c-text-secondary);">Panel on layer 2</div>
      </NbShellPanel>
    </div>
  </div>
</preview>

```vue
<!-- Panels adapt to the layer they sit in -->
<div class="nb-layer-0">
  <NbShellPanel title="Console"> ... </NbShellPanel>
</div>

<div class="nb-layer-2">
  <NbShellPanel title="Properties"> ... </NbShellPanel>
</div>
```

## IDE-like layout with NbShell

Panels can be placed in any region of `NbShell`. Stack them in the main area, the inspector, the bottom slot, or any combination. The panels negotiate space independently within each flex container, and the gaps between them provide the visual separation that makes complex layouts readable.

<preview>
  <div style="height: 480px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden;">
    <NbShell :inspector-visible="true" inspector-size="sm" :main-padding="false" style="height: 100%">
      <template #sidebar-logo>
        <div style="width: 28px; height: 28px; background: #a78bfa; border-radius: 6px;" />
      </template>
      <template #sidebar-nav>
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.12); border-radius: 8px;" />
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.12); border-radius: 8px;" />
      </template>
      <template #topbar-left>
        <strong>Editor</strong>
      </template>
      <!-- Main content: viewport + bottom panel stacked -->
      <div style="display: flex; flex-direction: column; height: 100%;">
        <div style="flex: 1; padding: 1rem; color: var(--nb-c-text-secondary, #666); min-height: 0;">Viewport</div>
        <NbShellPanel v-model:size="ideBottomSize" title="Console">
          <div style="padding: 0.5rem 1rem; font-family: monospace; font-size: 0.75rem; color: var(--nb-c-text-secondary);">
            <div>> Build complete in 2.1s</div>
          </div>
        </NbShellPanel>
      </div>
      <!-- Inspector: two stacked panels -->
      <template #inspector>
        <div style="display: flex; flex-direction: column; height: 100%;">
          <NbShellPanel v-model:size="idePropsSize" title="Properties">
            <div style="padding: 0.5rem; font-size: 0.75rem; color: var(--nb-c-text-secondary);">
              <div>Position: 0, 0, 0</div>
              <div>Rotation: 0, 0, 0</div>
              <div>Scale: 1, 1, 1</div>
            </div>
          </NbShellPanel>
          <NbShellPanel v-model:size="ideDetailsSize" title="Materials">
            <div style="padding: 0.5rem; font-size: 0.75rem; color: var(--nb-c-text-secondary);">
              <div>Shader: PBR Standard</div>
              <div>Albedo: #ffffff</div>
              <div>Roughness: 0.5</div>
            </div>
          </NbShellPanel>
        </div>
      </template>
    </NbShell>
  </div>
</preview>

```vue
<template>
  <NbShell :inspector-visible="true" inspector-size="sm" :main-padding="false">
    <template #sidebar-logo> ... </template>
    <template #sidebar-nav> ... </template>
    <template #topbar-left> <strong>Editor</strong> </template>

    <!-- Main area: viewport + console stacked vertically -->
    <div style="display: flex; flex-direction: column; height: 100%;">
      <Viewport style="flex: 1;" />
      <NbShellPanel v-model:size="consoleSize" title="Console">
        <pre>{{ logs }}</pre>
      </NbShellPanel>
    </div>

    <!-- Inspector: two panels sharing space -->
    <template #inspector>
      <div style="display: flex; flex-direction: column; height: 100%;">
        <NbShellPanel v-model:size="propsSize" title="Properties">
          <PropertyEditor :node="selected" />
        </NbShellPanel>
        <NbShellPanel v-model:size="matsSize" title="Materials">
          <MaterialEditor :node="selected" />
        </NbShellPanel>
      </div>
    </template>
  </NbShell>
</template>
```

## Using inside NbShell's bottom slot

`NbShellPanel` works inside the `#bottom` slot of `NbShell`. When a panel reaches `full` size there, the shell's CSS hides the main content area and lets the panel fill the body.

```vue
<template>
  <NbShell>
    <template #topbar-left> <strong>Editor</strong> </template>
    <p>Main content.</p>
    <template #bottom>
      <NbShellPanel v-model:size="panelSize" title="Terminal">
        <pre>{{ output }}</pre>
      </NbShellPanel>
    </template>
  </NbShell>
</template>
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop    | Type                                 | Default     | Description                                                                                                                                                                                                                                                    |
| ------- | ------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size`  | `'collapsed' \| 'default' \| 'full'` | `'default'` | Current panel size. Supports `v-model:size`.                                                                                                                                                                                                                   |
| `title` | `string`                             | `''`        | Label shown in the header.                                                                                                                                                                                                                                     |
| `fluid` | `boolean`                            | `false`     | When true, a `default`-sized panel sizes to its content (`flex: 0 0 auto`) instead of sharing column space equally with siblings (`flex: 1 1 0%`). Right for inspectors with several unrelated sections. See [Fluid sizing](#fluid-sizing).                    |
| `fill`  | `boolean`                            | `false`     | Claim the parent's height and scroll internally: the header stays pinned and the content region gets the scrollbar. Same name and semantics as `fill` on `NbDataTable`. Wins over `fluid`; ignored while `collapsed`. See [Fill and scroll](#fill-and-scroll). |

## Events

| Event         | Payload           | Description                                 |
| ------------- | ----------------- | ------------------------------------------- |
| `update:size` | `TShellPanelSize` | Emitted when the user clicks a size button. |

## Slots

| Slot       | Description                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------- |
| `default`  | Panel body. Hidden while `size === 'collapsed'` (only the header remains visible).              |
| `title`    | Custom title content. Replaces the plain text rendered by the `title` prop when both are given. |
| `toolbar`  | Center slot for actions like filter toggles or clear buttons.                                   |
| `controls` | Right slot for size buttons. Overrides the default minimize/default/maximize controls.          |

## Sizes

| Size        | Behavior                               | Notes                                                                                                                                                     |
| ----------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collapsed` | Header only, does not grow             | Content is unmounted, cheap to toggle frequently.                                                                                                         |
| `default`   | Sizing follows the `fluid` prop        | `fluid: false` (default) → `flex: 1 1 0%` (equal share with siblings). `fluid: true` → `flex: 0 0 auto` (content-fit). See [Fluid sizing](#fluid-sizing). |
| `full`      | `flex: 1`, siblings collapse to header | Sibling coordination is automatic via CSS `:has()`. `fluid` is ignored: `full` always fills.                                                              |

## Fluid sizing

`flex: 1 1 0%` (the back-compat default for `default`-size panels) makes every default panel take an equal slice of the column, no matter what's inside. That's right for tooling pages where every section roughly matches the others in length, but wrong for inspectors that mix short and long sections: a panel with two rows ends up the same height as a panel with twenty, and the long one then needs its own internal scrollbar inside its undersized share.

Set `fluid` on each panel where you want content-driven height. The panel then uses `flex: 0 0 auto`, taking only the height its content needs. The parent column should scroll when the total exceeds the available space.

```vue
<NbShellPanel title="Properties" fluid>
  <!-- two rows of inputs, short panel, doesn't waste vertical space -->
</NbShellPanel>
<NbShellPanel title="Bindings" fluid>
  <!-- long list, grows as needed, the inspector column scrolls -->
</NbShellPanel>
```

`fluid` only changes how `default` is sized. `collapsed` is always header-only; `full` always fills (and a single `full` panel still collapses its `fluid` siblings to header-only via the `:has()` rule).

## Fill and scroll

`size` decides how a panel shares a column with its siblings. `fill` decides something else: whether the panel claims the height its parent has, and puts the scrollbar inside itself rather than on the page.

The gap between those two is the one two of our applications kept closing by hand. Both re-declared the same pair of lines on `.nb-shell-panel` across six different stylesheets, because `default` only shares a column, `fluid` only shrinks to content, and neither of them says "take what is left, and scroll".

```vue
<template>
  <NbShell :main-padding="false">
    <NbShellPanel title="Events" fill>
      <NbDataTable :columns="columns" :rows="rows" row-key="id" fill />
    </NbShellPanel>
  </NbShell>
</template>
```

The prop is called `fill` because [`NbDataTable`](/ui/components/data-table#fill) already calls it that and means the same thing by it: become a flex item that fills its parent, keep the fixed furniture pinned, and give the scrollbar to the content region. The two compose exactly as you would hope. The panel takes the shell's height, the table takes the panel's, and one scrollbar appears, on the table body, under a header that stays put.

### It claims a height, it cannot create one

Same caveat as the table. `fill` only bites when an ancestor bounds the height, which in practice means a flex column with `min-height: 0` somewhere up the chain. Without one, the parent grows to fit the content and the page scrolls instead of the panel.

Inside `NbShell` you already have that: the `bottom` region and the inspector column are both bounded flex columns. Elsewhere, bound it yourself:

```vue
<template>
  <!-- The bounded column. Without min-height: 0 nothing below this scrolls. -->
  <div class="page">
    <NbShellPanel title="Log" fill>
      <pre>{{ lines.join('\n') }}</pre>
    </NbShellPanel>
  </div>
</template>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
</style>
```

### How it interacts with the other sizing props

- `fill` wins over `fluid` when both are set. `fluid` asks to shrink to content, `fill` asks to take the space: a panel told to do both is being told the second thing.
- `fill` has no effect on `size="collapsed"`. A collapsed panel is header-only by definition, and a collapsed panel that filled its parent would be a very tall header.
- A `full` sibling still collapses a `fill` panel to header-only, exactly as it does to every other panel. Maximizing one panel is a decision about the whole group.

## Accessibility

The default size controls are three toggle buttons, and the panel treats them as one control:

- `type="button"` on all three. The documented use for a panel is an inspector section, which is very often a form, and an untyped `<button>` in a form is a submit button. Clicking Minimize should not save the record.
- `aria-pressed` reflects the active size, so a screen reader announces which of the three is currently on rather than three identical unlabelled toggles.
- Each carries an `aria-label` (`Minimize`, `Default`, `Maximize`) and its glyph is `aria-hidden`, so the SVG contributes nothing to the accessible name.
- They sit in a `role="group"` named after the panel (`"Console panel size"` for `title="Console"`, `"Panel size"` with no title), so the three read as one set of related controls.

Replacing the `controls` slot replaces all of it. If you put your own buttons there, they are yours to type, name and label.

The collapsed-header dim and the size buttons' hover tint are transitions, and both are removed under `prefers-reduced-motion: reduce`. The panel still reaches the same states, instantly.

The panel does not render a heading element for `title`: it is an 11px chrome label, not a document heading, and turning it into an `<h2>` would put a heading into every inspector column. If a panel's content is a section of the page, put the heading in the content.

## Visual design

Each panel renders with:

- A `1px` border from `--nb-shell-panel-border` (`--nb-c-border`, layer-aware)
- A `1px` gap (margin) around itself, creating visual separation from siblings and edges
- A `2px` border-radius for subtle rounding
- Background from `--nb-shell-panel-bg` (`--nb-c-surface`, layer-aware)

This means panels adapt automatically to the layer context they sit in. No extra classes needed.

## CSS Custom Properties

| Variable                         | Default                        | Description                                           |
| -------------------------------- | ------------------------------ | ----------------------------------------------------- |
| `--nb-shell-panel-header-height` | `28px`                         | Header bar height                                     |
| `--nb-shell-panel-gap`           | `1px`                          | Gap (margin) around each panel for visual separation  |
| `--nb-shell-panel-bg`            | `var(--nb-c-surface)`          | Panel background                                      |
| `--nb-shell-panel-border`        | `1px solid var(--nb-c-border)` | Panel border, as a full `border` shorthand            |
| `--nb-shell-panel-header-bg`     | `transparent`                  | Header background. Set it to tint the header bar      |
| `--nb-shell-panel-header-border` | `1px solid var(--nb-c-border)` | Border under the header, as a full `border` shorthand |

Declared at `:root`, so an application overrides them there rather than competing with the component's scoped styles. The defaults resolve to semantic tokens, which means they follow the `.dark` theme on their own; a literal colour opts out of that and owes both themes a value.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const basicSize = ref('default')
const stackASize = ref('default')
const stackBSize = ref('default')
const toolbarSize = ref('default')
const ideBottomSize = ref('default')
const idePropsSize = ref('default')
const ideDetailsSize = ref('default')
</script>
