---
layout: nubisco
title: Text Input
intro: '`NbTextInput` is the primary text entry component. It wraps a native `<input>` or `<textarea>` with a label, validation messages, two layout variants, and four sizes. It is designed to sit flush on the same grid line as buttons and other form controls.'
source: src/components/TextInput.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: native
  screenReader: not recorded
---

## What the component guarantees

- **A native field.** It renders a real `<input>` (or `<textarea>` with `multiline`), so typing, selection, autofill, the on-screen keyboard and the reader's own field commands all work as the platform intends. `$attrs` land on the native element, so `autocomplete`, `inputmode` and `aria-*` you pass reach it.
- **A label tied to the field.** `label` renders an `NbLabel` (or, in `fluid`, a `<label>`) whose `for` matches the field's id. `required` sets the native `required` and shows an asterisk that is `aria-hidden`, so it is not read as "star".
- **Validation a reader hears.**
  - With `error`, the field carries `aria-invalid="true"`.
  - The visible message (error, then warning, then helper) has its own id, `{id}-error`, `{id}-warning` or `{id}-helper`, and the field points at it with `aria-describedby`. An `aria-describedby` you pass yourself is kept beside it.
  - A message present on first render is read when the field takes focus, and is not announced on load, so a form returned with server errors does not shout.
  - An error that appears or changes after mount mounts with `role="alert"`; a warning with `role="status"`.
  - In `fluid`, the message is an icon with a tooltip; its text stays in the accessibility tree, visually hidden, so `aria-describedby` still reads it.
- **Text a phone will not zoom.** Field text is at least 16px on a phone touch screen, so iOS does not zoom the page when the field takes focus.
- Tested in `tests/TextInput.test.ts` and `tests/fieldValidationAria.test.ts`, and by axe in `tests/axe.test.ts`.

## Keyboard

The browser's own. <kbd>Tab</kbd> reaches the field; everything inside it is native text editing. Buttons you put in the `#actions` slot, and the built-in clear and reveal buttons, are separate tab stops after the field. With `clearable`, <kbd>Escape</kbd> in a field that has a value empties it, and the key goes no further, so a dialog around the field stays open. On an empty field Escape is left alone.

## What you own

- **A label.** A placeholder is not a label: it disappears on the first keystroke and most readers treat it as a hint at best. Use `label`, the `#label` slot, or `aria-label`.
- **`autocomplete`** on personal data fields (`email`, `name`, `tel`, `street-address`), which WCAG 1.3.5 asks for and password managers rely on.
- **When to validate.** Showing an error on every keystroke announces an alert on every keystroke. Validate on blur or on submit, and after a failed submit move focus to the first invalid field.
- **Error text that says how to fix it.** "Enter an email like name@example.com" rather than "Invalid".
- **The names of `#actions` buttons.** Give each one a `label`, which names it and shows the same words as its tooltip. The built-in clear and reveal buttons (`clearable`, `revealable`) are already named, from the string catalogue, and the reveal button's name follows its state ("Show password", "Hide password").

## Known gaps

- With `highlight`, the native field is transparent over a mirror. It stays the real field for every assistive technology, but the colours a reader of the screen sees come from the mirror and are not measured by the contrast tests.
- No manual screen reader pass has been recorded for this component.

<!--@include: ./_shared.md-->
