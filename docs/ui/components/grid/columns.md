# Grid

## Columns

### Basic

:::tabs
== Preview

<preview style-grid>
  <div class="grid-demo-label">Column Spanning Examples</div>
  <div class="grid-demo-description">Different column combinations showing how grid items can span multiple columns.</div>
  
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="16" class="grid-demo-item span-8">16 columns (full width)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="1" class="grid-demo-item span-1">1</nb-grid>
    <nb-grid dir="col" grid="15" class="grid-demo-item span-7">15</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="2" class="grid-demo-item span-2">2</nb-grid>
    <nb-grid dir="col" grid="14" class="grid-demo-item span-6">14</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="3" class="grid-demo-item span-3">3</nb-grid>
    <nb-grid dir="col" grid="13" class="grid-demo-item span-5">13</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="4" class="grid-demo-item span-4">4</nb-grid>
    <nb-grid dir="col" grid="12" class="grid-demo-item span-4">12</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="5" class="grid-demo-item span-5">5</nb-grid>
    <nb-grid dir="col" grid="11" class="grid-demo-item span-3">11</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="6" class="grid-demo-item span-6">6</nb-grid>
    <nb-grid dir="col" grid="10" class="grid-demo-item span-2">10</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="7" class="grid-demo-item span-7">7</nb-grid>
    <nb-grid dir="col" grid="9" class="grid-demo-item span-1">9</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" gap="sm">
    <nb-grid dir="col" grid="8" class="grid-demo-item span-8">8</nb-grid>
    <nb-grid dir="col" grid="8" class="grid-demo-item span-8">8</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="16">16</nb-grid>
  </nb-grid>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="1">1</nb-grid>
    <nb-grid dir="col" grid="15">15</nb-grid>
  </nb-grid>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="2">2</nb-grid>
    <nb-grid dir="col" grid="14">14</nb-grid>
  </nb-grid>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="3">3</nb-grid>
    <nb-grid dir="col" grid="13">13</nb-grid>
  </nb-grid>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="4">4</nb-grid>
    <nb-grid dir="col" grid="12">12</nb-grid>
  </nb-grid>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="5">5</nb-grid>
    <nb-grid dir="col" grid="11">11</nb-grid>
  </nb-grid>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="6">6</nb-grid>
    <nb-grid dir="col" grid="10">10</nb-grid>
  </nb-grid>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="7">7</nb-grid>
    <nb-grid dir="col" grid="9">9</nb-grid>
  </nb-grid>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="8">8</nb-grid>
    <nb-grid dir="col" grid="8">8</nb-grid>
  </nb-grid>
</template>
```

:::

### Responsive

:::tabs
== Preview

<div>
  <nb-grid dir="row">
    <nb-grid
      dir="col"
      :grid="{ s: 10, m: 6 }"
    >Sample</nb-grid
    >
    <nb-grid
      dir="col"
      :grid="{ s: 6, m: 12 }"
    >Sample</nb-grid
    >
  </nb-grid>
</div>
== Code

```vue
<template>
  <nb-grid dir="row">
    <nb-grid dir="col" :grid="{ s: 10, m: 6 }">Sample</nb-grid>
    <nb-grid dir="col" :grid="{ s: 6, m: 12 }">Sample</nb-grid>
  </nb-grid>
</template>
```

:::

### Shift

:::tabs
== Preview

<div>
  <nb-grid justify="end" grid="1" shift="15">15/1</nb-grid>
  <nb-grid justify="end" grid="2" shift="14">14/2</nb-grid>
  <nb-grid justify="end" grid="3" shift="13">13/3</nb-grid>
  <nb-grid justify="end" grid="4" shift="12">12/4</nb-grid>
  <nb-grid justify="end" grid="5" shift="11">11/5</nb-grid>
  <nb-grid justify="end" grid="6" shift="10">10/6</nb-grid>
  <nb-grid justify="end" grid="7" shift="9">9/7</nb-grid>
  <nb-grid justify="end" grid="8" shift="8">8/8</nb-grid>
  <nb-grid justify="end" grid="9" shift="7">7/9</nb-grid>
  <nb-grid justify="end" grid="10" shift="6">6/10</nb-grid>
  <nb-grid justify="end" grid="11" shift="5">5/11</nb-grid>
  <nb-grid justify="end" grid="12" shift="4">4/12</nb-grid>
  <nb-grid justify="end" grid="13" shift="3">3/13</nb-grid>
  <nb-grid justify="end" grid="14" shift="2">2/14</nb-grid>
  <nb-grid justify="end" grid="15" shift="1">1/15</nb-grid>
  <nb-grid justify="end" grid="16" shift="0">0/16</nb-grid>
</div>
== Code

```vue
<template>
  <nb-grid dir="col">
    <nb-grid justify="end" grid="1" shift="15">15/1</nb-grid>
    <nb-grid justify="end" grid="2" shift="14">14/2</nb-grid>
    <nb-grid justify="end" grid="3" shift="13">13/3</nb-grid>
    <nb-grid justify="end" grid="4" shift="12">12/4</nb-grid>
    <nb-grid justify="end" grid="5" shift="11">11/5</nb-grid>
    <nb-grid justify="end" grid="6" shift="10">10/6</nb-grid>
    <nb-grid justify="end" grid="7" shift="9">9/7</nb-grid>
    <nb-grid justify="end" grid="8" shift="8">8/8</nb-grid>
    <nb-grid justify="end" grid="9" shift="7">7/9</nb-grid>
    <nb-grid justify="end" grid="10" shift="6">6/10</nb-grid>
    <nb-grid justify="end" grid="11" shift="5">5/11</nb-grid>
    <nb-grid justify="end" grid="12" shift="4">4/12</nb-grid>
    <nb-grid justify="end" grid="13" shift="3">3/13</nb-grid>
    <nb-grid justify="end" grid="14" shift="2">2/14</nb-grid>
    <nb-grid justify="end" grid="15" shift="1">1/15</nb-grid>
    <nb-grid justify="end" grid="16" shift="0">0/16</nb-grid>
  </nb-grid>
</template>
```
