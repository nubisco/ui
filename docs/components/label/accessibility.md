---
layout: nubisco
title: Label
intro: '`NbLabel` is a lightweight label element for associating descriptive text with form controls. Use it standalone or let `NbTextInput` manage it automatically.'
source: src/components/Label.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- Renders a native `<label>` element; clicking it focuses the associated input via `for`.
- The required asterisk is `aria-hidden="true"` so screen readers use the `required` attribute on the input instead.
