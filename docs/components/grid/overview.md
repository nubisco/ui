---
layout: nubisco
title: Grid
tabs: ['Usage']
---

<doc-tab name="Usage">

Configured at compile time via the `src/styles/variables/_grid.scss` file.

### Breakpoints

The grid ships with five predefined breakpoints. All breakpoints are **mobile-first** (`min-width`): a rule set at `md` applies from 672 px upward and is inherited by `lg`, `xl`, and `xxl` unless overridden.

| Name  | Min-width |
| ----- | :-------: |
| `sm`  |   320px   |
| `md`  |   672px   |
| `lg`  |  1056px   |
| `xl`  |  1312px   |
| `xxl` |  1584px   |

::: tip
These breakpoint names are important because you use them as keys in responsive prop objects.
They can be overridden in `src/styles/variables/_breakpoints.scss` or by replacing the `$breakpoints` map.
:::

![An image](/media/breakpoints.svg){width=640px}

### Columns and Gap

Columns default to `16`. The gap system uses an 8px base unit with a named scale:

| Name  | Value |
| ----- | ----: |
| `xxs` |   2px |
| `xs`  |   4px |
| `sm`  |   8px |
| `md`  |  16px |
| `lg`  |  24px |
| `xl`  |  32px |
| `xxl` |  48px |

::: tip
Gap tokens are configured in `src/styles/variables/_grid.scss` via the `$gap-ratios` map.
:::

## Visual Demo

<preview style-grid>
  <div class="grid-demo-label">Grid Structure Demo</div>
  <div class="grid-demo-description">This demo shows how the grid system works with visual indicators for spacing, alignment, and column spanning.</div>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="1" class="grid-demo-item">1</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">3</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">5</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">6</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">7</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">8</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">9</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">10</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">11</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">12</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">13</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">14</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">15</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">16</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="8" class="grid-demo-item">8</nb-grid>
    <nb-grid dir="col" grid="8" class="grid-demo-item">8</nb-grid>
  </nb-grid>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="16" class="grid-demo-item">16</nb-grid>
  </nb-grid>
</preview>

### Refs

To get the underlying DOM element from a `nb-grid`, use the `getRef()` method it exposes — the component ref itself points to the Vue instance, not the element.

```vue
<template>
  <nb-grid ref="myComponent"> test </nb-grid>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const myComponent = ref()

console.log(myComponent.value) // [!code --]
console.log(myComponent.value.getRef()) // [!code ++]
</script>
```

</doc-tab>
