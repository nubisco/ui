---
layout: nubisco
title: Copy Button
intro: '`NbCopyButton` is a small icon button that puts a piece of text on the clipboard and turns into a checkmark for a moment to say it worked. Use it beside the thing being copied: a card key whose link people paste into a chat, an API token, an id.'
source: src/components/CopyButton.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

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
