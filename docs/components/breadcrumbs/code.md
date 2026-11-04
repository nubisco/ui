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

## A crumb with a picture

A crumb that names something with a logo (a company, a client, a space) can
show it before the label with `picture`, drawn as a small round `NbAvatar`.
Options take `picture` too, and show it in the list. `null` draws the label's
initials in the same place, for an option whose siblings have a picture and
which has none, so the list still lines up. Leave it out and nothing is drawn.

```vue
<script setup lang="ts">
const trail = [
  { label: 'Clients', to: '/clients' },
  {
    label: 'Acme',
    picture: '/logos/acme.png',
    value: 'acme',
    options: [
      {
        label: 'Acme',
        to: '/clients/acme',
        value: 'acme',
        picture: '/logos/acme.png',
      },
      {
        label: 'Globex',
        to: '/clients/globex',
        value: 'globex',
        picture: null,
      },
    ],
  },
]
</script>
```

The picture is decorative: the label beside it already names the crumb. On a
phone with `collapse="phone"`, the label of the last crumb gives way to the
ellipsis and the picture keeps its size.

## A crumb that is a key

A crumb whose label is an identifier rather than a name (a record key, a path,
a version) sets `code`. The label is drawn in the monospace face as a small
chip, and the crumb otherwise behaves as it would: a link stays a link, the
current crumb stays current.

```vue
<template>
  <nb-breadcrumbs
    :items="[
      { label: 'Records', to: '/records' },
      { label: 'REC-2041', code: true },
    ]"
  />
</template>
```

## Item fields

| Field               | Type                  | Description                                                        |
| ------------------- | --------------------- | ------------------------------------------------------------------ |
| `label`             | `string`              | The text of the crumb                                              |
| `to` / `href`       | `string \| object`    | Where the crumb goes                                               |
| `onClick`           | `(event) => void`     | Makes a crumb with no link a button                                |
| `current`           | `boolean`             | Marks the current page. Defaults to the last crumb                 |
| `picture`           | `string \| null`      | A logo before the label. `null` draws initials                     |
| `code`              | `boolean`             | The label is a key or an identifier: drawn as a monospace chip     |
| `options`           | `IBreadcrumbOption[]` | The siblings. Adds the switcher chevron                            |
| `value`             | `string \| number`    | The current option. Defaults to the option labelled like the crumb |
| `switchLabel`       | `string`              | Accessible name of the chevron. Default `Switch <label>`           |
| `searchPlaceholder` | `string`              | Placeholder and name of the search box. Default `Find`             |
| `noResultsLabel`    | `string`              | Shown when nothing matches. Default `No results`                   |

An option is `{ label, to?, href?, value?, icon?, picture? }`, `picture` taking
the place of `icon` when both are set. `value` identifies it and
defaults to its position.

## Events

| Event    | Payload               | Description                                |
| -------- | --------------------- | ------------------------------------------ |
| `select` | `item, index, event`  | A crumb without a link was activated       |
| `switch` | `item, option, index` | An option was picked in a crumb's switcher |

<!--@include: ./_shared.md-->
