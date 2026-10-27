---
layout: nubisco
title: Walkthrough
intro: '`NbWalkthrough` is a guided product tour (coach-marks): it dims the screen, spotlights one element at a time, and shows a popover with a description and controls. Use it to teach first-time users the shape of the application, where the navigation lives, what the views are for, where the common controls sit.'
source: src/components/Walkthrough.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- The popover is a `role="dialog"` with `aria-modal="true"`. Focus moves into it when the tour starts, so a screen reader announces the title and body before the controls.
- <kbd>Tab</kbd> is trapped inside the popover: the page behind the scrim is not interactive, and letting focus walk out of the dialog would strand the user on invisible controls.
- <kbd>Escape</kbd> skips the tour.
- Focus returns to whatever was focused before the tour started, so a tour launched from a help menu returns you to the menu.
- The step counter is `aria-live="polite"`, so advancing announces the new position.
- Under `prefers-reduced-motion: reduce`, the popover animation is dropped and scrolling a target into view becomes an instant jump instead of a smooth scroll.

<!--@include: ./_shared.md-->
