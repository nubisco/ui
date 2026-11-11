---
layout: nubisco
title: Content Switcher
intro: '`NbContentSwitcher` switches between alternate views of the same content: a list or a grid, this week or this month. One outlined row of equal options, the selected one filled, and a radio group to assistive technology.'
source: src/components/ContentSwitcher.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<script setup lang="ts">
import { ref } from 'vue'
const period = ref('week')
const view = ref('list')
</script>

<preview>
  <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
    <NbContentSwitcher
      v-model="period"
      label="Period"
      :items="[
        { id: 'day', label: 'Day' },
        { id: 'week', label: 'Week' },
        { id: 'month', label: 'Month' },
      ]"
    />
    <NbContentSwitcher
      v-model="view"
      label="View"
      icon-only
      size="sm"
      :items="[
        { id: 'list', label: 'List', icon: 'list' },
        { id: 'grid', label: 'Grid', icon: 'squares-four' },
      ]"
    />
  </div>
</preview>

```vue
<NbContentSwitcher v-model="period" label="Period" :items="periods" />
<NbContentSwitcher v-model="view" label="View" icon-only :items="views" />
```

## When to use it

- To show the same content another way. The content stays, its
  presentation changes.
- Not to move between different content: that is [`NbTabs`](/components/tabs/usage).
- Not for a setting that is saved: that is a radio group or a select.
- Two to five options. More than that does not read as one choice.

## Icon only

`icon-only` drops the text. Each label becomes its button's accessible name
and its tooltip, through `NbButton`'s `label`, so give every item an `icon`.
An item without one keeps its text.
