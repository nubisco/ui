---
layout: nubisco
title: Image Picker
intro: '`NbImagePicker` shows one picture in a box and lets people add, replace or remove it, by clicking or by dropping a file. It is for company logos, avatars and any other "add a picture" spot. It emits the chosen file and never uploads it.'
source: src/components/ImagePicker.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

## When to use it

Use it wherever a person adds a single picture that belongs to a record: a
company logo, a client logo, a profile photo. Use `NbFileUploader` for
documents, and several files at once. Use `NbImageCropper` when the picture has
to be framed before it is kept.

<preview>
  <NbGrid dir="row" gap="lg" align="start">
    <NbImagePicker :src="empty" label="Add logo" @pick="pickEmpty" />
    <NbImagePicker :src="logo" alt="Sample mark" @pick="pickLogo" @remove="logo = ''" />
  </NbGrid>
</preview>

Empty, it is a dashed drop target with a label. With a picture, the picture fills
the box, and a trash can appears at the top right on hover and on keyboard focus.
On a touch screen, where there is no hover, it is always there.

## Removing

Removal is on by default: wherever someone adds a picture, they usually want a
way to take it away. It is a choice, not a fixed part of the control:

- **Allowed:** the default. The trash can emits `remove`.
- **Not offered:** set `:removable="false"`. The button is not drawn, for a
  picture the person should not delete.
- **Offered but unavailable:** set `remove-disabled`. The button stays and is
  greyed out, for an app that allows it only sometimes, such as a logo that
  cannot go while invoices use it. Say why in a helper text next to it.

## Writing the labels

Name what the picture is, not the action in general: "Add logo", not "Upload".
The remove label says what is lost: "Remove logo". Pass the labels in the
product's language (`label`, `drop-label`, `replace-label`, `remove-label`).

<!--@include: ./_shared.md-->
