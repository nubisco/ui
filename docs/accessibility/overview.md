---
layout: nubisco
title: Accessibility
description: What NubiscoUI guarantees, what your application still owns, and how to read a component page that says nothing about accessibility.
---

A component page that says nothing about accessibility is not a page that says "handled". Silence means exactly one thing, defined below, and the burden of saying so falls on us rather than on you. Clickable table rows no keyboard can reach, card rows built as bare `<div>`s, and a reorder that needs a mouse are all built from components that are accessible on their own.

## The contract

There are two halves and a seam. Most defects live in the seam.

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
- **Landmarks and page structure beyond the shell.** `NbShell` renders `<nav>`, `<main>` and `<aside>`, names the sidebar and inspector landmarks (`sidebar-label`, `inspector-label`), and ships a skip link on by default. Your headings, the names of landmarks you add, and the order of your page are yours. See [Skip links](/accessibility/keyboard#skip-links).
- **Focus after your state changes.** Where focus goes after your delete succeeds, after your route changes, after your list re-renders. The library knows a dialog closed; only you know what should hold focus next.
- **The order of your DOM.** Tab order is DOM order. If you place the primary action first in the markup and move it right with `order: 2`, you have made a keyboard trap for the eye.
- **Meaning that is only in colour.** A green dot in your row is a colour, not a status, until you also give it a word.
- **Live announcements for your async work.** `NbMessage` and `NbBanner` are live regions when you render them. Rendering nothing during a save announces nothing.
  :::

And the seam: **a library component reached through your data**. `NbDataTable`'s `row-click` is the canonical case. The table makes a clickable row focusable and answers <kbd>Enter</kbd> and <kbd>Space</kbd>, but the row is named by its raw cells and a row that navigates is still not a link. Where the row leads somewhere, put a real link in it: [the pattern](/accessibility/keyboard#making-a-whole-row-activatable).

## The standard we target

**WCAG 2.2 Level AA.** Not because a regulation names it, but because AA is the level at which the success criteria are testable claims rather than opinions, and because the parts of AAA that matter to an application UI (contrast on body text, mostly) we already clear by a wide margin: primary text measures between 8.98:1 and 15.96:1 against every layer in both themes, and never below 8.9:1.

Three criteria account for nearly all real failures in applications built on this library, so know them by name:

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

50 of the 78 component pages currently carry an Accessibility tab (a test, `tests/a11yDocsCounts.test.ts`, holds this number to the source). The rest are silent, and the silence is honest rather than reassuring. The three states in full:

- **Section present, claims made.** Load-bearing. `NbTabs`, `NbConfirm`, `NbDataTable`, `NbWalkthrough`, `NbShell` and fourteen others are in this state. Build on what they say.
- **Section present, gap stated.** We know about it and we are telling you, with the workaround. This is the most useful state a page can be in and we would rather write it than a section that quietly omits the bad news.
- **No section.** Unaudited. Test it yourself before you ship it, using the routine below. If it holds up, we would take the section as a pull request.

### The gaps we know about

Stated here rather than buried, because a consumer who finds these on their own after shipping has been failed twice.

::: tip `NbModal` traps focus
`NbModal` moves focus into the dialog on open,
cycles <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd> inside it, recovers
focus that leaves by a route no keystroke explains, and returns focus to the
trigger on every route out. The mechanism is shared with `NbConfirm` rather
than reimplemented, and `initialFocus` directs the landing for a form dialog.

It also sets `aria-labelledby` from its own title and locks body scroll,
including when it mounts already `open`. See
[Focus is handled](/components/modal/accessibility#focus-is-handled). A focus
trap of your own on an `NbModal` pulls against the built-in one: remove it, or
set `:trap-focus="false"` on that dialog.
:::

::: tip `NbDataTable`'s `row-click` reaches the keyboard
A row with a
`row-click` listener has `tabindex="0"`, activates on <kbd>Enter</kbd> and
<kbd>Space</kbd>, and leaves keys typed into its own controls alone
(`tests/DataTable.keyboard.test.ts`). What remains is the name: a focused row
is announced as its cells. Where the row navigates, a real link in it is still
the better interaction. See
[Making a whole row activatable](/accessibility/keyboard#making-a-whole-row-activatable).
:::

::: tip Form fields carry validation ARIA
`NbTextInput`, `NbNumberInput`, `NbSelect`, `NbRadio`, `NbSlider` and
`NbCheckboxGroup` mark the control `aria-invalid` while an error shows, link
the visible message by id with `aria-describedby`, and announce an error with
`role="alert"` only when it appears after load, never on first render. Each
form control's Accessibility tab has the detail.
:::

::: tip Tree, Menu and the command palette
`NbTree` has a roving tab stop, <kbd>←</kbd>/<kbd>→</kbd> to close, open and
step through branches, and first-letter typeahead. `NbMenu` returns focus to
its opener and takes <kbd>Home</kbd>, <kbd>End</kbd>, wrapping and typeahead.
`NbCommandPalette` is a modal dialog with a combobox and listbox. See
[Arrow-key composites](/accessibility/keyboard#arrow-key-composites).
:::

::: tip `NbBadge` variants name intents, and the dark focus ring clears 3:1
`NbBadge` takes `neutral`, `info`, `success`, `warning`, `danger` and `primary`, each painting a measured status surface pair (4.84:1 or better on every plane in both themes). The old colour names are deprecated aliases. The dark `--nb-c-focus-ring` is lifted toward white and measures 6.88 / 5.96 / 4.92 / 3.87 on layers 0 to 3. See [Colour and contrast](/accessibility/color-contrast).
:::

## How to test

Four passes. They take about ten minutes on a screen and they catch most of the keyboard, focus and naming defects described on this page. Do them on the real thing, in your product, not on a docs example.

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

- **Names.** Move to every control and listen. "Button" with no name, "graphic", or a filename is a defect. An icon-only button that fails this is usually one `aria-label` away from passing.
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

The library handles forced colours deliberately in 7 component files (`NbToast`, `NbToaster`, `NbSpinner`, `NbSkeleton`, `NbNotificationCenter` and its items, `NbContentSwitcher`). Everything else survives only by construction (outlines and inline SVG). Selected rows, the modal scrim and field borders are the known holes. See [Forced colours](/accessibility/color-contrast#forced-colours) for what is covered and what to add on your side.

### What automated tools will and will not do

Run `axe` or Lighthouse. They are cheap and they catch missing names, bad contrast on static text, and duplicate ids. The library runs axe-core itself on the components its suite mounts (`tests/axe.test.ts`), gated on a baseline of known findings, so a new markup regression fails CI; your pages still need their own pass. They will not catch a single one of the following, all of which are real findings from the twelve-app audit:

- a clickable row that no keyboard reaches (the row is valid HTML; it is just inert)
- focus dropped to `<body>` after a delete
- a dialog you can tab out of
- a status conveyed only by a green dot
- a spinner that never announces that it stopped

Automated coverage is a floor. The four passes above are the test.

## Related

- [Keyboard interaction](/accessibility/keyboard): tab order, focus management, arrow-key composites, skip links.
- [Colour and contrast](/accessibility/color-contrast): the ratios, the `-a11y` shade system, dark theme and forced colours.
- [`NbConfirm`](/components/confirm/usage): the reference implementation of a correctly focused dialog.
