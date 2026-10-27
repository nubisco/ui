---
layout: nubisco
title: Text Input
intro: '`NbTextInput` is the primary text entry component. It wraps a native `<input>` or `<textarea>` with a label, validation messages, two layout variants, and three sizes. It is designed to sit flush on the same grid line as buttons and other form controls.'
source: src/components/TextInput.vue
tab: code
pageTabs: ['usage', 'code']
---

## Variants

The `variant` prop controls how the label and messages are positioned relative to the field box.

### Default

Label sits above the field, message below. Standard form layout.

<preview dir="row">
  <NbTextInput v-model="variantDefault" label="Translation key" placeholder="auth.login.title" helper="Use dot-separated notation." required style="width: 300px" />
</preview>

### Fluid

Label and message icon live inside the field box. Useful in dense toolbars or inspector panels.

<preview dir="row">
  <NbTextInput v-model="variantFluid" variant="fluid" label="Translation key" placeholder="auth.login.title" helper="Use dot-separated notation." required style="width: 300px" />
</preview>

```vue
<template>
  <NbTextInput v-model="value" variant="fluid" label="Label" />
</template>
```

## Multiline

Set `multiline` to render a `<textarea>`. Use `rows` to control the initial height.

<preview dir="row">
  <NbTextInput v-model="multilineVal" label="Notes" placeholder="Write something…" multiline :rows="4" helper="Supports freeform text." style="width: 360px" />
</preview>

```vue
<template>
  <NbTextInput v-model="value" label="Notes" multiline :rows="4" />
</template>
```

## Inline actions slot

Use the `#actions` slot to place buttons inside the field at the trailing edge (default variant only).

<preview dir="row">
  <NbTextInput v-model="actionsVal" label="AI Translate" placeholder="Enter source text…" style="width: 360px">
    <template #actions>
      <NbButton size="sm" variant="ghost">
        <NbIcon name="sparkle" :size="14" />
      </NbButton>
    </template>
  </NbTextInput>
</preview>

```vue
<template>
  <NbTextInput v-model="value" label="AI Translate">
    <template #actions>
      <NbButton size="sm" variant="ghost">
        <NbIcon name="sparkle" :size="14" />
      </NbButton>
    </template>
  </NbTextInput>
</template>
```

## Suggestions

The `#dropdown` slot holds a popup anchored to the field. For autocomplete (an @mention, a reference, a tag) put an [`NbSuggestionList`](/components/suggestion-list/usage) in it: it takes the keyboard from the field and makes it a combobox, so you only decide when it opens and what it offers.

## Props

| Prop          | Type                   | Default     | Description                                         |
| ------------- | ---------------------- | ----------- | --------------------------------------------------- |
| `modelValue`  | `string \| number`     | `''`        | Bound value (`v-model`)                             |
| `variant`     | `'default' \| 'fluid'` | `'default'` | Layout variant                                      |
| `size`        | `'sm' \| 'md' \| 'lg'` | `'md'`      | Field height — aligns with buttons and other inputs |
| `type`        | `string`               | `'text'`    | Native input type                                   |
| `label`       | `string`               | -           | Label text                                          |
| `placeholder` | `string`               | -           | Input placeholder                                   |
| `helper`      | `string`               | -           | Helper message (shown when no error or warning)     |
| `error`       | `string`               | -           | Error message: highest priority                     |
| `warning`     | `string`               | -           | Warning message: priority over helper               |
| `required`    | `boolean`              | `false`     | Marks field as required (adds asterisk)             |
| `disabled`    | `boolean`              | `false`     | Disables the input                                  |
| `readonly`    | `boolean`              | `false`     | Makes the input read-only                           |
| `multiline`   | `boolean`              | `false`     | Render a `<textarea>` instead of `<input>`          |
| `rows`        | `number`               | -           | Initial textarea row count (multiline only)         |
| `id`          | `string`               | auto        | Explicit input ID                                   |
| `name`        | `string`               | -           | Native `name` attribute                             |
| `maxlength`   | `number`               | -           | Maximum character length                            |

## Events

| Event               | Payload            | Description                |
| ------------------- | ------------------ | -------------------------- |
| `update:modelValue` | `string \| number` | Emitted on every keystroke |

## Slots

| Slot       | Description                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------- |
| `label`    | Custom label content (replaces the `label` prop text)                                             |
| `actions`  | Buttons or icons rendered at the trailing edge (default only)                                     |
| `dropdown` | A popup anchored to the field, such as an [`NbSuggestionList`](/components/suggestion-list/usage) |

## Exposed

| Name       | Type                                           | Description                              |
| ---------- | ---------------------------------------------- | ---------------------------------------- |
| `focus`    | `() => void`                                   | Focuses the input                        |
| `blur`     | `() => void`                                   | Blurs the input                          |
| `nativeEl` | `Ref<HTMLInputElement \| HTMLTextAreaElement>` | The native field, for the caret position |

<!--@include: ./_shared.md-->
