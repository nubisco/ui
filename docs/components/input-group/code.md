---
layout: nubisco
title: Input Group
intro: '`NbInputGroup` joins a field and the buttons that act on it into one control: an email with its Invite button, a link with Copy, a quantity with Add. Every box in the row is the same height, from the scale fields and buttons share, and the edges where they meet are joined.'
source: src/components/InputGroup.vue
tab: code
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Props

| Prop       | Type                           | Default | Description                                                         |
| ---------- | ------------------------------ | ------- | ------------------------------------------------------------------- |
| `label`    | `string`                       | -       | The label above the row. It points at the first field in the group. |
| `helper`   | `string`                       | -       | Helper text below the row, when there is no error or warning        |
| `error`    | `string`                       | -       | Error below the row. The fields draw their error state.             |
| `warning`  | `string`                       | -       | Warning below the row. The fields draw their warning state.         |
| `size`     | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'`  | The height of every control in the row                              |
| `disabled` | `boolean`                      | `false` | Disables the fields. Buttons read the slot's `disabled`.            |
| `required` | `boolean`                      | `false` | Marks the label as required                                         |
| `id`       | `string`                       | auto    | The first field's id, which the label points at                     |

## Slots

| Slot      | Props                                 | Description                         |
| --------- | ------------------------------------- | ----------------------------------- |
| `default` | `{ size: string, disabled: boolean }` | One field and the buttons beside it |

## A button on each side

Order is up to you: a group squares whichever edges touch.

```vue
<template>
  <NbInputGroup label="Quantity" size="sm">
    <template #default="{ size, disabled }">
      <NbButton variant="secondary" :size="size" :disabled="disabled">
        Reset
      </NbButton>
      <NbNumberInput v-model="quantity" :min="0" />
      <NbButton variant="primary" :size="size" :disabled="disabled">
        Add
      </NbButton>
    </template>
  </NbInputGroup>
</template>
```

## How the fields join

A field draws its corners through the `field.radius` mixin (`src/styles/logic/_field.scss`), which reads `--nb-field-radius-start` and `--nb-field-radius-end` before the field's own radius. The group sets them to zero on the inner side of each child, so a field squares the right corners without knowing it is in a group. Build a custom field the same way and it joins a group too.

<!--@include: ./_shared.md-->
