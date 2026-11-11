---
layout: nubisco
title: Text Input
intro: '`NbTextInput` is the primary text entry component. It wraps a native `<input>` or `<textarea>` with a label, validation messages, two layout variants, and four sizes. It is designed to sit flush on the same grid line as buttons and other form controls.'
source: src/components/TextInput.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
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

The four sizes are the same heights as `NbButton`'s, so a field and a button of the same `size` line up.

<preview dir="row">
  <NbTextInput v-model="sizeXs" size="xs" label="Extra small" placeholder="xs: 24px" style="width: 220px" />
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

## Content

- **The label is a noun phrase of one to three words**, sentence case, no colon and no period: `Email address`, `Project name`.
- **A placeholder is optional, and the default is none.** When you add one it shows the shape of the value (`ACME-1024`), never an instruction, and never anything the user needs once they start typing.
- **`helper` says what the user needs before they answer**, as a sentence with a period, or a fragment without one (`Maximum 200 characters`).
- **`error` names the fix, not the failure**: `Enter a work email address`, not `Invalid input`. Two lines at most.
- **State a limit the user can hit.** With `maxlength`, add `show-count` so the limit is visible before it stops them.

Casing, punctuation and tone are set library-wide, not by this component: [Writing style](/content/writing-style) is the source.

<!--@include: ./_shared.md-->
