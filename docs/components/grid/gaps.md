# Grid

## Gaps

| Gap Name | Value |
| -------- | ----- |
| xxs      | 2px   |
| xs       | 4px   |
| sm       | 8px   |
| md       | 16px  |
| lg       | 24px  |
| xl       | 32px  |
| xxl      | 48px  |

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

### Basic Modes

:::tabs
== Preview

<preview style-grid>
  <nb-grid dir="col" gap="md">
    <nb-grid dir="row">parent is wide</nb-grid>
    <nb-grid dir="row">parent is wide</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="sm" mode="narrow">
    <nb-grid dir="row">parent is narrow</nb-grid>
    <nb-grid dir="row">parent is narrow</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="xs" mode="condensed">
    <nb-grid dir="row">parent is condensed</nb-grid>
    <nb-grid dir="row">parent is condensed</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="col" gap="md">
    <nb-grid dir="row">parent is wide</nb-grid>
    <nb-grid dir="row">parent is wide</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="sm" mode="narrow">
    <nb-grid dir="row">parent is narrow</nb-grid>
    <nb-grid dir="row">parent is narrow</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="xs" mode="condensed">
    <nb-grid dir="row">parent is condensed</nb-grid>
    <nb-grid dir="row">parent is condensed</nb-grid>
  </nb-grid>
</template>
```

:::

### Basic Responsive

:::tabs
== Preview

<preview style-grid>
  <nb-grid dir="row" :gap="{ s: 's', m: 'xl' }">
    <nb-grid dir="col" grow>Sample</nb-grid>
    <nb-grid dir="col" grow>Sample</nb-grid>
  </nb-grid>
  <nb-grid dir="col" :gap="{ s: 's', m: 'xl' }">
    <nb-grid dir="row">Sample</nb-grid>
    <nb-grid dir="row">Sample</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="row" :gap="{ s: 's', m: 'xl' }">
    <nb-grid dir="col" grow>Sample</nb-grid>
    <nb-grid dir="col" grow>Sample</nb-grid>
  </nb-grid>
  <nb-grid dir="col" :gap="{ s: 's', m: 'xl' }">
    <nb-grid dir="row">Sample</nb-grid>
    <nb-grid dir="row">Sample</nb-grid>
  </nb-grid>
</template>
```
