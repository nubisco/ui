---
layout: nubisco
title: Log View
intro: '`NbLogView` is read-only output: a log or a terminal, in monospace, following the newest line unless the reader scrolled up, with a copy-all action. It renders only the newest lines, so a log that runs for hours stays as quick as one that just started.'
source: src/components/LogView.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: tested
  screenReader: not recorded
---

## What the component does

- **A named log.** The lines sit in an element with `role="log"`, named by `label` ("Log").
- **Quiet by default.** `aria-live` is `off` unless `announce` is set, because a busy log would talk over everything else on the page. Turn it on for a log that writes a line now and then.
- **Level in words, not only colour.** An error or warning line shows its word as the marker when it has none. The colours are text colours held to 4.5:1 on every layer, light and dark.
- **Times are `<time>` elements** with a machine-readable `datetime`.
- **Scrollable from the keyboard.** The log is a tab stop, so the arrow keys and Page Up and Page Down scroll it.
- **Nothing moves under the reader.** The log follows the newest line only while the reader is at the end. "Jump to newest" is a real button, and it scrolls without animation under reduced motion.
- **A named copy button.** It is an `NbCopyButton` named "Copy log", which says "Copied" once it has.
- **Hidden lines are said.** The note at the top counts the lines not rendered.

## Keyboard

| Key                        | Does                             |
| -------------------------- | -------------------------------- |
| <kbd>Tab</kbd>             | The copy button, then the log    |
| Arrows, Page Up, Page Down | Scroll the log once it has focus |

## Known gaps

- No manual screen reader pass has been recorded for this component.
- Lines that are not rendered cannot be reached by a screen reader in the page. Copy-all, or a higher `max-lines`, reaches them.

<!--@include: ./_shared.md-->
