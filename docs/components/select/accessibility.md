---
layout: nubisco
title: Select
intro: '`NbSelect` is a custom dropdown that replaces the native `<select>`. It shares the same design language as `NbTextInput`: two variants (default / fluid), error/warning states, multi-select support, and full keyboard navigation.'
source: src/components/Select.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: tested
  screenReader: not recorded
---

## What the component guarantees

- **A combobox and a listbox.** The trigger is a `<button role="combobox">` with `aria-expanded`, `aria-haspopup="listbox"` and, while open, `aria-controls` pointing at the list. The list is `role="listbox"` (with `aria-multiselectable` for `multiple`), groups are `role="group"`, and each option is `role="option"` with `aria-selected` and `aria-disabled`.
- **The label is wired.** `label` renders an `NbLabel` whose `for` matches the trigger's id, so clicking the label opens the control and a reader names it.
- **Validation is announced and linked.** With `error`, the trigger carries `aria-invalid="true"`. The visible message (error, warning or helper, in that order) has its own id (`{id}-error`, `{id}-warning`, `{id}-helper`) and the trigger points at it with `aria-describedby`. A message present on first render is read when the trigger takes focus and is not shouted on load. An error that appears or changes later mounts with `role="alert"`, a warning with `role="status"`. With your own `#trigger`, `attrs` carries `aria-invalid` too.
- **Search keeps the reader in step.** With `searchable`, the search box is named by `search-placeholder` and points at the highlighted option with `aria-activedescendant`, so a screen reader follows the highlight while focus stays in the box.
- **Clear is its own control.** With `clearable`, the clear button is a separate `NbButton` next to the trigger, named by its `label` (which is also its tooltip) and drawing the shared focus ring, reached with <kbd>Tab</kbd> after it. Pressing it never opens the list, and focus goes back to the trigger.
- **Focus comes back.** Closing the list returns focus to the trigger. Inside an `NbModal`, the teleported list is part of the dialog for the focus trap.
- Tested in `tests/Select.test.ts` and `tests/fieldValidationAria.test.ts`, and by axe in `tests/axe.test.ts`.

## Keyboard

| Key                                                | Action                                         |
| -------------------------------------------------- | ---------------------------------------------- |
| <kbd>Enter</kbd> / <kbd>Space</kbd> / <kbd>↓</kbd> | On the trigger, opens the list                 |
| <kbd>↑</kbd> <kbd>↓</kbd>                          | Moves the highlight, skipping disabled options |
| <kbd>Home</kbd> / <kbd>End</kbd>                   | First or last option                           |
| <kbd>Enter</kbd> / <kbd>Space</kbd>                | Selects the highlighted option                 |
| <kbd>Esc</kbd> / <kbd>Tab</kbd>                    | Closes the list                                |

With `searchable`, typing narrows the list, <kbd>Enter</kbd> picks the highlighted match, and <kbd>Space</kbd> is part of the search, not a choice.

## What you own

- **A label.** Without `label`, a `#label` slot or an `aria-label`, the trigger is named only by its current value.
- **Error text that says how to fix it.** "Choose a country" rather than "Invalid".
- **Not opening a list nobody asked for.** Opening the list programmatically (the exposed `open()`) moves focus into it; only do that in response to the user.

## Known gaps

- No manual screen reader pass has been recorded for this component.
- In forced-colours mode the highlighted option and the default `fill` selection are background washes, which the browser discards. With `selected-mark="check"` the selection keeps its glyph; the highlight does not survive either way.

<!--@include: ./_shared.md-->
