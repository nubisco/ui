# Grid

## Visibility

### Basic

:::tabs
== Preview

<preview style-grid>
  <div class="grid-demo-label">Visibility: Hidden</div>
  <div class="grid-demo-description">The first item is hidden using the 'visible' prop.</div>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" :visible="false" class="grid-demo-item demo-small hidden">1 of 2</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">2 of 2</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col" :visible="false">1 of 2</nb-grid>
    <nb-grid dir="col">2 of 2</nb-grid>
  </nb-grid>
</template>
```

:::

### Responsive

:::tabs
== Preview

<preview style-grid>
  <div class="grid-demo-label">Responsive Visibility</div>
  <div class="grid-demo-description">The first item is hidden on small screens but visible on large screens.</div>
  
  <nb-grid dir="row" gap="sm">
    <nb-grid
      dir="col"
      :visible="{ s: false, l: true }"
      class="grid-demo-item demo-small"
    >1 of 2</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">2 of 2</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col" :visible="{ s: false, l: true }">1 of 2</nb-grid>
    <nb-grid dir="col">2 of 2</nb-grid>
  </nb-grid>
</template>
```

:::
