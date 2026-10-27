---
layout: nubisco
title: Blueprint Minimap
intro: '`NbBlueprintMinimap` is an optional overview for an [`NbBlueprint`](/components/blueprint/usage) canvas: it draws each card as a small rectangle plus a rectangle for the current viewport, and lets the user click or drag to recenter. It reads the camera through [`useBlueprint()`](/components/blueprint/code#the-useblueprint-composable) and takes the same `cards` array you pass to the blueprint (windowed API).'
source: src/components/BlueprintMinimap.vue
tab: usage
pageTabs: ['usage', 'code']
---

Place it in the blueprint's `#chrome` slot:

```vue
<template>
  <NbBlueprint :cards="cards" :connections="connections">
    <template #card="{ card }">
      <NbBlueprintCard v-bind="card" />
    </template>

    <template #chrome>
      <NbBlueprintMinimap :cards="cards" position="bottom-left" />
    </template>
  </NbBlueprint>
</template>
```

The minimap fits the union of all cards and the current viewport, so the viewport indicator stays in frame even when you pan into empty space. Node color defaults to each card's accent (`paint.color` or a top-level `color`); override it with the `nodeColor` prop.
