---
layout: nubisco
title: Accordion
intro: '`NbAccordion` is a stack of headings that reveal their content when clicked. It is the plain disclosure for page body: [`NbShellPanel`](/components/shell-panel/usage) looks similar but is an inspector section, carrying a size control and expecting a panel rail around it.'
source: src/components/Accordion.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Keyboard

| Key                                   | Does                                                    |
| ------------------------------------- | ------------------------------------------------------- |
| <kbd>Tab</kbd>                        | Moves to the next header, skipping the panels' contents |
| <kbd>Enter</kbd> / <kbd>Space</kbd>   | Opens or closes the focused section                     |
| <kbd>&uarr;</kbd> / <kbd>&darr;</kbd> | Moves between headers, wrapping                         |
| <kbd>Home</kbd> / <kbd>End</kbd>      | Jumps to the first or last header                       |

Each header is a `<button>` inside a `role="heading"` element. The heading is what lets a screen reader list the sections; the button is what operates them.

Set `headingLevel` to fit the accordion into the page's outline. It defaults to 3.

```vue
<NbAccordion :heading-level="2">
  <NbAccordionItem title="Under an h1" />
</NbAccordion>
```

The heading is a `role="heading"` div rather than an `<h3>` on purpose. A real `<h3>` inherits any `some-container h3 { margin }` the host page has, and an element selector inside a class outranks a component's own scoped rule, so the component cannot defend against it. That is not theoretical: it was adding 20px above every title in these very docs.
