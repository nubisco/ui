---
layout: nubisco
title: Select
intro: '`NbSelect` is a custom dropdown that replaces the native `<select>`. It shares the same design language as `NbTextInput`: two variants (default / fluid), error/warning states, multi-select support, and full keyboard navigation.'
source: src/components/Select.vue
tab: code
pageTabs: ['usage', 'code']
---

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

## Groups

Give options a `group` and the ones that share it, consecutively, are drawn
under one heading. Reach for it when a value only means something under a
field name: `1.12.0` says nothing on its own, `1.12.0` under **Fixes version**
says what it answers.

<preview>
  <NbSelect v-model="version" label="Version" :options="versionOptions" />
</preview>

```vue
<script setup lang="ts">
const options = [
  { label: '1.9.0', value: 'aff-190', group: 'Affects version' },
  { label: '1.11.0', value: 'aff-1110', group: 'Affects version' },
  { label: '1.12.0', value: 'aff-1120', group: 'Affects version' },
  { label: '1.9.0', value: 'fix-190', group: 'Fixes version' },
  { label: '1.12.0', value: 'fix-1120', group: 'Fixes version' },
]
</script>

<template>
  <NbSelect v-model="version" label="Version" :options="options" />
</template>
```

Three things worth knowing:

- **The order you give is the order you get.** A new heading starts wherever
  the group name changes, so options are never collected together behind your
  back. `1.9.0` before `1.11.0` stays that way, which alphabetical sorting
  would undo, and the same name appearing twice is two headings.
- **Two options may share a label.** They are told apart by `value`, so a
  versions list where both groups hold `1.12.0` works without inventing
  prefixes.
- **A heading is not an option.** It carries no `role="option"`, the arrow
  keys pass straight over it, and it is not selectable by any means. Faking
  one with a `disabled` option gives a screen reader a choice it may not make
  and costs a keystroke on the way past.

Mixing is fine: options without a `group` render as plain rows, and a list
where none of them has one is unchanged.

## Clearable

Set `clearable` on an optional select to show a clear button in the trigger
while a value is selected. It clears the selection to `null` (or `[]` with
`multiple`), emits `change`, and returns focus to the select. It is hidden
while nothing is selected and when the select is disabled. Use it instead of a
"None" option.

<preview>
  <NbGrid dir="column" gap="md">
    <NbSelect v-model="assignee" label="Assignee" placeholder="Unassigned" :options="localeOptions" clearable />
    <NbSelect v-model="clearableLocales" label="Locales" :options="localeOptions" multiple clearable />
  </NbGrid>
</preview>

```vue
<template>
  <NbSelect
    v-model="assignee"
    label="Assignee"
    placeholder="Unassigned"
    :options="options"
    clearable
  />
</template>
```

The button is named "Clear selection". Pass `clear-label` to name it in your
product's language.

## Searchable

Set `searchable` on a long list (countries, time zones, currencies) to show a
search box at the top of the open list. It takes focus when the list opens, so
the person types straight away, and each keystroke narrows the options. The
match is anywhere in the label, ignoring case and accents: "sao" finds "São
Tomé and Príncipe", and "cote" finds "Côte d'Ivoire".

<preview>
  <NbSelect v-model="country" label="Country" :options="countryOptions" searchable search-placeholder="Search countries" />
</preview>

```vue
<template>
  <NbSelect
    v-model="country"
    label="Country"
    :options="countries"
    searchable
    search-placeholder="Search countries"
  />
</template>
```

The first match is highlighted as you type, so <kbd>Enter</kbd> picks it.
<kbd>↑</kbd> and <kbd>↓</kbd> move through the matches without leaving the box,
and <kbd>Space</kbd> types a space instead of choosing. Closing the list clears
the search and returns focus to the select. When nothing matches, the list says
"No results"; pass `no-results-label` to say it in your product's language.

Search is for lists long enough to need it. Under about ten options, a plain
select is faster.

## Your own trigger

Fill the `trigger` slot to open the same list from a control of your own: a
chevron in a breadcrumb, an icon in a toolbar. The list, the search and the
keyboard stay `NbSelect`'s. Spread the slot's `attrs` on your button: it carries
`aria-expanded`, `aria-haspopup` and the click handler. Pass `anchor` (an element,
or a function that returns one) to hang the list under a larger thing than the
button, and `selected-mark="check"` to mark the chosen row with a check instead of
filling it, as a menu of places to go does. `NbBreadcrumbs` uses all three for
its switchers.

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

## Props

| Prop                | Type                                                | Default             | Description                                     |
| ------------------- | --------------------------------------------------- | ------------------- | ----------------------------------------------- |
| `modelValue`        | `string \| number \| Array<string\|number> \| null` | `null`              | Current selection (`v-model`)                   |
| `options`           | `ISelectOption[]`                                   | `[]`                | Array of options                                |
| `multiple`          | `boolean`                                           | `false`             | Allow multiple selections                       |
| `creatable`         | `boolean`                                           | `false`             | Show a text input for creating new options      |
| `createPlaceholder` | `string`                                            | `'Add new...'`      | Placeholder for the create input                |
| `clearable`         | `boolean`                                           | `false`             | Show a button that clears the selection         |
| `clearLabel`        | `string`                                            | `'Clear selection'` | Accessible name of the clear button             |
| `searchable`        | `boolean`                                           | `false`             | Show a search box at the top of the list        |
| `searchPlaceholder` | `string`                                            | `'Search…'`         | Placeholder and accessible name of the box      |
| `noResultsLabel`    | `string`                                            | `'No results'`      | Shown when nothing matches the search           |
| `selectedMark`      | `'fill' \| 'check'`                                 | `'fill'`            | How the chosen option is marked in the list     |
| `anchor`            | `HTMLElement \| (() => HTMLElement)`                | -                   | What the open list hangs under (with `trigger`) |
| `variant`           | `'default' \| 'fluid'`                              | `'default'`         | Layout variant                                  |
| `label`             | `string`                                            | -                   | Label text                                      |
| `placeholder`       | `string`                                            | `'Select…'`         | Placeholder when nothing is selected            |
| `helper`            | `string`                                            | -                   | Persistent helper text below the field          |
| `error`             | `string`                                            | -                   | Error message: triggers error state             |
| `warning`           | `string`                                            | -                   | Warning message: triggers warning state         |
| `disabled`          | `boolean`                                           | `false`             | Disables the select                             |
| `required`          | `boolean`                                           | `false`             | Marks the field as required (adds `*`)          |
| `id`                | `string`                                            | auto                | Native input id (auto-generated if omitted)     |
| `name`              | `string`                                            | -                   | Native form name                                |

## An icon per option

Give an option an `icon` when people recognise it by mark before they read the
word: a platform, a provider, a file kind. It appears in the list and on the
closed select, so the two cannot drift apart.

<preview>
  <NbSelect v-model="platform" label="Platform" :options="platformOptions" />
</preview>

```vue
<script setup lang="ts">
const options = [
  { label: 'LinkedIn', value: 'linkedin', icon: 'linkedin-logo' },
  { label: 'Instagram', value: 'instagram', icon: 'instagram-logo' },
  { label: 'X', value: 'x', icon: 'x-logo' },
  { label: 'Anywhere', value: 'generic' },
]
</script>

<template>
  <NbSelect v-model="platform" label="Platform" :options="options" />
</template>
```

Three things worth knowing:

- **An option without an icon is a plain row**, not a gap where a mark should
  be, so a list can mix the two.
- **A multiple select shows no mark on the trigger.** Its value is a count, and
  one mark beside "2 selected" would say less than the label alone.
- **The name is resolved at runtime.** With the glyph catalogue off, register
  the names you pass (`registerIcons`), the same as anywhere else an icon name
  is computed rather than written in a template.

For a row this cannot express, an avatar and two lines of text for example, the
`option` and `value` slots are still there.

## Option interface

```typescript
interface ISelectOption {
  label: string
  value: string | number
  disabled?: boolean
  /** Artwork before the label, in the list and on the closed select. */
  icon?: string
  /** The heading this option sits under. Runs are formed in order given. */
  group?: string
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

With `searchable`, typing narrows the list, <kbd>Enter</kbd> picks the highlighted match, and <kbd>Space</kbd> is part of the search, not a choice.

## Accessibility

- The trigger button announces `aria-expanded`, `aria-haspopup="listbox"`, and `aria-controls` pointing at the dropdown.
- Each option has `role="option"` with `aria-selected` and `aria-disabled`.
- The `for`/`id` association is handled automatically.
- With `searchable`, the search box is named by `search-placeholder` and points at the highlighted option with `aria-activedescendant`, so a screen reader follows the highlight while focus stays in the box.
- With `clearable`, the clear button is a separate `<button>` next to the trigger, reached with <kbd>Tab</kbd> after it. Pressing it never opens the list.

<!--@include: ./_shared.md-->
