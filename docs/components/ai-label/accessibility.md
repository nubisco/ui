---
layout: nubisco
title: AI Label
intro: 'The AI label marks content a model wrote or changed. It is present wherever that content appears, and when there is something to say about how the content was made, it opens to say it.'
source: src/components/AiLabel.vue
tab: accessibility
pageTabs: ['usage', 'style', 'code', 'accessibility']
a11y:
  automated: not recorded
  keyboard: tested
  screenReader: not recorded
---

## The mark

- A `span` with `role="img"`, named "Written by AI" by default. Screen readers announce it where it sits, next to the content it marks.
- The glyph is `aria-hidden`, and so are the inline dot and word: the name carries the meaning.
- It takes no focus. There is nothing to do with it.

## The control

- A real `<button>`, reachable with <kbd>Tab</kbd> and activated with <kbd>Enter</kbd> or <kbd>Space</kbd>.
- Always named: "AI, show information" by default, or `label`. A nameless button fails WCAG 4.1.2, and the component cannot render one.
- It only exists when it does something. Without an explanation, actions or a click listener it is the mark instead, so nobody reaches a control that does nothing.
- It is never disabled.
- Its focus ring is `--nb-c-focus-ring`, the same as every other control.

## The explanation

- A non-modal `role="dialog"` named "About this AI content", not a tooltip: it can hold links and buttons, which a tooltip may not.
- The label carries `aria-expanded` and `aria-controls` pointing at it.
- <kbd>Tab</kbd> from the label moves into the explanation, to its first link or button, or to the explanation itself when it has none.
- <kbd>Shift</kbd>+<kbd>Tab</kbd> from its start goes back to the label. <kbd>Tab</kbd> off its end closes it and returns to the label.
- <kbd>Escape</kbd> closes it from the label or from inside it and returns focus to the label.
- A press outside closes it and leaves focus where the person put it.
- On a phone it is a bottom sheet over a dimmed page, and a tap on the page closes it.

## Revert

- Once a person has edited the AI value, the label is an undo button named "Revert to AI input", or `revert-label`. Name it after what it restores when the page has several: "Restore the AI title".
- Activating it emits `revert`. The host restores the value and the label goes back to marking it.

## Content

- Write the explanation in plain sentences. Say what the facts were, who phrased them, and whether the plain version was used.
- Do not show a confidence score from the model. It is not checked against anything, and a number gives it an authority it has not earned.
- Localise the label with `text` (inline) and `label`, the explanation and the action wording through their props.
