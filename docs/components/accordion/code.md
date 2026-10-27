---
layout: nubisco
title: Accordion
intro: '`NbAccordion` is a stack of headings that reveal their content when clicked. It is the plain disclosure for page body: [`NbShellPanel`](/components/shell-panel/usage) looks similar but is an inspector section, carrying a size control and expecting a panel rail around it.'
source: src/components/Accordion.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Controlled

Bind `v-model` to drive which sections are open from outside, for example to open one from a URL. The value is always an array, including when `multiple` is false, so the binding does not change shape if you change your mind later.

```vue
<script setup>
const open = ref(['shipping'])
</script>

<template>
  <NbAccordion v-model="open" multiple>
    <NbAccordionItem id="shipping" title="Shipping" />
    <NbAccordionItem id="returns" title="Returns" />
  </NbAccordion>
</template>
```

Pass an explicit `id` on every item when you do this. Without one an id is generated, and a generated id is not a thing you can meaningfully persist.

## NbAccordion props

| Prop         | Type                   | Default | Description                                                            |
| ------------ | ---------------------- | ------- | ---------------------------------------------------------------------- |
| `modelValue` | `string[]`             | —       | Ids of the open items. Always an array, whatever `multiple` is set to. |
| `multiple`   | `boolean`              | `false` | Allow more than one item open at once.                                 |
| `flush`      | `boolean`              | `false` | Drop the side inset and the outer border, for panels and sidebars.     |
| `align`      | `'start' \| 'end'`     | `'end'` | Chevron placement. `start` reads as a tree; prefer `end`.              |
| `size`       | `'sm' \| 'md' \| 'lg'` | `'md'`  | Row height: 32, 40 or 48px.                                            |

## NbAccordion events

| Event               | Payload                       | Description                                                                   |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| `update:modelValue` | `string[]`                    | The new set of open ids.                                                      |
| `toggle`            | `[id: string, open: boolean]` | One item changed. Cheaper than diffing `modelValue` to lazily load a section. |

## NbAccordionItem props

| Prop       | Type      | Default | Description                                                                 |
| ---------- | --------- | ------- | --------------------------------------------------------------------------- |
| `id`       | `string`  | auto    | Stable identifier used in `modelValue`. Pass one if the state is persisted. |
| `title`    | `string`  | `''`    | Header text. Use the `title` slot for anything richer.                      |
| `icon`     | `string`  | —       | Icon name, rendered before the title.                                       |
| `meta`     | `string`  | `''`    | Short text after the title: a count, a status.                              |
| `info`     | `string`  | —       | An info hint beside the title, saying what the section is.                  |
| `disabled` | `boolean` | `false` | Renders muted and cannot be toggled.                                        |

## NbAccordionItem slots

| Slot      | Description                                     |
| --------- | ----------------------------------------------- |
| `default` | The panel's content.                            |
| `title`   | Replaces the `title` prop.                      |
| `meta`    | Replaces the `meta` prop.                       |
| `actions` | Controls beside the header, outside its button. |
