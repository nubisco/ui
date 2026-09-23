# Grid

## Alignment

### Horizontal

:::tabs
== Preview

<preview style-grid>
  <div class="grid-demo-label">Horizontal Alignment</div>
  <div class="grid-demo-description">Different horizontal alignment options showing how items are positioned within the grid.</div>
  <nb-grid dir="row" class="grid-demo-row" justify="start">
    <nb-grid dir="col" class="grid-demo-item demo-small">start (left)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="center">
    <nb-grid dir="col" class="grid-demo-item demo-small">center</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="end">
    <nb-grid dir="col" class="grid-demo-item demo-small">end (right)</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="around">
    <nb-grid dir="col" class="grid-demo-item demo-small">around</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">around</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">around</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="between">
    <nb-grid dir="col" class="grid-demo-item demo-small">between</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">between</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">between</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" justify="evenly">
    <nb-grid dir="col" class="grid-demo-item demo-small">evenly</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">evenly</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">evenly</nb-grid>
  </nb-grid>
  <nb-grid dir="row" class="grid-demo-row" distributed>
    <nb-grid dir="col" class="grid-demo-item demo-small">distributed</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">distributed</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">distributed</nb-grid>
  </nb-grid>
</preview>
== Code

```vue
<template>
  <nb-grid dir="row" justify="start">
    <nb-grid dir="col">left</nb-grid>
  </nb-grid>
  <nb-grid dir="row" justify="center">
    <nb-grid dir="col">center</nb-grid>
  </nb-grid>
  <nb-grid dir="row" justify="end">
    <nb-grid dir="col">right</nb-grid>
  </nb-grid>
  <nb-grid dir="row" justify="around">
    <nb-grid dir="col">around</nb-grid>
    <nb-grid dir="col">around</nb-grid>
    <nb-grid dir="col">around</nb-grid>
  </nb-grid>
  <nb-grid dir="row" justify="between">
    <nb-grid dir="col">between</nb-grid>
    <nb-grid dir="col">between</nb-grid>
    <nb-grid dir="col">between</nb-grid>
  </nb-grid>
  <nb-grid dir="row" justify="evenly">
    <nb-grid dir="col">evenly</nb-grid>
    <nb-grid dir="col">evenly</nb-grid>
    <nb-grid dir="col">evenly</nb-grid>
  </nb-grid>
  <nb-grid dir="row" distributed>
    <nb-grid dir="col">evenly</nb-grid>
    <nb-grid dir="col">evenly</nb-grid>
    <nb-grid dir="col">evenly</nb-grid>
  </nb-grid>
</template>
```

== API

| Option        | Description                                                                                                               |
| :------------ | :------------------------------------------------------------------------------------------------------------------------ |
| `start`       | Aligns items to the start of the main axis.                                                                               |
| `end`         | Aligns items to the end of the main axis.                                                                                 |
| `center`      | Aligns items in the center of the main axis.                                                                              |
| `between`     | Distributes items evenly, with the first item at the start and the last item at the end.                                  |
| `around`      | Distributes items evenly with equal space around each item.                                                               |
| `evenly`      | Distributes items evenly with equal space between each item.                                                              |
| `distributed` | Distributes items evenly with equal space between each item, similar to evenly but explicitly using the distributed prop. |

:::

:::tip
**Key Differences** between using `justify="evently"` or the new `distributed` prop:

- `justify="evenly"` affects the spacing between items, ensuring equal gaps between them.
- `distributed` affects the size of the items inside the grid element and ensures they grow equally to fill available space.

It's important to understand they don't address the same root problem. Hence both examples above.
:::

:::tip
**Key Differences** between using `justify="evently"` or the new `distributed` prop:

- `justify="evenly"` affects the spacing between items, ensuring equal gaps between them.
- `distributed` affects the size of the items inside the grid element and ensures they grow equally to fill available space.

It's important to understand they don't address the same root problem. Hence both examples above.
:::

### Horizontal Responsive

:::tabs
== Preview

<div>
  <nb-grid dir="row" :justify="{ s: 'center', m: 'start' }">
    <nb-grid dir="col">aligned center or left</nb-grid>
  </nb-grid>
  <nb-grid dir="row" :justify="{ s: 'center' }">
    <nb-grid dir="col">aligned center always</nb-grid>
  </nb-grid>
  <nb-grid dir="row" :justify="{ s: 'center', m: 'end' }">
    <nb-grid dir="col">aligned center or right</nb-grid>
  </nb-grid>
</div>
== Code

```vue
<template>
  <nb-grid dir="row" :justify="{ s: 'center', m: 'start' }">
    <nb-grid dir="col">aligned center or left</nb-grid>
  </nb-grid>
  <nb-grid dir="row" :justify="{ s: 'center' }">
    <nb-grid dir="col">aligned center always</nb-grid>
  </nb-grid>
  <nb-grid dir="row" :justify="{ s: 'center', m: 'end' }">
    <nb-grid dir="col">aligned center or right</nb-grid>
  </nb-grid>
</template>
```

:::

### Vertical

:::tabs
== Preview

<div>
  <nb-grid dir="row" align="start" style="height: 100px">
    <nb-grid dir="col" grow>top</nb-grid>
  </nb-grid>
  <nb-grid dir="row" align="center" style="height: 100px">
    <nb-grid dir="col" grow>middle</nb-grid>
  </nb-grid>
  <nb-grid dir="row" align="end" style="height: 100px">
    <nb-grid dir="col" grow>bottom</nb-grid>
  </nb-grid>
</div>
== Code

```vue
<template>
  <nb-grid dir="row" align="start" style="height: 100px">
    <nb-grid dir="col" grow>top</nb-grid>
  </nb-grid>
  <nb-grid dir="row" align="center" style="height: 100px">
    <nb-grid dir="col" grow>middle</nb-grid>
  </nb-grid>
  <nb-grid dir="row" align="end" style="height: 100px">
    <nb-grid dir="col" grow>bottom</nb-grid>
  </nb-grid>
</template>
```

== API

| Option     | Description                                   |
| :--------- | :-------------------------------------------- |
| `start`    | Aligns items to the start of the cross-axis.  |
| `end`      | Aligns items to the end of the cross-axis.    |
| `center`   | Aligns items in the center of the cross-axis. |
| `stretch`  | Stretches items to fill the cross-axis.       |
| `baseline` | Aligns items along the baseline.              |

:::

### Vertical Responsive

:::tabs
== Preview

<div>
  <nb-grid
    dir="row"
    :align="{ s: 'top', m: 'bottom' }"
    style="height: 100px"
  >
    <nb-grid dir="col" grow>Top or Bottom</nb-grid>
  </nb-grid>
</div>
== Code

```vue
<template>
  <nb-grid dir="row" :align="{ s: 'top', m: 'bottom' }" style="height: 100px">
    <nb-grid dir="col" grow>Top or Bottom</nb-grid>
  </nb-grid>
</template>
```

:::
