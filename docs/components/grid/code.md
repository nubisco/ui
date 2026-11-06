---
layout: nubisco
title: Grid
source: src/components/Grid.vue
tab: code
pageTabs: ['usage', 'code']
---

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

**1. Scalar**: applies at all viewport sizes:

```vue
<nb-grid dir="col">...</nb-grid>
```

**2. Breakpoint map**: different values per breakpoint. Rules cascade upward; only the breakpoints you define are set:

```vue
<!-- col until 672px, then row -->
<nb-grid :dir="{ sm: 'col', md: 'row' }">...</nb-grid>
```

**3. Function**: called reactively at render time. Any reactive state accessed inside is tracked automatically:

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
The function form is for dynamic logic that does not map cleanly to breakpoints, for example toggling layout based on component state. For viewport-driven changes, use the breakpoint map.
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

## Columns

The `grid` prop sets how many of the 16 available columns a child item spans, or a fraction the columns cannot make (`'1/3'`, see [Thirds, fifths and sixths](#thirds-fifths-and-sixths)). The `shift` prop offsets it from the left edge.

A span shares the gap of the row it sits in. Spans that add up to 16 fill the row exactly, gaps included: two `grid="8"` children of a `gap="md"` row are each `(100% - 16px) / 2`, and a wrapping row of them puts two on each line. Only a row's gap counts, since a column's gap is vertical.

```vue
<!-- Two fields side by side from md up, stacked below it. -->
<nb-grid :dir="{ sm: 'col', md: 'row' }" gap="md">
  <nb-grid dir="col" :grid="{ sm: 16, md: 8 }">...</nb-grid>
  <nb-grid dir="col" :grid="{ sm: 16, md: 8 }">...</nb-grid>
</nb-grid>
```

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

## Thirds, fifths and sixths

Sixteen columns split into halves, quarters and eighths, and not into thirds.
`grid` also takes a fraction, `'1/3'`, `'2/3'`, `'1/5'` to `'4/5'`, `'1/6'` and
`'5/6'`, sized with the same arithmetic as a column count, so three `'1/3'`
children of a `gap="md"` row fill it exactly, gaps included. A fraction works
in a breakpoint map like any other span.

<preview style-grid>
  <div class="grid-demo-label">Fractions</div>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="1/3" class="grid-demo-item">1/3</nb-grid>
    <nb-grid dir="col" grid="2/3" class="grid-demo-item span-b">2/3</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="1/3" class="grid-demo-item">1/3</nb-grid>
    <nb-grid dir="col" grid="1/3" class="grid-demo-item span-b">1/3</nb-grid>
    <nb-grid dir="col" grid="1/3" class="grid-demo-item">1/3</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="1/5" class="grid-demo-item">1/5</nb-grid>
    <nb-grid dir="col" grid="4/5" class="grid-demo-item span-b">4/5</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="1/6" class="grid-demo-item">1/6</nb-grid>
    <nb-grid dir="col" grid="5/6" class="grid-demo-item span-b">5/6</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row" gap="md">
    <nb-grid dir="col" grid="1/3">A third</nb-grid>
    <nb-grid dir="col" grid="2/3">Two thirds</nb-grid>
  </nb-grid>
</template>
```

## A tile two rows tall

`NbGrid` is a flex grid, so a child spans rows by nesting, not by a row count:
put the rows that sit beside the tall tile inside a column of their own, and
the tall tile stretches to their height (`align` defaults to `stretch`). The
dashboard block of a headline figure beside a 3 x 2 grid of small tiles is a
third beside two thirds, with the six tiles wrapping at `'1/3'` inside.

<preview style-grid>
  <div class="grid-demo-label">A headline beside six tiles</div>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="1/3" class="grid-demo-item">Headline</nb-grid>
    <nb-grid dir="col" grid="2/3">
      <nb-grid dir="row" gap="sm" wrap="wrap">
        <nb-grid dir="col" grid="1/3" class="grid-demo-item span-b">1</nb-grid>
        <nb-grid dir="col" grid="1/3" class="grid-demo-item span-b">2</nb-grid>
        <nb-grid dir="col" grid="1/3" class="grid-demo-item span-b">3</nb-grid>
        <nb-grid dir="col" grid="1/3" class="grid-demo-item span-b">4</nb-grid>
        <nb-grid dir="col" grid="1/3" class="grid-demo-item span-b">5</nb-grid>
        <nb-grid dir="col" grid="1/3" class="grid-demo-item span-b">6</nb-grid>
      </nb-grid>
    </nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row" gap="md">
    <nb-grid dir="col" grid="1/3">
      <nb-stat label="Revenue" value="48,200" unit="EUR" />
    </nb-grid>
    <nb-grid dir="col" grid="2/3">
      <nb-grid dir="row" gap="md" wrap="wrap">
        <nb-grid v-for="tile in tiles" :key="tile.label" dir="col" grid="1/3">
          <nb-stat v-bind="tile" />
        </nb-grid>
      </nb-grid>
    </nb-grid>
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

Use `shift` to push a column along by a number of column widths, from 0 to 15.
It is a `margin-inline-start`, so it mirrors under right-to-left. `0` is a real
rule, so a breakpoint map can take a shift back off: `:shift="{ sm: 4, lg: 0 }"`.

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

## Modes

`mode` is a default gutter, Carbon's three: `wide` 32px, `narrow` 16px,
`condensed` 1px. It applies only when there is no `gap`, so a `gap` (scalar or
at a breakpoint) wins over it. Spans share a mode's gutter the way they share a
`gap`, so spans that add up to 16 still fill the row. Without `mode` or `gap`
a grid has no gutter.

<preview style-grid>
  <div class="grid-demo-label">condensed: a wall of tiles read as one surface</div>
  <nb-grid dir="row" mode="condensed" wrap="wrap">
    <nb-grid dir="col" grid="4" class="grid-demo-item">1</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item span-b">2</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item">3</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item span-b">4</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row" mode="condensed" wrap="wrap">
    <nb-grid v-for="tile in tiles" :key="tile.id" dir="col" grid="4">
      <tile-preview :tile="tile" />
    </nb-grid>
  </nb-grid>
</template>
```

### Hang

In a narrow or condensed grid the boxes hug the gutter, which leaves their
text hard against it. `hang` on a span keeps the box where it is and insets
its content by the difference between a wide half gutter and this grid's half
gutter: nothing in a wide grid, 8px in a narrow one, 15.5px in a condensed one.
The text sits as far from the gutter's centre line as it would in a wide grid.

<preview style-grid>
  <nb-grid dir="row" mode="condensed">
    <nb-grid dir="col" grid="8" style="background: var(--nb-c-layer-2); padding-block: 8px">No hang: the text meets the gutter</nb-grid>
    <nb-grid dir="col" grid="8" hang style="background: var(--nb-c-layer-2); padding-block: 8px">Hang: the box meets the gutter, the text does not</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row" mode="condensed">
    <nb-grid dir="col" grid="8" hang>Caption</nb-grid>
    <nb-grid dir="col" grid="8" hang>Caption</nb-grid>
  </nb-grid>
</template>
```

## Page container

`container` makes a grid the page frame: `--nb-grid-max-width` (1440px),
centred, with `--nb-grid-gutter` as its inline margin. The margin is 16px up to
`xl`, phones included, and 24px at `xxl`. It is
opt-in and meant for a page outside `NbShell`. Inside the shell, `main`
already supplies the margin from `--nb-shell-chrome-padding-x`, so a container
there would add a second one.

```vue
<template>
  <nb-grid is="main" container dir="row" mode="wide" wrap="wrap">
    <nb-grid dir="col" :grid="{ sm: 16, lg: 8 }">...</nb-grid>
    <nb-grid dir="col" :grid="{ sm: 16, lg: 8 }">...</nb-grid>
  </nb-grid>
</template>
```

## Subgrid

A grid nested in a span starts a fresh 16 columns of the span's width. Its
spans line up with the parent's columns when the two gaps match, and drift
when they do not. `subgrid` drops the nested grid's own gap and takes its
parent's, so its spans land on the parent's column lines whatever `gap` it was
given. Below, the nested halves sit exactly under the parent's quarters.

<preview style-grid>
  <nb-grid dir="row" gap="lg">
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item span-b">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item span-b">4</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="lg" style="margin-top: 8px">
    <nb-grid dir="col" grid="8">
      <nb-grid dir="row" subgrid gap="xs">
        <nb-grid dir="col" grid="8" class="grid-demo-item">a quarter</nb-grid>
        <nb-grid dir="col" grid="8" class="grid-demo-item span-b">a quarter</nb-grid>
      </nb-grid>
    </nb-grid>
    <nb-grid dir="col" grid="8" class="grid-demo-item">8</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row" gap="lg">
    <nb-grid dir="col" grid="8">
      <nb-grid dir="row" subgrid>
        <nb-grid dir="col" grid="8">Quarter</nb-grid>
        <nb-grid dir="col" grid="8">Quarter</nb-grid>
      </nb-grid>
    </nb-grid>
    <nb-grid dir="col" grid="8">Half</nb-grid>
  </nb-grid>
</template>
```

## Aspect ratio

`ratio` holds a span at `'1:1'`, `'2:1'`, `'2:3'`, `'3:2'`, `'4:3'` or
`'16:9'`, so a row of tiles lines up before anything loads. It is a preferred
height: content taller than the ratio grows the box instead of being clipped.
In a row, flexbox stretches every item to the tallest one, so set
`align="start"` on the row when a tile must keep its shape beside taller
content. For a wall of same-shaped tiles, `NbCardGrid` takes the same `ratio`.

<preview style-grid>
  <nb-grid dir="row" gap="sm" align="start">
    <nb-grid dir="col" grid="4" ratio="1:1" class="grid-demo-item">1:1</nb-grid>
    <nb-grid dir="col" grid="4" ratio="4:3" class="grid-demo-item span-b">4:3</nb-grid>
    <nb-grid dir="col" grid="8" ratio="16:9" class="grid-demo-item">16:9</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row" gap="md" align="start">
    <nb-grid dir="col" grid="8" ratio="16:9">...</nb-grid>
    <nb-grid dir="col" grid="8" ratio="16:9">...</nb-grid>
  </nb-grid>
</template>
```

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

## Wrap

The `wrap` prop controls what happens when children overflow the container's inline axis.

<preview style-grid>
  <div class="grid-demo-label">nowrap: items overflow</div>
  <NbGrid is="ul" wrap="nowrap" gap="sm">
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
  </NbGrid>
  <div class="grid-demo-label">wrap: items flow to next line</div>
  <NbGrid is="ul" wrap="wrap" gap="sm"">
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">long string</NbGrid>
  </NbGrid>
  <div class="grid-demo-label">reverse: wraps and reverses row order</div>
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

## First

<preview style-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" class="grid-demo-item demo-small">DOM first</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">DOM second</nb-grid>
    <nb-grid dir="col" first class="grid-demo-item demo-small order-first">DOM third, renders first</nb-grid>
  </nb-grid>
</preview>

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col">DOM first</nb-grid>
    <nb-grid dir="col">DOM second</nb-grid>
    <nb-grid dir="col" first>DOM third, renders first</nb-grid>
  </nb-grid>
</template>
```

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

## Props

| Prop          | Type                                                     | Default | Description                                                |
| ------------- | -------------------------------------------------------- | ------- | ---------------------------------------------------------- |
| `dir`         | `'row' \| 'col' \| ResponsiveMap \| Fn`                  | `'row'` | Main axis direction                                        |
| `gap`         | `GapToken \| ResponsiveMap \| Fn`                        | -       | Gap between children                                       |
| `grid`        | `number \| Fraction \| ResponsiveMap \| Fn`              | -       | Columns to span (1 to 16), or a fraction such as `'1/3'`   |
| `shift`       | `number \| ResponsiveMap \| Fn`                          | -       | Column offset (0 to 15) from the start edge                |
| `justify`     | `JustifyValue \| ResponsiveMap \| Fn`                    | -       | Horizontal alignment of children                           |
| `align`       | `AlignValue \| ResponsiveMap \| Fn`                      | -       | Vertical alignment of children                             |
| `distributed` | `boolean`                                                | `false` | Children grow equally to fill width                        |
| `wrap`        | `'wrap' \| 'nowrap' \| 'reverse' \| ResponsiveMap \| Fn` | -       | Wrapping behaviour                                         |
| `grow`        | `boolean`                                                | `false` | Flex-grow: child expands to fill remaining space           |
| `visible`     | `boolean \| ResponsiveMap \| Fn`                         | `true`  | Show or hide the element                                   |
| `first`       | `boolean \| string[]`                                    | `false` | Render this item visually first; array form per breakpoint |
| `last`        | `boolean \| string[]`                                    | `false` | Render this item visually last; array form per breakpoint  |
| `reverse`     | `boolean \| string[]`                                    | `false` | Reverse child order; array form per breakpoint             |
| `is`          | `string`                                                 | `'div'` | HTML element tag to render (e.g. `'ul'`, `'li'`, `'nav'`)  |
| `mode`        | `'wide' \| 'narrow' \| 'condensed'`                      | -       | Default gutter (32, 16, 1px) when there is no `gap`        |
| `hang`        | `boolean`                                                | `false` | Insets the content to the wide-grid key line               |
| `container`   | `boolean`                                                | `false` | Page container: max width, centred, page margin            |
| `subgrid`     | `boolean`                                                | `false` | Takes the parent's gap so spans land on its column lines   |
| `ratio`       | `'1:1' \| '2:1' \| '2:3' \| '3:2' \| '4:3' \| '16:9'`    | -       | Holds the element at an aspect ratio                       |

## Gap tokens

`xxs` (2px) · `xs` (4px) · `sm` (8px) · `md` (16px) · `lg` (24px) · `xl` (32px) · `xxl` (48px). Each reads `--nb-spacing-N`, so retuning the scale moves the gaps.

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
