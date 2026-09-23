---
layout: nubisco
title: Label
tabs: ['Usage', 'Accessibility', 'Api']
---

<doc-tab name="Usage">

`NbLabel` is a lightweight label element for associating descriptive text with form controls. Use it standalone or let `NbTextInput` manage it automatically.

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

## Required field

<preview>
  <NbLabel for="req-input" required>API key</NbLabel>
  <input id="req-input" type="text" placeholder="sk-..." />
</preview>

## Sizes

<preview>
  <NbLabel size="md">Medium (default): 12px</NbLabel>
  <NbLabel size="sm">Small: 11px, uppercase</NbLabel>
</preview>

## Disabled

<preview>
  <NbLabel disabled>Read-only field</NbLabel>
</preview>

</doc-tab>

<doc-tab name="Accessibility">

## Accessibility

- Renders a native `<label>` element; clicking it focuses the associated input via `for`.
- The required asterisk is `aria-hidden="true"` so screen readers use the `required` attribute on the input instead.

</doc-tab>

<doc-tab name="Api">

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

</doc-tab>
