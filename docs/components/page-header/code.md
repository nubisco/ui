---
layout: nubisco
title: Page Header
intro: "`NbPageHeader` is the top of a page: where it sits, what it is called, the one state it is in, the few facts that define it, and what can be done to it. It renders the page's one `<h1>`."
source: src/components/PageHeader.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## A record view

```vue
<template>
  <NbPageHeader :title="record.title" :actions="actions" sticky>
    <template #eyebrow>
      <span>Part of</span>
      <RouterLink :to="parentRoute">{{ record.parent.title }}</RouterLink>
      <code>{{ record.key }}</code>
    </template>
    <template #status>
      <NbBadge :variant="statusVariant">{{ statusLabel }}</NbBadge>
    </template>
    <template #facts>
      <NbDefinitionList layout="auto" compact>
        <NbDefinitionListItem term="Owner">{{
          record.owner
        }}</NbDefinitionListItem>
        <NbDefinitionListItem term="Target">{{
          record.target
        }}</NbDefinitionListItem>
      </NbDefinitionList>
    </template>
  </NbPageHeader>
</template>

<script setup lang="ts">
import type { IActionGroupItem } from '@nubisco/ui'

const actions: IActionGroupItem[] = [
  {
    id: 'edit',
    label: 'Edit',
    icon: 'pencil-simple',
    variant: 'primary',
    priority: 'primary',
    onSelect: edit,
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: 'archive',
    variant: 'ghost',
    onSelect: archive,
  },
]
</script>
```

## Actions as a slot

Use the slot when the actions are not a list of buttons, a split button or a
menu, say. A filled `primary` in the slot still counts towards the one-primary
warning.

```vue
<NbPageHeader title="Quarterly report">
  <template #actions>
    <NbButton variant="tertiary">Export</NbButton>
    <NbButton variant="primary">Publish</NbButton>
  </template>
</NbPageHeader>
```

## Props

| Prop      | Type                 | Default     | Description                                                                   |
| --------- | -------------------- | ----------- | ----------------------------------------------------------------------------- |
| `title`   | `string`             | `undefined` | The page's name, as its one `<h1>`. The `title` slot replaces it.             |
| `actions` | `IActionGroupItem[]` | `undefined` | The page's actions, through `NbActionGroup` with `overflow="phone"`.          |
| `sticky`  | `boolean`            | `false`     | Stick to the top of the scroll container, with a surface and a rule under it. |

## Slots

| Slot          | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| `eyebrow`     | Above the title: what the thing belongs to, its key.                        |
| `title`       | Replaces `title`, inside the `<h1>`: an inline editor, a title with a mark. |
| `status`      | One `NbBadge`. Warns in development when it holds more than one element.    |
| `description` | Under the title: one or two sentences.                                      |
| `facts`       | Under the description: an `NbDefinitionList` with `layout="auto"`.          |
| `actions`     | After the `actions` prop's group: any other control.                        |
