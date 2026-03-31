---
layout: nubisco
title: Text Input
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbTextInput` is the primary text entry component. It wraps a native `<input>` or `<textarea>` with a label, validation messages, two layout variants, and three sizes. It is designed to sit flush on the same grid line as buttons and other form controls.

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

</doc-tab>

<doc-tab name="Api">

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

| Slot      | Description                                                   |
| --------- | ------------------------------------------------------------- |
| `label`   | Custom label content (replaces the `label` prop text)         |
| `actions` | Buttons or icons rendered at the trailing edge (default only) |

## Exposed

| Name    | Type         | Description       |
| ------- | ------------ | ----------------- |
| `focus` | `() => void` | Focuses the input |
| `blur`  | `() => void` | Blurs the input   |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
import type { PreviewPropDef } from '../../.vitepress/components/Preview.d'

const stageValue = ref('')

const availableProps: PreviewPropDef[] = [
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    default: 'default',
    placeholder: 'Layout variant: default or fluid',
    options: [
      { label: 'default', value: 'default' },
      { label: 'fluid', value: 'fluid' },
    ],
  },
  {
    label: 'Size',
    name: 'size',
    type: 'single',
    default: 'md',
    placeholder: 'Field height (aligns with buttons)',
    options: [
      { label: 'sm: 32px', value: 'sm' },
      { label: 'md: 40px', value: 'md' },
      { label: 'lg: 48px', value: 'lg' },
    ],
  },
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Label',
    placeholder: 'Text shown above or inside the field',
  },
  {
    label: 'Placeholder',
    name: 'placeholder',
    type: 'string',
    default: 'Placeholder…',
    placeholder: 'Input placeholder text',
  },
  {
    label: 'Helper',
    name: 'helper',
    type: 'string',
    default: 'I am helping a lot',
    placeholder: 'Help text shown when no error or warning',
  },
  {
    label: 'Error',
    name: 'error',
    type: 'string',
    default: undefined,
    placeholder: 'Error message: highest priority',
  },
  {
    label: 'Warning',
    name: 'warning',
    type: 'string',
    default: undefined,
    placeholder: 'Warning message: priority over helper',
  },
  {
    label: 'Required',
    name: 'required',
    type: 'boolean',
    default: false,
    placeholder: 'Marks the field as required',
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    default: false,
    placeholder: 'Disables the input',
  },
  {
    label: 'Read-only',
    name: 'readonly',
    type: 'boolean',
    default: false,
    placeholder: 'Makes the input read-only',
  },
  {
    label: 'Multiline',
    name: 'multiline',
    type: 'boolean',
    default: false,
    placeholder: 'Renders a textarea instead of input',
  },
]

const variantDefault = ref('')
const variantFluid = ref('')
const sizeSm = ref('')
const sizeMd = ref('')
const sizeLg = ref('')
const stateError = ref('my-project')
const stateWarning = ref('A rather long description that probably exceeds the limit.')
const stateHelper = ref('')
const multilineVal = ref('')
const actionsVal = ref('')
</script>
