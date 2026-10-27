---
layout: nubisco
title: Switch
intro: '`NbSwitch` is a toggle control that represents an on/off binary state. It supports labels, sizes, variants, and a verbose mode that shows the current state as text.'
source: src/components/Switch.vue
tab: code
pageTabs: ['usage', 'code']
---

## A label only for assistive technology

Every switch needs a label, because it is the input's accessible name. When the
row around the switch already says what it controls, for example a list of
panels each with its own title, set `hide-label`: the label stays the switch's
name for a screen reader but is not shown.

```vue
<NbSwitch v-model="shown" name="panel-goals" label="Show Goals" hide-label />
```

## Props

| Prop         | Type                       | Default     | Description                        |
| ------------ | -------------------------- | ----------- | ---------------------------------- |
| `modelValue` | `boolean`                  | `false`     | Current state (`v-model`)          |
| `name`       | `string`                   | required    | Native `name` attribute            |
| `label`      | `string`                   | -           | Label text shown beside the toggle |
| `size`       | `'sm' \| 'md' \| 'lg'`     | `'md'`      | Toggle size                        |
| `variant`    | `'primary' \| 'secondary'` | `'primary'` | Color variant for the active state |
| `verbose`    | `boolean`                  | `false`     | Show `On` / `Off` state text       |
| `disabled`   | `boolean`                  | `false`     | Disable the toggle                 |

## Events

| Event               | Payload   | Description                        |
| ------------------- | --------- | ---------------------------------- |
| `update:modelValue` | `boolean` | Emitted when the toggle is clicked |

<!--@include: ./_shared.md-->
