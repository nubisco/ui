---
layout: nubisco
title: Text Input
intro: '`NbTextInput` is the primary text entry component. It wraps a native `<input>` or `<textarea>` with a label, validation messages, two layout variants, and three sizes. It is designed to sit flush on the same grid line as buttons and other form controls.'
source: src/components/TextInput.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview :props="availableProps" dir="row" v-slot="{ resultingProps }">
  <NbTextInput v-bind="resultingProps" v-model="stageValue" />
</preview>

```vue
<template>
  <NbTextInput
    v-model="value"
    label="Label"
    placeholder="Placeholder"
    helper="Helper text"
  />
</template>
```

## Sizes

All three sizes align to the 8px base-unit grid.

<preview dir="row">
  <NbTextInput v-model="sizeSm" size="sm" label="Small" placeholder="sm: 32px" style="width: 220px" />
  <NbTextInput v-model="sizeMd" size="md" label="Medium" placeholder="md: 40px (default)" style="width: 220px" />
  <NbTextInput v-model="sizeLg" size="lg" label="Large" placeholder="lg: 48px" style="width: 220px" />
</preview>

## Validation states

`error` takes priority over `warning`, which takes priority over `helper`.

<preview dir="row">
  <NbTextInput v-model="stateError" label="Slug" placeholder="my-project" error="Slug is already taken." style="width: 260px" />
  <NbTextInput v-model="stateWarning" label="Description" placeholder="A short description…" warning="Exceeds recommended 120 characters." style="width: 260px" />
  <NbTextInput v-model="stateHelper" label="API key" placeholder="sk-…" helper="Keep this secret." style="width: 260px" />
</preview>

## Disabled and read-only

<preview dir="row">
  <NbTextInput label="Disabled" model-value="Frozen value" disabled style="width: 240px" />
  <NbTextInput label="Read-only" model-value="Cannot be changed" readonly style="width: 240px" />
</preview>

<!--@include: ./_shared.md-->
