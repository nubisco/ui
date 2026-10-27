---
layout: nubisco
title: Blueprint Background
intro: '`NbBlueprintBackground` is an optional, drop-in backdrop for an [`NbBlueprint`](/components/blueprint/usage) canvas: a `grid`, `dots`, or `lines` pattern with full control over colour, spacing, and thickness. It reads the camera from [`useBlueprint()`](/components/blueprint/code#the-useblueprint-composable) and pans/zooms with the scene, so it needs no wiring from the host.'
source: src/components/BlueprintBackground.vue
tab: usage
pageTabs: ['usage', 'code']
---

Most graphs want nothing more than the built-in `background` prop (`'grid' | 'dots' | 'lines' | 'none'`), which is the cheapest option: the DOM renderer draws a CSS pattern and the PixiJS renderer a GPU-tiled texture. Reach for `NbBlueprintBackground` when you need per-instance styling or a custom backdrop.

Place it in the blueprint's `#background` slot (it renders behind the scene). Using the slot replaces the built-in `background` pattern, so nothing double-paints:

```vue
<template>
  <NbBlueprint :cards="cards" :connections="connections">
    <template #card="{ card }">
      <NbBlueprintCard v-bind="card" />
    </template>

    <template #background>
      <NbBlueprintBackground variant="grid" />
    </template>
  </NbBlueprint>
</template>
```

Tune the look per instance:

```vue
<template #background>
  <NbBlueprintBackground
    variant="grid"
    color="rgba(255, 255, 255, 0.06)"
    :gap="32"
    :thickness="1"
    secondary-color="rgba(255, 255, 255, 0.12)"
    :secondary-gap="160"
  />
</template>
```

The `#background` slot is not limited to this component — drop any element in (a gradient, an SVG, an image) and it becomes the camera-independent or camera-aware backdrop you build.

## When to use the prop vs. the component

- **`background` prop** — the default and the most efficient. Perfect for the standard `grid`/`dots`/`lines` look, themeable app-wide via `--nb-blueprint-grid-color` / `--nb-blueprint-grid-gap`.
- **`NbBlueprintBackground` in `#background`** — per-instance colour/gap/thickness, a distinct secondary grid, or a bespoke backdrop. Rendered as a lightweight DOM/CSS layer over either renderer.
