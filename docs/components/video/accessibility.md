---
layout: nubisco
title: Video
intro: '`NbVideo` is a short, silent, looping video that takes the place of a still picture: a hero film, a five-second demo of a product being used. It is not a player for something to sit and watch. There are no controls beyond play and pause, and no sound.'
source: src/components/Video.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- It never starts by itself when the visitor prefers reduced motion or has
  asked to save data. The poster stays, and the play control starts it.
- A play and pause control is always there, in the corner, so motion can be
  stopped (WCAG 2.2.2). Once paused by the visitor it stays paused, even when
  it scrolls away and back.
- It is always muted, so it never makes a sound nobody asked for.
- Without `label` it is decorative and hidden from screen readers. Give it a
  `label` when it shows something the page does not say in words.
