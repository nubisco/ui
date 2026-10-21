---
layout: nubisco
title: Copy Button
tabs: ['Usage', 'Accessibility', 'Api']
---

<doc-tab name="Usage">

`NbCopyButton` is a small icon button that puts a piece of text on the
clipboard and turns into a checkmark for a moment to say it worked. Use it
beside the thing being copied: a card key whose link people paste into a chat,
an API token, an id.

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

</doc-tab>

<doc-tab name="Accessibility">

## Accessibility

- It is a real button named by `label`, which becomes `copiedLabel` while the
  checkmark shows. Name what is copied ("Copy link to MA-123"), not just
  "Copy".
- A polite status region says `copiedLabel` once, so a screen reader hears
  that the copy happened without having to see the icon change.
- The tooltip uses the `v-nb-tooltip` directive the app installs. Without it
  the button keeps its accessible name and simply shows no tooltip.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop          | Type          | Default    | Description                                       |
| ------------- | ------------- | ---------- | ------------------------------------------------- |
| `text`        | `string`      | required   | What lands on the clipboard                       |
| `label`       | `string`      | `'Copy'`   | Accessible name and tooltip                       |
| `copiedLabel` | `string`      | `'Copied'` | Accessible name and tooltip while it shows a tick |
| `size`        | `TButtonSize` | `'xs'`     | Button size                                       |
| `duration`    | `number`      | `1500`     | How long the checkmark stays, in ms               |

## Events

| Event    | Payload          | Fired when                     |
| -------- | ---------------- | ------------------------------ |
| `copied` | `text: string`   | The text is on the clipboard   |
| `error`  | `error: unknown` | The browser refused, both ways |

</doc-tab>
