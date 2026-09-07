---
layout: nubisco
title: Flag
tabs: ['Usage', 'Flags', 'Api']
---

<doc-tab name="Usage">

`NbFlag` renders country flag SVGs. Flags are loaded as async Vue components so they are code-split and only fetched when needed.

The `name` prop takes a two-letter ISO 3166-1 alpha-2 country code in lowercase (e.g. `pt`, `gb-sct`, `es`). The full list of available flags is below.

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

</doc-tab>

<doc-tab name="Flags">

<preview :props="availableProps" v-slot="{ resultingProps }" propsPosition="top">
  <ul class="flag-demo">
    <li
      v-for="(flag, flagIndex) in flagList.filter((item) => {
        if (resultingProps.search != '' && resultingProps.search.length >= 2) {
          return item.toUpperCase().includes(resultingProps.search.toUpperCase())
        }
        return true
      })"
      :key="flagIndex"
    >
      <span>{{flag}}</span>
      <div class="box">
        <NbFlag
          :name="`${flag}`"
          :size="resultingProps.size"
        />
      </div>
      <span v-if="flag.name"> {{flag.name}}</span>
    </li>
  </ul>
</preview>

</doc-tab>

<doc-tab name="Api">

## Props

| Prop        | Type               | Default  | Description                                                 |
| ----------- | ------------------ | -------- | ----------------------------------------------------------- |
| `name`      | `string \| module` | required | Lowercase ISO 3166-1 alpha-2 country code, or a flag module |
| `flag`      | `module`           | -        | An imported flag module; wins over `name`                   |
| `size`      | `string \| number` | `'md'`   | Named size or pixel value (see sizes table)                 |
| `clickable` | `boolean`          | `false`  | Adds pointer cursor and `role="button"`                     |

## How a code is resolved

The 255 flags follow the same three tiers as [NbIcon](/ui/components/icon): a
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

</doc-tab>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { catalog as flagCatalog } from '@nubisco/ui/flags/catalog'
import type { PreviewPropDef } from '../../.vitepress/components/Preview.d'
import { getCountryByCode } from '../../mocks/countries-mocks'

const { t } = useI18n({})

const isDialogOpen = ref(false)

const flagList = Object.keys(flagCatalog)

const availableProps: PreviewPropDef[] = [
  {
    label: 'Search',
    name: 'search',
    type: 'string',
    default: '',
    placeholder: 'Search by code',
  },
  {
    label: 'Size',
    name: 'size',
    type: 'slider',
    default: 32,
    placeholder: 'Flag size',
    min: 16,
    max: 128,
  },
]

const searchString = ref('')
const flagSize = ref(32)

const usableFlags = computed(() => {
  return flagList.map((flag) => {
    const countryData = getCountryByCode(flag)
    return {
      file: flag,
      ...(countryData && { name: t(`core.COUNTRY_NAMES.${countryData?.i18n_key}`) }),
    }
  })
})

const selectedSize = computed(() => {
  return Number(flagSize.value)
})
</script>

<style lang="scss" scoped>
.flag-demo {
  display: grid;
  list-style-type: none;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1px;
  padding: 0;
  margin: 0;
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
