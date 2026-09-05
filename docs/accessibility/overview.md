---
layout: nubisco
title: Accessibility
description: What NubiscoUI guarantees, what your application still owns, and how to read a component page that says nothing about accessibility.
---

An audit of twelve applications built on this library found two consoles with clickable table rows that no keyboard can reach, one with card rows built as bare `<div>`s, and one where reordering a form's fields required a mouse. In every case the team had looked at the component page, found nothing about accessibility, and drawn the reasonable conclusion that the library had it covered.

It had not. And the library had never said either way.

That ambiguity is what this section exists to end. A component page that says nothing is not a page that says "handled". From here on it means exactly one thing, defined below, and the burden of saying so falls on us rather than on you.

## The contract

There are two halves and a seam. Most of the fleet's defects live in the seam.

::: tip What the library guarantees
For every component the library ships:

- **Roles and structure.** The right element or the right ARIA role, and the relationships between them. `NbTabs` renders a real `tablist`/`tab`/`tabpanel` triple; `NbDataTable` renders a real `<table>` with `<th scope>` and `aria-sort`; `NbTree` renders `role="tree"` with `treeitem` children.
- **Keyboard for the widget's own interior.** Arrow keys inside `NbMenu`, `NbTabs`, `NbTree` and `NbReorderList`. Roving `tabindex` so a composite is one tab stop, not twenty.
- **A visible focus indicator** on every control the library makes focusable, drawn from `--nb-c-focus-ring`.
- **Names for the controls we invent.** The close button `NbModal` renders, the sort buttons `NbDataTable` renders, the drag handles `NbReorderList` renders. You never labelled them, so we do.
- **A motion opt-out.** Everything that animates checks `prefers-reduced-motion`, in CSS or through `useReducedMotion`.
- **Measured colour.** Every layer, border and text token in `src/styles/_theme.scss` is measured by `scripts/audit-contrast.mjs` and guarded in CI by `tests/layerContrast.test.ts`.
  :::

::: warning What your application owns
No component can supply these, because none of them are properties of a component:

- **The accessible name of the content you pass in.** `NbButton` renders whatever is in its default slot. An icon-only button with no `aria-label` is an unnamed button, and we cannot invent the label because we do not know what the icon means in your product.
- **Landmarks and page structure.** `NbShell` renders `<nav>`, `<main>` and `<aside>`, but it does not name them and it ships no skip link. See [Skip links](/accessibility/keyboard#skip-links).
- **Focus after your state changes.** Where focus goes after your delete succeeds, after your route changes, after your list re-renders. The library knows a dialog closed; only you know what should hold focus next.
- **The order of your DOM.** Tab order is DOM order. If you place the primary action first in the markup and move it right with `order: 2`, you have made a keyboard trap for the eye.
- **Meaning that is only in colour.** A green dot in your row is a colour, not a status, until you also give it a word.
- **Live announcements for your async work.** `NbMessage` and `NbBanner` are live regions when you render them. Rendering nothing during a save announces nothing.
  :::

And the seam: **a library component reached through your data**. `NbDataTable`'s `row-click` is the canonical case. The table gives you a well-formed `<tr>`; the moment you listen for `row-click` you have added an interaction that the `<tr>` cannot express. That is not a library bug you can wait out and it is not entirely your fault either. It has [a specific fix](/accessibility/keyboard#making-a-whole-row-activatable).

## The standard we target

**WCAG 2.2 Level AA.** Not because a regulation names it, but because AA is the level at which the success criteria are testable claims rather than opinions, and because the parts of AAA that matter to an application UI (contrast on body text, mostly) we already clear by a wide margin: primary text measures between 8.98:1 and 15.96:1 against every layer in both themes, and never below 8.9:1.

Three criteria account for nearly all of the fleet's real failures, so know them by name:

| Criterion                    | In practice                                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2.1.1 Keyboard**           | Every action reachable and operable without a pointer. This is the clickable-row failure.                                                                         |
| **1.4.11 Non-text contrast** | 3:1 for focus rings, control boundaries and meaningful glyphs. This is where the dark theme is weakest. See [Colour and contrast](/accessibility/color-contrast). |
| **1.4.1 Use of colour**      | Colour is never the only carrier of information. This is the `NbBadge` failure.                                                                                   |

We do not target Level A alone. A Level A pass permits a focus indicator you cannot see, which is the same product as no keyboard support for most of the people who need it.

## How to read a component page

::: danger The silence rule
From this section forward, a component page with no **Accessibility** heading means **we have not audited it and you should assume nothing**. It does not mean "nothing to say".

A page **with** an Accessibility heading is a commitment. Everything it claims is true of the current source, and anything it does not claim is yours.
:::

Nineteen of the fifty-two component pages currently carry that heading. The rest are silent, and the silence is honest rather than reassuring. The three states in full:

- **Section present, claims made.** Load-bearing. `NbTabs`, `NbConfirm`, `NbDataTable`, `NbWalkthrough`, `NbShell` and fourteen others are in this state. Build on what they say.
- **Section present, gap stated.** We know about it and we are telling you, with the workaround. This is the most useful state a page can be in and we would rather write it than a section that quietly omits the bad news.
- **No section.** Unaudited. Test it yourself before you ship it, using the routine below. If it holds up, we would take the section as a pull request.

### The gaps we know about

Stated here rather than buried, because a consumer who finds these on their own after shipping has been failed twice.

::: danger `NbModal` does not trap focus
[`docs/introduction.md`](/introduction) claims that `NbModal` "uses Vue's `Teleport` and a proper focus trap". The `Teleport` half is true. The focus trap does not exist. `Modal.vue` has a comment reading `// Trap focus / prevent body scroll` above a watcher that sets `document.body.style.overflow` and nothing else.

Concretely, `NbModal` on its own:

- does not move focus into the dialog when it opens, so the first <kbd>Tab</kbd> lands on whatever followed the trigger in the page behind the scrim;
- does not keep focus inside, so <kbd>Tab</kbd> walks out into the inert page;
- does not restore focus to the trigger on close;
- sets `role="dialog" aria-modal="true"` but never `aria-labelledby`, so a screen reader announces "dialog" and stops, even when you passed a `title`;
- locks body scroll from a watcher with no `immediate`, so a modal that mounts already `open` never locks it at all.

**What to do.** Use [`NbConfirm`](/ui/components/confirm) or `useConfirm` for anything destructive: it implements the trap, the initial focus, the focus restore and the `aria-labelledby` wiring on top of `NbModal`, and it is the pattern the fix will generalise from. For a bespoke dialog, do the same work yourself for now, and read `Confirm.vue` before you invent it: the fleet's hand-rolled versions all get the restore wrong.
:::

::: danger `NbDataTable`'s `row-click` is pointer-only
`row-click` is emitted from `@click` on the `<tr>`. The row gets no `tabindex` and no key handler, so the interaction exists for a mouse and does not exist for a keyboard. It also has no accessible name, so even a reachable row would announce as its raw cell text.

**What to do.** Put a real control in the row and treat `row-click` as a shortcut on top of it, not as the interaction. Full pattern in [Making a whole row activatable](/accessibility/keyboard#making-a-whole-row-activatable).
:::

::: danger `NbBadge`'s variants are colours, and four of them fail contrast
`EBadgeVariant` is `Grey | Blue | Orange | Green | Red | Purple | Primary`. The source carries a `// FIXME replace the variant with the existing variants`, so this is known. Two consequences:

1. The prop names a colour, so it cannot help you satisfy 1.4.1. `variant="green"` says nothing a colour-blind reader can use.
2. The variants are not all legible. At the badge's 10px and 11px type, measured against `--nb-c-layer-1`: **orange 1.88:1, green 2.79:1, red 3.84:1, blue 4.45:1** in the light theme. Small text needs 4.5:1.

**What to do.** See [Status is never only a colour](/accessibility/color-contrast#status-is-never-only-a-colour) for the ink to override with and the words to add.
:::

::: warning The focus ring falls below 3:1 on deep dark surfaces
`--nb-c-focus-ring` measures 6.20:1 to 7.28:1 against every layer in the light theme, comfortably clear. In the dark theme it measures 4.04, 3.50, 2.89 and 2.27 against layers 0 to 3. **Inside a modal or a popover (layer 3) a dark-theme focus ring is at 2.27:1, well under the 3:1 that 1.4.11 requires.**

**What to do.** See [The focus ring](/accessibility/color-contrast#the-focus-ring) for the one-line override.
:::

::: warning `NbMenu` closes without restoring focus
<kbd>Esc</kbd> and <kbd>Tab</kbd> both close the menu, which is correct, but `close()` only emits. Focus is left on a menu item that has just been removed from the document, and the browser drops it to `<body>`. The next <kbd>Tab</kbd> starts from the top of the page.

**What to do.** Restore it in your `@close` handler. See [Focus management](/accessibility/keyboard#where-focus-goes).
:::

## How to test

Four passes. They take about ten minutes on a screen and they catch nearly everything the twelve-app audit found. Do them on the real thing, in your product, not on a docs example.

### 1. Unplug the mouse

Not "mostly avoid the mouse". Physically stop using it and complete a real task: find the record, open it, change it, save it, and delete something.

Check, in order:

- **Can you see where you are?** Every stop must have a visible ring. If the ring disappears for even one stop, that is the bug: an invisible focus is the same as no keyboard support.
- **Does the order match the page?** Tab through the whole view once and narrate the reading order. Tabbing left-to-right down the page is right. Tabbing to the footer and back up to the toolbar means CSS reordered something.
- **Can you reach everything you can click?** Point at each clickable thing and ask whether Tab ever landed on it. Rows, cards, chips, "×" buttons on tags, and inline edit affordances are where this fails.
- **Can you get out?** Open every menu, dialog and popover and press <kbd>Esc</kbd>. Then <kbd>Tab</kbd> ten times inside a dialog and check you are still inside it.
- **Where does focus land after the action?** Delete a row, then press <kbd>Tab</kbd>. If the next stop is the top of the page you have dropped focus. This is the single most common finding.

### 2. Turn the screen off

Run a screen reader with your eyes closed, or with the monitor genuinely off. VoiceOver (<kbd>Cmd</kbd>+<kbd>F5</kbd> on macOS) and NVDA on Windows are both free; test with at least one of each engine family before you claim support.

- **Names.** Move to every control and listen. "Button" with no name, "graphic", or a filename is a defect. Every icon-only button in the fleet that failed this was one `aria-label` away from passing.
- **Roles.** A `<div>` you made clickable announces as nothing. A `<div role="button" tabindex="0">` announces as a button.
- **State.** Sorted, selected, expanded, current page, invalid: all of these must be spoken, not just drawn.
- **Async.** Start a save and listen. Silence during a two-second request, followed by the list quietly changing, is a defect. Render `NbMessage` or `NbInlineLoading` so there is something to announce.
- **Landmarks.** Ask for the landmark list. Two unnamed `<nav>`s is an ambiguity you fix with `aria-label`.

### 3. Zoom to 200 percent

Browser zoom to 200%, then separately narrow the window to 320 CSS pixels wide, which is the `sm` end of our scale (`320 / 672 / 1056 / 1312 / 1584`, from `src/styles/variables/_breakpoints.scss`).

- Nothing may be cut off, and nothing may require horizontal scrolling to read a line of text.
- Fixed pixel heights are the usual culprit. A toolbar with `height: 48px` and text inside it clips at 200%; `min-height` does not.
- Sticky headers and `NbShell`'s inspector column both need checking here: a shell that is `100vh` with three stacked fixed bars leaves no content at 200%.
- Text must scale. A container sized in `px` around text sized in `rem` is a clip waiting to happen.

### 4. Force the colours

Windows High Contrast (Settings → Accessibility → Contrast themes) or the emulator in Chrome DevTools: **Rendering → Emulate CSS media feature forced-colors**.

In this mode the browser replaces your palette with the user's. `background-image`, `box-shadow` and most `background-color` declarations are discarded. Anything whose meaning lived in one of those disappears.

- **Focus rings survive**, because ours are `outline`, which forced colours preserves and recolours.
- **Borders drawn with `box-shadow` do not.** Neither do state washes: a selected row that is only a tinted background looks identical to an unselected one.
- **Icons that are background images vanish.** Ours are inline SVG and inherit `currentColor`, so they survive.
- **Scrims flatten.** `--nb-c-scrim` is a `color-mix` to transparent; in forced colours a dialog can end up visually continuous with the page behind it. Give overlay content an explicit border.

The library ships **no `forced-colors` handling of its own today**: there are zero `@media (forced-colors: active)` blocks in `src/`. That is a stated gap, not an omission you are meant to infer. See [Forced colours](/accessibility/color-contrast#forced-colours) for what to add on your side.

### What automated tools will and will not do

Run `axe` or Lighthouse. They are cheap and they catch missing names, bad contrast on static text, and duplicate ids. They will not catch a single one of the following, all of which are real findings from the twelve-app audit:

- a clickable row that no keyboard reaches (the row is valid HTML; it is just inert)
- focus dropped to `<body>` after a delete
- a dialog you can tab out of
- a status conveyed only by a green dot
- a spinner that never announces that it stopped

Automated coverage is a floor. The four passes above are the test.

## Related

- [Keyboard interaction](/accessibility/keyboard): tab order, focus management, arrow-key composites, skip links.
- [Colour and contrast](/accessibility/color-contrast): the ratios, the `-a11y` shade system, dark theme and forced colours.
- [`NbConfirm`](/ui/components/confirm): the reference implementation of a correctly focused dialog.
