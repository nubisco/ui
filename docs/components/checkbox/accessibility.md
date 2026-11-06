---
layout: nubisco
title: Checkbox
intro: '`NbCheckbox` provides a clean, accessible checkbox input with optional label support and two-way binding via `v-model`.'
source: src/components/Checkbox.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: native
  screenReader: not recorded
---

## What the component guarantees

- **A native checkbox.** A real `<input type="checkbox">`, visually hidden but focusable, inside a `<label>` that wraps the box and the text. Clicking the text toggles it and a reader names it from the text.
- **Indeterminate is real.** `indeterminate` sets the native property, which readers announce as "mixed".
- **Disabled is native,** and an `NbCheckboxGroup` with `disabled` disables every checkbox in it.
- **A visible focus ring** on the drawn box under `:focus-visible`.
- **Group validation reaches every box.** Inside an `NbCheckboxGroup` with `error`, each checkbox carries `aria-invalid="true"`, and each points with `aria-describedby` at the group's visible message by its id. The group is `role="group"` named by its `label`. An error that appears or changes after mount is announced once, with `role="alert"`; one present on load is read on focus instead.
- **A fingertip target on phones.** On a phone touch screen the row is 44px tall and the `hit-area` mixin gives the box a 44px square, which matters for a box with no label (a table's select column). A desktop is unchanged.
- Tested in `tests/Checkbox.test.ts`, `tests/CheckboxGroup.test.ts` and `tests/fieldValidationAria.test.ts`, and by axe in `tests/axe.test.ts`.

## Keyboard

| Key              | Action                     |
| ---------------- | -------------------------- |
| <kbd>Tab</kbd>   | Moves to the next checkbox |
| <kbd>Space</kbd> | Toggles it                 |

Each checkbox is its own tab stop, as the platform does it. Checkboxes are not a composite.

## What you own

- **A name for a box without visible text.** Put the name in the default slot inside your own visually hidden span ("Select Ada Lovelace"), or the reader hears only "checkbox". `NbDataTable`'s own select column already does this.
- **A group label** on `NbCheckboxGroup` when the checkboxes answer one question.
- **What indeterminate means.** A "select all" that is mixed should say how many are selected somewhere a reader can find.

## Known gaps

- Attributes you pass (`aria-label`, `aria-describedby`, `aria-invalid`) land on the wrapping `<label>`, not on the input, so they do not reach the control. Name it through the slot, as above.
- A standalone `NbCheckbox` has no `error` or `helper` of its own; validation comes from its `NbCheckboxGroup`. A single required checkbox ("I accept the terms") cannot carry `aria-invalid` today: wrap it in an `NbCheckboxGroup` with the error.
- No manual screen reader pass has been recorded for this component.

<!--@include: ./_shared.md-->
