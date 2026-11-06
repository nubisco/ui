---
layout: nubisco
title: Typography
tabs: ['Overview', 'Style strategies', 'Type sets', 'Code']
---

<doc-tab name="Overview">

Typography in Nubisco is built on three layers: a **raw scale** of discrete sizes, a set of **semantic tokens** for weight, line height and letter spacing, and **type sets**: named roles like `body-md` or `heading-compact` that bundle size, weight, line height, tracking and family. Components always use type sets, never raw scale values, and a test holds the library to that.

## Typefaces

Nubisco declares two typefaces as its defaults: **IBM Plex Sans** for all UI text and **IBM Plex Mono** for code. These are the values of `--nb-font-family-sans` and `--nb-font-family-mono`. They are **not** bundled or loaded automatically: until you load them (or override the two variables), text falls back to the system stack. See [Loading the fonts](#loading-the-fonts) below.

### IBM Plex Sans

The typeface for all UI text: labels, body copy, headings and display. Plex Sans was drawn for interfaces. It holds its counters open at 12 and 14px, where a product spends most of its life, its figures can be set tabular, and its weights run from a light that suits large numbers to a semibold that carries a small heading.

<div style="font-family: var(--nb-font-family-sans); padding: 24px 0; display: flex; flex-direction: column; gap: 12px;">
  <span style="font-size: 42px; font-weight: 300; line-height: 50px; letter-spacing: -0.02em;">The quick brown fox</span>
  <span style="font-size: 16px; font-weight: 400; line-height: 24px;">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</span>
  <span style="font-size: 12px; font-weight: 400; line-height: 16px; letter-spacing: 0.32px; color: var(--nb-c-text-muted);">IBM Plex Sans: Light, Regular, Semibold. var(--nb-font-family-sans)</span>
</div>

### IBM Plex Mono

Used for code, JSON viewers, technical values, keys and keyboard shortcuts. It is metrically tuned to Plex Sans, so code inside a sentence sits on the same line without a jump.

<div style="font-family: var(--nb-font-family-mono); padding: 24px 0; display: flex; flex-direction: column; gap: 12px;">
  <span style="font-size: 24px; font-weight: 400; line-height: 32px;">const ui = nubisco()</span>
  <span style="font-size: 14px; font-weight: 400; line-height: 20px;">0123456789 => != !== === >= <= -> <-</span>
  <span style="font-size: 12px; font-weight: 400; line-height: 16px; color: var(--nb-c-text-muted);">IBM Plex Mono: Regular, Semibold. var(--nb-font-family-mono)</span>
</div>

## Loading the fonts

NubiscoUI references `--nb-font-family-sans` and `--nb-font-family-mono` everywhere, but it does **not** ship or auto-load any font files. This keeps the bundle free of fonts you may not want: a consumer that already serves its own typefaces pays nothing. There are two ways to get real fonts on the page.

### Option A: override the family variables (bring your own)

If your app already loads fonts (its own `@font-face`, a bundler plugin, an `@fontsource/*` package), point the two variables at them on `:root`. You load the files, NubiscoUI uses them.

```css
/* main.css or App.vue <style>: load Inter and JetBrains Mono yourself, then: */
:root {
  --nb-font-family-sans: 'Inter', system-ui, sans-serif;
  --nb-font-family-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

Every type set resolves its family through these two variables, so every role re-points the moment they change. Load at least 300, 400 and 600 of the sans: those are the only weights the library uses.

### Option B: the fonts plugin

NubiscoUI exports a Vite plugin that self-hosts IBM Plex Sans and IBM Plex Mono through [Fontsource](https://fontsource.org), with no third-party CDN. Install the source packages and add the plugin:

```bash
pnpm add -D @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono
```

The plugin runs on a copy of `unplugin-fonts` (2.0.0) bundled into the library, so there is nothing else to install. An app that also uses `unplugin-fonts` directly keeps its own copy, whatever its version.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { fonts } from '@nubisco/ui/plugins/fonts'

export default defineConfig({
  plugins: [fonts()],
})
```

Then add the matching CSS import to your application entry, once. `unplugin-fonts` does not inject it automatically:

```ts
// src/main.ts (or your equivalent entry)
import 'unfonts.css'
```

TypeScript users may need to declare the module in their `env.d.ts`:

```ts
declare module 'unfonts.css'
```

Called with no arguments, `fonts()` loads the library defaults: IBM Plex Sans at 300, 400 and 600, and IBM Plex Mono at 400 and 600, `normal` styles, `font-display: swap`. Medium (500) and bold (700) are not loaded, because no component uses them. These match the declared `--nb-font-family-*` defaults, so you do **not** need to touch any CSS variable.

To load different families or weights, pass options (they replace the defaults). Any provider `unplugin-fonts` supports works, including `custom` for your own self-hosted woff2 files:

```ts
fonts({
  fontsource: {
    families: [
      { name: 'Inter', weights: [300, 400, 600], styles: ['normal'] },
      { name: 'JetBrains Mono', weights: [400], styles: ['normal'] },
    ],
  },
})
```

The name passed to each family must match the value used in `--nb-font-family-sans` / `--nb-font-family-mono` exactly, including the quoting around multi-word names like `'JetBrains Mono'`. Fontsource emits the `@font-face` under that exact family name, so if the override does not match, the browser falls through to the next fallback in the stack. Then set the two variables (Option A) so NubiscoUI uses the families you just loaded.

> **Not on Vite?** The plugin is a convenience, not a requirement. Load the fonts however your toolchain prefers (hand-written `@font-face`, your own bundler plugin), then use Option A to wire them into NubiscoUI.

### Preloading the body weight

Fontsource sets `font-display: swap`, so text never blocks render. For first-paint screens (sign-in, a landing dashboard), preloading the single weight the body uses (Plex Sans 400, latin subset) removes the flash of fallback text:

```html
<!-- path is the hashed woff2 your bundler emits for the 400 weight -->
<link
  rel="preload"
  href="/path/to/your-body-weight.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

## The scale

The font size scale runs from **12px** to 76px. Values are named by their pixel size and exposed as `--nb-font-size-{N}` on `:root`, with a `.text-{N}` utility each.

**12px is the floor.** Below it a sans serif's counters close and the text stops being readable on an ordinary screen. The steps `--nb-font-size-8`, `-9`, `-10`, `-11` and `-13` are **deprecated**: they are still emitted for one minor release so nothing breaks, no library component uses them, and 8 to 11 no longer get a `.text-N` utility. Replace them with a type set: `label`, `helper-text` or `body-sm` for 12px text, `body-compact` for 14px.

<div style="display: flex; flex-direction: column; gap: 6px; padding: 24px 0;">
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 12px;">12</span><span style="font-size: var(--nb-font-size-12);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 12px;">14</span><span style="font-size: var(--nb-font-size-14);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 12px;">16</span><span style="font-size: var(--nb-font-size-16);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 12px;">20</span><span style="font-size: var(--nb-font-size-20);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 12px;">24</span><span style="font-size: var(--nb-font-size-24);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 12px;">32</span><span style="font-size: var(--nb-font-size-32);">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 12px;">42</span><span style="font-size: var(--nb-font-size-42); font-weight: 300;">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 12px;">54</span><span style="font-size: var(--nb-font-size-54); font-weight: 300;">Nubisco UI</span></div>
  <div style="display: flex; align-items: baseline; gap: 16px;"><span style="min-width: 40px; color: var(--nb-c-text-muted); font-family: var(--nb-font-family-mono); font-size: 12px;">76</span><span style="font-size: var(--nb-font-size-76); font-weight: 300;">Nubisco UI</span></div>
</div>

## How CSS variables are generated

All typographic values come from SCSS maps in `src/styles/variables/_type.scss` and are emitted as CSS custom properties on `:root` by `_theme.scss`:

| Prefix                       | Example                     | Source map       |
| ---------------------------- | --------------------------- | ---------------- |
| `--nb-font-size-{N}`         | `--nb-font-size-14`         | `$fontSizes`     |
| `--nb-font-weight-{name}`    | `--nb-font-weight-semibold` | `$fontWeight`    |
| `--nb-font-family-{name}`    | `--nb-font-family-mono`     | `$fontFamilies`  |
| `--nb-line-height-{name}`    | `--nb-line-height-normal`   | `$lineHeights`   |
| `--nb-letter-spacing-{name}` | `--nb-letter-spacing-tight` | `$letterSpacing` |
| `--nb-type-{set}-{prop}`     | `--nb-type-body-md-size`    | `$typeSets`      |
| `--nb-measure`               | `65ch`                      | `$measure`       |

</doc-tab>

<doc-tab name="Style strategies">

## The productive ladder

Nubisco is a **product interface** library: dashboards, forms, tables, inspectors. Its ladder is built for dense screens, and it has **one size per role**. Pick the role, and the size, weight, line height and tracking come with it.

| Role                         | Type set          | Size / line height | Weight   | Element |
| ---------------------------- | ----------------- | ------------------ | -------- | ------- |
| Page title                   | `heading-03`      | 24 / 32            | regular  | `h1`    |
| Region title                 | `heading-02`      | 20 / 28            | regular  | `h2`    |
| Panel or container title     | `heading-01`      | 16 / 22            | semibold | `h3`    |
| Row or component title       | `heading-compact` | 14 / 18            | semibold | `h4`    |
| Body (paragraphs)            | `body-md`         | 14 / 20            | regular  |         |
| Body inside a component      | `body-compact`    | 14 / 18            | regular  |         |
| Support (meta, timestamps)   | `body-sm`         | 12 / 16            | regular  |         |
| Label                        | `label`           | 12 / 16            | regular  | `h6`    |
| Helper text (under a field)  | `helper-text`     | 12 / 16            | regular  |         |
| Overline (uppercase heading) | `overline`        | 12 / 16            | semibold |         |
| Code                         | `code-sm`         | 12 / 16            | regular  |         |
| Code in a block              | `code-md`         | 14 / 20            | regular  |         |

`h5` is `heading-compact` too. The large headings (`heading-04` to `-06`) and `display-01` and `-02` are for marketing surfaces and big figures, not for product chrome.

On a dense screen, row text and its title are the **same size** and differ by weight, and meta is the only 12px rung. That is how a list stays scannable: the eye sorts by weight at 14px, and by size only across two steps.

## Weight falls as size rises

Size already carries hierarchy, so weight is spent where size cannot do the job.

- **Semibold (600)** for the two smallest headings (`heading-compact`, `heading-01`), the overline, and emphasis (`strong` and `b` are pinned to semibold).
- **Regular (400)** for all body, labels, helper text, code, and every heading from 20px up.
- **Light (300)** for `heading-05`, `heading-06` and display, where a light large figure reads with more contrast and less ink than a heavy one.

These are the only three weights. Medium and bold are not loaded by the fonts plugin, and a test fails if a component asks for 500 or 700. `--nb-font-weight-bold` stays as a token for a product that loads bold itself.

## Line height on a 4px rhythm

Every type set has an integer pixel line height: 16 at 12px, 18 or 20 at 14px, 22 or 24 at 16px, 28 at 20px, 32 at 24px. Rows built from type sets add up to the spacing scale the layout uses, so a 32px or 48px row resolves cleanly with 8px or 12px of padding.

Leading tightens as size grows: 133% at 12px, about 140% at 14 and 16px, down to about 110% at display, where the long ascenders and descenders already make the gap.

## Tracking

Small text is tracked out a little and large text is tracked in.

| Size       | Letter spacing          |
| ---------- | ----------------------- |
| 12px       | `0.32px`                |
| 14px       | `0.16px`                |
| 16px       | `0`                     |
| 20 to 54px | `-0.01em` to `-0.025em` |
| Display    | `-0.03em`               |
| Overline   | `0.06em` (uppercase)    |

Never add hand-written tracking to a component. Read the set's `-letter-spacing` variable.

## Uppercase is the overline set, and nothing else

Tracked capitals at 12px are the least legible text on a screen, and when every component chooses its own tracking they stop looking like one system. When a group or a panel needs an uppercase heading, use `overline` (12/16, semibold, `0.06em`, uppercase). It carries the transform itself, so `.type-overline` is the whole job.

## Tabular figures

Numbers that line up in a column, or that tick while you watch, use tabular figures: digits of one width. The library applies them to `NbStat`, right-aligned `NbDataTable` columns, `NbNumberInput`, `NbDatePicker`, `NbCalendar` day numbers, `NbBadge`, counts and chart tooltips. In your own markup, add the `.tabular` utility:

```html
<span class="type-body-compact tabular">1,204.50</span>
```

## Line length

Running prose is comfortable at 45 to 75 characters a line, and a line much longer than that loses the reader on the way back to the next one. `--nb-measure` (65ch) is that limit: give a block of prose `max-width: var(--nb-measure)` and let the rest of the layout take the remaining width. Data, tables and forms do not need it, only paragraphs people read.

## Display on a phone

`display-01` (60px) and `display-02` (76px) would overflow a 360px screen, so on the phone layout they step down to 42/50 and 54/64 through the phone signal. Nothing else in the ladder changes size on a phone, and the desktop does not move.

## Code typography

Use `code-sm` or `code-md` for any monospaced content, not `font-family: mono` with a size of your own. For IDs and keys inside prose, consider `.tabular` on the sans first: it lines figures up without the change of face.

## Colour and text roles

| Token                | Use                                            |
| -------------------- | ---------------------------------------------- |
| `--nb-c-text`        | Primary body text, headings                    |
| `--nb-c-text-muted`  | Supporting text, labels, secondary info        |
| `--nb-c-text-subtle` | Placeholder text, disabled labels, ghost hints |

Labels and helper text are regular weight and lean on colour (`--nb-c-text-muted`) for subordination, not on weight.

</doc-tab>

<doc-tab name="Type sets">

Type sets are the primary way to apply typography. Each set bundles size, weight, line height, letter spacing and family into one named role. Apply them with the `.type-{name}` utility class or through their CSS custom properties.

## Labels, helper text and overline

<div style="display: flex; flex-direction: column; gap: 24px; padding: 24px 0;">
  <div><span class="type-label">Billing email</span><br><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">label · 12/16 · regular · 0.32px</span></div>
  <div><span class="type-helper-text" style="color: var(--nb-c-text-muted);">We send invoices to this address.</span><br><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">helper-text · 12/16 · regular · 0.32px</span></div>
  <div><span class="type-overline">Recent projects</span><br><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">overline · 12/16 · semibold · 0.06em · uppercase</span></div>
</div>

`label-sm` and `label-md` are older names for `label` (12/16 regular). `label-lg` is 14/18 regular.

## Body

<div style="display: flex; flex-direction: column; gap: 24px; padding: 24px 0;">
  <div><p class="type-body-sm" style="margin: 0 0 4px;">Updated 3 minutes ago by the release bot.</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">body-sm · 12/16 · regular · support</span></div>
  <div><p class="type-body-compact" style="margin: 0 0 4px;">A row in a list, a cell, a menu item.</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">body-compact · 14/18 · regular</span></div>
  <div><p class="type-body-md" style="margin: 0 0 4px; max-width: var(--nb-measure);">The quick brown fox jumps over the lazy dog. Nubisco UI is a design system built for product interfaces at scale.</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">body-md · 14/20 · regular · paragraphs</span></div>
  <div><p class="type-body-lg" style="margin: 0 0 4px; max-width: var(--nb-measure);">The quick brown fox jumps over the lazy dog. Nubisco UI is a design system built for product interfaces at scale.</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">body-lg · 16/24 · regular</span></div>
</div>

## Code

<div style="display: flex; flex-direction: column; gap: 24px; padding: 24px 0;">
  <div><p class="type-code-sm" style="margin: 0 0 4px;">const answer = 42 // => true</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">code-sm · 12/16</span></div>
  <div><p class="type-code-md" style="margin: 0 0 4px;">const answer = 42 // => true</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">code-md · 14/20</span></div>
  <div><p class="type-code-lg" style="margin: 0 0 4px;">const answer = 42 // => true</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">code-lg · 16/24</span></div>
</div>

## Headings

<div style="display: flex; flex-direction: column; gap: 20px; padding: 24px 0;">
  <div><p class="type-heading-compact" style="margin: 0 0 4px;">Heading compact: a row title</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">heading-compact · 14/18 · semibold · h4, h5</span></div>
  <div><p class="type-heading-01" style="margin: 0 0 4px;">Heading 01: a panel title</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">heading-01 · 16/22 · semibold · h3</span></div>
  <div><p class="type-heading-02" style="margin: 0 0 4px;">Heading 02: a region title</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">heading-02 · 20/28 · regular · -0.01em · h2</span></div>
  <div><p class="type-heading-03" style="margin: 0 0 4px;">Heading 03: a page title</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">heading-03 · 24/32 · regular · -0.015em · h1</span></div>
  <div><p class="type-heading-04" style="margin: 0 0 4px;">Heading 04</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">heading-04 · 32/40 · regular · -0.02em</span></div>
  <div><p class="type-heading-05" style="margin: 0 0 4px;">Heading 05</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">heading-05 · 42/50 · light · -0.02em</span></div>
  <div><p class="type-heading-06" style="margin: 0 0 4px;">Heading 06</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">heading-06 · 54/64 · light · -0.025em</span></div>
</div>

## Display

For hero sections, onboarding and marketing surfaces. Both step down on a phone.

<div style="display: flex; flex-direction: column; gap: 20px; padding: 24px 0;">
  <div><p class="type-display-01" style="margin: 0 0 4px;">Display 01</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">display-01 · 60/68 · light · -0.03em · phone 42/50</span></div>
  <div><p class="type-display-02" style="margin: 0 0 4px;">Display 02</p><span style="font-family: var(--nb-font-family-mono); font-size: 12px; color: var(--nb-c-text-muted);">display-02 · 76/84 · light · -0.03em · phone 54/64</span></div>
</div>

</doc-tab>

<doc-tab name="Code">

## CSS custom properties

Every type set generates five CSS variables on `:root`, and `overline` a sixth:

```css
--nb-type-{name}-size
--nb-type-{name}-weight
--nb-type-{name}-line-height
--nb-type-{name}-letter-spacing
--nb-type-{name}-family
--nb-type-overline-text-transform
```

**Full reference:**

| Set               | Size | Weight   | Line height | Letter spacing | Family |
| ----------------- | ---- | -------- | ----------- | -------------- | ------ |
| `label`           | 12   | regular  | `16px`      | `0.32px`       | sans   |
| `label-sm`        | 12   | regular  | `16px`      | `0.32px`       | sans   |
| `label-md`        | 12   | regular  | `16px`      | `0.32px`       | sans   |
| `label-lg`        | 14   | regular  | `18px`      | `0.16px`       | sans   |
| `helper-text`     | 12   | regular  | `16px`      | `0.32px`       | sans   |
| `overline`        | 12   | semibold | `16px`      | `0.06em`       | sans   |
| `body-sm`         | 12   | regular  | `16px`      | `0.32px`       | sans   |
| `body-compact`    | 14   | regular  | `18px`      | `0.16px`       | sans   |
| `body-md`         | 14   | regular  | `20px`      | `0.16px`       | sans   |
| `body-lg`         | 16   | regular  | `24px`      | `0`            | sans   |
| `code-sm`         | 12   | regular  | `16px`      | `0.32px`       | mono   |
| `code-md`         | 14   | regular  | `20px`      | `0.16px`       | mono   |
| `code-lg`         | 16   | regular  | `24px`      | `0`            | mono   |
| `heading-compact` | 14   | semibold | `18px`      | `0.16px`       | sans   |
| `heading-01`      | 16   | semibold | `22px`      | `0`            | sans   |
| `heading-02`      | 20   | regular  | `28px`      | `-0.01em`      | sans   |
| `heading-03`      | 24   | regular  | `32px`      | `-0.015em`     | sans   |
| `heading-04`      | 32   | regular  | `40px`      | `-0.02em`      | sans   |
| `heading-05`      | 42   | light    | `50px`      | `-0.02em`      | sans   |
| `heading-06`      | 54   | light    | `64px`      | `-0.025em`     | sans   |
| `display-01`      | 60   | light    | `68px`      | `-0.03em`      | sans   |
| `display-02`      | 76   | light    | `84px`      | `-0.03em`      | sans   |

## Utility classes

Apply a complete type set in one class:

```html
<p class="type-body-md">Readable paragraph text</p>
<span class="type-label">Form label</span>
<span class="type-overline">Recent projects</span>
<h2 class="type-heading-03">A heading styled as a page title</h2>
<code class="type-code-sm">const x = 1</code>
<span class="tabular">1,204.50</span>
```

`h1` to `h6` are wired to the ladder by default: `heading-03`, `heading-02`, `heading-01`, `heading-compact`, `heading-compact` and `label`. You only need a `.type-*` class to give an element a role other than its default.

## SCSS usage in components

Inside a component's `<style>` block, read the set's variables. A literal `font-size`, or a raw `--nb-font-size-N`, in `src/components` fails the test suite (`tests/type-guard.test.ts`).

```scss
.my-component__title {
  font-size: var(--nb-type-heading-01-size);
  font-weight: var(--nb-type-heading-01-weight);
  line-height: var(--nb-type-heading-01-line-height);
  letter-spacing: var(--nb-type-heading-01-letter-spacing);
}

.my-component__description {
  font-size: var(--nb-type-body-compact-size);
  line-height: var(--nb-type-body-compact-line-height);
  letter-spacing: var(--nb-type-body-compact-letter-spacing);
  max-width: var(--nb-measure);
}
```

## Line height and letter spacing scale

Independent values exist for the rare case where you override a single property:

```css
--nb-line-height-none: 1;
--nb-line-height-tight: 1.1;
--nb-line-height-snug: 1.25;
--nb-line-height-normal: 1.5;
--nb-line-height-relaxed: 1.625;
--nb-line-height-loose: 1.75;

--nb-letter-spacing-tighter: -0.05em;
--nb-letter-spacing-tight: -0.02em;
--nb-letter-spacing-normal: 0em;
--nb-letter-spacing-wide: 0.02em;
--nb-letter-spacing-wider: 0.05em;
```

## Adding a new type set

Edit `$typeSets` in `src/styles/variables/_type.scss`. Keep it at 12px or above with an integer pixel line height (the test checks both):

```scss
$typeSets: (
  // ...existing sets...
  caption: (
      size: 12,
      weight: regular,
      line-height: 16px,
      letter-spacing: 0.32px,
    )
) !default;
```

This generates `--nb-type-caption-*` variables and a `.type-caption` utility class. Add `transform: uppercase` to a set to give it a `--nb-type-{name}-text-transform` and have the utility apply it.

</doc-tab>
