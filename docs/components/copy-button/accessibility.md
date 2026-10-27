---
layout: nubisco
title: Copy Button
intro: '`NbCopyButton` is a small icon button that puts a piece of text on the clipboard and turns into a checkmark for a moment to say it worked. Use it beside the thing being copied: a card key whose link people paste into a chat, an API token, an id.'
source: src/components/CopyButton.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- It is a real button named by `label`, which becomes `copiedLabel` while the
  checkmark shows. Name what is copied ("Copy link to MA-123"), not just
  "Copy".
- A polite status region says `copiedLabel` once, so a screen reader hears
  that the copy happened without having to see the icon change.
- The tooltip uses the `v-nb-tooltip` directive the app installs. Without it
  the button keeps its accessible name and simply shows no tooltip.
