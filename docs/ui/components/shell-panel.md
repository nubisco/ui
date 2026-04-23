---
layout: nubisco
title: Shell Panel
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbShellPanel` is a self-contained, collapsible panel that negotiates space with its siblings via flexbox. Each panel renders with its own border, background, and a small gap around it, so that stacked panels look visually detached from one another and from their container (similar to panels in Unity or Unreal Engine).

Panels are layer-aware. They use `--nb-c-surface` and `--nb-c-border`, so they automatically adapt to whatever layer context they sit in. Place panels inside a `.nb-layer-0` container and they pick up the corresponding surface. Nest them deeper and they contrast accordingly.

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

Panels use `--nb-c-surface` and `--nb-c-border` for their background and border. This means they respond to the layer system automatically. Place the panel container on a deeper layer and the panels contrast against it.

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

| Prop    | Type                                 | Default     | Description                                  |
| ------- | ------------------------------------ | ----------- | -------------------------------------------- |
| `size`  | `'collapsed' \| 'default' \| 'full'` | `'default'` | Current panel size. Supports `v-model:size`. |
| `title` | `string`                             | `''`        | Label shown in the header.                   |

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

| Size        | Behavior                               | Notes                                                               |
| ----------- | -------------------------------------- | ------------------------------------------------------------------- |
| `collapsed` | Header only, does not grow             | Content is unmounted, cheap to toggle frequently.                   |
| `default`   | `flex: 1`, shares space with siblings  | Two panels in default mode each take half. Three take a third. Etc. |
| `full`      | `flex: 1`, siblings collapse to header | Sibling coordination is automatic via CSS `:has()`.                 |

## Visual design

Each panel renders with:

- A `1px` border using `--nb-c-border` (layer-aware)
- A `1px` gap (margin) around itself, creating visual separation from siblings and edges
- A `2px` border-radius for subtle rounding
- Background from `--nb-c-surface` (layer-aware)

This means panels adapt automatically to the layer context they sit in. No extra classes needed.

## CSS Custom Properties

| Variable                         | Default | Description                                          |
| -------------------------------- | ------- | ---------------------------------------------------- |
| `--nb-shell-panel-header-height` | `28px`  | Header bar height                                    |
| `--nb-shell-panel-gap`           | `1px`   | Gap (margin) around each panel for visual separation |

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
