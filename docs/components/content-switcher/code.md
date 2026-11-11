---
layout: nubisco
title: Content Switcher
intro: '`NbContentSwitcher` switches between alternate views of the same content: a list or a grid, this week or this month. One outlined row of equal options, the selected one filled, and a radio group to assistive technology.'
source: src/components/ContentSwitcher.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Props

| Prop         | Type                     | Default  | Description                                |
| ------------ | ------------------------ | -------- | ------------------------------------------ |
| `modelValue` | `string`                 |          | The selected item's `id` (`v-model`)       |
| `items`      | `IContentSwitcherItem[]` | required | The options, in order                      |
| `label`      | `string`                 | required | What the choice is about: the group's name |
| `iconOnly`   | `boolean`                | `false`  | Icons only, labels as names and tooltips   |
| `size`       | `'sm' \| 'md' \| 'lg'`   | `'md'`   | 32, 40 or 48px                             |

## IContentSwitcherItem

| Field      | Type          | Description                                  |
| ---------- | ------------- | -------------------------------------------- |
| `id`       | `string`      | Stable key, and the `v-model` value          |
| `label`    | `string`      | The text, or the name and tooltip icon-only  |
| `icon`     | `TIconSource` | Needed for `iconOnly`                        |
| `disabled` | `boolean`     | Takes the option out of the choice, in place |

## Events

| Event               | Payload      | Fired when                  |
| ------------------- | ------------ | --------------------------- |
| `update:modelValue` | `id: string` | Another option was selected |
