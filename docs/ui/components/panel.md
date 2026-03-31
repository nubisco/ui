---
layout: nubisco
title: Panel
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbPanel` is a surface container that groups related content inside a styled card. It provides a consistent background, border, and spacing out of the box.

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

## As a footer action bar

Panels are commonly used as a container for modal or form action buttons, keeping them visually separated from the main content.

<preview dir="row">
  <NbPanel>
    <NbGrid dir="row" gap="sm" justify="end">
      <NbButton variant="ghost">Cancel</NbButton>
      <NbButton variant="primary">Save</NbButton>
    </NbGrid>
  </NbPanel>
</preview>

```vue
<template>
  <NbPanel>
    <NbGrid dir="row" gap="sm" justify="end">
      <NbButton variant="ghost">Cancel</NbButton>
      <NbButton variant="primary">Save</NbButton>
    </NbGrid>
  </NbPanel>
</template>
```

</doc-tab>

<doc-tab name="Api">

## Slots

| Slot      | Description                        |
| --------- | ---------------------------------- |
| `default` | Any content to render inside Panel |

`NbPanel` is a pure layout container with no props of its own. Use CSS custom properties or inline styles to customize appearance.

</doc-tab>
