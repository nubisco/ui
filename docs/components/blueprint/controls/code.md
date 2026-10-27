---
layout: nubisco
title: Blueprint Controls
intro: '`NbBlueprintControls` is an optional, NubiscoUI-styled toolbar for an [`NbBlueprint`](/components/blueprint/usage) canvas: zoom, fit, center, auto-layout, and a contextual alignment cluster. It is wired entirely to the blueprint through [`useBlueprint()`](/components/blueprint/code#the-useblueprint-composable), so it needs no event plumbing from the host.'
source: src/components/BlueprintControls.vue
tab: code
pageTabs: ['usage', 'code']
---

## Props

| Prop          | Type                                                           | Default          | Description                                                                              |
| ------------- | -------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `position`    | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-right'` | Corner the toolbar floats in.                                                            |
| `orientation` | `'horizontal' \| 'vertical'`                                   | `'vertical'`     | Stack direction.                                                                         |
| `show`        | `'always' \| 'edit'`                                           | `'always'`       | Always visible, or only while the blueprint is in edit mode (`editable` / `isEditMode`). |
| `autoLayout`  | `boolean`                                                      | `true`           | Show the auto-layout button.                                                             |
| `alignment`   | `boolean`                                                      | `true`           | Show the alignment/distribution cluster (appears when 2+ cards are selected).            |

For full custom controls, build your own with [`useBlueprint()`](/components/blueprint/code#the-useblueprint-composable).
