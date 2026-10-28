---
layout: nubisco
title: Breadcrumbs
intro: '`NbBreadcrumbs` shows where the person is and the way back up. A crumb that stands for one of several siblings (a company, a client, a repository, a year) can also switch to another one, in place.'
source: src/components/Breadcrumbs.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Basic usage

Pass the trail as `items`. Each crumb links with `to` or `href`, or is a button
with `onClick`. The last one is the current page.

```vue
<template>
  <NbBreadcrumbs :items="trail" />
</template>

<script setup lang="ts">
const trail = [
  { label: 'Home', to: '/' },
  { label: 'Clients', to: '/clients' },
  { label: 'Acme' },
]
</script>
```

## A crumb that switches

Add `options` to a crumb. `value` is the current option; without it, the option
whose label equals the crumb's is marked.

```vue
<template>
  <NbBreadcrumbs :items="trail" @switch="onSwitch" />
</template>

<script setup lang="ts">
const trail = [
  { label: 'Home', to: '/' },
  {
    label: 'Acme',
    value: 'acme',
    options: [
      { label: 'Acme', to: '/c/acme', value: 'acme' },
      { label: 'Globex', to: '/c/globex', value: 'globex' },
    ],
    switchLabel: 'Switch company',
    searchPlaceholder: 'Find companies',
    noResultsLabel: 'No companies',
  },
  { label: 'Hours' },
]
</script>
```

Picking an option goes to its `to` (through vue-router when it is installed,
otherwise by loading the path) or `href`, and emits `switch` with the crumb, the
option and the crumb's index. An option with neither only emits `switch`, so a
view can handle it. Picking the current option does nothing.

The search is the one `NbSelect` has: it matches anywhere in the label, ignores
case and accents, and Enter picks the first match.

## Item fields

| Field               | Type                  | Description                                                        |
| ------------------- | --------------------- | ------------------------------------------------------------------ |
| `label`             | `string`              | The text of the crumb                                              |
| `to` / `href`       | `string \| object`    | Where the crumb goes                                               |
| `onClick`           | `(event) => void`     | Makes a crumb with no link a button                                |
| `current`           | `boolean`             | Marks the current page. Defaults to the last crumb                 |
| `options`           | `IBreadcrumbOption[]` | The siblings. Adds the switcher chevron                            |
| `value`             | `string \| number`    | The current option. Defaults to the option labelled like the crumb |
| `switchLabel`       | `string`              | Accessible name of the chevron. Default `Switch <label>`           |
| `searchPlaceholder` | `string`              | Placeholder and name of the search box. Default `Find`             |
| `noResultsLabel`    | `string`              | Shown when nothing matches. Default `No results`                   |

An option is `{ label, to?, href?, value?, icon? }`. `value` identifies it and
defaults to its position.

## Events

| Event    | Payload               | Description                                |
| -------- | --------------------- | ------------------------------------------ |
| `select` | `item, index, event`  | A crumb without a link was activated       |
| `switch` | `item, option, index` | An option was picked in a crumb's switcher |

<!--@include: ./_shared.md-->
