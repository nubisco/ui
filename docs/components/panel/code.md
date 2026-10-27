---
layout: nubisco
title: Panel
intro: '`NbPanel` is a surface container that groups related content inside a styled card. It provides a consistent background, border, and spacing out of the box.'
source: src/components/Panel.vue
tab: code
pageTabs: ['usage', 'code']
---

## Depth is derived from nesting

A panel inside a panel paints one layer deeper on its own. Nothing names a
depth, and the count is clamped at layer 3.

<preview>
  <NbPanel>
    <NbLabel size="sm" muted>Panel, layer 1</NbLabel>
    <NbPanel style="margin-top: 8px;">
      <NbLabel size="sm" muted>Panel in a panel, layer 2</NbLabel>
      <NbPanel style="margin-top: 8px;">
        <NbLabel size="sm" muted>Panel in a panel in a panel, layer 3</NbLabel>
      </NbPanel>
    </NbPanel>
  </NbPanel>
</preview>

Use the `layer` prop, or a `.nb-layer-{0-3}` class, only to pin or reset a
level. See [Theming, Layers](/theming) for when that is worth doing.

```vue
<NbPanel :layer="0" />
```

## As a footer action bar

Panels are commonly used as a container for modal or form action buttons, keeping them visually separated from the main content.

<preview dir="row">
  <NbPanel>
    <NbGrid dir="row" gap="sm" justify="end">
      <NbButton variant="ghost">Cancel</NbButton>
      <NbButton variant="primary">Save</NbButton>
    </NbGrid>
  </NbPanel>
</preview>

```vue
<template>
  <NbPanel>
    <NbGrid dir="row" gap="sm" justify="end">
      <NbButton variant="ghost">Cancel</NbButton>
      <NbButton variant="primary">Save</NbButton>
    </NbGrid>
  </NbPanel>
</template>
```

## Slots

| Slot      | Description                        |
| --------- | ---------------------------------- |
| `default` | Any content to render inside Panel |

## Props

| Prop    | Type               | Default     | Description                                                                        |
| ------- | ------------------ | ----------- | ---------------------------------------------------------------------------------- |
| `layer` | `0 \| 1 \| 2 \| 3` | `undefined` | Pins the panel to an absolute layer. Leave unset to derive the level from nesting. |

Beyond the layer it paints, `NbPanel` is a layout container. Use CSS custom properties or inline styles to customize appearance.
