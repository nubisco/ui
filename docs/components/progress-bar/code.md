---
layout: nubisco
title: Progress Bar
intro: '`NbProgressBar` shows how far an operation has advanced against a known total, or an indeterminate animation while the total is still unknown. Follow it with a `finished` or `error` status so users get explicit closure.'
source: src/components/ProgressBar.vue
tab: code
pageTabs: ['usage', 'code']
---

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

## Hidden label

When the row around the bar already says what it measures, a name beside it and a count after it, a visible label would say it twice. `hide-label` keeps `label` as the bar's accessible name and does not show it, the same as on `NbSwitch`. A bar with no name at all is announced as just "progress bar", so prefer this to leaving `label` out.

<preview>
  <div style="display: grid; grid-template-columns: 80px 1fr 60px; gap: 12px; align-items: center; width: 100%">
    <span>German</span>
    <NbProgressBar label="German" hide-label size="sm" :value="72" />
    <span>72 / 100</span>
    <span>Spanish</span>
    <NbProgressBar label="Spanish" hide-label size="sm" :value="100" status="finished" />
    <span>100 / 100</span>
  </div>
</preview>

```vue
<NbProgressBar
  :label="locale.name"
  hide-label
  size="sm"
  :value="approved"
  :max="total"
/>
```

## Props

| Prop        | Type                                | Default     | Description                                              |
| ----------- | ----------------------------------- | ----------- | -------------------------------------------------------- |
| `value`     | `number`                            | `undefined` | Current progress. Omit for an indeterminate bar          |
| `max`       | `number`                            | `100`       | Upper bound the progress is measured against             |
| `label`     | `string`                            | `undefined` | Label rendered above the track                           |
| `helper`    | `string`                            | `undefined` | Hint below the bar, uses the error style on error status |
| `size`      | `'md' \| 'sm'`                      | `'md'`      | Track thickness: `md` is 8px, `sm` is 4px                |
| `status`    | `'active' \| 'finished' \| 'error'` | `'active'`  | Semantic state, `finished`/`error` fill the bar          |
| `hideLabel` | `boolean`                           | `false`     | Keep `label` as the accessible name without showing it   |

## Accessibility

- The track exposes `role="progressbar"` with `aria-valuemin`, `aria-valuemax`
  and `aria-valuenow` (omitted while indeterminate).
- The `label` prop doubles as the `aria-label` of the progress bar, also when
  `hideLabel` hides it.
- Status changes are also conveyed by the icon and helper text, not only by
  color.

<!--@include: ./_shared.md-->
