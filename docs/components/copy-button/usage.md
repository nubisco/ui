---
layout: nubisco
title: Copy Button
intro: '`NbCopyButton` is a small icon button that puts a piece of text on the clipboard and turns into a checkmark for a moment to say it worked. Use it beside the thing being copied: a card key whose link people paste into a chat, an API token, an id.'
source: src/components/CopyButton.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

```vue
<template>
  <span class="key">MA-123</span>
  <NbCopyButton
    :text="`https://acta.nubisco.io/s/MA?item=MA-123`"
    label="Copy link to MA-123"
    copied-label="Link copied"
  />
</template>
```

## It works inside a clickable parent

The click, `pointerdown`, `mousedown` and `dblclick` stop at the button. Placed
on a card that opens on click or starts a drag on press, copying does neither.

## Where the clipboard is refused

It uses the async clipboard API, and falls back to the selection copy where
the page is not allowed it (plain http on a LAN address, a sandboxed frame).
If both are refused it shows no checkmark and emits `error`, so the host can
say so in a toast.
