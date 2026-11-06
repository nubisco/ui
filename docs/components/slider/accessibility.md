---
layout: nubisco
title: Slider
intro: '`NbSlider` is a draggable range input with an optional `NbNumberInput` companion. It supports single-value and two-handle range modes.'
source: src/components/Slider.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: partial
  keyboard: tested
  screenReader: not recorded
---

## What the component guarantees

- **Handles are sliders.** Each handle is `role="slider"` in the tab order, with `aria-valuemin`, `aria-valuemax` and `aria-valuenow`. A single slider is named by its `label` (`aria-labelledby`). In range mode the two handles are named "Minimum" and "Maximum", after the label when there is one, and each handle's bounds stop at the other's value, so the reader hears the real limits.
- **Validation a reader hears.** With `error`, each handle carries `aria-invalid="true"` and `aria-describedby` points at the visible message by its id (`{id}-error`, `{id}-warning`, `{id}-helper`). A message present on load is read on focus; one that appears or changes later mounts with `role="alert"` (error) or `role="status"` (warning).
- **A visible focus ring.** The single handle draws 2px of `--nb-c-focus-ring`. A range handle is clipped to a triangle, which would clip its outline, so the track carries the ring while either handle has focus.
- **The companion field** (`show-input`) is an `NbNumberInput`, reachable and typeable.
- Keys and validation tested in `tests/fieldValidationAria.test.ts`, markup by axe in `tests/axe.test.ts` (see the gap below).

## Keyboard

| Key                                       | Action               |
| ----------------------------------------- | -------------------- |
| <kbd>→</kbd> <kbd>↑</kbd>                 | Up one `step`        |
| <kbd>←</kbd> <kbd>↓</kbd>                 | Down one `step`      |
| <kbd>Page Up</kbd> / <kbd>Page Down</kbd> | Up or down ten steps |
| <kbd>Home</kbd> / <kbd>End</kbd>          | To `min` or `max`    |

## What you own

- **A `label`.** Without it a single handle has no name.
- **Units and meaning.** `aria-valuenow` is a bare number. If the value is a percentage, a price or a time, say so in the label ("Volume, percent").
- **Not acting on every step.** Keys emit `update:modelValue` and `change` on every press. Debounce anything expensive.

## Known gaps

- **The companion number fields have no name.** With `show-input`, each `NbNumberInput` beside the track is rendered without a label, so a reader hears "spin button" alone. axe reports it, and it is the one entry in `tests/axe-baseline.json`. Turn `show-input` off, or label the slider so at least the handles are named, until it is fixed.
- No `aria-valuetext`, so a value with units is read as a bare number.
- No manual screen reader pass has been recorded for this component.

<!--@include: ./_shared.md-->
