---
layout: nubisco
title: Typography
tabs: ['Overview', 'Style strategies', 'Type sets', 'Code']
---

<doc-tab name="Overview">

Typography in Nubisco is built on three layers: a **raw scale** of discrete sizes, a set of **semantic tokens** for line-height and letter-spacing, and **type sets** — pre-configured roles that bundle everything together into a named identity like `body-md` or `heading-03`. Components always use type sets, never raw scale values directly.

## Typefaces

Nubisco ships with two typefaces, both served via the font plugin.

### Plus Jakarta Sans — sans-serif

The primary typeface for all UI text. It is a geometric sans-serif with strong legibility at small sizes and enough personality to work at display scale. Used for labels, body copy, headings, and display type.

<div style="font-family: var(--nb-font-family-sans); padding: 24px 0; display: flex; flex-direction: column; gap: 12px;">
  <span style="font-size: 36px; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em;">The quick brown fox</span>
  <span style="font-size: 18px; font-weight: 400; line-height: 1.6;">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</span>
  <span style="font-size: 14px; font-weight: 400; line-height: 1.5; color: var(--nb-c-text-muted);">Plus Jakarta Sans — Regular, Semibold, Bold — var(--nb-font-family-sans)</span>
</div>

### Fira Code — monospace

Used exclusively for code, JSON viewers, technical values, and keyboard shortcuts. Its ligatures are enabled by default.

<div style="font-family: var(--nb-font-family-mono); padding: 24px 0; display: flex; flex-direction: column; gap: 12px;">
  <span style="font-size: 28px; font-weight: 400; line-height: 1.2;">const ui = nubisco()</span>
  <span style="font-size: 16px; font-weight: 400; line-height: 1.5;">0123456789 => != !== === >= <= -> <-</span>
  <span style="font-size: 13px; font-weight: 400; line-height: 1.5; color: var(--nb-c-text-muted);">Fira Code — Regular — var(--nb-font-family-mono)</span>
</div>

## The scale

The font-size scale is a curated set of values from 8px to 76px. Values are named by their pixel equivalent and exposed as CSS custom properties on `:root`.

<div style="display: flex; flex-direction: column; gap: 6px; padding: 24px 0;">
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-size: var(--nb-font-size-8); min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 11px;">8</span><span style="font-size: var(--nb-font-size-8);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-size: var(--nb-font-size-8); min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 11px;">10</span><span style="font-size: var(--nb-font-size-10);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-size: var(--nb-font-size-8); min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 11px;">12</span><span style="font-size: var(--nb-font-size-12);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-size: var(--nb-font-size-8); min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 11px;">14</span><span style="font-size: var(--nb-font-size-14);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-size: var(--nb-font-size-8); min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 11px;">16</span><span style="font-size: var(--nb-font-size-16);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-size: var(--nb-font-size-8); min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 11px;">20</span><span style="font-size: var(--nb-font-size-20);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-size: var(--nb-font-size-8); min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 11px;">24</span><span style="font-size: var(--nb-font-size-24);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-size: var(--nb-font-size-8); min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 11px;">32</span><span style="font-size: var(--nb-font-size-32);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-size: var(--nb-font-size-8); min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 11px;">42</span><span style="font-size: var(--nb-font-size-42);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-size: var(--nb-font-size-8); min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 11px;">54</span><span style="font-size: var(--nb-font-size-54);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="font-size: var(--nb-font-size-8); min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 11px;">76</span><span style="font-size: var(--nb-font-size-76);">Nubisco UI</span></div>
</div>

## How CSS variables are generated

All typographic values are derived from SCSS maps in `src/styles/variables/_type.scss` and emitted as CSS custom properties on `:root` by `_theme.scss`. Three categories:

| Prefix                       | Example                     | Source map       |
| ---------------------------- | --------------------------- | ---------------- |
| `--nb-font-size-{N}`         | `--nb-font-size-14`         | `$fontSizes`     |
| `--nb-font-weight-{name}`    | `--nb-font-weight-semibold` | `$fontWeight`    |
| `--nb-font-family-{name}`    | `--nb-font-family-mono`     | `$fontFamilies`  |
| `--nb-line-height-{name}`    | `--nb-line-height-normal`   | `$lineHeights`   |
| `--nb-letter-spacing-{name}` | `--nb-letter-spacing-tight` | `$letterSpacing` |
| `--nb-type-{set}-{prop}`     | `--nb-type-body-md-size`    | `$typeSets`      |

</doc-tab>

<doc-tab name="Style strategies">

## Hierarchy through scale

Nubisco UI is primarily a **product interface** library — dashboards, forms, data-heavy views. At this density, the default reading size is `body-md` (14px), not 16px. Reserve `body-lg` for settings screens, onboarding flows, and other low-density contexts where users read more than they interact.

The hierarchy descends from the most prominent element on the page toward the least:

1. **Page title** — one per view, `heading-04` or higher
2. **Section heading** — groups of content, `heading-02` or `heading-03`
3. **Card/panel title** — scoped context, `heading-01`
4. **Body** — primary readable content, `body-md`
5. **Supporting text** — descriptions, help text, captions, `body-sm`
6. **Labels** — form labels, column headers, badges — `label-md` or `label-lg`
7. **Meta** — timestamps, IDs, secondary counts — `label-sm` with `--nb-c-text-muted`

## Line-height rationale

Line-height is the most common typographic mistake in UI systems. Nubisco uses **tighter leading as sizes grow**:

| Context                  | Line-height   | Why                                                       |
| ------------------------ | ------------- | --------------------------------------------------------- |
| Display / Large headings | `1.0 – 1.1`   | Visual mass; long ascenders/descenders create natural gap |
| Mid headings             | `1.2 – 1.3`   | Enough breathing room for multi-line titles               |
| Body text                | `1.5 – 1.625` | Comfortable for sustained reading                         |
| Labels / UI controls     | `1.4`         | Compact but not cramped in tight layouts                  |
| Code                     | `1.5`         | Consistent gutter for scan-reading                        |

**Never set `line-height` equal to `font-size`** — this produces `lh = 1` regardless of font size and makes body text illegible.

## Letter-spacing at large sizes

At display and heading sizes, the optical spacing between glyphs appears too loose due to how fonts are designed (they assume small text). Nubisco applies negative `letter-spacing` to headings and display type:

- `heading-02` and up: `-0.01em` to `-0.025em`
- `display-01` / `display-02`: `-0.03em`

**Never apply negative letter-spacing to body or label text** — it tightens to the point of illegibility at small sizes.

## Semibold vs bold

- **Semibold (600)** — headings at `heading-01` through `heading-03`, all labels. Enough weight for hierarchy without heaviness in dense UIs.
- **Bold (700)** — only for `heading-04` and above, plus display. The visual jump to 700 is intentional at large sizes; at small sizes it reads as shouting.
- **Regular (400)** — all body and code.
- **Light (300)** — reserved for decorative large numbers or editorial use; avoid in core product UI.

## Code typography

Always use `code-*` type sets for any monospaced content — not raw `font-family: mono` with an arbitrary size. This ensures Fira Code is paired with the right line-height for readability and the correct weight (ligatures only activate at `regular`).

## Colour and text roles

The following semantic tokens are available for text colour:

| Token                | Use                                            |
| -------------------- | ---------------------------------------------- |
| `--nb-c-text`        | Primary body text, headings                    |
| `--nb-c-text-muted`  | Supporting text, captions, secondary info      |
| `--nb-c-text-subtle` | Placeholder text, disabled labels, ghost hints |

</doc-tab>

<doc-tab name="Type sets">

Type sets are the primary way to apply typography. Each set bundles font-size, weight, line-height, letter-spacing, and font-family into a single named role. Apply them with the `.type-{name}` utility class or via CSS custom properties.

## Labels

Used in UI controls — form field labels, column headers, badges, chips, tabs.

<div style="display: flex; flex-direction: column; gap: 24px; padding: 24px 0;">
  <div style="display: flex; align-items: center; gap: 32px;">
    <span class="type-label-sm" style="min-width: 200px;">Label Small — 11px</span>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">label-sm · 11px · semibold · lh 1.4</span>
  </div>
  <div style="display: flex; align-items: center; gap: 32px;">
    <span class="type-label-md" style="min-width: 200px;">Label Medium — 12px</span>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">label-md · 12px · semibold · lh 1.4</span>
  </div>
  <div style="display: flex; align-items: center; gap: 32px;">
    <span class="type-label-lg" style="min-width: 200px;">Label Large — 14px</span>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">label-lg · 14px · semibold · lh 1.4</span>
  </div>
</div>

## Body

Used for readable content — paragraphs, descriptions, help text, notifications.

<div style="display: flex; flex-direction: column; gap: 24px; padding: 24px 0;">
  <div>
    <p class="type-body-sm" style="margin: 0 0 4px;">The quick brown fox jumps over the lazy dog. Nubisco UI is a design system built for product interfaces at scale.</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">body-sm · 12px · regular · lh 1.5</span>
  </div>
  <div>
    <p class="type-body-md" style="margin: 0 0 4px;">The quick brown fox jumps over the lazy dog. Nubisco UI is a design system built for product interfaces at scale.</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">body-md · 14px · regular · lh 1.5</span>
  </div>
  <div>
    <p class="type-body-lg" style="margin: 0 0 4px;">The quick brown fox jumps over the lazy dog. Nubisco UI is a design system built for product interfaces at scale.</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">body-lg · 16px · regular · lh 1.625</span>
  </div>
</div>

## Code

Used for monospaced content — code blocks, inline code, JSON viewers, keyboard shortcuts.

<div style="display: flex; flex-direction: column; gap: 24px; padding: 24px 0;">
  <div>
    <p class="type-code-sm" style="margin: 0 0 4px;">const answer = 42; // => true</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">code-sm · 11px · regular · lh 1.5 · Fira Code</span>
  </div>
  <div>
    <p class="type-code-md" style="margin: 0 0 4px;">const answer = 42; // => true</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">code-md · 13px · regular · lh 1.5 · Fira Code</span>
  </div>
  <div>
    <p class="type-code-lg" style="margin: 0 0 4px;">const answer = 42; // => true</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">code-lg · 16px · regular · lh 1.5 · Fira Code</span>
  </div>
</div>

## Headings

Used for page titles, section headings, card headers, and dialog titles. Headings 01–06 map directly to `h6`–`h1` respectively.

<div style="display: flex; flex-direction: column; gap: 20px; padding: 24px 0;">
  <div>
    <p class="type-heading-01" style="margin: 0 0 4px;">Heading 01 — section title</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">heading-01 · 16px · semibold · lh 1.3 · ls 0 → h6</span>
  </div>
  <div>
    <p class="type-heading-02" style="margin: 0 0 4px;">Heading 02 — card title</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">heading-02 · 20px · semibold · lh 1.25 · ls −0.01em → h5</span>
  </div>
  <div>
    <p class="type-heading-03" style="margin: 0 0 4px;">Heading 03 — page section</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">heading-03 · 24px · semibold · lh 1.2 · ls −0.015em → h4</span>
  </div>
  <div>
    <p class="type-heading-04" style="margin: 0 0 4px;">Heading 04 — page title</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">heading-04 · 32px · bold · lh 1.15 · ls −0.02em → h3</span>
  </div>
  <div>
    <p class="type-heading-05" style="margin: 0 0 4px;">Heading 05</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">heading-05 · 42px · bold · lh 1.1 · ls −0.02em → h2</span>
  </div>
  <div>
    <p class="type-heading-06" style="margin: 0 0 4px;">Heading 06</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">heading-06 · 54px · bold · lh 1.05 · ls −0.025em → h1</span>
  </div>
</div>

## Display

Used for hero sections, onboarding screens, marketing surfaces, and large statistical callouts.

<div style="display: flex; flex-direction: column; gap: 20px; padding: 24px 0;">
  <div>
    <p class="type-display-01" style="margin: 0 0 4px;">Display 01</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">display-01 · 60px · bold · lh 1.0 · ls −0.03em</span>
  </div>
  <div>
    <p class="type-display-02" style="margin: 0 0 4px;">Display 02</p>
    <span style="font-family: var(--nb-font-family-mono); font-size: 11px; color: var(--nb-c-text-muted);">display-02 · 76px · bold · lh 1.0 · ls −0.03em</span>
  </div>
</div>

</doc-tab>

<doc-tab name="Code">

## CSS custom properties

Every type set generates four CSS variables on `:root`:

```css
--nb-type-{name}-size
--nb-type-{name}-weight
--nb-type-{name}-line-height
--nb-type-{name}-letter-spacing
--nb-type-{name}-family
```

**Full reference:**

| Set          | Size                | Weight                      | Line height | Letter spacing |
| ------------ | ------------------- | --------------------------- | ----------- | -------------- |
| `label-sm`   | `--nb-font-size-11` | `--nb-font-weight-semibold` | `1.4`       | `0`            |
| `label-md`   | `--nb-font-size-12` | `--nb-font-weight-semibold` | `1.4`       | `0`            |
| `label-lg`   | `--nb-font-size-14` | `--nb-font-weight-semibold` | `1.4`       | `0`            |
| `body-sm`    | `--nb-font-size-12` | `--nb-font-weight-regular`  | `1.5`       | `0`            |
| `body-md`    | `--nb-font-size-14` | `--nb-font-weight-regular`  | `1.5`       | `0`            |
| `body-lg`    | `--nb-font-size-16` | `--nb-font-weight-regular`  | `1.625`     | `0`            |
| `code-sm`    | `--nb-font-size-11` | `--nb-font-weight-regular`  | `1.5`       | `0`            |
| `code-md`    | `--nb-font-size-13` | `--nb-font-weight-regular`  | `1.5`       | `0`            |
| `code-lg`    | `--nb-font-size-16` | `--nb-font-weight-regular`  | `1.5`       | `0`            |
| `heading-01` | `--nb-font-size-16` | `--nb-font-weight-semibold` | `1.3`       | `0`            |
| `heading-02` | `--nb-font-size-20` | `--nb-font-weight-semibold` | `1.25`      | `-0.01em`      |
| `heading-03` | `--nb-font-size-24` | `--nb-font-weight-semibold` | `1.2`       | `-0.015em`     |
| `heading-04` | `--nb-font-size-32` | `--nb-font-weight-bold`     | `1.15`      | `-0.02em`      |
| `heading-05` | `--nb-font-size-42` | `--nb-font-weight-bold`     | `1.1`       | `-0.02em`      |
| `heading-06` | `--nb-font-size-54` | `--nb-font-weight-bold`     | `1.05`      | `-0.025em`     |
| `display-01` | `--nb-font-size-60` | `--nb-font-weight-bold`     | `1.0`       | `-0.03em`      |
| `display-02` | `--nb-font-size-76` | `--nb-font-weight-bold`     | `1.0`       | `-0.03em`      |

## Utility classes

Apply a complete type set in one class:

```html
<p class="type-body-md">Readable paragraph text</p>
<span class="type-label-md">Form label</span>
<h2 class="type-heading-03">Section title</h2>
<code class="type-code-md">const x = 1</code>
```

`h1`–`h6` elements are already wired to their corresponding type sets by default (`h1` → `heading-06`, `h6` → `heading-01`). You only need `.type-heading-*` when applying heading styling to a non-heading element.

## SCSS usage in components

Inside component `<style>` blocks, reference type set variables directly:

```scss
.my-component__title {
  font-size: var(--nb-type-heading-02-size);
  font-weight: var(--nb-type-heading-02-weight);
  line-height: var(--nb-type-heading-02-line-height);
  letter-spacing: var(--nb-type-heading-02-letter-spacing);
}

.my-component__description {
  font-size: var(--nb-type-body-md-size);
  font-weight: var(--nb-type-body-md-weight);
  line-height: var(--nb-type-body-md-line-height);
}
```

## Line-height and letter-spacing scale utilities

Independent scale values are also available when you need to override a single property:

```css
/* Line heights */
--nb-line-height-none: 1 --nb-line-height-tight: 1.1 --nb-line-height-snug: 1.25
  --nb-line-height-normal: 1.5 --nb-line-height-relaxed: 1.625
  --nb-line-height-loose: 1.75 /* Letter spacing */
  --nb-letter-spacing-tighter: -0.05em --nb-letter-spacing-tight: -0.02em
  --nb-letter-spacing-normal: 0em --nb-letter-spacing-wide: 0.02em
  --nb-letter-spacing-wider: 0.05em;
```

## Adding a new type set

Edit `$typeSets` in `src/styles/variables/_type.scss`:

```scss
$typeSets: (
  // ...existing sets...
  caption: (
      size: 11,
      weight: regular,
      line-height: 1.4,
      letter-spacing: 0.01em,
    )
) !default;
```

This automatically generates `--nb-type-caption-*` variables and a `.type-caption` utility class.

</doc-tab>
