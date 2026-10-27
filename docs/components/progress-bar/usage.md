---
layout: nubisco
title: Progress Bar
intro: '`NbProgressBar` shows how far an operation has advanced against a known total, or an indeterminate animation while the total is still unknown. Follow it with a `finished` or `error` status so users get explicit closure.'
source: src/components/ProgressBar.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbProgressBar :value="65" v-bind="resultingProps" />
</preview>

```vue
<template>
  <NbProgressBar
    label="Uploading assets"
    helper="42 of 64 files"
    :value="42"
    :max="64"
  />
</template>
```

## Sizes

`md` (8px track) is the default. Use `sm` (4px track) in dense layouts or when
the bar accompanies another component.

<preview>
  <NbProgressBar label="Default (md)" :value="60" />
  <NbProgressBar label="Small (sm)" size="sm" :value="60" />
</preview>

## Simulated progress

<preview>
  <NbProgressBar
    label="Downloading"
    :helper="demoStatus === 'finished' ? 'Done' : `${demoValue}%`"
    :value="demoValue"
    :status="demoStatus"
  />
  <NbButton size="sm" @click="restartDemo">Restart</NbButton>
</preview>

<!--@include: ./_shared.md-->
