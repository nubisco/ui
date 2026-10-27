---
layout: nubisco
title: Image Cropper
intro: '`NbImageCropper` allows users to select and crop an image with precision. It supports circular and rectangular crops, aspect ratio locking, and a real-time preview of the cropped output.'
source: src/components/ImageCropper.vue
tab: code
pageTabs: ['usage', 'code']
---

## Props

| Prop              | Type           | Default | Description                                                    |
| ----------------- | -------------- | ------- | -------------------------------------------------------------- |
| `image`           | `File \| null` | `null`  | The image file to crop                                         |
| `cropAsCircle`    | `boolean`      | `false` | Display the crop area as a circle overlay                      |
| `outputAsCircle`  | `boolean`      | `false` | Output the cropped image with transparent corners (circle PNG) |
| `lockAspectRatio` | `boolean`      | `false` | Maintain the crop area aspect ratio during resizing            |
| `showPreview`     | `boolean`      | `false` | Display a live preview of the cropped image and geometry       |

## Events

| Event  | Payload                                             | Description                           |
| ------ | --------------------------------------------------- | ------------------------------------- |
| `crop` | `{ blob: Blob; geometry: { x, y, width, height } }` | Emitted when the user crops the image |

The `blob` is ready to upload via `FormData`. The `geometry` object contains the crop rectangle in the original image's coordinate space.

<!--@include: ./_shared.md-->
