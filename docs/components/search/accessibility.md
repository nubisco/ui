---
layout: nubisco
title: Search
intro: '`NbSearch` is the search field: a magnifying glass at the start, a clear button once there is a query, and Escape to clear it. It sits flush in a toolbar or a table header, and `expandable` folds it into a square button until it is wanted.'
source: src/components/Search.vue
tab: accessibility
pageTabs: ['usage', 'style', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: tested
  screenReader: not recorded
---

## What the component does

- **A search landmark.** The root carries `role="search"`, so a screen reader user can jump to it from anywhere on the page.
- **A named field.** The input is `type="search"` and is named by `label` ("Search" from the string catalogue by default). A search has no visible label: the glass is its label, and the name is what a screen reader reads.
- **A named clear button.** The clear button is an `NbButton` with a `label` ("Clear"), which is its name and its tooltip. A click keeps focus in the field.
- **A named collapsed button.** Collapsed, an expandable search is an `NbButton` with the same `label`, so the name a screen reader hears does not change when it opens.
- **Focus goes where you expect.** Opening moves focus into the field. Escape folds it and puts focus back on the button, and that focus does not open it again.
- **Text a phone will not zoom.** The field text is at least 16px on a phone touch screen.

## Keyboard

| Key               | Does                                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| <kbd>Tab</kbd>    | Into the field, then the clear button. Onto a collapsed search, opens it.       |
| <kbd>Enter</kbd>  | Emits `search` with the query                                                   |
| <kbd>Escape</kbd> | Clears the query. On an expandable search, also folds it. Stopped when it acts. |

## What you own

- **A `label` that says what is searched** when there is more than one search on a page ("Search invoices", "Search members").
- **Announcing the result.** When the results change, say so in a live region ("12 invoices") so a screen reader user knows the query did something.

## Known gaps

- The expanding is not animated.
- No manual screen reader pass has been recorded for this component.

<!--@include: ./_shared.md-->
