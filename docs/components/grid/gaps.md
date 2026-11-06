# Grid

## Gaps

Each gap reads a spacing token, so a product that retunes the scale moves its
grid gaps with it.

| Gap Name | Value | Token             |
| -------- | ----- | ----------------- |
| xxs      | 2px   | `--nb-spacing-2`  |
| xs       | 4px   | `--nb-spacing-4`  |
| sm       | 8px   | `--nb-spacing-8`  |
| md       | 16px  | `--nb-spacing-16` |
| lg       | 24px  | `--nb-spacing-24` |
| xl       | 32px  | `--nb-spacing-32` |
| xxl      | 48px  | `--nb-spacing-48` |

### Basic Column

:::tabs
== Preview

<preview style-grid>
  <div class="grid-demo-label">Gap Sizes (Vertical)</div>
  <div class="grid-demo-description">Different gap sizes showing spacing between grid items in column direction.</div>
  
  <nb-grid dir="col" gap="xxs">
    <nb-grid dir="row" class="grid-demo-item demo-small">extra extra small (xxs)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">extra extra small (xxs)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="xs">
    <nb-grid dir="row" class="grid-demo-item demo-small">extra small (xs)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">extra small (xs)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="sm">
    <nb-grid dir="row" class="grid-demo-item demo-small">small (sm)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">small (sm)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="md">
    <nb-grid dir="row" class="grid-demo-item demo-small">medium (md)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">medium (md)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="lg">
    <nb-grid dir="row" class="grid-demo-item demo-small">large (lg)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">large (lg)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="xl">
    <nb-grid dir="row" class="grid-demo-item demo-small">extra large (xl)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">extra large (xl)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="xxl">
    <nb-grid dir="row" class="grid-demo-item demo-small">extra extra large (xxl)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">extra extra large (xxl)</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="col" gap="xxs">
    <nb-grid dir="row">extra extra small (xxs)</nb-grid>
    <nb-grid dir="row">extra extra small (xxs)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="xs">
    <nb-grid dir="row">extra small (xs)</nb-grid>
    <nb-grid dir="row">extra small (xs)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="sm">
    <nb-grid dir="row">small (sm)</nb-grid>
    <nb-grid dir="row">small (sm)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="md">
    <nb-grid dir="row">medium (md)</nb-grid>
    <nb-grid dir="row">medium (md)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="lg">
    <nb-grid dir="row">large (lg)</nb-grid>
    <nb-grid dir="row">large (lg)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="xl">
    <nb-grid dir="row">extra large (xl)</nb-grid>
    <nb-grid dir="row">extra large (xl)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="xxl">
    <nb-grid dir="row">extra extra large (xxl)</nb-grid>
    <nb-grid dir="row">extra extra large (xxl)</nb-grid>
  </nb-grid>
</template>
```

:::

### Basic Row

:::tabs
== Preview

<preview style-grid>
  <nb-grid dir="row" gap="xxs">
    <nb-grid dir="col">extra extra small (xxs)</nb-grid>
    <nb-grid dir="col">extra extra small (xxs)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="xs">
    <nb-grid dir="col">extra small (xs)</nb-grid>
    <nb-grid dir="col">extra small (xs)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col">small (sm)</nb-grid>
    <nb-grid dir="col">small (sm)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="md">
    <nb-grid dir="col">medium (md)</nb-grid>
    <nb-grid dir="col">medium (md)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="lg">
    <nb-grid dir="col">large (lg)</nb-grid>
    <nb-grid dir="col">large (lg)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="xl">
    <nb-grid dir="col">extra large (xl)</nb-grid>
    <nb-grid dir="col">extra large (xl)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="xxl">
    <nb-grid dir="col">extra extra large (xxl)</nb-grid>
    <nb-grid dir="col">extra extra large (xxl)</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="row" gap="xxs">
    <nb-grid dir="col">extra extra small (xxs)</nb-grid>
    <nb-grid dir="col">extra extra small (xxs)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="xs">
    <nb-grid dir="col">extra small (xs)</nb-grid>
    <nb-grid dir="col">extra small (xs)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col">small (sm)</nb-grid>
    <nb-grid dir="col">small (sm)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="md">
    <nb-grid dir="col">medium (md)</nb-grid>
    <nb-grid dir="col">medium (md)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="lg">
    <nb-grid dir="col">large (lg)</nb-grid>
    <nb-grid dir="col">large (lg)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="xl">
    <nb-grid dir="col">extra large (xl)</nb-grid>
    <nb-grid dir="col">extra large (xl)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="xxl">
    <nb-grid dir="col">extra extra large (xxl)</nb-grid>
    <nb-grid dir="col">extra extra large (xxl)</nb-grid>
  </nb-grid>
</template>
```

:::

### Modes

A mode is a default gutter, Carbon's three: `wide` is 32px, `narrow` 16px and
`condensed` 1px. It applies only when the grid has no `gap` of its own, so
`mode="narrow" :gap="{ lg: 'xl' }"` is 16px below `lg` and 32px from it. Spans
share a mode's gutter exactly as they share a `gap`, so they still add up to
the row. A grid with no `mode` and no `gap` has no gutter, as before.

:::tabs
== Preview

<preview style-grid>
  <div class="grid-demo-label">wide (32px)</div>
  <nb-grid dir="row" mode="wide">
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item span-b">4</nb-grid>
    <nb-grid dir="col" grid="8" class="grid-demo-item">8</nb-grid>
  </nb-grid>
  <div class="grid-demo-label">narrow (16px)</div>
  <nb-grid dir="row" mode="narrow">
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item span-b">4</nb-grid>
    <nb-grid dir="col" grid="8" class="grid-demo-item">8</nb-grid>
  </nb-grid>
  <div class="grid-demo-label">condensed (1px)</div>
  <nb-grid dir="row" mode="condensed">
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item span-b">4</nb-grid>
    <nb-grid dir="col" grid="8" class="grid-demo-item">8</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="row" mode="wide">
    <nb-grid dir="col" grid="4">4</nb-grid>
    <nb-grid dir="col" grid="4">4</nb-grid>
    <nb-grid dir="col" grid="8">8</nb-grid>
  </nb-grid>
  <nb-grid dir="row" mode="narrow">...</nb-grid>
  <nb-grid dir="row" mode="condensed">...</nb-grid>
</template>
```

:::

### Responsive

`gap` takes a breakpoint map keyed by `sm`, `md`, `lg`, `xl` and `xxl`, with
values from the gap scale. Here the gap is `xs` (4px) from 320px and `xl`
(32px) from 672px.

:::tabs
== Preview

<preview style-grid>
  <nb-grid dir="row" :gap="{ sm: 'xs', md: 'xl' }">
    <nb-grid dir="col" grow class="grid-demo-item">Sample</nb-grid>
    <nb-grid dir="col" grow class="grid-demo-item span-b">Sample</nb-grid>
  </nb-grid>
  <nb-grid dir="col" :gap="{ sm: 'xs', md: 'xl' }">
    <nb-grid dir="row" class="grid-demo-item">Sample</nb-grid>
    <nb-grid dir="row" class="grid-demo-item span-b">Sample</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="row" :gap="{ sm: 'xs', md: 'xl' }">
    <nb-grid dir="col" grow>Sample</nb-grid>
    <nb-grid dir="col" grow>Sample</nb-grid>
  </nb-grid>
  <nb-grid dir="col" :gap="{ sm: 'xs', md: 'xl' }">
    <nb-grid dir="row">Sample</nb-grid>
    <nb-grid dir="row">Sample</nb-grid>
  </nb-grid>
</template>
```

:::
