---
layout: nubisco
title: Tabs
intro: '`NbTabs` switches between sections of the same page. Give it an `items` array and bind `v-model` to the id of the section on screen. It renders the tab bar and, when you fill the matching slot, the panel below it.'
source: src/components/Tabs.vue
tab: usage
pageTabs: ['usage', 'code']
---

Reach for tabs when the sections are peers and only one is relevant at a time.
Do not use them for steps in a sequence, or to navigate to a different page.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbTabs :items="clientTabs" v-model="activeTab" v-bind="resultingProps">
    <template #settings><p>Name, billing address, VAT number.</p></template>
    <template #hours><p>Logged hours for the current period.</p></template>
    <template #invoices><p>Issued invoices and their status.</p></template>
  </NbTabs>
</preview>

```vue
<template>
  <NbTabs v-model="activeTab" :items="items" aria-label="Client">
    <template #settings>
      <ClientSettings />
    </template>
    <template #hours>
      <ClientHours />
    </template>
    <template #invoices>
      <ClientInvoices />
    </template>
  </NbTabs>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ITabItem } from '@nubisco/ui'

const items: ITabItem[] = [
  { id: 'settings', label: 'Settings' },
  { id: 'hours', label: 'Hours' },
  { id: 'invoices', label: 'Invoices' },
]
const activeTab = ref('settings')
</script>
```

## Sizes

`md` is the baseline. Use `sm` on dense surfaces such as inspectors and side
panels, and `lg` when the tabs head a full page.

<preview>
  <NbTabs :items="clientTabs" size="sm" />
  <NbTabs :items="clientTabs" size="md" />
  <NbTabs :items="clientTabs" size="lg" />
</preview>

## Full width

`full-width` shares the available width equally between the tabs. It suits a
segmented control spanning a form, and a bar of two or three tabs. Avoid it
with many tabs, where each one stretches far past its label.

<preview>
  <NbTabs :items="authTabs" variant="contained" full-width />
</preview>

## Disabled

Disable a single item with `disabled` on the item, or the whole bar with the
`disabled` prop. Disabled tabs are skipped by keyboard navigation, so arrow
keys never land on a tab that cannot be opened.

<preview>
  <NbTabs :items="partiallyDisabledTabs" />
  <NbTabs :items="clientTabs" disabled />
</preview>

## On a phone

On a phone layout (below 672px, or a phone held sideways) the bar always
scrolls this way, and on a phone touch screen every tab is at least 44px tall.

<!--@include: ./_shared.md-->
