---
layout: nubisco
title: Close Button
intro: '`NbCloseButton` is the one control that closes or dismisses something: a dialog, a side panel, a sheet, a toast, a banner. It is a ghost icon-only `NbButton` with the `x` icon, in the two sizes Carbon uses for the job.'
source: src/components/CloseButton.vue
tab: usage
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

<preview dir="row" gap="lg">
  <NbCloseButton size="lg" />
  <NbCloseButton />
  <NbCloseButton label="Close notifications" />
</preview>

```vue
<template>
  <!-- A dialog, a side panel, a sheet -->
  <NbCloseButton size="lg" @click="open = false" />

  <!-- A toast, a banner, a panel header -->
  <NbCloseButton @click="dismiss" />
</template>
```

## Why there is one

Before it, the library had nine close controls in seven sizes, from about 16px
to 56px, with four hover treatments and three focus colours. Each was right on
its own, and together they told the user that closing a thing works
differently depending on what the thing is. Every close and dismiss control in
the library is now this component, and a product's own should be too.

## Two sizes, by context

| Size           | Height | Use it for                                                                     |
| -------------- | ------ | ------------------------------------------------------------------------------ |
| `lg`           | 48px   | A surface that owns the screen or a column of it: dialogs, side panels, sheets |
| `sm` (default) | 32px   | Something that sits in the page: toasts, banners, tags, panel headers          |

Nothing in between. A close control that needs a third size is usually sitting
in a header that needs a second look.

## The name

The label is the button's accessible name and its tooltip. It comes from the
string catalogue's `close` ("Close"), so a translated app gets its language
everywhere. Pass `label` when the page has more than one thing to close and
the name should say which: "Close notifications", "Close inspector". The prop
wins over the catalogue.

## Where it goes

Top right, last in the tab order. In `NbModal` it is written after the footer,
so <kbd>Tab</kbd> reaches the body, the primary and the secondary before it, as
in every Carbon dialog.
