---
layout: nubisco
title: Icon
tabs: ['Usage', 'Icons', 'Api']
---

<doc-tab name="Usage">

`NbIcon` renders SVG icons from the Phosphor icon set. Icons are loaded as async Vue components via a Vite virtual module, so only icons that are actually used end up in your bundle.

## Overview

<preview dir="row">
  <NbIcon name="sparkle" />
  <NbIcon name="gear" weight="duotone" :size="24" color="#4f46e5" />
  <NbIcon name="trash" weight="bold" clickable @click="() => isDialogOpen = true" />
  <NbModal :open="isDialogOpen">
    <template #header>Hello World!</template>
    <p>You clicked the icon.</p>
    <template #footer>
      <NbButton size="lg" @click="isDialogOpen = false">Close</NbButton>
    </template>
  </NbModal>
</preview>

```vue
<template>
  <NbIcon name="sparkle" />
  <NbIcon name="gear" weight="duotone" :size="24" color="#4f46e5" />
  <NbIcon name="trash" weight="bold" clickable @click="console.log('remove')" />
</template>
```

</doc-tab>

<doc-tab name="Icons">

<preview :props="availableProps" v-slot="{ resultingProps }" propsPosition="top">
  <ul class="icon-demo">
    <li
      v-for="(iconName, iconIndex) in iconList.filter((item) => {
        if (resultingProps.search != '' && resultingProps.search.length >= 2) {
          return item.toUpperCase().includes(resultingProps.search.toUpperCase())
        }
        return true
      })"
      :key="iconIndex"
    >
      <div class="box">
        <NbIcon
          :name="iconName"
          :size="resultingProps.size"
          :color="resultingProps.color"
          :weight="resultingProps.weight"
          v-bind="{...(resultingProps.animation && {animation: resultingProps.animation})}"
        />
      </div>
      <span>{{iconName}}</span>
    </li>
  </ul>
</preview>

</doc-tab>

<doc-tab name="Api">

## Props

| Prop        | Type               | Default     | Description                                  |
| ----------- | ------------------ | ----------- | -------------------------------------------- |
| `name`      | `string`           | required    | Icon name in kebab-case (e.g. `arrow-right`) |
| `size`      | `string \| number` | `'md'`      | Named size or pixel value (see sizes table)  |
| `weight`    | `string`           | `'regular'` | Icon weight variant (see weights table)      |
| `color`     | `string`           | -           | Any valid CSS color value                    |
| `clickable` | `boolean`          | `false`     | Adds pointer cursor and `role="button"`      |

## Weights

| Value     | Description                         |
| --------- | ----------------------------------- |
| `thin`    | Very light stroke                   |
| `light`   | Light stroke                        |
| `regular` | Default stroke                      |
| `bold`    | Heavy stroke                        |
| `fill`    | Solid filled                        |
| `duotone` | Two-tone with foreground/background |

Not every icon has all weights. If a requested weight is not available, the component falls back to `regular`.

## Sizes

Named sizes map to fixed pixel values:

| Name  | Pixels |
| ----- | ------ |
| `xxs` | 8      |
| `xs`  | 12     |
| `sm`  | 14     |
| `md`  | 16     |
| `lg`  | 20     |
| `xl`  | 60     |
| `xxl` | 92     |

You can also pass any number: `:size="32"` sets both width and height to 32px. String values other than the named sizes are passed directly as CSS (`size="1.5rem"` works too).

## Events

| Event   | Payload      | Description                           |
| ------- | ------------ | ------------------------------------- |
| `click` | `MouseEvent` | Only fires when `clickable` is `true` |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
import icons from 'virtual:icons'
import str2kebab from '@nubisco/ui/utils/str2kebab.helper'
import type { PreviewPropDef } from '../../.vitepress/components/Preview.d'

const isDialogOpen = ref(false)

// Extract base icon names (remove weight suffixes and deduplicate)
const iconList = [...new Set(Object.keys(icons)
  .map(item => {
    const baseName = str2kebab(item.replace(/^i/, ''))
    // Remove weight suffixes to get base name
    return baseName.replace(/-(thin|light|bold|fill|duotone)$/, '')
  })
)]

const availableProps: PreviewPropDef[] = [
  {
    label: 'Search',
    name: 'search',
    type: 'string',
    default: '',
    placeholder: 'Search by name',
  },
  {
    label: 'Weight',
    name: 'weight',
    type: 'single',
    options: [
      { label: 'Thin', value: 'thin' },
      { label: 'Light', value: 'light' },
      { label: 'Regular', value: 'regular' },
      { label: 'Bold', value: 'bold' },
      { label: 'Fill', value: 'fill' },
      { label: 'Duotone', value: 'duotone' }
    ],
    default: 'regular',
    placeholder: 'Select one',
  },
  {
    label: 'Color',
    name: 'color',
    type: 'color',
    default: null,
    options: [
      'grey',
      'var(--nb-c-primary)',
      'red',
      'green',
      'blue',
      'yellow',
      'cyan',
    ],
  },
  {
    label: 'Size',
    name: 'size',
    type: 'slider',
    default: 32,
    placeholder: 'Icon size',
    min: 16,
    max: 128,
  },
  {
    label: 'Animation',
    name: 'animation',
    type: 'single',
    options: [
      {
        label: 'No animation',
        value: null,
      },
      {
        label: 'swing-right',
        value: 'swing-right',
      },
      {
        label: 'wobble',
        value: 'wobble',
      },
      {
        label: 'expand',
        value: 'expand',
      },
      {
        label: 'refresh',
        value: 'refresh',
      },
      {
        label: 'heart',
        value: 'heart',
      },
      {
        label: 'undo',
        value: 'undo',
      },
      {
        label: 'italic',
        value: 'italic',
      },
      {
        label: 'cog',
        value: 'cog',
      },
      {
        label: 'wrench',
        value: 'wrench',
      },
      {
        label: 'mouse-pointer',
        value: 'mouse-pointer',
      },
      {
        label: 'magic',
        value: 'magic',
      },
      {
        label: 'lock',
        value: 'lock',
      },
      {
        label: 'unlock',
        value: 'unlock',
      },
      {
        label: 'hourglass',
        value: 'hourglass',
      },
      {
        label: 'eraser',
        value: 'eraser',
      },
      {
        label: 'rocket',
        value: 'rocket',
      },
      {
        label: 'times',
        value: 'times',
      },
    ],
    default: null,
    placeholder: 'Select one',
  },
]
</script>

<style lang="scss" scoped>
.icon-demo {
  display: grid;
  list-style-type: none;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1px;
  padding: 0;
  margin: calc(var(--nb-base-unit) * 2) 0 0 0;
  background-color: var(--vp-c-divider);

  li {
    display: flex;
    flex-direction: column;
    align-items: flex-start; // Left-align content
    height: 120px;
    background: var(--vp-code-block-bg);
    border-radius: 0;
    padding: calc(var(--nb-base-unit) * 1.5);
    margin: 0;
    box-sizing: border-box;
    .box {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      flex-grow: 1;
      margin: 0;
      padding: 0;
    }

    span {
      font-size: 12px;
      word-break: break-word;
      width: 100%;
      text-align: left;
      margin: 0;
      padding: 0;
    }
  }
}
</style>
