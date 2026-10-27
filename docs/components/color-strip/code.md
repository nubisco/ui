---
layout: nubisco
title: Color Strip
intro: '`NbColorStrip` is a row of color swatches that acts as a color picker. It supports single selection, multi-selection, wrapping into a square grid, a null/clear option, and a view-only mode.'
source: src/components/ColorStrip.vue
tab: code
pageTabs: ['usage', 'code']
---

## Wrap mode

Set `wrap` to `true` to break the strip into a near-square grid. The number of columns is computed as `ceil(sqrt(totalColors))`, so 9 colors render as 3×3, and 8 colors render in 3 columns.

<preview>
  <NbColorStrip v-model="singleModel" label="Color" :options="options" wrap />
</preview>

```vue
<template>
  <NbColorStrip v-model="color" label="Color" :options="options" wrap />
</template>
```

## Multiple selection

Set `allowMultiple` to `true` to allow selecting more than one color. The model becomes an array of selected values. The `showNull` option is ignored in multiple mode.

<preview>
  <NbColorStrip v-model="multipleModel" :options="options" :allow-multiple="true" />
</preview>

```vue
<template>
  <NbColorStrip v-model="colors" :options="options" :allow-multiple="true" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const colors = ref<string[]>(['ocean'])
</script>
```

## Null / clear option

Set `showNull` to `true` to prepend a swatch that represents no value (`null`). In single mode, it acts as a clear action. The null swatch renders the `empty` icon, shown with `duotone` weight when selected.

<preview>
  <NbColorStrip :options="options" v-model="nullModel" showNull />
</preview>

```vue
<template>
  <NbColorStrip v-model="color" :options="options" showNull />
</template>
```

## Automatic contrast

When a color is selected, a check icon is rendered on top of the swatch. The component automatically calculates whether to use a black or white icon based on the background color to ensure legibility.

CSS custom properties are also supported as option colors — the component resolves the computed value at runtime.

```vue
<template>
  <NbColorStrip
    :options="[{ value: 'brand', color: 'var(--nb-c-primary)' }, '#F59E0B']"
    v-model="color"
  />
</template>
```

## Props

| Prop            | Type                         | Default     | Description                                              |
| --------------- | ---------------------------- | ----------- | -------------------------------------------------------- |
| `modelValue`    | `string \| string[] \| null` | -           | Selected value or array in multiple mode (`v-model`)     |
| `options`       | `IOption[] \| string[]`      | `[]`        | Color swatches as string hex values or `IOption` objects |
| `label`         | `string`                     | -           | Label shown above the strip                              |
| `variant`       | `'default' \| 'fluid'`       | `'default'` | Layout variant                                           |
| `wrap`          | `boolean`                    | `false`     | Break into a near-square grid                            |
| `allowMultiple` | `boolean`                    | `false`     | Enable multi-selection mode                              |
| `showNull`      | `boolean`                    | `false`     | Prepend a null/clear swatch (single mode only)           |
| `onlyView`      | `boolean`                    | `false`     | Display-only, no interaction                             |

## Option interface

```typescript
interface IOption {
  value: string
  color: string // hex value or CSS custom property
}
```

## Events

| Event               | Payload                      | Description                       |
| ------------------- | ---------------------------- | --------------------------------- |
| `update:modelValue` | `string \| string[] \| null` | Emitted on every selection change |

<!--@include: ./_shared.md-->
