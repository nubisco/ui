---
layout: nubisco
title: Image Picker
intro: '`NbImagePicker` shows one picture in a box and lets people add, replace or remove it, by clicking or by dropping a file. It is for company logos, avatars and any other "add a picture" spot. It emits the chosen file and never uploads it.'
source: src/components/ImagePicker.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- The picker is a real `<button>`, reached with Tab and activated with Enter or
  Space, and it opens the browser's own file dialog. Its name is `label` when
  empty and `replace-label` when it has an image.
- The remove control is a second button next to it, never inside it. It is
  reached with Tab after the picker, it is shown whenever the picker has focus
  as well as on hover, and its name comes from `remove-label`. Pressing it never
  opens the file dialog.
- With `remove-disabled`, the button is natively disabled: it leaves the tab
  order and is announced as unavailable.
- `alt` describes the image. Leave it empty when the image is decoration beside
  a visible name.
- While `loading`, the picker is `aria-busy` and natively disabled.
- Dragging is an extra way in, never the only one: everything it does is
  available by keyboard.
