---
layout: nubisco
title: Icon
intro: '`NbIcon` renders SVG icons from the Phosphor icon set. Icons are loaded as async Vue components via a Vite virtual module, so only icons that are actually used end up in your bundle.'
source: src/components/Icon.vue
tab: code
pageTabs: ['usage', 'code']
---

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

## Props

| Prop        | Type               | Default     | Description                                                     |
| ----------- | ------------------ | ----------- | --------------------------------------------------------------- |
| `name`      | `string \| module` | required    | Icon name in kebab-case (e.g. `arrow-right`), or an icon module |
| `icon`      | `module`           | -           | An imported icon module; wins over `name`                       |
| `size`      | `string \| number` | `'md'`      | Named size or pixel value (see sizes table)                     |
| `weight`    | `string`           | `'regular'` | Icon weight variant (see weights table)                         |
| `color`     | `string`           | -           | Any valid CSS color value                                       |
| `clickable` | `boolean`          | `false`     | Adds pointer cursor and `role="button"`                         |

## How a name is resolved

Nubisco UI carries about 1,500 icons in six weights. No page should link all of
them to render a handful, so a name is resolved as early as it can be.

**A literal name** is a constant, and the bundler plugin rewrites it into an
import of that one icon. This is almost all usage and it costs one icon:

```vue
<NbIcon name="github-logo" />
```

**An imported module** covers code the plugin cannot see through, and projects
that do not run a bundler plugin:

```vue
<script setup>
import GithubLogo from '@nubisco/ui/icons/github-logo'
</script>

<template>
  <NbIcon :icon="GithubLogo" />
</template>
```

**A name known only at runtime** (an API field, a CMS value, a picker) needs one
of two declarations. If the set of values is bounded, register those modules and
the app links only them:

```ts
import { registerIcons } from '@nubisco/ui'
import * as check from '@nubisco/ui/icons/check'
import * as warning from '@nubisco/ui/icons/warning'

registerIcons({ check, warning })
```

If it is open-ended, load the catalogue in the one file that needs it:

```ts
import '@nubisco/ui/icons/all'
```

A registered name always wins over the catalogue, which is also how you add
icons of your own or override a built-in. If a runtime name arrives with none
of the three in place, `NbIcon` throws on first render rather than leaving an
invisible hole in the page.

Because of this, **a built app contains only the icons its templates named**.
See [What ships in your bundle](/bundling) for how to check what was linked, and
how to ship the whole set deliberately when you need it.

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

<!--@include: ./_shared.md-->
