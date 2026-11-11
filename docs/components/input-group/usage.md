---
layout: nubisco
title: Input Group
intro: '`NbInputGroup` joins a field and the buttons that act on it into one control: an email with its Invite button, a link with Copy, a quantity with Add. Every box in the row is the same height, from the scale fields and buttons share, and the edges where they meet are joined.'
source: src/components/InputGroup.vue
tab: usage
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

<preview dir="col">
  <NbInputGroup label="Invite a member" helper="They get an email with a link to join." style="max-width: 420px">
    <NbTextInput v-model="email" type="email" placeholder="name@example.com" autocomplete="email" />
    <NbButton variant="primary">Invite</NbButton>
  </NbInputGroup>
</preview>

```vue
<template>
  <NbInputGroup label="Invite a member" :error="emailError">
    <NbTextInput v-model="email" type="email" autocomplete="email" />
    <NbButton variant="primary" @click="invite">Invite</NbButton>
  </NbInputGroup>
</template>
```

## When to use it

Use a group when the button only makes sense together with the field beside it: it submits that one value, copies it, or adds it to a list. A button that acts on the whole form (Save, Cancel) belongs in the form's footer, not in a group.

## The group owns the label and the message

Give `label`, `helper`, `error` and `warning` to the group, not to the fields inside it. The label sits above the row and the message below it, so the boxes in the row line up with each other rather than with whichever child happens to have a label. The fields inside take the group's error or warning state, and point at its message with `aria-describedby`.

<preview dir="col">
  <NbInputGroup label="Project URL" error="That address is already taken." style="max-width: 420px">
    <NbTextInput v-model="slug" placeholder="my-project" />
    <NbButton variant="ghost" icon="copy" label="Copy" />
  </NbInputGroup>
</preview>

## Size

`size` sets the height of every control in the row, from the scale fields and buttons share: `xs` 24, `sm` 32, `md` 40, `lg` 48. The fields inside take it over their own `size`, and a button is held to the same height. Pass the slot's `size` to your buttons too, so an icon-only button's icon is sized for it.

<preview dir="col">
  <NbInputGroup v-for="s in ['xs', 'sm', 'md', 'lg']" :key="s" :size="s" style="max-width: 360px">
    <template #default="{ size }">
      <NbSelect v-model="unit" :options="units" />
      <NbButton variant="secondary" :size="size">Apply</NbButton>
    </template>
  </NbInputGroup>
</preview>

## Works with

`NbTextInput`, `NbNumberInput`, `NbSelect` and `NbSearch` take the group's size, state and message. `NbButton` in any variant. Put one field in a group: two fields side by side are two controls, and belong in an `NbGrid`.

<!--@include: ./_shared.md-->
