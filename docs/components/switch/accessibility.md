---
layout: nubisco
title: Switch
intro: '`NbSwitch` is a toggle control that represents an on/off binary state. It supports labels, sizes, variants, and a verbose mode that shows the current state as text.'
source: src/components/Switch.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: native
  screenReader: not recorded
---

## What the component guarantees

- **A switch, announced as one.** A native `<input type="checkbox" role="switch">`, so a reader says "on" and "off" rather than "checked", and the browser handles <kbd>Space</kbd>. It is visually hidden inside the track, not removed, so it is in the tab order.
- **A label tied to it.** `label` renders an `NbLabel` whose `for` is the input's id. `hide-label` hides it visually and keeps it for assistive technology, for a switch whose row already says what it does.
- **A visible focus ring**, 2px of `--nb-c-focus-ring` around the track under `:focus-visible`.
- **Disabled is native** on the input, with `aria-disabled` on the track.
- **A fingertip target on phones**: the `hit-area` mixin gives the 32 by 16 track a 44px box on a phone touch screen. A desktop is unchanged.
- Tested in `tests/Switch.test.ts` and by axe in `tests/axe.test.ts`.

## Keyboard

| Key              | Action              |
| ---------------- | ------------------- |
| <kbd>Tab</kbd>   | Moves to the switch |
| <kbd>Space</kbd> | Turns it on or off  |

## What you own

- **A label**, visible or with `hide-label`. Without one the switch is announced as "switch, off" and nothing else.
- **Immediate effect.** A switch says the change happens now. If it only takes effect when a form is saved, use `NbCheckbox`.
- **Announcing a failure.** If turning it on fails (a request rejected), revert it and say so with a toast; a switch that quietly flips back is not announced.

## Known gaps

- `verbose` draws ON and OFF as generated content on the track. It is decoration: the state a reader hears comes from the input, not from that text.
- No validation props (`error`, `helper`). A switch inside a form that needs a message has to carry it beside the switch, linked by you.
- No manual screen reader pass has been recorded for this component.

<!--@include: ./_shared.md-->
