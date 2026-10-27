---
layout: nubisco
title: Blueprint Background
intro: '`NbBlueprintBackground` is an optional, drop-in backdrop for an [`NbBlueprint`](/components/blueprint/usage) canvas: a `grid`, `dots`, or `lines` pattern with full control over colour, spacing, and thickness. It reads the camera from [`useBlueprint()`](/components/blueprint/code#the-useblueprint-composable) and pans/zooms with the scene, so it needs no wiring from the host.'
source: src/components/BlueprintBackground.vue
tab: code
pageTabs: ['usage', 'code']
---

## Props

| Prop             | Type                                    | Default             | Description                                                                                         |
| ---------------- | --------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `variant`        | `'grid' \| 'dots' \| 'lines' \| 'none'` | `'dots'`            | Pattern to paint. `'grid'` adds heavier major lines; `'none'` renders nothing.                      |
| `color`          | `string`                                | theme border colour | Line/dot colour (any CSS colour). Falls back to `--nb-blueprint-grid-color`, then the theme border. |
| `gap`            | `number`                                | `24`                | Cell spacing in canvas px (the minor grid pitch).                                                   |
| `thickness`      | `number`                                | `1`                 | Line/dot thickness in px.                                                                           |
| `secondaryColor` | `string`                                | `color`             | Colour of the major lines in the `grid` variant.                                                    |
| `secondaryGap`   | `number`                                | `gap * 5`           | Spacing of the major lines in the `grid` variant, canvas px.                                        |
