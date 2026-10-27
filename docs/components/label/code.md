---
layout: nubisco
title: Label
intro: '`NbLabel` is a lightweight label element for associating descriptive text with form controls. Use it standalone or let `NbTextInput` manage it automatically.'
source: src/components/Label.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Basic Usage

<preview>
  <NbLabel for="demo-input">Workspace name</NbLabel>
  <input id="demo-input" type="text" placeholder="my-workspace" />
</preview>

```vue
<template>
  <NbLabel for="my-input">Workspace name</NbLabel>
  <input id="my-input" type="text" placeholder="my-workspace" />
</template>
```

## Props

| Prop       | Type           | Default     | Description                                       |
| ---------- | -------------- | ----------- | ------------------------------------------------- |
| `for`      | `string`       | `undefined` | Maps to the HTML `for` attribute (links to input) |
| `required` | `boolean`      | `false`     | Appends a red `*` asterisk                        |
| `disabled` | `boolean`      | `false`     | Reduces opacity                                   |
| `size`     | `'sm' \| 'md'` | `'md'`      | `sm` renders 11px uppercase; `md` renders 12px    |

## Slots

| Slot      | Description    |
| --------- | -------------- |
| `default` | The label text |
