---
layout: nubisco
title: Back To Top
tabs: ['Usage', 'Accessibility', 'Api']
---

<doc-tab name="Usage">

`NbBackToTop` is a round floating button in the bottom corner that takes the
visitor back to the top of a long page. It appears once the page has been
scrolled past one screen height, and disappears again near the top. Place it
once, in the layout every long page shares.

```vue
<template>
  <main>...</main>
  <NbBackToTop />
</template>
```

## When it appears

By default after one screen height of scrolling, the point at which the first
screen is gone. `threshold` sets a different distance in pixels. The scroll
position is read once per frame, however fast the page moves.

## On a phone

On a touch phone it sits closer to the corner, clear of the home indicator
through the safe-area insets, and its target grows to 44px. Nothing about it
changes on a desktop.

</doc-tab>

<doc-tab name="Accessibility">

## Accessibility

- It is a real button named by `label` ("Back to top" by default), with the
  same text as its tooltip.
- It is only in the page while it is shown, so it is never an invisible tab
  stop on the first screen.
- Used from the keyboard, focus returns to the first focusable element on the
  page, so the next Tab continues from the top rather than from a button that
  has just disappeared. A mouse click leaves focus where it is.
- Under reduced motion the page jumps instead of scrolling smoothly, and the
  button appears without a transition.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop        | Type     | Default           | Description                              |
| ----------- | -------- | ----------------- | ---------------------------------------- |
| `threshold` | `number` | one screen height | How far the page must be scrolled, in px |
| `label`     | `string` | `'Back to top'`   | Accessible name and tooltip              |

</doc-tab>
