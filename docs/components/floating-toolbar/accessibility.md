---
layout: nubisco
title: Floating Toolbar
intro: '`NbFloatingToolbar` is a small bar of controls that floats next to something on the page: formatting buttons over a text selection, actions over a selected image, alignment controls over a table cell. It holds ordinary `NbButton`s, places itself with the same flip-and-clamp logic as `NbInfoHint`, and is careful never to take focus from the thing it acts on.'
source: src/components/FloatingToolbar.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Keyboard

The toolbar is a single tab stop, following the WAI-ARIA toolbar pattern.

| Key                                   | Does                                            |
| ------------------------------------- | ----------------------------------------------- |
| <kbd>&rarr;</kbd> / <kbd>&larr;</kbd> | Next or previous control, wrapping (horizontal) |
| <kbd>&darr;</kbd> / <kbd>&uarr;</kbd> | Next or previous control, wrapping (vertical)   |
| <kbd>Home</kbd> / <kbd>End</kbd>      | First or last control                           |
| <kbd>Tab</kbd>                        | Leaves the toolbar                              |
| <kbd>Esc</kbd>                        | Emits `close`                                   |

Disabled controls are skipped. Arrow keys inside a text field move the caret, not the toolbar.

## Accessibility

- `role="toolbar"`, named by the required `label` and oriented by `aria-orientation`.
- Roving `tabindex` is applied to the slotted controls directly, so plain `NbButton`s work without any extra wiring. It is kept up to date as controls are added, removed or disabled.
- Icon-only buttons need their own accessible name. Pass `aria-label` to each `NbButton`, as in the examples.
- The entrance animation is suppressed under `prefers-reduced-motion: reduce`.

<!--@include: ./_shared.md-->
