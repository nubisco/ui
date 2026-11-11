---
layout: nubisco
title: Search
intro: '`NbSearch` is the search field: a magnifying glass at the start, a clear button once there is a query, and Escape to clear it. It sits flush in a toolbar or a table header, and `expandable` folds it into a square button until it is wanted.'
source: src/components/Search.vue
tab: style
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Anatomy

A field with a 16px magnifying glass at the start and, once there is a query, a clear button (`x`) at the end. The glass is an icon, not a button: the field already has focus. The clear button is a ghost icon-only `NbButton`, a square of the field's inner height.

## Layout

`NbSearch` has no outer margin and fills the width it is given, so it sits flush wherever it is put. Give it a width through its container (a grid column, a flex item) rather than a margin. Collapsed, an expandable search takes exactly the width of its button, and grows to fill the space when it opens.

## In an input group

A search is a field, so it joins an [`NbInputGroup`](/components/input-group/usage) like any other: a search with a scope selector in front of it, or a Search button after it.

<preview dir="col">
  <NbInputGroup style="max-width: 420px">
    <NbSearch v-model="query" placeholder="Search members" />
    <NbButton variant="primary">Search</NbButton>
  </NbInputGroup>
</preview>

<!--@include: ./_shared.md-->
