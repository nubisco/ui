---
layout: nubisco
title: Input Group
intro: '`NbInputGroup` joins a field and the buttons that act on it into one control: an email with its Invite button, a link with Copy, a quantity with Add. Every box in the row is the same height, from the scale fields and buttons share, and the edges where they meet are joined.'
source: src/components/InputGroup.vue
tab: accessibility
pageTabs: ['usage', 'style', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: native
  screenReader: not recorded
---

## What the group does

- **The label is a real `<label for>`.** It points at the first field in the group, so a click on it lands in the field and the field is named by it.
- **The row is a named group.** It carries `role="group"` and `aria-labelledby` the label, so a screen reader announces every control in it, the button included, in the context of the label.
- **One message, read with the field.** The group's message has its own id, and every field in the group adds it to its `aria-describedby`. A group `error` also sets `aria-invalid` on the fields. As in a single field, a message present on first render is read on focus, not announced on load, and one that appears later is announced once.
- **One size.** Every control in the row has the same height, from the shared scale, so no control in it is a smaller target than the others.

## Keyboard

Nothing new. <kbd>Tab</kbd> moves through the field and then each button, in the order they are written. Each control keeps its own keys.

## What you own

- **A name for every icon-only button.** Give it a `label`, which names it and shows the same words as its tooltip.
- **One field per group.** Two fields in one group read as one control and are announced as one group.

## Known gaps

- No manual screen reader pass has been recorded for this component.

<!--@include: ./_shared.md-->
