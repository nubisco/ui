---
layout: nubisco
title: Canvas Controls
intro: '`NbCanvasControls` floats a set of controls over a canvas, a map or a diagram: zoom, fit, a view switch, a layer toggle. It places itself in a corner or at an edge of the canvas, and each `NbCanvasControlsGroup` inside it is one raised island with a border, a corner and a lift. It takes any content, and sizes the buttons in it for you.'
source: src/components/CanvasControls.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: not recorded
  keyboard: native
  screenReader: not recorded
---

## What the component guarantees

- **A named toolbar.** The set is `role="toolbar"`, named by the required `label` and oriented by `aria-orientation`.
- **Named groups.** A group given a `label` is `role="group"` with that name, so "Zoom" and "Align" read as two sets of controls. A group without one adds nothing to the accessibility tree.
- **Order follows the page.** The set comes after the canvas in the DOM, so Tab reaches the controls after the canvas, and each control is its own tab stop in visual order.
- Tested in `tests/CanvasControls.test.ts`.

## What you provide

- **A name for every icon button.** Give each ghost `NbButton` a `label`. It is the button's accessible name and its tooltip.
- **A keyboard way to do what the canvas does.** Controls over a canvas are often the only keyboard route to zoom or fit. Offer each canvas gesture that matters as a control here.
