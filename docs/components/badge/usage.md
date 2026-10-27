---
layout: nubisco
title: Badge
intro: '`NbBadge` is a compact label used to highlight status, category, or a short value. It supports multiple color variants, two sizes, and an optional dot indicator.'
source: src/components/Badge.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbBadge v-bind="resultingProps">badge</NbBadge>
</preview>

```vue
<template>
  <NbBadge variant="blue">badge</NbBadge>
</template>
```

## Variants

Use `variant` to communicate meaning through color.

<preview dir="row">
  <NbBadge variant="grey">grey</NbBadge>
  <NbBadge variant="blue">blue</NbBadge>
  <NbBadge variant="green">green</NbBadge>
  <NbBadge variant="orange">orange</NbBadge>
  <NbBadge variant="red">red</NbBadge>
  <NbBadge variant="purple">purple</NbBadge>
  <NbBadge variant="primary">primary</NbBadge>
</preview>

## Sizes

<preview dir="row">
  <NbBadge size="md">medium</NbBadge>
  <NbBadge size="sm">small</NbBadge>
</preview>

## With an icon

`icon` puts a glyph before the text, sized to the badge.

<preview dir="row">
  <NbBadge variant="orange" icon="calendar-blank">Tomorrow</NbBadge>
  <NbBadge variant="red" size="sm" icon="calendar-blank">2 days late</NbBadge>
</preview>

<!--@include: ./_shared.md-->
