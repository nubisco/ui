---
layout: nubisco
title: Switch
intro: '`NbSwitch` is a toggle control that represents an on/off binary state. It supports labels, sizes, variants, and a verbose mode that shows the current state as text.'
source: src/components/Switch.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbSwitch name="demo" v-bind="resultingProps" />
</preview>

```vue
<template>
  <NbSwitch v-model="enabled" name="notifications" label="Notifications" />
</template>
```

## Sizes

<preview dir="row">
  <NbSwitch name="sm" size="sm" label="Small" />
  <NbSwitch name="md" size="md" label="Medium" />
  <NbSwitch name="lg" size="lg" label="Large" />
</preview>

## Verbose mode

When `verbose` is enabled, the switch shows the current state as a text label (`On` / `Off`) alongside the toggle.

<preview dir="row">
  <NbSwitch name="verbose" verbose label="Verbose" />
</preview>

## Disabled

<preview dir="row">
  <NbSwitch name="dis1" disabled label="Disabled off" />
  <NbSwitch name="dis2" disabled :model-value="true" label="Disabled on" />
</preview>

<!--@include: ./_shared.md-->
