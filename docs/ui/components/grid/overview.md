---
layout: nubisco
title: Grid
tabs: ['Usage']
---

<doc-tab name="Usage">

Configured at compile time via the `src/styles/variables/_grid.scss` file.

### Breakpoints

This design system ships with **predefined** `$breakpoints` variable which you can override, prior to importing the `src/styles/grid/index.scss` file:

| Name | Value |
| ---- | :---: |
| s    |  320  |
| m    |  672  |
| l    | 1056  |
| xl   | 1312  |
| xxl  | 1584  |

::: tip
These breakpoint names are important, because you can use them to define rules **per breakpoint**.
They can be edited in the `src/styles/variables/_breakpoints.scss` file or by overriding the `$breakpoints` map.
:::

![An image](/media/breakpoints.svg){width=640px}

### Columns and Gap

Columns come **predefined** to `16`, but you may use any other number of columns that best suits your design.

The optional gap is set as an initial unit of `8`, and a **predefined** set of gap options is provided. These can also be defined for more or less granularity.

::: tip
This can be configured in the `src/styles/variables/_grid.scss` file or by overriding the `$gap-ratios` map.
:::

| Name | Rap ratio | Result |
| ---- | :-------: | -----: |
| xs   |    1/4    |    2px |
| sm   |    1/2    |    4px |
| md   |    1/1    |    8px |
| lg   |   1\*2    |   16px |
| xl   |   1\*4    |   32px |

## Visual Demo

The Grid component provides a flexible layout system. To better understand how it works, here's a visual demonstration showing the grid structure with exaggerated styling:

<preview style-grid>
  <div class="grid-demo-label">Grid Structure Demo</div>
  <div class="grid-demo-description">This demo shows how the grid system works with visual indicators for spacing, alignment, and column spanning.</div>
  <!-- Row 1: 15 small items -->
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">1</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">2</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">3</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">4</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">5</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">6</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">7</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">8</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">9</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">10</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">11</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">12</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">13</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">14</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">15</nb-grid>
  </nb-grid>
  <!-- Row 2: 8 medium items -->
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2 cols</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2 cols</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2 cols</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2 cols</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2 cols</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2 cols</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2 cols</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2 cols</nb-grid>
  </nb-grid>
  <!-- Row 3: 4 large items -->
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="4" class="grid-demo-item wireframe-row-3">4 cols</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item wireframe-row-3">4 cols</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item wireframe-row-3">4 cols</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item wireframe-row-3">4 cols</nb-grid>
  </nb-grid>
  <!-- Row 4: 2 extra large items -->
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="8" class="grid-demo-item wireframe-row-4">8 cols</nb-grid>
    <nb-grid dir="col" grid="8" class="grid-demo-item wireframe-row-4">8 cols</nb-grid>
  </nb-grid>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="16" class="grid-demo-item wireframe-row-5">16 cols (full width)</nb-grid>
  </nb-grid>
</preview>

### Refs

In order to get the ref from a `nb-grid` object, you must realize you are getting the reference to the parent `component` and not the actual object. So, we need to relly on a method exposed by the `grid` component which returns the actual `ref`.

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
