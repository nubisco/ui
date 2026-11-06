---
layout: nubisco
title: Select
intro: '`NbSelect` is a custom dropdown that replaces the native `<select>`. It shares the same design language as `NbTextInput`: two variants (default / fluid), error/warning states, multi-select support, and full keyboard navigation.'
source: src/components/Select.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

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

## Validation states

<preview>
  <NbSelect v-model="locale" label="Locale" error="A locale is required" :options="localeOptions" />
  <NbSelect v-model="locale" label="Locale" warning="This locale has no translations yet" :options="localeOptions" />
</preview>

## Disabled

<preview>
  <NbSelect v-model="locale" label="Locale" disabled :options="localeOptions" />
</preview>

## Content

- **The label names the thing being chosen**, not the action: `Role`, not `Select a role`.
- **Options are sentence-case nouns, sorted the way a reader scans them**: by frequency for short lists, alphabetically for long ones. No trailing periods.
- **The placeholder for an empty select is optional.** When used, it says what is missing (`No role`), never `Please select...`.
- **The search box says `Search`**, with no ellipsis. Override `searchPlaceholder` only to name what is searched (`Search members`).

Casing, punctuation and tone are the fleet's, not this component's: [Writing style](/content/writing-style) is the source.

<!--@include: ./_shared.md-->
