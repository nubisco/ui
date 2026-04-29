---
layout: nubisco
title: Select
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbSelect` is a custom dropdown that replaces the native `<select>`. It shares the same design language as `NbTextInput`: two variants (default / fluid), error/warning states, multi-select support, and full keyboard navigation.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbSelect v-model="locale" v-bind="resultingProps" :options="localeOptions" />
</preview>

```vue
<template>
  <NbSelect
    v-model="locale"
    label="Locale"
    :options="[
      { label: 'English', value: 'en' },
      { label: 'Portuguese', value: 'pt' },
      { label: 'Spanish', value: 'es' },
    ]"
  />
</template>
```

## Variants

### Default

The label sits above the field. Helper/error/warning messages appear below.

<preview>
  <NbSelect v-model="locale" label="Locale" helper="Choose the target locale" :options="localeOptions" />
</preview>

### Fluid

The label is rendered inside the field at the top. Useful in dense forms or inline editors.

<preview>
  <NbSelect v-model="locale" variant="fluid" label="Locale" :options="localeOptions" />
</preview>

```vue
<template>
  <NbSelect
    v-model="value"
    variant="fluid"
    label="Status"
    :options="statusOptions"
  />
</template>
```

## Validation states

<preview>
  <NbSelect v-model="locale" label="Locale" error="A locale is required" :options="localeOptions" />
  <NbSelect v-model="locale" label="Locale" warning="This locale has no translations yet" :options="localeOptions" />
</preview>

## Disabled

<preview>
  <NbSelect v-model="locale" label="Locale" disabled :options="localeOptions" />
</preview>

## Multi-select

Set `:multiple="true"` and bind to an array. The trigger displays the item label when 1 is selected, a comma-separated list for 2, and `N selected` for 3 or more.

<preview>
  <NbSelect v-model="selectedLocales" label="Target locales" :options="localeOptions" :multiple="true" />
</preview>

```vue
<template>
  <NbSelect
    v-model="selected"
    label="Target locales"
    :options="localeOptions"
    :multiple="true"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const selected = ref<string[]>([])
</script>
```

## Creatable

Set `:creatable="true"` to show a text input at the bottom of the dropdown. When the user types a value and presses Enter, the `create` event fires with the entered string. You can then add it to your options array.

<preview>
  <NbSelect v-model="locale" label="Locale" :options="localeOptions" creatable create-placeholder="New locale..." @create="onCreateOption" />
</preview>

```vue
<template>
  <NbSelect
    v-model="locale"
    label="Locale"
    :options="options"
    creatable
    create-placeholder="New locale..."
    @create="onCreate"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const locale = ref('en')
const options = ref([
  { label: 'English', value: 'en' },
  { label: 'Portuguese', value: 'pt' },
])

function onCreate(value: string) {
  options.value.push({ label: value, value: value.toLowerCase() })
}
</script>
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop                | Type                                                | Default        | Description                                 |
| ------------------- | --------------------------------------------------- | -------------- | ------------------------------------------- |
| `modelValue`        | `string \| number \| Array<string\|number> \| null` | `null`         | Current selection (`v-model`)               |
| `options`           | `ISelectOption[]`                                   | `[]`           | Array of options                            |
| `multiple`          | `boolean`                                           | `false`        | Allow multiple selections                   |
| `creatable`         | `boolean`                                           | `false`        | Show a text input for creating new options  |
| `createPlaceholder` | `string`                                            | `'Add new...'` | Placeholder for the create input            |
| `variant`           | `'default' \| 'fluid'`                              | `'default'`    | Layout variant                              |
| `label`             | `string`                                            | -              | Label text                                  |
| `placeholder`       | `string`                                            | `'Select…'`    | Placeholder when nothing is selected        |
| `helper`            | `string`                                            | -              | Persistent helper text below the field      |
| `error`             | `string`                                            | -              | Error message — triggers error state        |
| `warning`           | `string`                                            | -              | Warning message — triggers warning state    |
| `disabled`          | `boolean`                                           | `false`        | Disables the select                         |
| `required`          | `boolean`                                           | `false`        | Marks the field as required (adds `*`)      |
| `id`                | `string`                                            | auto           | Native input id (auto-generated if omitted) |
| `name`              | `string`                                            | -              | Native form name                            |

## Option interface

```typescript
interface ISelectOption {
  label: string
  value: string | number
  disabled?: boolean
}
```

## Events

| Event               | Payload                                             | Description                                                                           |
| ------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `update:modelValue` | `string \| number \| Array<string\|number> \| null` | Emitted on every selection change                                                     |
| `change`            | same as above                                       | Also emitted on every change                                                          |
| `create`            | `string`                                            | Emitted when the user submits a new value via the create input (requires `creatable`) |

## Exposed

```typescript
const selectRef = ref<InstanceType<typeof NbSelect>>()
selectRef.value?.open() // programmatically open the dropdown
selectRef.value?.close() // programmatically close the dropdown
```

## Keyboard navigation

| Key               | Action                         |
| ----------------- | ------------------------------ |
| `Enter` / `Space` | Open dropdown / select item    |
| `↑` / `↓`         | Move highlight through options |
| `Escape` / `Tab`  | Close dropdown                 |

## Accessibility

- The trigger button announces `aria-expanded`, `aria-haspopup="listbox"`, and `aria-controls` pointing at the dropdown.
- Each option has `role="option"` with `aria-selected` and `aria-disabled`.
- The `for`/`id` association is handled automatically.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const locale = ref('en')
const selectedLocales = ref<string[]>([])

const localeOptions = [
  { label: 'English', value: 'en' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
]

function onCreateOption(value: string) {
  localeOptions.push({ label: value, value: value.toLowerCase() })
}

const availableProps = [
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    default: 'default',
    placeholder: 'Layout variant',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Fluid', value: 'fluid' },
    ],
  },
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Locale',
    placeholder: 'Label text',
  },
  {
    label: 'Placeholder',
    name: 'placeholder',
    type: 'string',
    default: 'Select…',
    placeholder: 'Placeholder text',
  },
  {
    label: 'Helper',
    name: 'helper',
    type: 'string',
    default: '',
    placeholder: 'Helper text',
  },
  {
    label: 'Error',
    name: 'error',
    type: 'string',
    default: undefined,
    placeholder: 'Error message',
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    default: false,
    placeholder: 'Disable the select',
  },
  {
    label: 'Required',
    name: 'required',
    type: 'boolean',
    default: false,
    placeholder: 'Mark as required',
  },
  {
    label: 'Multiple',
    name: 'multiple',
    type: 'boolean',
    default: false,
    placeholder: 'Allow multiple selections',
  },
]
</script>
