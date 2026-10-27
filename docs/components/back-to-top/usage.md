---
layout: nubisco
title: Back To Top
intro: '`NbBackToTop` is a round floating button in the bottom corner that takes the visitor back to the top of a long page. It appears once the page has been scrolled past one screen height, and disappears again near the top. Place it once, in the layout every long page shares.'
source: src/components/BackToTop.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

```vue
<template>
  <main>...</main>
  <NbBackToTop />
</template>
```

## When it appears

By default after one screen height of scrolling, the point at which the first
screen is gone. `threshold` sets a different distance in pixels. The scroll
position is read once per frame, however fast the page moves.

## On a phone

On a touch phone it sits closer to the corner, clear of the home indicator
through the safe-area insets, and its target grows to 44px. Nothing about it
changes on a desktop.
