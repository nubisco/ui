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

## A flat panel

`flat` keeps the border and the padding and paints nothing: the panel sits on
the plane around it. It does not deepen its contents either, so a panel inside
a flat panel paints the level a sibling of the flat one would.

<preview>
  <NbPanel>
    <NbLabel size="sm" muted>Panel, layer 1</NbLabel>
    <NbPanel flat style="margin-top: 8px;">
      <NbLabel size="sm" muted>Flat panel: no surface of its own</NbLabel>
      <NbPanel style="margin-top: 8px;">
        <NbLabel size="sm" muted>Panel inside it, layer 2, as if the flat one were not there</NbLabel>
      </NbPanel>
    </NbPanel>
  </NbPanel>
</preview>

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

| Slot      | Description                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `default` | Any content to render inside Panel                                                                     |
| `meta`    | Beside the title: a count, an `NbInfoHint`. Renders the header.                                        |
| `actions` | At the end of the header: the panel's one filled button, and quiet ones beside it. Renders the header. |

## Props

| Prop           | Type               | Default     | Description                                                                                                                |
| -------------- | ------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `layer`        | `0 \| 1 \| 2 \| 3` | `undefined` | Pins the panel to an absolute layer. Leave unset to derive the level from nesting.                                         |
| `title`        | `string`           | `undefined` | The panel's title, in a header at `heading-01`. Unset (with no description, meta or actions), the panel renders no header. |
| `description`  | `string`           | `undefined` | One line of support under the title, `body-sm` muted.                                                                      |
| `headingLevel` | `'h1'` to `'h6'`   | `'h2'`      | The element the title renders as. Match the page outline.                                                                  |
| `flat`         | `boolean`          | `false`     | Keep the border and padding, paint no surface, and do not deepen the contents.                                             |

Beyond the layer it paints, `NbPanel` is a layout container. Use CSS custom properties or inline styles to customize appearance.
