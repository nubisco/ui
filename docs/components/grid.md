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

All breakpoints are **mobile-first** (`min-width`). Base styles apply at all viewport sizes. A rule defined at `md` kicks in from 672px upward and stays active unless a wider breakpoint overrides it.

| Name  | Min-width |
| ----- | :-------: |
| `sm`  |   320px   |
| `md`  |   672px   |
| `lg`  |  1056px   |
| `xl`  |  1312px   |
| `xxl` |  1584px   |

### How responsive props work

Most layout props (`dir`, `gap`, `grid`, `justify`, `align`, `wrap`, `visible`) accept three input forms:

**1. Scalar** — applies at all viewport sizes:

```vue
<nb-grid dir="col">...</nb-grid>
```

**2. Breakpoint map** — different values per breakpoint. Rules cascade upward; only the breakpoints you define are set:

```vue
<!-- col until 672px, then row -->
<nb-grid :dir="{ sm: 'col', md: 'row' }">...</nb-grid>
```

**3. Function** — called reactively at render time. Any reactive state accessed inside is tracked automatically:

```vue
<script setup lang="ts">
import { ref } from 'vue'
const isExpanded = ref(false)
</script>

<template>
  <nb-grid :dir="() => (isExpanded ? 'col' : 'row')">...</nb-grid>
</template>
```

::: tip
The function form is for dynamic logic that does not map cleanly to breakpoints — for example, toggling layout based on component state. For viewport-driven changes, use the breakpoint map.
:::

### Props that accept responsive forms

| Prop      | Scalar | Breakpoint map | Function |
| --------- | :----: | :------------: | :------: |
| `dir`     |   ✓    |       ✓        |    ✓     |
| `gap`     |   ✓    |       ✓        |    ✓     |
| `grid`    |   ✓    |       ✓        |    ✓     |
| `shift`   |   ✓    |       ✓        |    ✓     |
| `justify` |   ✓    |       ✓        |    ✓     |
| `align`   |   ✓    |       ✓        |    ✓     |
| `wrap`    |   ✓    |       ✓        |    ✓     |
| `visible` |   ✓    |       ✓        |    ✓     |
| `first`   |   ✓    |   array form   |    -     |
| `last`    |   ✓    |   array form   |    -     |
| `reverse` |   ✓    |   array form   |    -     |
| `grow`    |   ✓    |       -        |    -     |
| `flex`    |   ✓    |       -        |    -     |
| `shrink`  |   ✓    |       -        |    -     |

`first`, `last`, and `reverse` use an array of breakpoint names instead of an object: `:first="['sm', 'md']"`.

## Visual demo

<preview style-grid>
  <div class="grid-demo-label">Grid structure</div>
  <div class="grid-demo-description">Column-spanning overview — each row uses the same 16-column total width.</div>
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
    <nb-grid dir="col" grid="16" class="grid-demo-item">16</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="14" class="grid-demo-item span-b">14</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="12" class="grid-demo-item span-b">12</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="6" class="grid-demo-item">6</nb-grid>
    <nb-grid dir="col" grid="10" class="grid-demo-item span-b">10</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="8" class="grid-demo-item">8</nb-grid>
    <nb-grid dir="col" grid="8" class="grid-demo-item span-b">8</nb-grid>
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
    <nb-grid dir="col" :grid="{ sm: 16, md: 8 }" class="grid-demo-item">16 → 8</nb-grid>
    <nb-grid dir="col" :grid="{ sm: 16, md: 8 }" class="grid-demo-item span-b">16 → 8</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col" :grid="{ sm: 16, md: 8 }">Left</nb-grid>
    <nb-grid dir="col" :grid="{ sm: 16, md: 8 }">Right</nb-grid>
  </nb-grid>
</template>
```

## Column shift (offset)

Use `shift` to push a column to the right by a number of column widths.

<preview style-grid>
  <nb-grid dir="col" gap="xs">
    <nb-grid justify="end" grid="4" shift="12" class="grid-demo-item">shift 12</nb-grid>
    <nb-grid justify="end" grid="8" shift="8" class="grid-demo-item span-b">shift 8</nb-grid>
    <nb-grid justify="end" grid="12" shift="4" class="grid-demo-item">shift 4</nb-grid>
    <nb-grid justify="end" grid="16" shift="0" class="grid-demo-item span-b">shift 0</nb-grid>
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
  <nb-grid :dir="{ sm: 'col', md: 'row' }" gap="sm">
    <nb-grid :dir="{ sm: 'row', md: 'col' }" class="grid-demo-item demo-small">First</nb-grid>
    <nb-grid :dir="{ sm: 'row', md: 'col' }" class="grid-demo-item demo-small">Second</nb-grid>
    <nb-grid :dir="{ sm: 'row', md: 'col' }" class="grid-demo-item demo-small">Third</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <!-- col on small, row on medium+ -->
  <nb-grid :dir="{ sm: 'col', md: 'row' }">
    <nb-grid :dir="{ sm: 'row', md: 'col' }">First</nb-grid>
    <nb-grid :dir="{ sm: 'row', md: 'col' }">Second</nb-grid>
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
  <nb-grid dir="row" :gap="{ sm: 'xs', md: 'xl' }">
    <nb-grid dir="col" grow class="grid-demo-item demo-small">xs → xl</nb-grid>
    <nb-grid dir="col" grow class="grid-demo-item demo-small">xs → xl</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row" :gap="{ sm: 'xs', md: 'xl' }">
    <nb-grid dir="col" grow>One</nb-grid>
    <nb-grid dir="col" grow>Two</nb-grid>
  </nb-grid>
</template>
```

</doc-tab>

<doc-tab name="Alignment">

## Horizontal alignment (`justify`)

<preview style-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="start" style="border: 1px dotted lightgrey">
    <nb-grid dir="col" class="grid-demo-item demo-small">start</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="center" style="border: 1px dotted lightgrey">
    <nb-grid dir="col" class="grid-demo-item demo-small">center</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="end" style="border: 1px dotted lightgrey">
    <nb-grid dir="col" class="grid-demo-item demo-small">end</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="between" style="border: 1px dotted lightgrey">
    <nb-grid dir="col" class="grid-demo-item demo-small">between</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">between</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">between</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="around" style="border: 1px dotted lightgrey">
    <nb-grid dir="col" class="grid-demo-item demo-small">around</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">around</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">around</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="evenly" style="border: 1px dotted lightgrey">
    <nb-grid dir="col" class="grid-demo-item demo-small">evenly</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">evenly</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">evenly</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" distributed style="border: 1px dotted lightgrey">
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
  <nb-grid dir="row" align="start" style="height: 80px; border: 1px dotted lightgrey" class="grid-demo-row">
    <nb-grid dir="col" grow class="grid-demo-item demo-small">start</nb-grid>
  </nb-grid>
  <nb-grid dir="row" align="center" style="height: 80px; border: 1px dotted lightgrey" class="grid-demo-row">
    <nb-grid dir="col" grow class="grid-demo-item demo-small">center</nb-grid>
  </nb-grid>
  <nb-grid dir="row" align="end" style="height: 80px; border: 1px dotted lightgrey" class="grid-demo-row">
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
  <NbGrid is="ul" wrap="nowrap" gap="sm">
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
  </NbGrid>
  <div class="grid-demo-label">wrap — items flow to next line</div>
  <NbGrid is="ul" wrap="wrap" gap="sm"">
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
  </NbGrid>
  <div class="grid-demo-label">reverse — wraps and reverses row order</div>
  <NbGrid is="ul" wrap="reverse" gap="sm">
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
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
<NbGrid :wrap="{ sm: 'wrap', lg: 'nowrap' }">...</NbGrid>
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
<nb-grid :dir="{ md: 'col' }" :reverse="['md']">...</nb-grid>
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
    <nb-grid dir="col" :visible="{ sm: false, lg: true }" class="grid-demo-item demo-small">hidden on small</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">always visible</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row">
    <!-- Hidden on small, visible on large -->
    <nb-grid dir="col" :visible="{ sm: false, lg: true }">Sidebar</nb-grid>
    <nb-grid dir="col" grow>Main content</nb-grid>
  </nb-grid>
</template>
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop          | Type                                                     | Default  | Description                                                |
| ------------- | -------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| `dir`         | `'row' \| 'col' \| ResponsiveMap \| Fn`                  | `'row'`  | Main axis direction                                        |
| `gap`         | `GapToken \| ResponsiveMap \| Fn`                        | -        | Gap between children                                       |
| `grid`        | `number \| ResponsiveMap \| Fn`                          | -        | Number of columns to span (1–16)                           |
| `shift`       | `number \| ResponsiveMap \| Fn`                          | -        | Column offset from the left edge                           |
| `justify`     | `JustifyValue \| ResponsiveMap \| Fn`                    | -        | Horizontal alignment of children                           |
| `align`       | `AlignValue \| ResponsiveMap \| Fn`                      | -        | Vertical alignment of children                             |
| `distributed` | `boolean`                                                | `false`  | Children grow equally to fill width                        |
| `wrap`        | `'wrap' \| 'nowrap' \| 'reverse' \| ResponsiveMap \| Fn` | -        | Wrapping behaviour                                         |
| `grow`        | `boolean`                                                | `false`  | Flex-grow: child expands to fill remaining space           |
| `visible`     | `boolean \| ResponsiveMap \| Fn`                         | `true`   | Show or hide the element                                   |
| `first`       | `boolean \| string[]`                                    | `false`  | Render this item visually first; array form per breakpoint |
| `last`        | `boolean \| string[]`                                    | `false`  | Render this item visually last; array form per breakpoint  |
| `reverse`     | `boolean \| string[]`                                    | `false`  | Reverse child order; array form per breakpoint             |
| `is`          | `string`                                                 | `'div'`  | HTML element tag to render (e.g. `'ul'`, `'li'`, `'nav'`)  |
| `mode`        | `'wide' \| 'narrow' \| 'condensed'`                      | `'wide'` | Predefined gap preset                                      |

## Gap tokens

`xxs` (2px) · `xs` (4px) · `sm` (8px) · `md` (16px) · `lg` (24px) · `xl` (32px) · `xxl` (48px)

## Justify values

`start` · `center` · `end` · `between` · `around` · `evenly`

## Align values

`start` · `center` · `end` · `stretch` · `baseline`

## Breakpoints

Mobile-first. Rules at `sm` apply from 320px up; later breakpoints override earlier ones.

| Name  | Min-width |
| ----- | :-------: |
| `sm`  |   320px   |
| `md`  |   672px   |
| `lg`  |  1056px   |
| `xl`  |  1312px   |
| `xxl` |  1584px   |

## Responsive maps

Props that accept a breakpoint map take an object keyed by breakpoint name:

```typescript
{ sm?: T, md?: T, lg?: T, xl?: T, xxl?: T }
```

## Function props

Props that accept a function are called inside the component's computed class generator. Any reactive refs or stores accessed inside are tracked automatically:

```typescript
// TypeScript signatures
type TGridTypeFn = () => 'row' | 'col' | 'row-reverse' | 'col-reverse'
type TGridGapFn = () => 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
// ...same pattern for align, justify, wrap, grid, shift, visible
```

```vue
<script setup lang="ts">
const isExpanded = ref(false)
</script>

<template>
  <nb-grid :dir="() => (isExpanded ? 'col' : 'row')">...</nb-grid>
</template>
```

## Exposed

```typescript
const gridRef = ref<InstanceType<typeof NbGrid>>()
gridRef.value?.getRef() // → underlying HTMLElement
```

</doc-tab>
