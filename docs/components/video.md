---
layout: nubisco
title: Video
tabs: ['Usage', 'Accessibility', 'Api']
---

<doc-tab name="Usage">

`NbVideo` is a short, silent, looping video that takes the place of a still
picture: a hero film, a five-second demo of a product being used. It is not a
player for something to sit and watch. There are no controls beyond play and
pause, and no sound.

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

</doc-tab>

<doc-tab name="Accessibility">

## Accessibility

- It never starts by itself when the visitor prefers reduced motion or has
  asked to save data. The poster stays, and the play control starts it.
- A play and pause control is always there, in the corner, so motion can be
  stopped (WCAG 2.2.2). Once paused by the visitor it stays paused, even when
  it scrolls away and back.
- It is always muted, so it never makes a sound nobody asked for.
- Without `label` it is decorative and hidden from screen readers. Give it a
  `label` when it shows something the page does not say in words.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop               | Type                   | Default         | Description                                      |
| ------------------ | ---------------------- | --------------- | ------------------------------------------------ |
| `src`              | `string`               | required        | The video file                                   |
| `poster`           | `string`               | required        | The still painted first, and kept without motion |
| `mobileSrc`        | `string`               |                 | A lighter cut for narrow screens                 |
| `mobileBreakpoint` | `number`               | `768`           | Width in px under which `mobileSrc` is used      |
| `label`            | `string`               |                 | What it shows, for screen readers                |
| `width`            | `number`               |                 | Intrinsic width, to reserve the space            |
| `height`           | `number`               |                 | Intrinsic height, to reserve the space           |
| `fit`              | `'cover' \| 'contain'` | `'cover'`       | Crop to fill, or show whole                      |
| `loop`             | `boolean`              | `true`          | Loop the video                                   |
| `playLabel`        | `string`               | `'Play video'`  | Accessible name of the play control              |
| `pauseLabel`       | `string`               | `'Pause video'` | Accessible name of the pause control             |

</doc-tab>
