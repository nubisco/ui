---
layout: nubisco
title: Video
intro: '`NbVideo` is a short, silent, looping video that takes the place of a still picture: a hero film, a five-second demo of a product being used. It is not a player for something to sit and watch. There are no controls beyond play and pause, and no sound.'
source: src/components/Video.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

```vue
<template>
  <NbVideo
    src="/media/rig-loop.mp4"
    poster="/media/rig-loop.jpg"
    mobile-src="/media/rig-loop-mobile.mp4"
    :width="1600"
    :height="900"
  />
</template>
```

## What loads, and when

The poster is what paints first, so it is the page's largest picture while the
video is still on its way. The video file is only requested once the video is
near the screen, which keeps a hero from delaying the first paint and costs
nothing for a loop further down the page that is never reached.

On screen it plays, off screen it pauses, so a page with several loops only
ever decodes the ones being looked at. Give it `width` and `height` and its
space is reserved before anything arrives.

## On a phone

Below `mobileBreakpoint` (768px) it plays `mobileSrc` when there is one: a
lighter encode, or a portrait cut. On a touch phone the play and pause control
grows to 44px. Nothing about it changes on a desktop.

## Sizing the files

Keep loops short (3 to 10 seconds) and small: under 4MB for a full-width hero,
under 1.5MB for a mobile cut or a demo. MP4 with H.264 plays in every browser.
