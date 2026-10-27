---
layout: nubisco
title: Select
intro: '`NbSelect` is a custom dropdown that replaces the native `<select>`. It shares the same design language as `NbTextInput`: two variants (default / fluid), error/warning states, multi-select support, and full keyboard navigation.'
source: src/components/Select.vue
tab: usage
pageTabs: ['usage', 'code']
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

<!--@include: ./_shared.md-->
