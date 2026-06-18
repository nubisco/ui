---
layout: nubisco
title: Blueprint Minimap
---

# Blueprint Minimap

`NbBlueprintMinimap` is an optional overview for an [`NbBlueprint`](/ui/components/blueprint/overview) canvas: it draws each card as a small rectangle plus a rectangle for the current viewport, and lets the user click or drag to recenter. It reads the camera through [`useBlueprint()`](/ui/components/blueprint/overview#the-useblueprint-composable) and takes the same `cards` array you pass to the blueprint (windowed API).

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

## Props

| Prop        | Type                                                           | Default         | Description                                                            |
| ----------- | -------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------- |
| `cards`     | `IBlueprintCard[]`                                             | (required)      | The same cards passed to `NbBlueprint`; their geometry drives the map. |
| `position`  | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-left'` | Corner the minimap floats in.                                          |
| `width`     | `number`                                                       | `200`           | Minimap width in px.                                                   |
| `height`    | `number`                                                       | `140`           | Minimap height in px.                                                  |
| `pannable`  | `boolean`                                                      | `true`          | Click / drag on the minimap to recenter the viewport.                  |
| `nodeColor` | `string`                                                       | (card accent)   | Override the node color (any CSS color).                               |
