---
title: Design Tokens
description: What a token is in NubiscoUI, how to read the --nb-* naming grammar, which family answers which question, and which tokens you may safely override.
---

# Design Tokens

This is the first page most people open. For a long time it was five rendered strips of values and nothing else, and an audit of twelve consuming applications showed what that cost: two teams looked at a wall of spacing bars, concluded the scale was an internal implementation detail of the library, and shipped **462** and **287** hardcoded pixel values respectively, with zero uses of the scale between them.

The viewers are still here, at the bottom, because seeing the values matters. But a list of tokens is a dictionary, not a language. This page is the grammar.

## Terms

The rest of this page uses these five words precisely. They are not synonyms.

| Term         | Definition                                                                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Token**    | A CSS custom property emitted on `:root` by the theme mixins, for example `--nb-spacing-16`. Not a Sass variable, not a JS constant.                                                                         |
| **Family**   | The group a token belongs to, named by the segment after `--nb-`: `c` for colour, `spacing`, `radius`, `zindex`, `type`, `field`, `shell`, `animation`. A family answers one kind of question.               |
| **Raw**      | A token that names a value: `--nb-c-grape-hyacinth-500` is a specific purple, `--nb-font-size-14` is a specific size. Raw tokens exist so the theme can be built from them.                                  |
| **Semantic** | A token that names a job: `--nb-c-danger`, `--nb-field-height-sm`, `--nb-type-body-md-size`. What application code should use. Retinting a semantic token moves everything that spoke semantically.          |
| **Theme**    | One set of values for the semantic layer. The library ships two, emitted by the `light` and `dark` mixins, switched by a `.dark` class on an ancestor. Your brand is a third, written as a `:root` override. |

Two more you will meet on the pages this one links to: a **step** is one entry on a numeric scale (`--nb-spacing-24` is a step), and a **scale** is a family whose members are ordered and meant to be chosen between rather than combined.

## What a token is here

A NubiscoUI token is a **CSS custom property emitted on `:root`**, not a Sass variable and not a JavaScript constant. There are over 700 of them, compiled from `src/styles/_theme.scss` by the `theme.base`, `theme.light` and `theme.dark` mixins.

That choice has three consequences you can rely on:

**Resolution happens where the property is used, not where it is declared.** `--nb-c-surface` resolves against whatever `.nb-layer-2` ancestor a component happens to sit inside. This is why a panel nested in a panel darkens by itself, and why `.dark` retheming needs no duplicate rule anywhere in the library.

**You can override any of them from your own stylesheet without recompiling.** There is no build step, no Sass import, no fork. One `:root` block in your app changes the library. Whether you _should_ is the subject of [Overriding](#which-tokens-you-may-override).

**A misspelled token is silent.** `var(--nb-z-toast)` is not an error. The browser resolves it to nothing, the declaration is dropped, and the element renders on whatever it inherited. One application in the audit shipped a toast host on the wrong z-index for months for exactly this reason: the real token is `--nb-zindex-toast`. See [Checking that a name is real](#checking-that-a-name-is-real) before you type any token you have not copied from this page.

## Reading a token name

Every token follows the same shape:

```
--nb-<family>-<subject>[-<modifier>][-a11y]
     └─ what kind of decision this is
                └─ which member of that family
                             └─ state or variant, when the family has states
                                              └─ the contrast-safe text colour for it
```

Four things that trip people up:

**The family prefix is not always a word you would guess.** Colour is `--nb-c-`, not `--nb-color-`. Stacking is `--nb-zindex-`, not `--nb-z-`. Rounding is `--nb-radius-`, not `--nb-border-radius-`. All three of those wrong guesses exist in real code today.

**Numeric suffixes mean different things in different families.** In `--nb-spacing-16` and `--nb-font-size-16` the number is the pixel value. In `--nb-c-grape-hyacinth-500` it is a tint step on a 100 to 900 ramp. In `--nb-c-layer-2` it is a depth index, 0 to 3. In `--nb-type-heading-03-size` it is a rank in a scale, where higher means larger. The number is never an arbitrary id, but it is also never the same kind of number twice.

**`-a11y` is not a variant of the colour, it is the ink that goes on top of it.** `--nb-c-primary-a11y` is the automatically contrast-checked foreground for text placed on `--nb-c-primary`. Pairing `color: var(--nb-c-primary)` with `background: var(--nb-c-primary-a11y)` is backwards and will fail contrast.

**Sizes are `xs sm md lg`, ranks are `01 02 03`.** Families where the members are interchangeable at different densities use t-shirt sizes (`--nb-field-height-md`, `--nb-radius-sm`). Families where the members are a hierarchy use zero-padded ranks (`--nb-type-heading-03-*`). If you see a rank, ordering is meaningful; if you see a size, it is a density choice.

## The families

| Family                                                    | Count | Answers                                                 | Declared in                   |
| --------------------------------------------------------- | ----: | ------------------------------------------------------- | ----------------------------- |
| `--nb-base-unit`                                          |     1 | What is the geometric grain? (`8px`)                    | `_theme.scss`                 |
| `--nb-c-<ramp>-<100…900>` and `-a11y`                     |  ~400 | The raw palette. 11 named ramps, 17 tints each.         | `variables/_colors.scss`      |
| `--nb-c-<role>` (`primary`, `danger`, `text`, `surface`…) |   ~90 | What is this element _for_? The semantic layer.         | `_theme.scss`                 |
| `--nb-c-chart-<1…8>`, `-sequential-from` / `-to`          |    10 | Which series is this? Categorical and sequential ramps. | `_theme.scss`                 |
| `--nb-spacing-<px>`                                       |    25 | How far apart are these two things?                     | `variables/_type.scss`        |
| `--nb-radius-<none…pill>`                                 |     6 | Is this a control the user manipulates, or a container? | `_theme.scss`                 |
| `--nb-font-size-<px>`                                     |    22 | The raw type ramp. Rarely used directly.                | `variables/_type.scss`        |
| `--nb-font-weight-<light…bold>`                           |     4 | Raw weights.                                            | `variables/_type.scss`        |
| `--nb-font-family-sans` / `-mono`                         |     2 | Which typeface? Override these to bring your own.       | `variables/_type.scss`        |
| `--nb-line-height-*`, `--nb-letter-spacing-*`             |    11 | Raw leading and tracking.                               | `variables/_type.scss`        |
| `--nb-type-<set>-<size, weight, line-height, …>`          |    85 | What role does this text play? 17 sets, 5 props each.   | `variables/_type.scss`        |
| `--nb-animation-<fast…xslow>`                             |     4 | How long should this take?                              | `variables/_animations.scss`  |
| `--nb-zindex-<layer>`                                     |    22 | What sits above what? 19 root layers, 3 modal-scoped.   | `variables/_layout.scss`      |
| `--nb-grid-max-width` / `-columns` / `-gutter`            |     3 | Page frame geometry.                                    | `variables/_grid.scss`        |
| `--nb-field-height-xs…lg`, `-padding-h`, `-label-gap`, …  |     9 | How dense is this form control?                         | `_theme.scss`                 |
| `--nb-shell-*`, `--nb-bottom-panel-*`                     |    37 | How is the application frame painted and sized?         | `_theme.scss` (`light` mixin) |
| `--nb-menu-item-h`, `--nb-size-titlebar-height`           |     2 | Two chrome dimensions that predate the families.        | `_theme.scss`                 |

Four areas are documented in depth elsewhere, because each has rules a table cannot carry:

- **Spacing** has its own page: [Spacing and rhythm](/principles/spacing). Read it before you write a `padding`.
- **Colour and layers** are covered in [Theming](/theming) and [Colors](/principles/color).
- **Type sets** are covered in [Typography](/principles/typography).
- **Stacking** is covered in [z-Index](/principles/z-index), including why every value is a `calc()` off `--nb-zindex-root`.

### Raw versus semantic, and why it matters commercially

Most families exist in two layers, and picking the wrong one is the single most expensive token mistake in this codebase.

```
raw          --nb-c-grape-hyacinth-500     "this exact purple"
semantic     --nb-c-primary                 "the brand's main action colour"
```

The raw layer describes a pigment. The semantic layer describes a job. A white-label deployment retints the semantic layer and everything that spoke semantically follows; everything that named a pigment stays purple.

This is not hypothetical. `NbButton`'s ghost hover border used to name `--nb-c-grape-hyacinth-200`, a raw Nubisco brand ramp, and a white-label client had to write the vendor's purple into their own stylesheet to stop it leaking onto that edge. The comment explaining the fix is still in `Button.vue`. The same class of mistake in a chart palette put a purple placeholder into a green-branded white-label product, where no upgrade could remove it, because the hex had been copied into the consuming app.

**Rule: never name a raw token in application code.** Raw tokens exist so the theme layer can be built out of them. If the semantic token you need does not exist, that is a gap in this library worth reporting, not a licence to reach past it.

The same split applies outside colour. `--nb-font-size-14` is raw; `--nb-type-body-md-size` is semantic. `--nb-spacing-16` is a scale step, which is the closest thing spacing has to a semantic layer.

## Choosing a token

Work down this ladder and stop at the first rung that applies. Every rung below the first is a smaller claim about what you meant.

**1. Is there a semantic token for the job?** Use it. `--nb-c-danger` for a destructive action. `--nb-c-text-muted` for supporting copy. `--nb-field-height-sm` for a dense control. This is the only rung where the value moves correctly when the theme, the brand or the density changes.

**2. Is there a scale step for the relationship?** Use it. `--nb-spacing-16` for padding inside a panel, `--nb-radius-sm` for a popover, `--nb-animation-fast` for a hover transition. You are not naming a role, but you are naming a step, and steps move together.

**3. Is this geometry that must match a known dimension?** Compute it from the grain and say what you are matching.

```scss
// Matches --nb-menu-item-h so the trigger aligns with the rows beneath it.
height: calc(var(--nb-base-unit) * 5);
```

**4. Only now, a literal, with the reason written above it.**

A worked example. You are styling a compact toolbar button inside an inspector.

| Decision           | Rung | Token                                                  |
| ------------------ | ---- | ------------------------------------------------------ |
| Background         | 1    | `var(--nb-c-surface)`                                  |
| Text               | 1    | `var(--nb-c-text)`                                     |
| Border             | 1    | `var(--nb-c-border)`                                   |
| Corner             | 2    | `var(--nb-radius-xs)` (a control, not a container)     |
| Height             | 1    | `var(--nb-field-height-xs)` (it lives among xs fields) |
| Horizontal padding | 2    | `var(--nb-spacing-8)`                                  |
| Gap to its icon    | 2    | `var(--nb-spacing-4)`                                  |
| Hover transition   | 2    | `var(--nb-animation-fast)`                             |
| Focus ring         | 1    | `var(--nb-c-focus-ring)`                               |

Nine decisions, no literals, and the whole thing retints, rethemes and re-densifies without being touched.

One caveat on that fifth row: a token being available does not make it conformant in context. `--nb-field-height-xs` is 28px and clears the 24px WCAG 2.5.8 target minimum; `NbButton`'s `xxs` size is 16px and does not, except by the spacing exception. Density choices carry accessibility consequences that no token can express. See [Accessibility](/principles/spacing#accessibility) on the spacing page before you commit to a dense surface.

A second caveat on spacing specifically: the `.ph-*`, `.pl-*`, `.pr-*` and `.mh-*` utility classes generated from the scale emit physical `padding-left` / `padding-right`, so they do not mirror under right-to-left. Component styles should use `padding-inline` and `margin-inline`, as `Button.vue` and `DataTable.vue` already do. See [Logical properties](/principles/spacing#logical-properties-and-why-the-utilities-are-ltr-only).

### The question to ask before every value

Not "what value looks right." That question has a different correct answer on every screen and produces the 462.

Ask **"what am I claiming about this element?"** A token is a claim: _this is the dangerous one_, _this is one step of separation_, _this is a control rather than a container_. A literal is not a claim about anything, which is why literals never move together and never can be fixed in one place.

## When no token fits

This happens, and pretending otherwise is how you get people quietly inventing their own scales. Three legitimate outcomes, in order of preference.

**Compose from existing tokens.** CSS gives you `calc()`, `color-mix()` and `clamp()`, and the library uses all three. `--nb-c-scrim` is defined as `color-mix(in srgb, var(--nb-c-black) 45%, transparent)` precisely so no component has to write a literal `rgba()`. A tint you need once is usually a `color-mix()` of a semantic token away, and it stays theme-aware.

**Declare a component-scoped custom property.** When a component needs a knob that is genuinely its own, declare it on the component root with the component name in it, and read it with a fallback so it works undeclared. This is an established pattern in the library:

```vue
<style scoped lang="scss">
.nb-empty-state {
  // Consumers narrow the measure on a cramped surface without a wrapper class.
  --nb-empty-state-measure: 44ch;

  max-width: var(--nb-empty-state-measure);
}
</style>
```

Real examples you can read: `--nb-empty-state-measure` in `EmptyState.vue`, `--nb-button-icon-size` in `Button.vue`, `--nb-stepper-marker` in `Stepper.vue`, `--nb-field-label-width` and `--nb-field-col-gap` in `Field.vue` (both read with a fallback and never declared at `:root`, which is deliberate: they are set by the container that owns the alignment).

Naming rule: `--nb-<component>-<thing>`. Not `--nb-<thing>`, which reads like a system token and will collide.

**Report the gap.** If two components need the same non-existent value, it is a missing system token, not two component knobs. The spacing scale, for one, has real holes documented in [Where the scale genuinely runs out](/principles/spacing#where-the-scale-genuinely-runs-out).

## Which tokens you may override

Not all 700 are public API. Three tiers.

### Tier 1: the theming contract

Override these freely. They exist to be overridden, and the library is built so that a change here propagates everywhere.

| Tokens                                                                                    | What you are changing            |
| ----------------------------------------------------------------------------------------- | -------------------------------- |
| `--nb-c-primary` / `-secondary` / `-success` / `-info` / `-warning` / `-danger` (+states) | The brand and its status palette |
| `--nb-c-focus-ring`                                                                       | Focus affordance                 |
| `--nb-font-family-sans`, `--nb-font-family-mono`                                          | Typefaces                        |
| `--nb-c-chart-1` … `-8`, `--nb-c-chart-sequential-from` / `-to`                           | Data series colours              |
| `--nb-shell-*`, `--nb-bottom-panel-*`                                                     | Application frame paint and size |
| `--nb-zindex-root`                                                                        | Shifts the whole stack at once   |

Put them on `:root` in your own stylesheet. That beats the library's scoped component styles without `:deep()` or `!important`, which is why the shell tokens were moved to `:root` in the first place.

```css
/* your-app.css, loaded after the library */
:root {
  --nb-c-primary: #0f766e;
  --nb-c-primary-hover: #0d5f58;
  --nb-c-primary-active: #0a4a44;
  --nb-font-family-sans: 'Inter', system-ui, sans-serif;
}
```

### Tier 2: override with care

Legal, and occasionally correct, but each has a blast radius you should know before you type it.

| Tokens                 | Why care                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--nb-field-height-*`  | Changes the vertical rhythm of every form. Change the whole set or none of it.                                                 |
| `--nb-field-label-gap` | Shared by every control so mixed rows align. Overriding it in one place breaks that alignment for the row.                     |
| `--nb-radius-*`        | Retunes rounding globally. Squaring the whole system is a coherent choice; squaring one step is usually not.                   |
| `--nb-animation-*`     | Applies to every transition. Do not set these to `0` to disable motion; honour `prefers-reduced-motion` instead.               |
| `--nb-c-layer-*`       | The four-level depth model. Read the Layers section of [Theming](/theming#layers) first, then change all four levels together. |
| `--nb-grid-*`          | Page frame. Harmless, but the 16-column grid classes are compiled from Sass and will not follow.                               |

::: danger `--nb-base-unit` is a trap
It looks like the master dial and it is not. Field heights, radii and shell dimensions are `calc(var(--nb-base-unit) * n)` and will scale. The entire `--nb-spacing-*` scale is emitted as literal `rem` values and will **not**. Changing it produces a UI stretched in one dimension and untouched in the other. Leave it at `8px` unless you are also re-declaring all 25 spacing tokens in the same block.
:::

### Tier 3: internal

Read them, do not write them.

- **Raw palette tints** (`--nb-c-grape-hyacinth-500` and the ~400 like it, including every `-a11y`). These are the vendor's pigments. Naming one in your app is how a white-label product ends up hardcoding someone else's brand. Retint the semantic role instead.
- **Raw type primitives** (`--nb-font-size-*`, `--nb-line-height-*`, `--nb-letter-spacing-*`). Use a type set.
- **Type set internals** (`--nb-type-<set>-<prop>`). Overriding one property of a set produces a set nothing else matches. Add a set in SCSS instead: see [Adding a type set](/theming#adding-a-type-set).
- **Component-scoped properties** (`--nb-button-icon-size`, `--nb-stepper-marker`, `--nb-blueprint-*`, and similar). These are internal geometry unless a component's own page documents them as a knob. The pattern is stable; any individual name is not.

## Checking that a name is real

Do this. It takes two seconds and it is the highest-value habit on this page, because a wrong token name produces no error, no warning and no visible failure until someone notices the wrong pixels months later.

```bash
# From your app: does the token exist in the shipped stylesheet?
grep -c -- "--nb-zindex-toast:" node_modules/@nubisco/ui/dist/ui.css
```

```bash
# From this repo: list every token the theme actually emits.
# Grep the compiled output, not the SCSS. Most token names are generated by
# @each loops with interpolation, so they do not appear literally in source.
pnpm build && grep -ohE -- "--nb-[a-z0-9-]+:" dist/ui.css | sort -u
```

Three wrong names that are live right now, as a calibration of how easy this is:

| Written                                                             | Real token               | Effect                                                                                                                                      |
| ------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `var(--nb-z-toast)` (a consuming app's toast host)                  | `--nb-zindex-toast`      | Toasts rendered on the fallback, below modals.                                                                                              |
| `var(--nb-border-radius-sm, 6px)` (`ImageCropper.vue:831`)          | `--nb-radius-sm` (`4px`) | Always paints the 6px fallback. Off the radius scale entirely.                                                                              |
| `--nb-gap-xxs` … `--nb-gap-xxl` (documented in [Theming](/theming)) | No such tokens exist     | The gap scale is a Sass map compiled to `.gap-*` classes, never emitted as custom properties. Anything binding to those names gets nothing. |

The third is the worst kind, because the wrong names were _published in our own documentation_. Verify against the stylesheet, not against prose, this page included.

## The machine-readable file

Every token is also published in [W3C Design Token (DTCG)](https://tr.designtokens.org/format/) format at [`/tokens.json`](/tokens.json), regenerated on every docs build by `scripts/build-tokens.mjs`. It compiles the theme, parses the emitted custom properties, and resolves `var()` references to concrete values, so a Figma plugin such as [Tokens Studio](https://tokens.studio) can sync straight from `https://docs.nubisco.io/tokens.json`.

Know its boundaries before you build on it:

- It contains seven sets: `color`, `typography`, `spacing`, `radius`, `animation`, `zIndex`, `grid`.
- It compiles `theme.base()` only. Tokens declared in the `light` mixin, which is all 34 `--nb-shell-*` tokens, are **absent**.
- Tokens whose prefix has no branch in the extractor are dropped even when they are in `base`. That includes every `--nb-field-*` token and `--nb-menu-item-h`.
- It is a build artefact and is not committed.

So it is a faithful export of the visual scales and an incomplete export of the component contracts. For the second group, this page and the component pages are the reference.

## Live token reference

Values below are read from the compiled stylesheet at build time, so they match what ships.

### Colors

<ClientOnly>
  <tokens-viewer section="colors" />
</ClientOnly>

### Typography

Roles, not raw sizes. See [Typography](/principles/typography) for which set to use where.

<ClientOnly>
  <tokens-viewer section="typography" />
</ClientOnly>

### Spacing

Twenty-five steps, but only eight of them form the working rhythm. [Spacing and rhythm](/principles/spacing) explains which eight and why the others exist.

<ClientOnly>
  <tokens-viewer section="spacing" />
</ClientOnly>

### Radius

`xs` for controls the user manipulates, `sm` for popovers and menus, `md` for modals, `lg` for panels, `pill` for tracks and avatars, `none` for full-bleed edges.

<ClientOnly>
  <tokens-viewer section="radius" />
</ClientOnly>

### Animation

Pair every one of these with a `prefers-reduced-motion` guard. Do not override them to zero.

<ClientOnly>
  <tokens-viewer section="animation" />
</ClientOnly>
