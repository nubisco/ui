---
layout: nubisco
title: Video
intro: '`NbVideo` is a short, silent, looping video that takes the place of a still picture: a hero film, a five-second demo of a product being used. It is not a player for something to sit and watch. There are no controls beyond play and pause, and no sound.'
source: src/components/Video.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

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
