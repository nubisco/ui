---
layout: nubisco
title: Grid
tabs:
  [
    'Overview',
    'Columns',
    'Direction',
    'Gaps',
    'Alignment',
    'Wrap',
    'Order',
    'Visibility',
    'Api',
  ]
---

<doc-tab name="Overview">

`NbGrid` is a flexible layout primitive built on CSS flexbox. A `dir="row"` grid arranges children horizontally; a `dir="col"` grid arranges them vertically. Nest them freely to build any layout.

The grid is configured at compile time via `src/styles/variables/_grid.scss`.

## Breakpoints

| Name | Min-width |
| ---- | :-------: |
| s    |   320px   |
| m    |   672px   |
| l    |  1056px   |
| xl   |  1312px   |
| xxl  |  1584px   |

Most props (`dir`, `gap`, `grid`, `justify`, `align`, `wrap`, `visible`) accept either a scalar value or a breakpoint map for responsive control:

```vue
<nb-grid :dir="{ s: 'col', m: 'row' }" :gap="{ s: 'sm', m: 'lg' }">
  <nb-grid :grid="{ s: 16, m: 8 }">Left / top</nb-grid>
  <nb-grid :grid="{ s: 16, m: 8 }">Right / bottom</nb-grid>
</nb-grid>
```

## Visual demo

<preview style-grid>
  <div class="grid-demo-label">Grid structure</div>
  <div class="grid-demo-description">Column-spanning overview — each row uses the same 16-column total width.</div>
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
    <nb-grid dir="col" grid="1" class="grid-demo-item wireframe-row-1">16</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item wireframe-row-2">2</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="4" class="grid-demo-item wireframe-row-3">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item wireframe-row-3">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item wireframe-row-3">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item wireframe-row-3">4</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="8" class="grid-demo-item wireframe-row-4">8</nb-grid>
    <nb-grid dir="col" grid="8" class="grid-demo-item wireframe-row-4">8</nb-grid>
  </nb-grid>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="16" class="grid-demo-item wireframe-row-5">16 (full width)</nb-grid>
  </nb-grid>
</preview>

## Getting a ref

`NbGrid` exposes a `getRef()` method that returns the underlying DOM element.

```vue
<template>
  <nb-grid ref="myGrid"> content </nb-grid>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const myGrid = ref()
console.log(myGrid.value.getRef()) // → HTMLElement
</script>
```

</doc-tab>

<doc-tab name="Columns">

The `grid` prop sets how many of the 16 available columns a child item spans. The `shift` prop offsets it from the left edge.

## Column spanning

<preview style-grid>
  <div class="grid-demo-label">Column spanning</div>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="16" class="grid-demo-item span-8">16</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="2" class="grid-demo-item span-2">2</nb-grid>
    <nb-grid dir="col" grid="14" class="grid-demo-item span-6">14</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="4" class="grid-demo-item span-4">4</nb-grid>
    <nb-grid dir="col" grid="12" class="grid-demo-item span-4">12</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="6" class="grid-demo-item span-6">6</nb-grid>
    <nb-grid dir="col" grid="10" class="grid-demo-item span-2">10</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="8" class="grid-demo-item span-8">8</nb-grid>
    <nb-grid dir="col" grid="8" class="grid-demo-item span-8">8</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="4">4 cols</nb-grid>
    <nb-grid dir="col" grid="12">12 cols</nb-grid>
  </nb-grid>
</template>
```

## Responsive columns

Pass a breakpoint map to change column spans at different screen widths.

<preview style-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" :grid="{ s: 16, m: 8 }" class="grid-demo-item span-4">16 → 8</nb-grid>
    <nb-grid dir="col" :grid="{ s: 16, m: 8 }" class="grid-demo-item span-8">16 → 8</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col" :grid="{ s: 16, m: 8 }">Left</nb-grid>
    <nb-grid dir="col" :grid="{ s: 16, m: 8 }">Right</nb-grid>
  </nb-grid>
</template>
```

## Column shift (offset)

Use `shift` to push a column to the right by a number of column widths.

<preview style-grid>
  <nb-grid dir="col" gap="xs">
    <nb-grid justify="end" grid="4" shift="12" class="grid-demo-item span-4">shift 12</nb-grid>
    <nb-grid justify="end" grid="8" shift="8" class="grid-demo-item span-8">shift 8</nb-grid>
    <nb-grid justify="end" grid="12" shift="4" class="grid-demo-item span-4">shift 4</nb-grid>
    <nb-grid justify="end" grid="16" shift="0" class="grid-demo-item span-8">shift 0</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="col" grid="8" shift="4">centered-ish</nb-grid>
</template>
```

</doc-tab>

<doc-tab name="Direction">

The `dir` prop controls the main axis: `row` lays children side by side; `col` stacks them top to bottom.

## Basic direction

<preview style-grid>
  <div class="grid-demo-label">Row direction</div>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" class="grid-demo-item demo-small">First</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">Second</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">Third</nb-grid>
  </nb-grid>
  <div class="grid-demo-label" style="margin-top: 16px">Column direction</div>
  <nb-grid dir="col" gap="sm">
    <nb-grid dir="row" class="grid-demo-item demo-small">First</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">Second</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">Third</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <!-- Horizontal -->
  <nb-grid dir="row">
    <nb-grid dir="col">First</nb-grid>
    <nb-grid dir="col">Second</nb-grid>
  </nb-grid>
  <!-- Vertical -->
  <nb-grid dir="col">
    <nb-grid dir="row">First</nb-grid>
    <nb-grid dir="row">Second</nb-grid>
  </nb-grid>
</template>
```

## Responsive direction

<preview style-grid>
  <nb-grid :dir="{ s: 'col', m: 'row' }" gap="sm">
    <nb-grid :dir="{ s: 'row', m: 'col' }" class="grid-demo-item demo-small">First</nb-grid>
    <nb-grid :dir="{ s: 'row', m: 'col' }" class="grid-demo-item demo-small">Second</nb-grid>
    <nb-grid :dir="{ s: 'row', m: 'col' }" class="grid-demo-item demo-small">Third</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <!-- col on small, row on medium+ -->
  <nb-grid :dir="{ s: 'col', m: 'row' }">
    <nb-grid :dir="{ s: 'row', m: 'col' }">First</nb-grid>
    <nb-grid :dir="{ s: 'row', m: 'col' }">Second</nb-grid>
  </nb-grid>
</template>
```

</doc-tab>

<doc-tab name="Gaps">

The `gap` prop controls spacing between children using named size tokens.

## Gap scale

| Token | Value |
| ----- | ----- |
| `xxs` | 2px   |
| `xs`  | 4px   |
| `sm`  | 8px   |
| `md`  | 16px  |
| `lg`  | 24px  |
| `xl`  | 32px  |
| `xxl` | 48px  |

## Column gaps

<preview style-grid>
  <nb-grid dir="col" gap="xxs">
    <nb-grid dir="row" class="grid-demo-item demo-small">xxs (2px)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">xxs (2px)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="sm">
    <nb-grid dir="row" class="grid-demo-item demo-small">sm (8px)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">sm (8px)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="lg">
    <nb-grid dir="row" class="grid-demo-item demo-small">lg (24px)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">lg (24px)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="xxl">
    <nb-grid dir="row" class="grid-demo-item demo-small">xxl (48px)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">xxl (48px)</nb-grid>
  </nb-grid>
</preview>

## Row gaps

<preview style-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" class="grid-demo-item demo-small">sm</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">sm</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">sm</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="xl">
    <nb-grid dir="col" class="grid-demo-item demo-small">xl</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">xl</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">xl</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row" gap="md">
    <nb-grid dir="col">One</nb-grid>
    <nb-grid dir="col">Two</nb-grid>
  </nb-grid>
</template>
```

## Responsive gaps

<preview style-grid>
  <nb-grid dir="row" :gap="{ s: 'xs', m: 'xl' }">
    <nb-grid dir="col" grow class="grid-demo-item demo-small">xs → xl</nb-grid>
    <nb-grid dir="col" grow class="grid-demo-item demo-small">xs → xl</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row" :gap="{ s: 'xs', m: 'xl' }">
    <nb-grid dir="col" grow>One</nb-grid>
    <nb-grid dir="col" grow>Two</nb-grid>
  </nb-grid>
</template>
```

</doc-tab>

<doc-tab name="Alignment">

## Horizontal alignment (`justify`)

<preview style-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="start">
    <nb-grid dir="col" class="grid-demo-item demo-small">start</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="center">
    <nb-grid dir="col" class="grid-demo-item demo-small">center</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="end">
    <nb-grid dir="col" class="grid-demo-item demo-small">end</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="between">
    <nb-grid dir="col" class="grid-demo-item demo-small">between</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">between</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">between</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="around">
    <nb-grid dir="col" class="grid-demo-item demo-small">around</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">around</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">around</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="evenly">
    <nb-grid dir="col" class="grid-demo-item demo-small">evenly</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">evenly</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">evenly</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" distributed>
    <nb-grid dir="col" class="grid-demo-item demo-small">distributed</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">distributed</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">distributed</nb-grid>
  </nb-grid>
</preview>

::: tip
`justify="evenly"` sets equal **spacing** between items. `distributed` makes items **grow equally** to fill the available width. They solve different problems.
:::

```vue
<template>
  <nb-grid dir="row" justify="between">
    <nb-grid dir="col">Left</nb-grid>
    <nb-grid dir="col">Right</nb-grid>
  </nb-grid>
</template>
```

## Vertical alignment (`align`)

<preview style-grid>
  <nb-grid dir="row" align="start" style="height: 80px" class="grid-demo-row">
    <nb-grid dir="col" grow class="grid-demo-item demo-small">start</nb-grid>
  </nb-grid>
  <nb-grid dir="row" align="center" style="height: 80px" class="grid-demo-row">
    <nb-grid dir="col" grow class="grid-demo-item demo-small">center</nb-grid>
  </nb-grid>
  <nb-grid dir="row" align="end" style="height: 80px" class="grid-demo-row">
    <nb-grid dir="col" grow class="grid-demo-item demo-small">end</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row" align="center" style="height: 120px">
    <nb-grid dir="col" grow>Vertically centered</nb-grid>
  </nb-grid>
</template>
```

</doc-tab>

<doc-tab name="Wrap">

The `wrap` prop controls what happens when children overflow the container's inline axis.

<preview style-grid>
  <div class="grid-demo-label">nowrap — items overflow</div>
  <NbGrid is="ul" wrap="nowrap" gap="sm" style="list-style: none; padding: 0; margin-bottom: 16px;">
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">2</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">3</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">4</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">5</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">6</NbGrid>
  </NbGrid>
  <div class="grid-demo-label">wrap — items flow to next line</div>
  <NbGrid is="ul" wrap="wrap" gap="sm" style="list-style: none; padding: 0; margin-bottom: 16px;">
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">2</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">3</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">4</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">5</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">6</NbGrid>
  </NbGrid>
  <div class="grid-demo-label">reverse — wraps and reverses row order</div>
  <NbGrid is="ul" wrap="reverse" gap="sm" style="list-style: none; padding: 0;">
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">2</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">3</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">4</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">5</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">6</NbGrid>
  </NbGrid>
</preview>

```vue
<template>
  <NbGrid is="ul" wrap="wrap" gap="sm">
    <NbGrid is="li" dir="col">1</NbGrid>
    <NbGrid is="li" dir="col">2</NbGrid>
    <NbGrid is="li" dir="col">3</NbGrid>
  </NbGrid>
</template>
```

`wrap` also supports a breakpoint map:

```vue
<NbGrid :wrap="{ s: 'wrap', l: 'nowrap' }">...</NbGrid>
```

</doc-tab>

<doc-tab name="Order">

Use `first` and `last` boolean props to reorder items visually without changing DOM order. Use `reverse` to flip the entire row or column.

## First

<preview style-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" class="grid-demo-item demo-small">DOM first</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">DOM second</nb-grid>
    <nb-grid dir="col" first class="grid-demo-item demo-small order-first">DOM third — renders first</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col">DOM first</nb-grid>
    <nb-grid dir="col">DOM second</nb-grid>
    <nb-grid dir="col" first>DOM third — renders first</nb-grid>
  </nb-grid>
</template>
```

## Last

<preview style-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" class="grid-demo-item demo-small">DOM first</nb-grid>
    <nb-grid dir="col" last class="grid-demo-item demo-small order-last">DOM second — renders last</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">DOM third</nb-grid>
  </nb-grid>
</preview>

## Reverse

<preview style-grid>
  <nb-grid dir="row" reverse gap="sm">
    <nb-grid dir="col" class="grid-demo-item demo-small">First</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">Second</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">Third</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row" reverse>
    <nb-grid dir="col">First</nb-grid>
    <nb-grid dir="col">Second</nb-grid>
    <nb-grid dir="col">Third</nb-grid>
  </nb-grid>
</template>
```

`reverse` also accepts an array of breakpoint names to apply the reversal only at those sizes:

```vue
<nb-grid :dir="{ m: 'col' }" :reverse="['m']">...</nb-grid>
```

</doc-tab>

<doc-tab name="Visibility">

Use the `visible` prop to show or hide grid items. It accepts a boolean or a breakpoint map for responsive control.

## Hidden item

<preview style-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" :visible="false" class="grid-demo-item demo-small hidden">hidden</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">visible</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">visible</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col" :visible="false">Hidden</nb-grid>
    <nb-grid dir="col">Visible</nb-grid>
  </nb-grid>
</template>
```

## Responsive visibility

<preview style-grid>
  <div class="grid-demo-description">First item hidden on small, visible on large (resize the window).</div>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" :visible="{ s: false, l: true }" class="grid-demo-item demo-small">hidden on small</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">always visible</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row">
    <!-- Hidden on small, visible on large -->
    <nb-grid dir="col" :visible="{ s: false, l: true }">Sidebar</nb-grid>
    <nb-grid dir="col" grow>Main content</nb-grid>
  </nb-grid>
</template>
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop          | Type                                               | Default | Description                                               |
| ------------- | -------------------------------------------------- | ------- | --------------------------------------------------------- |
| `dir`         | `'row' \| 'col' \| ResponsiveMap`                  | -       | Main axis direction                                       |
| `gap`         | `GapToken \| ResponsiveMap`                        | -       | Gap between children                                      |
| `grid`        | `number \| ResponsiveMap`                          | -       | Number of columns to span (1–16)                          |
| `shift`       | `number`                                           | -       | Column offset from the left edge                          |
| `justify`     | `JustifyValue \| ResponsiveMap`                    | -       | Horizontal alignment of children                          |
| `align`       | `AlignValue \| ResponsiveMap`                      | -       | Vertical alignment of children                            |
| `distributed` | `boolean`                                          | `false` | Children grow equally to fill width                       |
| `wrap`        | `'wrap' \| 'nowrap' \| 'reverse' \| ResponsiveMap` | -       | Wrapping behaviour                                        |
| `grow`        | `boolean`                                          | `false` | Flex-grow: child expands to fill remaining space          |
| `visible`     | `boolean \| ResponsiveMap`                         | `true`  | Show or hide the element                                  |
| `first`       | `boolean`                                          | `false` | Render this item visually first in the flex order         |
| `last`        | `boolean`                                          | `false` | Render this item visually last in the flex order          |
| `reverse`     | `boolean \| string[]`                              | `false` | Reverse child order; array form per breakpoint            |
| `is`          | `string`                                           | `'div'` | HTML element tag to render (e.g. `'ul'`, `'li'`, `'nav'`) |
| `mode`        | `'wide' \| 'narrow' \| 'condensed'`                | -       | Predefined gap presets                                    |

## Gap tokens

`xxs` (2px) · `xs` (4px) · `sm` (8px) · `md` (16px) · `lg` (24px) · `xl` (32px) · `xxl` (48px)

## Justify values

`start` · `center` · `end` · `between` · `around` · `evenly`

## Align values

`start` · `center` · `end` · `stretch` · `baseline`

## Responsive maps

All responsive props accept an object keyed by breakpoint name:

```typescript
{ s?: T, m?: T, l?: T, xl?: T, xxl?: T }
```

## Exposed

```typescript
const gridRef = ref<InstanceType<typeof NbGrid>>()
gridRef.value?.getRef() // → underlying HTMLElement
```

</doc-tab>
