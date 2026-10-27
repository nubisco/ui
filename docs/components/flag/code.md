---
layout: nubisco
title: Flag
intro: '`NbFlag` renders country flag SVGs. Flags are loaded as async Vue components so they are code-split and only fetched when needed.'
source: src/components/Flag.vue
tab: code
pageTabs: ['usage', 'code']
---

## Overview

:::tabs
== Preview

<preview>
  <NbFlag name="pt" size="256" clickable @click="() => isDialogOpen = true" />
  <NbModal :open="isDialogOpen">
    <template #header>Hello World!</template>
    <p>You clicked the flag.</p>
    <template #footer>
      <NbButton size="lg" @click="isDialogOpen = false">Close</NbButton>
    </template>
  </NbModal>
</preview>

== Code

```vue
<template>
  <NbFlag name="pt" size="256" clickable @click="selectLocale" />
</template>
```

:::

## Props

| Prop        | Type               | Default  | Description                                                 |
| ----------- | ------------------ | -------- | ----------------------------------------------------------- |
| `name`      | `string \| module` | required | Lowercase ISO 3166-1 alpha-2 country code, or a flag module |
| `flag`      | `module`           | -        | An imported flag module; wins over `name`                   |
| `size`      | `string \| number` | `'md'`   | Named size or pixel value (see sizes table)                 |
| `clickable` | `boolean`          | `false`  | Adds pointer cursor and `role="button"`                     |

## How a code is resolved

The 255 flags follow the same three tiers as [NbIcon](/components/icon/usage): a
literal code is linked as one module by the bundler plugin, an imported module
can be passed directly, and a code known only at runtime needs either
`registerFlags` for a bounded set or `@nubisco/ui/flags/all` for an open one.

A country _selector_ is the case the full catalogue exists for, since it must
render whatever the user picks:

```ts
import '@nubisco/ui/flags/all'
```

A built app therefore contains only the flags its templates named; see
[What ships in your bundle](/bundling) for how to check, and how to ship all 255
on purpose.

Where the codes are bounded, register them instead and the page links only
those flags:

```ts
import { registerFlags } from '@nubisco/ui'
import * as pt from '@nubisco/ui/flags/pt'
import * as es from '@nubisco/ui/flags/es'

registerFlags({ pt, es })
```

## Sizes

| Name | Pixels |
| ---- | ------ |
| `sm` | 16     |
| `md` | 20     |
| `lg` | 32     |

You can also pass any number: `:size="48"` sets width and height to 48px.

## Events

| Event   | Payload      | Description                           |
| ------- | ------------ | ------------------------------------- |
| `click` | `MouseEvent` | Only fires when `clickable` is `true` |

## Mapping locale codes to flag names

Locale codes like `pt_PT` or `en_US` are not the same as flag names. To convert, extract the country segment and lowercase it:

```typescript
// "pt_PT" -> "pt", "en_US" -> "us", "zh_Hans_CN" -> "cn"
function localeToFlagName(code: string): string {
  const parts = code.split(/[-_]/)
  const country = [...parts].reverse().find((p) => /^[A-Z]{2}$/.test(p))
  return country ? country.toLowerCase() : parts[0].toLowerCase()
}
```

For bare language codes without a country (`en`, `fr`), the language code itself is used as the flag name. Not all language codes have a corresponding flag, so the component will silently render nothing if the name does not match a known flag.

<!--@include: ./_shared.md-->
