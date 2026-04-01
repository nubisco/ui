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
      v-for="(icon, iconIndex) in iconList.filter((icon) => {
        if (resultingProps.category && !icon.categories.includes(resultingProps.category)) return false
        if (resultingProps.search !== '' && resultingProps.search.length >= 2) {
          const q = resultingProps.search.toUpperCase()
          return icon.name.toUpperCase().includes(q)
            || icon.tags.some((t) => t.toUpperCase().includes(q))
        }
        return true
      })"
      :key="iconIndex"
      :class="{ copied: copiedIcon === icon.name }"
      @click="copyName(icon.name)"
    >
      <NbIcon
        :name="copiedIcon === icon.name ? 'check' : icon.name"
        :size="resultingProps.size"
        :color="resultingProps.color"
        :weight="resultingProps.weight"
        v-bind="{...(resultingProps.animation && {animation: resultingProps.animation})}"
      />
      <span class="icon-name">{{ icon.name }}</span>
      <div class="icon-overlay">
        <NbGrid dir="col">
          <span v-for="(category, categoryIndex) in icon.categories" :key="categoryIndex">{{ category }}</span>
        </NbGrid>
        <p v-if="icon.tags.length" class="icon-overlay-tags">{{ icon.tags.map(tag => `#${tag}`).join(', ') }}</p>
      </div>
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
import { catalog } from 'virtual:icons'

const copiedIcon = ref<string | null>(null)

function copyName(name: string) {
  navigator.clipboard.writeText(name)
  copiedIcon.value = name
  setTimeout(() => {
    copiedIcon.value = null
  }, 1500)
}
import type { PreviewPropDef } from '../../.vitepress/components/Preview.d'

const isDialogOpen = ref(false)

const iconList = Object.values(catalog)

const categoryOptions = [...new Set(iconList.flatMap((icon) => icon.categories))]
  .sort()
  .map((cat) => ({
    label: cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: cat,
  }))

const availableProps: PreviewPropDef[] = [
  {
    label: 'Search',
    name: 'search',
    type: 'string',
    default: '',
    placeholder: 'Search by name',
  },
  {
    label: 'Category',
    name: 'category',
    type: 'single',
    options: categoryOptions,
    default: null,
    placeholder: 'Filter by category',
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
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1px;
  padding: 0;
  margin: calc(var(--nb-base-unit) * 2) 0 0 0;
  background-color: var(--vp-c-divider);

  li {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100px;
    background: var(--vp-code-block-bg);
    padding: calc(var(--nb-base-unit) * 1.5);
    margin: 0;
    box-sizing: border-box;
    cursor: pointer;
    transition: background 0.1s ease;

    &:hover,
    &.copied {
      background: var(--vp-c-bg-soft);

      .icon-overlay {
        transform: translateY(0);
        opacity: 1;
      }
    }

    &.copied .icon-overlay {
      background: var(--vp-c-bg-soft);

      &::after {
        content: 'Copied!';
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 10px;
        color: var(--vp-c-brand-1);
        font-weight: 600;
      }
    }
  }

  .icon-name {
    font-size: 11px;
    text-align: center;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--vp-c-text-2);
    margin: 0;
    padding: 0;
  }

  .icon-overlay {
    position: absolute;
    inset: 0;
    background: var(--vp-c-bg-soft);
    padding: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    font-size: 10px;
    transform: translateY(100%);
    opacity: 0;
    transition: transform 0.15s ease, opacity 0.15s ease;
    line-height: 1.2;

    &-tags {
      color: var(--vp-c-text-3);
      margin: 0;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.4;
    }
  }
}
</style>
