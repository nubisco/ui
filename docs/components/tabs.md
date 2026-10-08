---
layout: nubisco
title: Tabs
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbTabs` switches between sections of the same page. Give it an `items` array
and bind `v-model` to the id of the section on screen. It renders the tab bar
and, when you fill the matching slot, the panel below it.

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

<preview>
  <NbTabs :items="clientTabs" />
  <NbTabs :items="authTabs" variant="contained" />
</preview>

```vue
<template>
  <NbTabs :items="authTabs" variant="contained" v-model="mode" />
</template>
```

## Sizes

`md` is the baseline. Use `sm` on dense surfaces such as inspectors and side
panels, and `lg` when the tabs head a full page.

<preview>
  <NbTabs :items="clientTabs" size="sm" />
  <NbTabs :items="clientTabs" size="md" />
  <NbTabs :items="clientTabs" size="lg" />
</preview>

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

</doc-tab>

<doc-tab name="Api">

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

## Keyboard

| Key                       | Action                                        |
| ------------------------- | --------------------------------------------- |
| <kbd>Tab</kbd>            | Moves into the bar, landing on the active tab |
| <kbd>←</kbd> <kbd>→</kbd> | Selects the previous or next tab, wrapping    |
| <kbd>Home</kbd>           | Selects the first tab                         |
| <kbd>End</kbd>            | Selects the last tab                          |

Arrow keys select as they move (automatic activation), which the WAI-ARIA tabs
pattern recommends when showing a panel is cheap.

## Accessibility

- The bar is a `role="tablist"`, each tab a `role="tab"`, each rendered panel a
  `role="tabpanel"` labelled by its tab.
- Only the active tab is in the tab order (roving `tabindex`), so the bar is a
  single stop rather than one per tab.
- `aria-controls` is set only when a panel is actually rendered, so it never
  points at a missing element.
- Name the bar with `ariaLabel` when a page carries more than one set of tabs.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const clientTabs = [
  { id: 'settings', label: 'Settings' },
  { id: 'hours', label: 'Hours' },
  { id: 'invoices', label: 'Invoices' },
]

const authTabs = [
  { id: 'sign-in', label: 'Sign in' },
  { id: 'sign-up', label: 'Sign up' },
]

const decoratedTabs = [
  { id: 'files', label: 'Files', icon: 'folder' },
  { id: 'issues', label: 'Issues', icon: 'warning-circle', badge: 12 },
  { id: 'history', label: 'History', icon: 'clock-counter-clockwise' },
]

const partiallyDisabledTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'billing', label: 'Billing', disabled: true },
  { id: 'members', label: 'Members' },
]

const activeTab = ref('settings')

const availableProps = [
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    options: [
      { value: 'line', label: 'Line' },
      { value: 'contained', label: 'Contained' },
    ],
    default: 'line',
  },
  {
    label: 'Size',
    name: 'size',
    type: 'single',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
    ],
    default: 'md',
  },
  {
    label: 'Full width',
    name: 'fullWidth',
    type: 'boolean',
    placeholder: 'Share the width equally',
    default: false,
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    placeholder: 'Disable every tab',
    default: false,
  },
]
</script>
