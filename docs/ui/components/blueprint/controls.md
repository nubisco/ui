---
layout: nubisco
title: Blueprint Controls
---

# Blueprint Controls

`NbBlueprintControls` is an optional, NubiscoUI-styled toolbar for an [`NbBlueprint`](/ui/components/blueprint/overview) canvas: zoom, fit, center, auto-layout, and a contextual alignment cluster. It is wired entirely to the blueprint through [`useBlueprint()`](/ui/components/blueprint/overview#the-useblueprint-composable), so it needs no event plumbing from the host.

Place it in the blueprint's `#chrome` slot (it renders in viewport space, in both the windowed and legacy APIs):

```vue
<template>
  <NbBlueprint :cards="cards" :connections="connections" editable>
    <template #card="{ card }">
      <NbBlueprintCard v-bind="card" />
    </template>

    <template #chrome>
      <NbBlueprintControls position="bottom-right" />
    </template>
  </NbBlueprint>
</template>
```

The alignment and distribution buttons appear only when two or more cards are selected (they act on the selection). Set `show="edit"` to reveal the whole toolbar only while the blueprint is in edit mode (the `editable` prop):

```vue
<NbBlueprintControls
  show="edit"
  position="top-right"
  orientation="horizontal"
/>
```

## Props

| Prop          | Type                                                           | Default          | Description                                                                              |
| ------------- | -------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `position`    | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-right'` | Corner the toolbar floats in.                                                            |
| `orientation` | `'horizontal' \| 'vertical'`                                   | `'vertical'`     | Stack direction.                                                                         |
| `show`        | `'always' \| 'edit'`                                           | `'always'`       | Always visible, or only while the blueprint is in edit mode (`editable` / `isEditMode`). |
| `autoLayout`  | `boolean`                                                      | `true`           | Show the auto-layout button.                                                             |
| `alignment`   | `boolean`                                                      | `true`           | Show the alignment/distribution cluster (appears when 2+ cards are selected).            |

For full custom controls, build your own with [`useBlueprint()`](/ui/components/blueprint/overview#the-useblueprint-composable).
