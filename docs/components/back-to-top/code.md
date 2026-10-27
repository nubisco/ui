---
layout: nubisco
title: Back To Top
intro: '`NbBackToTop` is a round floating button in the bottom corner that takes the visitor back to the top of a long page. It appears once the page has been scrolled past one screen height, and disappears again near the top. Place it once, in the layout every long page shares.'
source: src/components/BackToTop.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Props

| Prop        | Type     | Default           | Description                              |
| ----------- | -------- | ----------------- | ---------------------------------------- |
| `threshold` | `number` | one screen height | How far the page must be scrolled, in px |
| `label`     | `string` | `'Back to top'`   | Accessible name and tooltip              |
