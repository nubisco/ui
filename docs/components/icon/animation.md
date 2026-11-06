---
layout: nubisco
title: Icon
intro: '`NbIcon` renders SVG icons from the Phosphor icon set. Icons are loaded as async Vue components via a Vite virtual module, so only icons that are actually used end up in your bundle.'
source: src/components/Icon.vue
tab: animation
pageTabs: ['usage', 'animation', 'code']
---

## Animations

`animation` takes one of seventeen gestures. Each tile below plays one on the
glyph it suits, continuously, with `animation-mode="always"`. Use the switch to
pause them all.

<preview>
  <NbSwitch v-model="animationsPlaying" label="Play animations" name="play-animations" />
  <ul class="animation-demo" :class="{ paused: !animationsPlaying }">
    <li v-for="item in animations" :key="item.name">
      <NbIcon :name="item.icon" :size="32" :animation="item.name" animation-mode="always" />
      <span class="animation-name">{{ item.name }}<span v-if="item.loading" class="animation-loading"> (loading)</span></span>
    </li>
  </ul>
</preview>

```vue
<template>
  <NbIcon name="arrows-clockwise" animation="refresh" />
  <NbIcon name="bell" animation="wobble" animation-mode="hover" />
</template>
```

`animation-mode` is `always` (the default) or `hover`, which plays the gesture
only while the pointer is over the icon. An animated icon stays the size of a
static one: only the gesture moves. Each cycle is one second (half that for
the quick gestures, five for `cog`), tuned to the icon like every loop in the
library, and the gestures ease on `--nb-ease-standard`.

## Reduced motion

Under `prefers-reduced-motion: reduce` the travel stops, and `NbIcon` handles it
for you. The three marked **loading** (`refresh`, `cog`, `hourglass`) say
"working", so they keep looping as an opacity breath instead, because a frozen
loading glyph reads as a hung page. The other fourteen stand still. Turn on
reduced motion in your operating system to see it on this page. See
[Motion accessibility](/principles/motion/accessibility).

<!--@include: ./_shared.md-->
