---
layout: nubisco
title: Radio
intro: '`NbRadio` renders a group of radio button inputs for single-choice selection. Radio buttons in the same group share a `name` attribute, ensuring only one can be active at a time.'
source: src/components/Radio.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: native
  screenReader: not recorded
---

## What the component guarantees

- **Native radios in a radiogroup.** Each option is a real `<input type="radio">` sharing your `name`, inside a `<label>` with its text. The options sit in a `role="radiogroup"` labelled by the group's `label` (`aria-labelledby`), so a reader says "Plan, radio group" before the first option.
- **Validation on the group.** With `error`, the radiogroup carries `aria-invalid="true"`, and `aria-describedby` points at the visible message by its id (`{id}-error`, `{id}-warning`, `{id}-helper`). A message present on first render is read on entering the group and not announced on load; one that appears or changes later mounts with `role="alert"` (error) or `role="status"` (warning).
- **Disabled and read-only.** `disabled` disables every input natively and sets `aria-disabled` on the group; a disabled option is skipped by the arrow keys. `readonly` keeps the choice visible and refuses changes.
- **A visible focus ring** on the drawn circle under `:focus-visible`.
- **A fingertip target on phones**: each option row is 44px tall on a phone touch screen, and the `hit-area` mixin gives the circle a 44px square. A desktop is unchanged.
- Tested in `tests/Radio.test.ts` and `tests/fieldValidationAria.test.ts`, and by axe in `tests/axe.test.ts`.

## Keyboard

The browser's own radio group behaviour, which is the WAI-ARIA one:

| Key                                                 | Action                                                     |
| --------------------------------------------------- | ---------------------------------------------------------- |
| <kbd>Tab</kbd>                                      | Into the group, on the checked option (or the first)       |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | Moves to and selects the previous or next option, wrapping |
| <kbd>Space</kbd>                                    | Selects the focused option if none is selected             |

## What you own

- **A `name`** unique to the group on the page. Two groups with one `name` are one group to the browser and to the arrow keys.
- **A `label`** for the question the options answer. Without it the radiogroup is unnamed.
- **Whether arrows should act.** Arrowing selects, so an option that triggers work on selection (a filter that refetches) fires as the user moves through the list.

## Known gaps

- `readonly` is not a state radios have natively, and the group does not carry `aria-readonly`, so a reader announces read-only options as editable. Prefer showing the chosen value as text when it cannot change.
- No manual screen reader pass has been recorded for this component.

<!--@include: ./_shared.md-->
