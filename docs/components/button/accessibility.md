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

- **The right element for the job.** With no `href` or `to` it renders a native `<button>` with `type="button"` by default, so it is focusable and activates on <kbd>Enter</kbd> and <kbd>Space</kbd> without any script of ours. With `href` it renders an `<a>`, and with an object `to` and vue-router installed a `RouterLink`, so a button that navigates keeps middle-click, <kbd>Cmd</kbd>-click and "copy link address".
- **Disabled means disabled.** On a `<button>`, `disabled` (and `loading`) set the native `disabled` attribute: the control leaves the tab order and is announced as unavailable. A link cannot be disabled natively, so on `<a>` and `RouterLink` it carries `aria-disabled="true"` and the click is swallowed.
- **Icon-only buttons are checked.** In development, a button with an icon and no text, `aria-label`, `aria-labelledby` or `title` logs one warning per icon naming it. `v-nb-tooltip` writes `aria-label`, so a tooltip counts as a name.
- **Decoration stays out of the name.** The loading spinner is `aria-hidden="true"`, and icons are inline SVG that inherit `currentColor`, so they survive forced-colours mode.
- **A touch target on phones.** On a phone touch screen the `hit-area` mixin grows the tap box to 44px around the smaller sizes without changing how the button looks. A desktop is unchanged.
- **Checked by axe** in `tests/axe.test.ts` on every run.

## Keyboard

| Key              | Action                                       |
| ---------------- | -------------------------------------------- |
| <kbd>Tab</kbd>   | Moves to the button (skipped while disabled) |
| <kbd>Enter</kbd> | Activates a button or a link                 |
| <kbd>Space</kbd> | Activates a button (not a link, by design)   |

## What you own

- **The name of an icon-only button.** We cannot know what the icon means in your product. Add `aria-label`, or name it with `v-nb-tooltip`.
- **Words that say what happens.** "Save invoice" rather than "OK". A screen reader user often lists the buttons on a page out of context.
- **Announcing the result of a long action.** `loading` changes how the button looks; it does not tell a reader that the save finished or failed. Use `useInlineLoading` or a toast.
- **`type="submit"`** on the one button that submits a form. The default is `button`, so a button inside a `<form>` does not submit it by accident.

## Known gaps

- **Its focus ring is 1px, inset.** `.nb-button:focus-visible` draws a 1px outline at `-2px`, thinner than the 2px house ring every other control uses. It is visible, and it is the next thing to bring in line.
- **`loading` drops focus.** On a `<button>`, `loading` sets native `disabled`, and a browser moves focus off a control that becomes disabled, to `<body>`. A keyboard user who pressed Save starts again from the top of the page. Until that changes, move focus yourself when the action completes, or keep the button enabled and ignore repeat presses in your handler.

<!--@include: ./_shared.md-->
