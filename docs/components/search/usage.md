---
layout: nubisco
title: Search
intro: '`NbSearch` is the search field: a magnifying glass at the start, a clear button once there is a query, and Escape to clear it. It sits flush in a toolbar or a table header, and `expandable` folds it into a square button until it is wanted.'
source: src/components/Search.vue
tab: usage
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

<preview dir="col">
  <NbSearch v-model="query" style="max-width: 360px" />
</preview>

```vue
<template>
  <NbSearch v-model="query" placeholder="Search invoices" />
</template>
```

## When to use it

For a query that filters or finds: a table's rows, a list of members, a set of projects. A field that takes a value for a form (a name, an address) is an [`NbTextInput`](/components/text-input/usage), even when it filters as you type.

## Expandable

`expandable` starts the search as a square icon-only button the size of the field. A click, or <kbd>Tab</kbd> onto it, opens the field and moves focus into it. It folds back when focus leaves an empty field, and on <kbd>Escape</kbd>, which also clears it. It stays open while it holds a query, so a filter in force is never hidden behind a bare icon. Use it in a toolbar that is short of room, beside other icon-only buttons.

<preview dir="row">
  <div style="display: flex; align-items: center; gap: 8px; width: 420px">
    <NbButton variant="ghost" icon="funnel" label="Filter" />
    <NbSearch v-model="toolbarQuery" expandable placeholder="Search projects" />
    <NbButton variant="ghost" icon="dots-three" label="More actions" />
  </div>
</preview>

```vue
<template>
  <NbSearch v-model="query" v-model:expanded="open" expandable />
</template>
```

## Sizes

The four field sizes, the same heights as `NbButton`'s: `xs` 24, `sm` 32, `md` 40, `lg` 48. Collapsed, an expandable search is a square of that height.

<preview dir="col">
  <NbSearch v-for="s in ['xs', 'sm', 'md', 'lg']" :key="s" v-model="sizeQuery" :size="s" style="max-width: 320px" />
</preview>

<!--@include: ./_shared.md-->
