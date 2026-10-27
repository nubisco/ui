---
layout: nubisco
title: Blueprint Minimap
intro: '`NbBlueprintMinimap` is an optional overview for an [`NbBlueprint`](/components/blueprint/usage) canvas: it draws each card as a small rectangle plus a rectangle for the current viewport, and lets the user click or drag to recenter. It reads the camera through [`useBlueprint()`](/components/blueprint/code#the-useblueprint-composable) and takes the same `cards` array you pass to the blueprint (windowed API).'
source: src/components/BlueprintMinimap.vue
tab: code
pageTabs: ['usage', 'code']
---

## Props

| Prop        | Type                                                           | Default         | Description                                                            |
| ----------- | -------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------- |
| `cards`     | `IBlueprintCard[]`                                             | (required)      | The same cards passed to `NbBlueprint`; their geometry drives the map. |
| `position`  | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-left'` | Corner the minimap floats in.                                          |
| `width`     | `number`                                                       | `200`           | Minimap width in px.                                                   |
| `height`    | `number`                                                       | `140`           | Minimap height in px.                                                  |
| `pannable`  | `boolean`                                                      | `true`          | Click / drag on the minimap to recenter the viewport.                  |
| `nodeColor` | `string`                                                       | (card accent)   | Override the node color (any CSS color).                               |
