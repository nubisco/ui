---
layout: nubisco
title: Button
intro: "`NbButton` is the library's action control. Its job on any given screen is to make one action obvious and keep the rest available without competing."
source: src/components/Button.vue
tab: accessibility
pageTabs: ['usage', 'style', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: native
  screenReader: not recorded
---

## What the component guarantees

- **The right element for the job.** With no `href` or `to` it renders a native `<button>` with `type="button"` by default, so it is focusable and activates on <kbd>Enter</kbd> and <kbd>Space</kbd> without any script of ours. With `href` it renders an `<a>`, and with any `to` (a string or a location object) and vue-router installed a `RouterLink`, so a button that navigates keeps middle-click, <kbd>Cmd</kbd>-click and "copy link address". Without a router, a string `to` is a plain `<a>`.
- **Disabled means disabled.** On a `<button>`, `disabled` (and `loading`) set the native `disabled` attribute: the control leaves the tab order and is announced as unavailable. A link cannot be disabled natively, so a disabled or loading link renders a plain `<a>` with no `href` and `aria-disabled="true"`: there is nothing left for <kbd>Enter</kbd> to follow, and the click is swallowed.
- **Icon-only buttons are named, and the name is the tooltip.** `label` becomes the accessible name and the tooltip anchored to the button, so the words a screen reader hears and the words a mouse user sees are the same words. The tooltip itself is hidden from assistive tech, so the name is not read twice. In development, an icon-only button with no name logs one warning per icon naming it.
- **Toggles say their state.** `pressed` sets `aria-pressed`, so a toggle is announced as "toggle button, pressed" rather than by its colour alone.
- **One focus ring for every control.** 2px of `--nb-c-focus-ring` drawn inside the edge, with a 1px band of the surface inside that. The inner band keeps the ring legible on a filled button whose colour is close to the ring's, and the outer band is an `outline`, so it survives forced-colours mode.
- **Disabled is drawn from tokens, not opacity**, so its contrast does not depend on what sits behind it.
- **Decoration stays out of the name.** The loading spinner is `aria-hidden="true"`, and icons are inline SVG that inherit `currentColor`, so they survive forced-colours mode.
- **A touch target on phones.** On a phone touch screen the `hit-area` mixin grows the tap box to 44px around the sizes below it (`xxs` to `md`) without changing how the button looks. A desktop is unchanged.
- **Checked by axe** in `tests/axe.test.ts` on every run.

## Keyboard

| Key              | Action                                       |
| ---------------- | -------------------------------------------- |
| <kbd>Tab</kbd>   | Moves to the button (skipped while disabled) |
| <kbd>Enter</kbd> | Activates a button or a link                 |
| <kbd>Space</kbd> | Activates a button (not a link, by design)   |

## What you own

- **The `label` of an icon-only button.** We cannot know what the icon means in your product. Name the action and, in a row, the row: "Edit invoice 2026/014". Do not add `v-nb-tooltip` or `aria-label` as well.
- **Words that say what happens.** "Save invoice" rather than "OK". A screen reader user often lists the buttons on a page out of context.
- **Why a disabled row action is disabled.** A disabled button cannot be focused, so its reason has to be visible where the row is: the tooltip of the [row-action standard](/principles/hierarchy#the-row-action-standard), or a line of text.
- **Announcing the result of a long action.** `loading` changes how the button looks. It does not tell a reader that the save finished or failed. Use `useInlineLoading` or a toast.
- **`type="submit"`** on the one button that submits a form. The default is `button`, so a button inside a `<form>` does not submit it by accident.

## Known gaps

- **`loading` drops focus.** On a `<button>`, `loading` sets native `disabled`, and a browser moves focus off a control that becomes disabled, to `<body>`. A keyboard user who pressed Save starts again from the top of the page. Until that changes, move focus yourself when the action completes, or keep the button enabled and ignore repeat presses in your handler.
- **A disabled icon-only button shows no tooltip.** It cannot be focused, and a disabled button takes no pointer events, so its `label` is never seen. Until the button can carry a reason itself, put the reason on a wrapper: `<span v-nb-tooltip="{ body: 'Already sent', focusable: true }">` around the button, which the keyboard can reach and the pointer can hover.

<!--@include: ./_shared.md-->
