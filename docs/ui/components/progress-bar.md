---
layout: nubisco
title: Progress Bar
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbProgressBar` shows how far an operation has advanced against a known total,
or an indeterminate animation while the total is still unknown. Follow it with
a `finished` or `error` status so users get explicit closure.

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

## Indeterminate

Omit `value` while the total amount of work is unknown and the bar sweeps
continuously.

<preview>
  <NbProgressBar label="Preparing export" helper="Contacting server..." />
</preview>

```vue
<template>
  <NbProgressBar label="Preparing export" helper="Contacting server..." />
</template>
```

## Sizes

`md` (8px track) is the default. Use `sm` (4px track) in dense layouts or when
the bar accompanies another component.

<preview>
  <NbProgressBar label="Default (md)" :value="60" />
  <NbProgressBar label="Small (sm)" size="sm" :value="60" />
</preview>

## Status

`finished` and `error` fill the track, recolor the bar, and show a status icon
next to the label. When `status` is `error` the helper text switches to the
error style automatically.

<preview>
  <NbProgressBar label="Upload complete" helper="64 of 64 files" status="finished" />
  <NbProgressBar label="Upload failed" helper="Connection lost, retry in 30s" status="error" />
</preview>

```vue
<template>
  <NbProgressBar
    label="Upload failed"
    helper="Connection lost, retry in 30s"
    status="error"
  />
</template>
```

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

</doc-tab>

<doc-tab name="Api">

## Props

| Prop     | Type                                | Default     | Description                                              |
| -------- | ----------------------------------- | ----------- | -------------------------------------------------------- |
| `value`  | `number`                            | `undefined` | Current progress. Omit for an indeterminate bar          |
| `max`    | `number`                            | `100`       | Upper bound the progress is measured against             |
| `label`  | `string`                            | `undefined` | Label rendered above the track                           |
| `helper` | `string`                            | `undefined` | Hint below the bar, uses the error style on error status |
| `size`   | `'md' \| 'sm'`                      | `'md'`      | Track thickness: `md` is 8px, `sm` is 4px                |
| `status` | `'active' \| 'finished' \| 'error'` | `'active'`  | Semantic state, `finished`/`error` fill the bar          |

## Accessibility

- The track exposes `role="progressbar"` with `aria-valuemin`, `aria-valuemax`
  and `aria-valuenow` (omitted while indeterminate).
- The `label` prop doubles as the `aria-label` of the progress bar.
- Status changes are also conveyed by the icon and helper text, not only by
  color.

</doc-tab>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const demoValue = ref(0)
const demoStatus = ref<'active' | 'finished'>('active')
let demoTimer: ReturnType<typeof setInterval> | undefined

function restartDemo() {
  demoValue.value = 0
  demoStatus.value = 'active'
  clearInterval(demoTimer)
  demoTimer = setInterval(() => {
    demoValue.value = Math.min(demoValue.value + Math.random() * 9, 100)
    if (demoValue.value >= 100) {
      demoStatus.value = 'finished'
      clearInterval(demoTimer)
    }
  }, 300)
}

onMounted(restartDemo)
onBeforeUnmount(() => clearInterval(demoTimer))

const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Uploading assets',
    placeholder: 'Label text',
  },
  {
    label: 'Helper',
    name: 'helper',
    type: 'string',
    default: '42 of 64 files',
    placeholder: 'Helper text',
  },
]
</script>
