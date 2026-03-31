# Grid

## Overview

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
