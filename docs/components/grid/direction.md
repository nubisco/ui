# Grid

## Direction

### Basic

:::tabs
== Preview

<preview style-grid>
  <div class="grid-demo-label">Direction Examples</div>
  <div class="grid-demo-description">Different direction options showing how items are arranged.</div>
  
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" class="grid-demo-item demo-small">Side</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">by</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">Side</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="sm">
    <nb-grid dir="row" class="grid-demo-item demo-small">Top</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">Middle</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">Bottom</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col">Side</nb-grid>
    <nb-grid dir="col">by</nb-grid>
    <nb-grid dir="col">Side</nb-grid>
  </nb-grid>
  <nb-grid dir="col">
    <nb-grid dir="row">Top</nb-grid>
    <nb-grid dir="row">Middle</nb-grid>
    <nb-grid dir="row">Bottom</nb-grid>
  </nb-grid>
</template>
```

:::

### Responsive

:::tabs
== Preview

<preview style-grid>
  <div class="grid-demo-label">Responsive Direction</div>
  <div class="grid-demo-description">Direction changes based on screen size.</div>
  
  <nb-grid :dir="{ s: 'col', m: 'row' }" gap="sm">
    <nb-grid :dir="{ s: 'row', m: 'col' }" class="grid-demo-item demo-small">First</nb-grid>
    <nb-grid :dir="{ s: 'row', m: 'col' }" class="grid-demo-item demo-small">Second</nb-grid>
    <nb-grid :dir="{ s: 'row', m: 'col' }" class="grid-demo-item demo-small">Third</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid :dir="{ s: 'col', m: 'row' }">
    <nb-grid :dir="{ s: 'row', m: 'col' }">First</nb-grid>
    <nb-grid :dir="{ s: 'row', m: 'col' }">Second</nb-grid>
    <nb-grid :dir="{ s: 'row', m: 'col' }">Third</nb-grid>
  </nb-grid>
</template>
```

:::

### Mixed Responsive

:::tabs
== Preview

<preview style-grid>
  <nb-grid :dir="{ s: 'row', m: 'col' }">
    <nb-grid
      :dir="{ s: 'col', m: 'row' }"
      grow
    >1 of 3</nb-grid
    >
    <nb-grid
      :dir="{ s: 'col', m: 'row' }"
      grow
    >2 of 3</nb-grid
    >
    <nb-grid
      :dir="{ s: 'col', m: 'row' }"
      grow
    >3 of 3</nb-grid
    >
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid :dir="{ s: 'row', m: 'col' }">
    <nb-grid :dir="{ s: 'col', m: 'row' }" grow>1 of 3</nb-grid>
    <nb-grid :dir="{ s: 'col', m: 'row' }" grow>2 of 3</nb-grid>
    <nb-grid :dir="{ s: 'col', m: 'row' }" grow>3 of 3</nb-grid>
  </nb-grid>
</template>
```
