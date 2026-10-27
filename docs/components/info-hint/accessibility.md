---
layout: nubisco
title: Info Hint
intro: '`NbInfoHint` is a small, discreet affordance you drop next to anything whose meaning is not self-evident: a KPI number, a status word, a column header, an abbreviation. It renders a compact icon in a subtle token colour and reveals a short description on hover, focus, or click.'
source: src/components/InfoHint.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- The trigger is a real `<button>`, so it is reachable by <kbd>Tab</kbd> and activated by <kbd>Enter</kbd> or <kbd>Space</kbd>.
- `aria-expanded` reflects the open state; `aria-describedby` points at the popover only while it is visible, so the description is announced as the button's description rather than duplicated in its name.
- Give `label` a specific value when the hint sits next to an ambiguous value: the default name, "More information", tells a screen-reader user nothing about _what_ is being explained.
- <kbd>Escape</kbd> closes the popover and leaves focus on the trigger.
- The open animation is suppressed under `prefers-reduced-motion: reduce`.

<!--@include: ./_shared.md-->
