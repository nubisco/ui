---
layout: nubisco
title: Blueprint Controls
intro: '`NbBlueprintControls` is an optional, NubiscoUI-styled toolbar for an [`NbBlueprint`](/components/blueprint/usage) canvas: zoom, fit, center, auto-layout, and a contextual alignment cluster. It is wired entirely to the blueprint through [`useBlueprint()`](/components/blueprint/code#the-useblueprint-composable), so it needs no event plumbing from the host.'
source: src/components/BlueprintControls.vue
tab: usage
pageTabs: ['usage', 'code']
---

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
