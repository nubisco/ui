# Grid

## Wrap

### Basic

::: tabs
== Preview

<preview style-grid>
  <div class="grid-demo-label">Wrap Examples</div>
  <div class="grid-demo-description">Different wrap options showing how items flow when they exceed container width.</div>
  
  <NbGrid is="ul" wrap="nowrap" gap="sm" style="list-style: none; padding: 0; margin-bottom: 16px;">
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 1</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 2</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 3</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 4</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 5</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 6</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 7</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 8</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 9</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 10</NbGrid>
  </NbGrid>
  <NbGrid is="ul" wrap="wrap" gap="sm" style="list-style: none; padding: 0; margin-bottom: 16px;">
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 1</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 2</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 3</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 4</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 5</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 6</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 7</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 8</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 9</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 10</NbGrid>
  </NbGrid>
  <NbGrid is="ul" wrap="reverse" gap="sm" style="list-style: none; padding: 0;">
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 1</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 2</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 3</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 4</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 5</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 6</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 7</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 8</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 9</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 10</NbGrid>
  </NbGrid>
</preview>
== Code

```vue
<template>
  <NbGrid is="ul" wrap="nowrap">
    <NbGrid is="li" dir="col">1 of 1</NbGrid>
    <NbGrid is="li" dir="col">1 of 2</NbGrid>
    <NbGrid is="li" dir="col">1 of 3</NbGrid>
    <NbGrid is="li" dir="col">1 of 4</NbGrid>
    <NbGrid is="li" dir="col">1 of 5</NbGrid>
    <NbGrid is="li" dir="col">1 of 6</NbGrid>
    <NbGrid is="li" dir="col">1 of 7</NbGrid>
    <NbGrid is="li" dir="col">1 of 8</NbGrid>
    <NbGrid is="li" dir="col">1 of 9</NbGrid>
    <NbGrid is="li" dir="col">1 of 10</NbGrid>
  </NbGrid>
  <NbGrid is="ul" wrap="wrap">
    <NbGrid is="li" dir="col">1 of 1</NbGrid>
    <NbGrid is="li" dir="col">1 of 2</NbGrid>
    <NbGrid is="li" dir="col">1 of 3</NbGrid>
    <NbGrid is="li" dir="col">1 of 4</NbGrid>
    <NbGrid is="li" dir="col">1 of 5</NbGrid>
    <NbGrid is="li" dir="col">1 of 6</NbGrid>
    <NbGrid is="li" dir="col">1 of 7</NbGrid>
    <NbGrid is="li" dir="col">1 of 8</NbGrid>
    <NbGrid is="li" dir="col">1 of 9</NbGrid>
    <NbGrid is="li" dir="col">1 of 10</NbGrid>
  </NbGrid>
  <NbGrid is="ul" wrap="reverse">
    <NbGrid is="li" dir="col">1 of 1</NbGrid>
    <NbGrid is="li" dir="col">1 of 2</NbGrid>
    <NbGrid is="li" dir="col">1 of 3</NbGrid>
    <NbGrid is="li" dir="col">1 of 4</NbGrid>
    <NbGrid is="li" dir="col">1 of 5</NbGrid>
    <NbGrid is="li" dir="col">1 of 6</NbGrid>
    <NbGrid is="li" dir="col">1 of 7</NbGrid>
    <NbGrid is="li" dir="col">1 of 8</NbGrid>
    <NbGrid is="li" dir="col">1 of 9</NbGrid>
    <NbGrid is="li" dir="col">1 of 10</NbGrid>
  </NbGrid>
</template>
```

:::

### Responsive

:::tabs
== Preview

<preview style-grid>
  <NbGrid is="ul" :wrap="{ s: 'wrap', l: 'reverse' }">
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 1</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 2</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 3</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 4</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 5</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 6</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 7</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 8</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 9</NbGrid>
    <NbGrid is="li" dir="col" class="grid-demo-item demo-small">1 of 10</NbGrid>
  </NbGrid>
</preview>
== Code

```vue
<template>
  <NbGrid is="ul" :wrap="{ s: 'wrap', l: 'reverse' }">
    <NbGrid is="li" dir="col">1 of 1</NbGrid>
    <NbGrid is="li" dir="col">1 of 2</NbGrid>
    <NbGrid is="li" dir="col">1 of 3</NbGrid>
    <NbGrid is="li" dir="col">1 of 4</NbGrid>
    <NbGrid is="li" dir="col">1 of 5</NbGrid>
    <NbGrid is="li" dir="col">1 of 6</NbGrid>
    <NbGrid is="li" dir="col">1 of 7</NbGrid>
    <NbGrid is="li" dir="col">1 of 8</NbGrid>
    <NbGrid is="li" dir="col">1 of 9</NbGrid>
    <NbGrid is="li" dir="col">1 of 10</NbGrid>
  </NbGrid>
</template>
```
