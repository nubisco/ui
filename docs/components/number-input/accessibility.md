---
layout: nubisco
title: Number Input
intro: '`NbNumberInput` is a numeric field with built-in stepper buttons (`−` and `+`). It shares the same design language as `NbTextInput` and `NbSelect`, with default and fluid variants.'
source: src/components/NumberInput.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: native
  screenReader: not recorded
---

## What the component guarantees

- **A native number field.** It renders `<input type="number">` with `min`, `max` and `step`, so a reader announces it as a spin button and the arrow keys step it natively.
- **A label tied to the field** through `for` and the field's id.
- **Validation a reader hears.** With `error`, the field carries `aria-invalid="true"` and `aria-describedby` points at the visible message by its id (`{id}-error`, `{id}-warning`, `{id}-helper`). A message present on first render is read on focus and not announced on load; one that appears or changes later mounts with `role="alert"` (error) or `role="status"` (warning). The status icon inside the field repeats the message for sighted users and is `aria-hidden`, so a reader hears it once.
- **Named steppers.** The `−` and `+` buttons are real `<button>`s named "Decrease" and "Increase". They do not take focus from the field on a mouse press.
- **Text a phone will not zoom**, at least 16px on a phone touch screen.
- Tested in `tests/NumberInput.test.ts` and `tests/fieldValidationAria.test.ts`, and by axe in `tests/axe.test.ts`.

## Keyboard

| Key                       | Action                                        |
| ------------------------- | --------------------------------------------- |
| <kbd>↑</kbd> <kbd>↓</kbd> | Steps the value by `step` (the browser's own) |
| <kbd>Enter</kbd>          | Commits the typed value (the field blurs)     |
| <kbd>Tab</kbd>            | Moves to the steppers, then out               |

## What you own

- **A label.** Without `label` the field has no name.
- **Units.** "Seats" or "Price (EUR)" in the label; a unit drawn only beside the field is not read with it.
- **Error text that says the range**, "Between 1 and 50", rather than "Invalid".

## Known gaps

- <kbd>Enter</kbd> blurs the field to commit it, so focus leaves the field. A keyboard user presses <kbd>Shift</kbd>+<kbd>Tab</kbd> to return.
- The stepper buttons add two tab stops after every field. They are reachable, which is correct, and a long form of number fields is a long tab sequence.
- No manual screen reader pass has been recorded for this component.

<!--@include: ./_shared.md-->
