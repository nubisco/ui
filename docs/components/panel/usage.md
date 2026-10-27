---
layout: nubisco
title: Panel
intro: '`NbPanel` is a surface container that groups related content inside a styled card. It provides a consistent background, border, and spacing out of the box.'
source: src/components/Panel.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview>
  <NbPanel>
    <p style="margin: 0">Simple panel with default styling.</p>
  </NbPanel>
</preview>

```vue
<template>
  <NbPanel>
    <p>Simple panel with default styling.</p>
  </NbPanel>
</template>
```

## Nesting content

Panels accept any slotted content, including other components.

<preview>
  <NbPanel>
    <NbGrid dir="row" gap="md">
      <NbGrid dir="col" grow>
        <NbTextInput label="First name" placeholder="Jane" />
      </NbGrid>
      <NbGrid dir="col" grow>
        <NbTextInput label="Last name" placeholder="Doe" />
      </NbGrid>
    </NbGrid>
  </NbPanel>
</preview>
