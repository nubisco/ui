# Grid

## Order

### First

:::tabs
== Preview

<preview style-grid>
  <div class="grid-demo-label">Order: First</div>
  <div class="grid-demo-description">The third item appears first due to the 'first' prop.</div>
  
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" class="grid-demo-item demo-small">First</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">Second</nb-grid>
    <nb-grid dir="col" first class="grid-demo-item demo-small order-first">Third!!!</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col">First</nb-grid>
    <nb-grid dir="col">Second</nb-grid>
    <nb-grid dir="col" first>Third!!!</nb-grid>
  </nb-grid>
</template>
```

:::

### Last

:::tabs
== Preview

<preview style-grid>
  <div class="grid-demo-label">Order: Last</div>
  <div class="grid-demo-description">The second item appears last due to the 'last' prop.</div>
  
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" class="grid-demo-item demo-small">First</nb-grid>
    <nb-grid dir="col" last class="grid-demo-item demo-small order-last">Second!!!</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">Third</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col">First</nb-grid>
    <nb-grid dir="col" last>Second!!!</nb-grid>
    <nb-grid dir="col">Third</nb-grid>
  </nb-grid>
</template>
```

:::

### Responsive First last

:::tabs
== Preview

<preview style-grid>
  <nb-grid :dir="{ m: 'col' }" :reverse="['m']">
    <nb-grid>First</nb-grid>
    <nb-grid>Second</nb-grid>
    <nb-grid>Third</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid :dir="{ m: 'col' }" :reverse="['m']">
    <nb-grid>First</nb-grid>
    <nb-grid>Second</nb-grid>
    <nb-grid>Third</nb-grid>
  </nb-grid>
</template>
```

:::

### Responsive Reverse

:::tabs
== Preview

<preview style-grid>
  <nb-grid :dir="{ m: 'col' }" :reverse="['m']">
    <nb-grid>First</nb-grid>
    <nb-grid>Second</nb-grid>
    <nb-grid>Third</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid :dir="{ m: 'col' }" :reverse="['m']">
    <nb-grid>First</nb-grid>
    <nb-grid>Second</nb-grid>
    <nb-grid>Third</nb-grid>
  </nb-grid>
</template>
```

:::

### Reverse

:::tabs
== Preview

<preview style-grid>
  <nb-grid dir="row" reverse>
    <nb-grid dir="col">First</nb-grid>
    <nb-grid dir="col">Second</nb-grid>
    <nb-grid dir="col">Third</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="row" reverse>
    <nb-grid dir="col">First</nb-grid>
    <nb-grid dir="col">Second</nb-grid>
    <nb-grid dir="col">Third</nb-grid>
  </nb-grid>
</template>
```
