---
layout: nubisco
title: Page Layout
intro: '`NbPageLayout` is a main region and an aside, side by side when there is room and stacked when there is not. It decides from the width it is given, not from the window, so it reflows at the right moment inside the shell.'
source: src/components/PageLayout.vue
tab: code
pageTabs: ['usage', 'code']
---

## A record page

```vue
<template>
  <NbPageHeader :title="record.title">...</NbPageHeader>
  <NbPageLayout aside-width="2:1" aside-first>
    <NbPanel title="Work">...</NbPanel>
    <template #aside>
      <NbPanel flat title="Facts">...</NbPanel>
    </template>
  </NbPageLayout>
</template>
```

## A fixed aside

<preview>
  <NbPageLayout aside-width="14rem" gap="lg" style="width: 100%">
    <NbPanel>Main, taking the rest of the width.</NbPanel>
    <template #aside><NbPanel flat>A 14rem aside.</NbPanel></template>
  </NbPageLayout>
</preview>

```vue
<NbPageLayout aside-width="14rem" gap="lg">...</NbPageLayout>
```

## Replacing a hand-written split

```scss
// Before: a viewport query inside the shell, against the layout rules.
.view__grid {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(18rem, 2fr);
  gap: var(--nb-spacing-24);

  @media (max-width: 64rem) {
    grid-template-columns: 1fr;
  }
}
```

```vue
<!-- After -->
<NbPageLayout gap="lg">...</NbPageLayout>
```

## Props

| Prop         | Type                   | Default | Description                                                       |
| ------------ | ---------------------- | ------- | ----------------------------------------------------------------- |
| `asideWidth` | `string`               | `'3:2'` | A ratio of main to aside, or a CSS length for a fixed aside.      |
| `stackBelow` | `'sm' \| 'md' \| 'lg'` | `'md'`  | Container width below which the regions stack: 480, 720 or 960px. |
| `asideFirst` | `boolean`              | `false` | Stacked, put the aside first.                                     |
| `gap`        | `TGapSize`             | `'xl'`  | Space between the regions, on `NbGrid`'s scale.                   |

## Slots

| Slot      | Description      |
| --------- | ---------------- |
| `default` | The main region. |
| `aside`   | The aside.       |
