---
layout: nubisco
title: Chat Thread
intro: '`NbChatThread` is a conversation: a scrolling log of `NbChatMessage`s that follows the newest one unless the reader has scrolled up, and an optional composer under it. Use it where people talk to each other or to an agent.'
source: src/components/ChatThread.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: tested
  screenReader: not recorded
---

## What the component does

- **A polite log.** The messages sit in an element with `role="log"` and `aria-live="polite"`, named by `label` ("Conversation"). A screen reader reads each message as it is added, author, time and text, without moving focus.
- **Busy while working.** `working` sets `aria-busy` on the log, and the indicator is an `NbInlineLoading`, a status region of its own.
- **Scrollable from the keyboard.** The log is a tab stop, so the arrow keys and Page Up and Page Down scroll it.
- **Nothing moves under the reader.** The log follows the newest message only while the reader is at the end. The "Jump to newest" button is a real button, and it scrolls without animation under reduced motion.
- **A named composer.** The field is named by `composer-label` ("Message"). The send and stop buttons are icon-only `NbButton`s whose `label` is their name and their tooltip.
- **A disabled composer says why.** The reason is written under the field, and the send button stays focusable with the reason as its description.
- **AI is labelled.** A message with `ai` carries the AI label after its author, so it is announced as AI-written.
- **The avatar is decorative.** The author's name is beside it, so it is not announced twice.

## Keyboard

| Key                                             | Does                                            |
| ----------------------------------------------- | ----------------------------------------------- |
| <kbd>Tab</kbd>                                  | The log, then the field, then stop and send     |
| <kbd>Enter</kbd>                                | Sends, on a desktop. Breaks the line on a phone |
| <kbd>Shift</kbd>+<kbd>Enter</kbd>               | Breaks the line                                 |
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Enter</kbd> | Sends, on a phone with a hardware keyboard too  |

Enter that confirms an input method's composition (Japanese, Chinese, Korean) is left alone.

## What you own

- **`own` on the viewer's messages.** The thread does not know who is reading.
- **`ai` on every message a model wrote**, and an explanation built from what the product computed.
- **A `disabled-reason`** whenever the composer is off.

## Known gaps

- No manual screen reader pass has been recorded for this component.
- The field grows with its text only where the browser supports `field-sizing`. Elsewhere it is one row that scrolls.

<!--@include: ./_shared.md-->
