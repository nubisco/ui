---
layout: nubisco
title: Tabs
intro: '`NbTabs` switches between sections of the same page. Give it an `items` array and bind `v-model` to the id of the section on screen. It renders the tab bar and, when you fill the matching slot, the panel below it.'
source: src/components/Tabs.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: tested
  screenReader: not recorded
---

## What the component guarantees

- The bar is a `role="tablist"`, each tab a `role="tab"` with `aria-selected`, and each rendered panel a `role="tabpanel"` labelled by its tab.
- Only the active tab is in the tab order (roving `tabindex`), so the bar is a single stop rather than one per tab.
- `aria-controls` is set only when a panel is actually rendered, so it never points at a missing element.
- Disabled tabs are skipped by the arrow keys.
- Each tab draws the 2px `--nb-c-focus-ring` outline under `:focus-visible`.
- On a phone touch screen every tab is at least 44px tall and the `hit-area` mixin makes a narrow tab 44px wide. The bar scrolls rather than wrapping. A desktop is unchanged.
- Keyboard behaviour is tested in `tests/Tabs.test.ts`, markup by axe in `tests/axe.test.ts`.

## Keyboard

| Key                       | Action                                        |
| ------------------------- | --------------------------------------------- |
| <kbd>Tab</kbd>            | Moves into the bar, landing on the active tab |
| <kbd>←</kbd> <kbd>→</kbd> | Selects the previous or next tab, wrapping    |
| <kbd>Home</kbd>           | Selects the first tab                         |
| <kbd>End</kbd>            | Selects the last tab                          |

Arrow keys select as they move (automatic activation), which the WAI-ARIA tabs pattern recommends when showing a panel is cheap.

## What you own

- **A name for the bar** with `ariaLabel` when a page carries more than one set of tabs. Two unnamed tablists sound identical.
- **Whether selection should follow focus.** If showing a panel fires a request or discards unsaved input, automatic activation lets a held arrow key fire one per tab. Load the panel lazily, or keep that section out of a tab bar.
- **Panels rendered elsewhere.** Leave the slots out and only the bar renders, with no `aria-controls`. Your router view is then the panel, and moving focus to its heading on change is yours (see [After a route change](/accessibility/keyboard#after-a-route-change)).

## Known gaps

- No manual screen reader pass has been recorded for this component.

<!--@include: ./_shared.md-->
