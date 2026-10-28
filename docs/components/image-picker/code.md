---
layout: nubisco
title: Image Picker
intro: '`NbImagePicker` shows one picture in a box and lets people add, replace or remove it, by clicking or by dropping a file. It is for company logos, avatars and any other "add a picture" spot. It emits the chosen file and never uploads it.'
source: src/components/ImagePicker.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Basic usage

The picker holds nothing: pass the current image in as `src` (a URL or a data
URL), and handle `pick` and `remove` yourself. Upload in `pick`, and set `src`
to what you now hold.

<preview>
  <NbImagePicker :src="logo" alt="Sample mark" @pick="pickLogo" @remove="logo = ''" />
</preview>

```vue
<template>
  <NbImagePicker
    :src="logoUrl"
    alt="Company logo"
    label="Add logo"
    remove-label="Remove logo"
    :loading="uploading"
    :max-size="200 * 1024"
    @pick="upload"
    @remove="remove"
    @reject="onReject"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const logoUrl = ref('')
const uploading = ref(false)

async function upload(file: File) {
  uploading.value = true
  try {
    logoUrl.value = await api.uploadLogo(file)
  } finally {
    uploading.value = false
  }
}

async function remove() {
  await api.deleteLogo()
  logoUrl.value = ''
}

function onReject({ file, reason }: { file: File; reason: 'type' | 'size' }) {
  // Say why, in the product's words.
}
</script>
```

## Limits

`accept` takes what `<input accept>` takes and defaults to `image/*`. `max-size`
is in bytes. A file that fails either check is **not** emitted as `pick`: the
picker emits `reject` with the file and the reason (`'type'` or `'size'`), and
the product says why in its own words. The same checks apply to a dropped file,
which the browser does not check itself.

<preview>
  <NbGrid dir="column" gap="sm" align="start">
    <NbImagePicker label="Add logo" :max-size="204800" @pick="pickEmpty" @reject="onReject" :src="empty" />
    <NbMessage v-if="rejected" variant="error">{{ rejected }}</NbMessage>
  </NbGrid>
</preview>

## Size and shape

`size` is the width: a number is pixels, a string is any CSS length. `ratio` is the
shape, as a CSS `aspect-ratio`, square by default. `fit` is `contain` (all of the
image, right for a logo) or `cover` (fills the box and crops, right for a photo).

<preview>
  <NbGrid dir="row" gap="lg" align="start">
    <NbImagePicker :src="mark" :size="96" />
    <NbImagePicker :src="mark" size="14rem" ratio="3 / 1" />
    <NbImagePicker :src="mark" :size="96" fit="cover" />
  </NbGrid>
</preview>

## Loading and disabled

`loading` covers the picker with a spinner and blocks picking, dropping and
removing while your upload runs. `disabled` blocks all of it and dims the box.

<preview>
  <NbGrid dir="row" gap="lg" align="start">
    <NbImagePicker :src="mark" loading />
    <NbImagePicker :src="mark" disabled />
    <NbImagePicker :src="mark" remove-disabled />
    <NbImagePicker :src="mark" :removable="false" />
  </NbGrid>
</preview>

## Props

| Prop             | Type                   | Default            | Description                                        |
| ---------------- | ---------------------- | ------------------ | -------------------------------------------------- |
| `src`            | `string`               | `''`               | Current image, as a URL or data URL                |
| `alt`            | `string`               | `''`               | What the image shows, for a screen reader          |
| `label`          | `string`               | `'Add image'`      | Text in the empty drop target                      |
| `dropLabel`      | `string`               | `'Drop to upload'` | Text while a file is dragged over                  |
| `replaceLabel`   | `string`               | `'Replace image'`  | Accessible name of the picker when it has an image |
| `removeLabel`    | `string`               | `'Remove image'`   | Tooltip and accessible name of the remove button   |
| `accept`         | `string`               | `'image/*'`        | File types taken, as for `<input accept>`          |
| `maxSize`        | `number`               | -                  | Largest file taken, in bytes                       |
| `removable`      | `boolean`              | `true`             | Draw the remove button while there is an image     |
| `removeDisabled` | `boolean`              | `false`            | Keep the remove button but make it unavailable     |
| `loading`        | `boolean`              | `false`            | Spinner over the picker, and block it              |
| `disabled`       | `boolean`              | `false`            | Block the picker                                   |
| `size`           | `number \| string`     | `'10rem'`          | Width of the box                                   |
| `ratio`          | `string`               | `'1 / 1'`          | Shape of the box, as a CSS `aspect-ratio`          |
| `fit`            | `'contain' \| 'cover'` | `'contain'`        | How the image sits in the box                      |

## Events

| Event    | Payload                                    | Description                                         |
| -------- | ------------------------------------------ | --------------------------------------------------- |
| `pick`   | `File`                                     | A file passed the checks. Upload it, then set `src` |
| `remove` | -                                          | The remove button was pressed                       |
| `reject` | `{ file: File, reason: 'type' \| 'size' }` | A file was turned away                              |

## Exposed

`open()` opens the file dialog, for a button of your own elsewhere on the page.

<!--@include: ./_shared.md-->
