---
layout: nubisco
title: Tabs
intro: '`NbTabs` switches between sections of the same page. Give it an `items` array and bind `v-model` to the id of the section on screen. It renders the tab bar and, when you fill the matching slot, the panel below it.'
source: src/components/Tabs.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Panels are optional

Leave the slots out and only the bar renders, which is what you want when the
sections live in a router view or in separate components further down the page.
The tab then carries no `aria-controls`, since there is no panel to point at.

```vue
<template>
  <NbTabs v-model="section" :items="items" aria-label="Project" />
  <RouterView />
</template>
```

## Variants

`line` is the default: text tabs on a rule, the active one underlined in the
primary color. It is the treatment for a page's own sections.

`contained` is a segmented control with a filled active block. Use it for a
mode switch that changes what a single surface does, such as sign in against
sign up, not for page sections.

In both variants the active mark is one element that slides to the chosen tab
on the medium step, so the eye follows the selection rather than seeing one
mark vanish and another appear. Under `prefers-reduced-motion` it lands in
place. The mark is measured from the tabs, so a bar that is not laid out yet
(a hidden panel, a closed accordion section) shows the active tab's own mark
until it is, and nothing depends on timing.

<preview>
  <NbTabs :items="clientTabs" />
  <NbTabs :items="authTabs" variant="contained" />
</preview>

```vue
<template>
  <NbTabs :items="authTabs" variant="contained" v-model="mode" />
</template>
```

## Icons and badges

An item can carry an `icon` before its label and a `badge` after it. Keep the
badge to a count or a very short status: it competes with the label for room.

<preview>
  <NbTabs :items="decoratedTabs" />
</preview>

```vue
<script setup lang="ts">
const items = [
  { id: 'files', label: 'Files', icon: 'folder' },
  { id: 'issues', label: 'Issues', icon: 'warning-circle', badge: 12 },
]
</script>
```

## More tabs than fit

There is nothing to opt into. When the tabs are wider than their container (a
side panel, a split view, or simply many tabs), the bar scrolls sideways
instead of running past the edge, at any screen width. It snaps loosely to tab
edges, shows no scrollbar, and fades the edge that has more tabs behind it. The
active tab is always brought fully into view, on load and whenever it changes,
by scrolling the bar itself and never the page around it.

The bar measures its own container, not the screen, so the same tabs scroll in
a narrow panel and sit still in a wide one. A bar whose tabs fit renders
exactly as it always has.

<preview>
  <div style="max-width: 320px">
    <NbTabs :items="detailTabs" v-model="detailTab" />
  </div>
</preview>

```vue
<template>
  <aside class="side-panel">
    <NbTabs :items="items" v-model="activeTab" />
  </aside>
</template>
```

## Props

| Prop         | Type                    | Default     | Description                                             |
| ------------ | ----------------------- | ----------- | ------------------------------------------------------- |
| `items`      | `ITabItem[]`            | required    | Tabs to render, in display order                        |
| `modelValue` | `string`                | `undefined` | Id of the selected tab, falls back to the first enabled |
| `variant`    | `'line' \| 'contained'` | `'line'`    | Underlined text tabs, or a filled segmented control     |
| `size`       | `'sm' \| 'md' \| 'lg'`  | `'md'`      | Control size                                            |
| `disabled`   | `boolean`               | `false`     | Disables every tab in the bar                           |
| `fullWidth`  | `boolean`               | `false`     | Stretches tabs to share the available width equally     |
| `ariaLabel`  | `string`                | `undefined` | Accessible name of the tab bar, nothing is rendered     |
| `id`         | `string`                | `undefined` | Explicit id, auto-generated when omitted                |

## ITabItem

| Field      | Type               | Description                                      |
| ---------- | ------------------ | ------------------------------------------------ |
| `id`       | `string`           | Stable id, used as the model value and slot name |
| `label`    | `string`           | Visible tab text                                 |
| `icon`     | `string`           | Optional icon name rendered before the label     |
| `badge`    | `string \| number` | Optional count or short status after the label   |
| `disabled` | `boolean`          | Prevents selection and dims the tab              |

## Events

| Event               | Payload                      | Description                     |
| ------------------- | ---------------------------- | ------------------------------- |
| `update:modelValue` | `id: string`                 | The newly selected tab id       |
| `change`            | `id: string, item: ITabItem` | The newly selected tab and item |

Neither event fires when the already active tab is clicked.

## Slots

| Slot        | Props            | Description                                          |
| ----------- | ---------------- | ---------------------------------------------------- |
| `[item.id]` | `item: ITabItem` | Panel for that tab, rendered only while it is active |

Keys, roles and what you own are on the [Accessibility](/components/tabs/accessibility) tab.

<!--@include: ./_shared.md-->
