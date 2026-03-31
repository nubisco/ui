---
layout: nubisco
title: Image Cropper
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbImageCropper` allows users to select and crop an image with precision. It supports circular and rectangular crops, aspect ratio locking, and a real-time preview of the cropped output.

::: tip
The component automatically handles image scaling and positioning to fit within the display area while maintaining the original aspect ratio.
:::

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbImageCropper v-bind="resultingProps" :image="selectedImage" @crop="handleCrop" />
</preview>

```vue
<template>
  <NbImageCropper :image="selectedImage" @crop="handleCrop" />
  <input
    type="file"
    ref="fileInput"
    accept="image/*"
    style="display: none"
    @change="onFileChange"
  />
  <NbButton @click="() => fileInput.click()">Open File</NbButton>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const fileInput = ref<HTMLInputElement | null>(null)
const selectedImage = ref<File | null>(null)

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) selectedImage.value = input.files[0]
}

const handleCrop = (data: {
  blob: Blob
  geometry: { x: number; y: number; width: number; height: number }
}) => {
  const formData = new FormData()
  formData.append('file', data.blob, 'cropped.png')
  formData.append('geometry', JSON.stringify(data.geometry))
}
</script>
```

## Circle crop

When `cropAsCircle` is enabled, the crop area is displayed as a circle overlay.

<preview>
  <NbImageCropper :image="selectedImage" :cropAsCircle="true" @crop="handleCrop" />
</preview>

## Locked aspect ratio

When `lockAspectRatio` is enabled, the crop area maintains its proportions during resizing. Combined with `cropAsCircle`, this creates a perfect circle.

<preview>
  <NbImageCropper :image="selectedImage" :lockAspectRatio="true" :cropAsCircle="true" @crop="handleCrop" />
</preview>

## With live preview

Enable `showPreview` to display a real-time preview of the cropped area and its geometry data.

<preview>
  <NbImageCropper :image="selectedImage" :showPreview="true" @crop="handleCrop" />
</preview>

## Circular output

When `outputAsCircle` is enabled, the final cropped image has transparent corners, producing a circular PNG.

<preview>
  <NbImageCropper :image="selectedImage" :cropAsCircle="true" :outputAsCircle="true" @crop="handleCrop" />
</preview>

</doc-tab>

<doc-tab name="Api">

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

</doc-tab>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const selectedImage = ref<File | null>(null)

const availableProps = [
  {
    label: 'Crop as Circle',
    name: 'cropAsCircle',
    type: 'boolean',
    placeholder: 'Display crop area as a circle overlay',
    default: false,
  },
  {
    label: 'Output as Circle',
    name: 'outputAsCircle',
    type: 'boolean',
    placeholder: 'Output cropped image as a circle with transparent corners',
    default: false,
  },
  {
    label: 'Lock Aspect Ratio',
    name: 'lockAspectRatio',
    type: 'boolean',
    placeholder: 'Lock the aspect ratio during resizing',
    default: false,
  },
  {
    label: 'Show Preview',
    name: 'showPreview',
    type: 'boolean',
    placeholder: 'Display live preview of cropped image',
    default: false,
  },
]

const handleCrop = (croppedData: { blob: Blob; geometry: { x: number; y: number; width: number; height: number } }) => {
  const { blob, geometry } = croppedData
  const formData = new FormData()
  formData.append('file', blob, 'cropped-image.png')
  formData.append('geometry', JSON.stringify(geometry))
}

const loadDefaultImage = async () => {
  try {
    const response = await fetch('/media/sample.webp', { mode: 'cors' })
    if (!response.ok) return
    const blob = await response.blob()
    selectedImage.value = new File([blob], 'sample-image.jpg', { type: blob.type })
  } catch {
    // silently ignore — user can load their own image
  }
}

onMounted(() => {
  loadDefaultImage()
})
</script>
