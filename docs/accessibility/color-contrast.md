---
layout: nubisco
title: Colour and contrast
description: Contrast requirements for text, icons, borders and focus rings, why colour is never the only signal, what the -a11y shade system actually does, and how the dark theme and forced colours change the answer.
---

Colour fails quietly. A control with no keyboard path is obviously broken the moment you test it; a label at 2:1 looks fine to the person who chose it, on the display they chose it on, and disappears for everybody else. Nobody files a bug, because the people who cannot read it assume they have missed something.

Every ratio on this page was measured against the compiled theme with `scripts/audit-contrast.mjs`, which resolves every `--nb-*` custom property to a literal colour and applies the WCAG 2.x formula. You can re-run it, and CI runs the same maths through `tests/layerContrast.test.ts`.

## The numbers

| What                                                    | Ratio | Criterion |
| ------------------------------------------------------- | ----- | --------- |
| Body text, and anything under 24px (or under 19px bold) | 4.5:1 | 1.4.3     |
| Large text: 24px and up, or 19px bold and up            | 3:1   | 1.4.3     |
| Icons and glyphs that carry meaning                     | 3:1   | 1.4.11    |
| Focus rings                                             | 3:1   | 1.4.11    |
| Boundaries of controls you must find to use them        | 3:1   | 1.4.11    |
| Purely decorative rules, dividers, disabled controls    | none  | exempt    |

Measured against the **actual** background, which for a translucent element means the composite. Every ratio below is stated against `--nb-c-layer-1`, the surface most components sit on, unless it says otherwise.

::: tip Disabled is exempt, and that is not a licence
1.4.3 exempts disabled controls, so `--nb-field-disabled-opacity: 0.45` is legal. It is still bad: a user who cannot read a disabled button cannot tell what they are being prevented from doing. Keep disabled controls readable, and prefer a control that is enabled and explains its refusal over one that is greyed out and silent.
:::

## Text

Text is the part of this system that is already comfortable. Primary text measures **13.22 / 14.69 / 12.52 / 13.94** against layers 0 to 3 in the light theme, and **15.96 / 13.83 / 11.40 / 8.98** in the dark. Secondary text sits between 7.01 and 12.46. All of it clears AA, and most of it clears AAA.

Three tokens, in decreasing weight:

| Token                | Role                                              | Worst measured ratio |
| -------------------- | ------------------------------------------------- | -------------------- |
| `--nb-c-text`        | Body copy, labels, values.                        | 8.98 (dark, layer 3) |
| `--nb-c-text-muted`  | Secondary information, help text.                 | 7.01 (dark, layer 3) |
| `--nb-c-text-subtle` | Placeholders, timestamps, de-emphasised metadata. | 4.50 (dark, layer 3) |

`--nb-c-text-subtle` is the one with no headroom. At 4.50:1 against layer 3 it passes AA for normal text by two hundredths, and it fails immediately if you also shrink the type. **Do not put `--nb-c-text-subtle` below 14px on a deep dark surface.** If you need both small and quiet, take the small and give up the quiet.

::: danger Do not build text colours by hand
`color: color-mix(in srgb, var(--nb-c-text) 60%, transparent)` looks like a reasonable way to get a quieter grey and it is how three of the fleet's stylesheets ended up with unmeasurable text. A translucent ink over a surface that changes with the layer produces a different ratio in every context it renders in, and no tool will tell you which one broke. Use the three tokens.
:::

## Icons, glyphs and status marks

An icon that means something is held to 3:1. An icon that decorates a label already next to it is exempt, because removing it removes nothing.

The trap is that the semantic colour tokens are **fills**, sized to sit behind white text on a button, not inks meant to be drawn on a page. Measured against layer 1 in the light theme:

| Token                   | Value     | Against layer 1 | As a glyph            |
| ----------------------- | --------- | --------------- | --------------------- |
| `--nb-c-warning`        | `#f59e0b` | **2.06**        | Fails. Fill only.     |
| `--nb-c-success`        | green 600 | **3.16**        | Barely passes 1.4.11. |
| `--nb-c-danger`         | `#dc2626` | 4.62            | Passes.               |
| `--nb-c-info`           | blue 500  | 5.25            | Passes.               |
| `--nb-c-status-warning` | amber 700 | **5.20**        | Yes. Use this.        |
| `--nb-c-status-valid`   | green 700 | **5.19**        | Yes. Use this.        |
| `--nb-c-status-error`   | red 600   | **6.64**        | Yes. Use this.        |
| `--nb-c-status-info`    | blue 500  | 5.25            | Yes. Use this.        |
| `--nb-c-status-neutral` | grey 600  | 4.23 worst      | Yes. Use this.        |

`--nb-c-warning` as a warning triangle drawn on a card is 2.06:1. It is the single most attractive wrong token in the theme, because its name is exactly what you were looking for.

::: tip The rule
**Filling a shape:** `--nb-c-warning`, `--nb-c-danger`, `--nb-c-success`, `--nb-c-info`, paired with the matching `-a11y` ink (below).

**Drawing a glyph, a 1px line or a word directly on a surface:** `--nb-c-status-warning`, `--nb-c-status-error`, `--nb-c-status-valid`, `--nb-c-status-info`, `--nb-c-status-neutral`. For error **text** (a message under a field), `--nb-c-text-error`, held to 4.5:1 on every layer and hover.
:::

## Borders

Borders divide into two kinds and the library has a token for each.

`--nb-c-border` is **decorative**. It measures 2.60:1 against its own surface in the light theme and 1.98:1 in the dark. That is deliberate: a card's edge does not need to be findable, it needs to read as a seam. Under 1.4.11 it is exempt because removing it costs no information.

`--nb-c-field-border` is **structural**. It is the boundary of a control you have to locate in order to type in it, so it is measured, per plane: `.nb-layer-N` points it at the rule for that plane, and it clears 3:1 against both the field's fill and the plane under it in both themes. In dark that is `#818283` on planes 0 and 1 (3.53 on the plane-1 fill) and `#939495` on planes 2 and 3 (3.53 on layer 3). It used to be one value for every plane and fell to 2.78 inside a dialog.

`--nb-c-border-strong` is the same kind of edge for a control that is not a field, 3:1 on its own plane (3.31 to 3.35).

Under `prefers-contrast: more`, or `data-nb-contrast="more"`, the decorative borders take the strong values too, so every edge clears 3:1. See [Theming](/theming#the-per-plane-set).

The same distinction applies to anything you draw yourself. Ask whether removing the line removes information. A table's zebra striping: no. The outline that tells you where a text field ends: yes.

## The focus ring

The focus ring is the only indicator a keyboard user has, and 1.4.11 holds it to 3:1 against everything adjacent to it.

`--nb-c-focus-ring` is the accent itself in the light theme, where it measures **6.55 / 7.28 / 6.20 / 6.91** against layers 0 to 3.

In the dark theme it is 70% of the accent mixed with white, the same lift the selected edge takes, and measures **6.88 / 5.96 / 4.92 / 3.87**. The bare dark primary measured 2.89 on layer 2 and 2.27 on layer 3, which is where dialogs and menus live. `tests/focusRingContrast.test.ts` holds the ring at 3:1 on every layer, every hover and every per-plane state surface, in both themes, and a named theme re-emits it in its own dark scope.

On an inverted chip (`--nb-c-bg-inverse`) use `--nb-c-focus-inverse`, 3:1 or better there for the default accent and every category.

Two further rules for rings you draw yourself, both of which come from the fleet:

- **Draw it with `outline`, not `box-shadow`.** Forced-colours mode discards box shadows and preserves outlines. A ring built from `box-shadow` is invisible in exactly the mode used by the people most likely to need it.
- **Give it an offset.** `outline-offset: 2px` outside a control that has room, `-2px` for a control flush against its neighbours (menu rows, table cells, sidebar links). A zero-offset ring on a same-coloured control is a ring that touches nothing.

## Status is never only a colour

WCAG 1.4.1: colour must never be the sole carrier of information. A red dot means "failed" to you and means "a dot" to the roughly one man in twelve with a colour vision deficiency, to anyone on a projector, and to anyone in sunlight.

The library's own `NbBadge` is the clearest illustration, because its API makes the mistake structural.

::: tip `NbBadge` used to name colours, and four of its variants were unreadable
`EBadgeVariant` was `Grey | Blue | Orange | Green | Red | Purple | Primary`, each a 12% wash of its colour with the text in the same colour. At the badge's 10px and 11px, against layer 1 in light: orange 1.88, green 2.79, red 3.84, blue 4.45.

The variants now name intents: `neutral`, `info`, `success`, `warning`, `danger`, `primary`. Each status intent paints the theme's status surface pair, 8.04 to 10.87 in light and 4.84 or better in dark on every plane (`tests/badgeContrast.test.ts`). The colour names are deprecated aliases that render as their intent and warn once in development, so an application that has not moved yet already gets the measured pair.

The word is still not optional. "Degraded" is what makes the badge readable in greyscale, and it is what a screen reader announces.
:::

The general rule, applied to the shapes that keep recurring:

- **A status dot needs a word.** If space is genuinely tight, the word goes in the accessible name: `<span class="dot" role="img" aria-label="Degraded" />`.
- **A red form field needs a message.** `NbTextInput` accepts `error` and `warning` text and renders it under the field; across 58 field instances in one audited application, both props were bound **zero** times. A red border alone is a colour, and nothing announces it.
- **A chart needs more than hue.** The library ships eight `--nb-c-chart-*` roles. Minimum perceptual separation across the first five is CIEDE2000 16.0 under normal vision and **5.3 under simulated deuteranopia**; across all eight it drops to 0.8, because roles 1 and 7 are both violet-blues. Cap colour-only encoding at five series and add a second channel (direct labels, dash patterns, markers) beyond that.
- **A selected row needs more than a tint.** Background washes are among the first things forced-colours mode discards. Add a left bar, a check, or `aria-selected`, which `NbDataTable` already sets.

## The `-a11y` shade system

Every colour in the palette generates a companion token, and this is the most misunderstood part of the theme:

```css
--nb-c-grape-hyacinth-500: #5c35c4;
--nb-c-grape-hyacinth-500-a11y: #ffffff;
```

::: danger `-a11y` is not an accessible version of the colour
[Colors](/principles/color) describes these as "accessible (`a11y`) variants" and "accessible shades", which reads as "the same colour, made legible". That is not what they are, and the misreading is almost certainly why they are barely used outside `Button.vue`.

`--nb-c-X-a11y` is **the ink to write on top of `--nb-c-X`**. It is computed by `color-contrast()` in `src/styles/logic/_a11y.scss`, which returns `#ffffff` or `#101010`, whichever has more contrast against `X`. It is always one of exactly two values, and it is a **foreground**, never a background.
:::

So the token has exactly one correct shape, and it is a pair:

```scss
.thing {
  background: var(--nb-c-danger);
  color: var(--nb-c-danger-a11y);
}
```

This is what makes it worth using. Write that pair and the label stays legible when a white-label client repaints `--nb-c-danger`, when the dark theme swaps the tint, and when the ramp step changes under you. Hardcode `color: white` and it is correct exactly until one of those happens.

`Button.vue` uses it consistently, and that is why every button variant carries readable text in both themes without a per-variant text colour:

```scss
&--danger {
  background: var(--nb-c-danger);
  color: var(--nb-c-danger-a11y);
  &:hover:not(:disabled) {
    background: var(--nb-c-danger-hover);
    color: var(--nb-c-danger-hover-a11y);
  }
}
```

Every semantic role has the pair: `--nb-c-primary-a11y`, `--nb-c-secondary-a11y`, `--nb-c-success-a11y`, `--nb-c-info-a11y`, `--nb-c-warning-a11y`, `--nb-c-danger-a11y`, and `-hover-a11y` / `-active-a11y` for each state.

### What it guarantees, and what it does not

It guarantees **the better of black and white**. It does not guarantee 4.5:1, because on a mid-tone fill neither black nor white reaches 4.5:1 and the function still has to return one of them. Measured:

| Pair                           | Light theme | Dark theme |
| ------------------------------ | ----------- | ---------- |
| `--nb-c-primary` + its `-a11y` | 7.60        | 4.71       |
| `--nb-c-warning` + its `-a11y` | 8.86        | 10.25      |
| `--nb-c-success` + its `-a11y` | 5.76        | 8.86       |
| `--nb-c-info` + its `-a11y`    | 5.48        | 5.09       |
| `--nb-c-danger` + its `-a11y`  | 4.83        | 4.98       |

The dark theme lightens `--nb-c-danger` and `--nb-c-info` to their 400 tints so they read against a dark ground, and computes their `-a11y` from those tints, so both carry near-black text there: 4.98:1 and 5.09:1. They carried white at 3.82 and 3.74 until the inks were re-computed. `tests/inkContrast.test.ts` holds every filled pair, base, hover and active, at 4.5:1 in both themes.

The other thing `-a11y` does not do is derive a _tinted_ accessible colour. `_a11y.scss` also exports `a11y-color($fg, $bg, $level, $size, $bold)`, which walks a colour's lightness in 1% steps until it clears the ratio, preserving the hue. It is available to Sass in the library and it is **not** exposed as a custom property, because it has to run at compile time against a known background. If you need a hue-preserving accessible ink, use it in your own SCSS; if you need black or white on a fill, use the `-a11y` token.

## The dark theme

The dark theme is a `.dark` class on an ancestor (see [Theming](/theming)), not a separate stylesheet, so **every colour you write has to work in both**. Four things reliably change between them:

**Contrast inverts with depth.** In the light theme, layer 1 is the _brightest_ surface, so text contrast peaks there (14.69) and dips on layer 2 (12.52). In the dark theme, contrast falls monotonically as layers get shallower: 15.96, 13.83, 11.40, 8.98. Anything marginal is marginal on layer 3, which is where dialogs and menus live. **Test on layer 3, not on the page background.**

**Semantic fills get lighter, so their inks flip.** `--nb-c-warning` goes from the 500 tint to 400, `--nb-c-success` from 600 to 500. This is why the pair matters: `--nb-c-warning-a11y` is `#101010` in both themes and `--nb-c-danger-a11y` is `#ffffff` in both, but you should never be the one deciding.

**Status surfaces stop being solid.** A 100-tint ground is a lamp on a dark page, so the dark theme fills status surfaces with a `color-mix` wash of the status colour over whatever is behind:

```css
--nb-c-info-surface: color-mix(in srgb, <blue 400> 16%, transparent);
```

That is deliberate and it looks right. It also means **the contrast of dark-theme status surfaces cannot be measured statically**: the audit script reports `null` for all five, because the value has no literal to measure. If you put text on one, measure the composite in the browser's contrast inspector against the layer it actually renders on.

**Borders get weaker, not stronger.** `--nb-c-border` is 2.60:1 in light and 1.98:1 in dark against its own surface. Increasing separation in dark mode is a job for the layer surfaces (which do separate: dL\* 7.06 to 7.27 between adjacent layers, versus 4.17 to 6.28 in light), not for the border.

## Forced colours

Windows High Contrast and its equivalents run the page through `forced-colors: active`, where the browser throws away most of your palette and substitutes the user's. This is not a degraded rendering to tolerate; for many low-vision users it is the only way the product is usable.

What survives, what does not:

| Survives                                  | Discarded                         |
| ----------------------------------------- | --------------------------------- |
| `outline` (recoloured to the system ring) | `box-shadow`                      |
| `border` (recoloured)                     | `background-image`, and gradients |
| Inline SVG using `currentColor`           | Most `background-color`           |
| Text, recoloured to system pairs          | `color-mix` washes, translucency  |

The consequences for this library, concretely:

- **Focus rings survive**, because every one of them is an `outline`. This is the main reason the library refuses `box-shadow` rings.
- **Icons survive**, because `NbIcon` renders inline SVG marked `aria-hidden="true"` and inheriting `currentColor`.
- **Selected states mostly vanish.** A selected row is a background wash; forced colours drops it and the row becomes indistinguishable. Anything conveyed only by a fill needs a border, a glyph, or `aria-selected` doing the work instead.
- **Scrims flatten.** `--nb-c-scrim` is a `color-mix` to transparent. In forced colours, a dialog can end up visually continuous with the page behind it, so give overlay surfaces an explicit `border`.
- **Layer depth disappears entirely.** The whole four-level surface system is `background-color`. Structure that only exists as a lightness difference is gone.

::: warning Forced-colours handling is partial
Six components carry a `@media (forced-colors: active)` block: `NbToast`, `NbToaster`, `NbSpinner`, `NbSkeleton`, `NbNotificationCenter` and `NbNotificationCenterItem`. Everything else survives only by construction (outlines and inline SVG). Selected rows in `NbDataTable` and `NbTree`, the modal scrim and dialog edge, and the `NbSelect` highlight still vanish.

Where you need a state to survive, restore it with a system colour:

```scss
.thing--selected {
  background: var(--nb-c-surface-hover);

  @media (forced-colors: active) {
    // System colours are the only palette that means anything here, and
    // forced-color-adjust: none opts this rule out of the substitution.
    border: 2px solid Highlight;
    forced-color-adjust: none;
  }
}
```

Only use system colour keywords (`Canvas`, `CanvasText`, `LinkText`, `Highlight`, `HighlightText`, `ButtonFace`, `ButtonText`, `GrayText`) inside such a block. A `--nb-*` token there means nothing, because the user's palette has replaced it.
:::

Test it in Chrome DevTools: **Rendering → Emulate CSS media feature forced-colors → active**. It takes seconds and it catches the whole class.

## Checking your own colours

1. **Name the surface.** Which layer does this render on, in both themes? If the answer is "it depends", measure the worst one, which is layer 3 in dark and layer 2 in light.
2. **Pick the threshold.** 4.5 for text under 24px, 3 for large text and for anything non-text that carries meaning.
3. **Measure the composite.** Not the token against white. If either colour is translucent, use the browser's contrast inspector on the rendered pixel.
4. **Remove the colour.** Screenshot it and desaturate it. If a state is now ambiguous, you have a 1.4.1 failure regardless of the ratio.
5. **Re-run the audit** if you touched the theme: `node scripts/audit-contrast.mjs`. `tests/layerContrast.test.ts` runs the same maths in CI and will fail the build if you regress the layer system.

## Related

- [Accessibility overview](/accessibility/overview): the contract, the standard, and the four testing passes.
- [Keyboard interaction](/accessibility/keyboard): where the focus ring has to be visible.
- [Colors](/principles/color): the palette and how shades are generated.
- [Theming](/theming): how `.dark` is applied and how to override tokens for a white-label product.
