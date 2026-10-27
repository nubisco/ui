---
layout: nubisco
title: Image Cropper
intro: '`NbImageCropper` allows users to select and crop an image with precision. It supports circular and rectangular crops, aspect ratio locking, and a real-time preview of the cropped output.'
source: src/components/ImageCropper.vue
tab: usage
pageTabs: ['usage', 'code']
---

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

<!--@include: ./_shared.md-->
