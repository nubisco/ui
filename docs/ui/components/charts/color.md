---
layout: nubisco
title: Chart Color
tabs: ['Usage', 'Accessibility', 'Api']
---

<doc-tab name="Usage">

Five of the six chart components paint through one colour contract: `NbBarChart`, `NbLineChart`, `NbPieChart`, `NbGanttChart` and `NbInterpolationChart` all resolve their marks through the same module. (`NbSparkline` is the exception and takes a single `color`, defaulting to `var(--nb-c-primary)`.) This page is that contract: which of the three scales a question needs, in what order colours are assigned, how many series colour can carry before it stops working, and what a white-label product overrides.

Charts never name a Nubisco ramp. They paint through eight **role** tokens, `--nb-c-chart-1` to `--nb-c-chart-8`, plus five ramp anchors. In the light theme the defaults resolve to exactly the ramps the charts painted before the roles existed, so nothing moves. **In the dark theme every chart repaints once**, see [Upgrading](#upgrading) below.

## Pick the scale first

| Your data                                                         | Scale       | What carries meaning        | In this library                                        |
| ----------------------------------------------------------------- | ----------- | --------------------------- | ------------------------------------------------------ |
| Unordered groups: regions, plans, tenants, error classes          | Categorical | Hue                         | `--nb-c-chart-1` … `-8`, `colorAt()`, `seriesColors()` |
| One-directional magnitude: volume, density, count, duration       | Sequential  | Lightness within one hue    | `sequentialAt(t)`                                      |
| Signed distance from a meaningful zero: variance to target, delta | Diverging   | Hue on each side, lightness | `divergingAt(t)`                                       |

Two failure modes are worth naming, because both have shipped:

- A **categorical** palette on ordered data invents groups. Months rendered in eight hues read as eight unrelated things.
- A **sequential** ramp on unordered data invents a ranking. Five tenants shaded light to dark say one tenant is more than another, and the reader will believe it.

Diverging has a third: an asymmetric domain. If the ramp runs from -5 to +40 without pinning the neutral band to zero, the colour that means "on target" lands at +17.5 and every chart on the page lies in the same direction.

## Categorical roles

<preview>
  <div style="display: flex; flex-wrap: wrap; gap: 8px; width: 100%;">
    <div v-for="n in 8" :key="n" style="flex: 1 1 88px; min-width: 88px;">
      <div :style="{ background: `var(--nb-c-chart-${n})`, height: '44px', borderRadius: 'var(--nb-radius-xs)' }"></div>
      <code style="font-size: 12px;">--nb-c-chart-{{ n }}</code>
    </div>
  </div>
</preview>

With no `colors` prop, roles are assigned in role order and wrap at eight. Two consequences follow, and both are load-bearing:

1. **Series index decides colour.** Reordering a `series` array recolours the chart. If a dashboard shows the same three tenants in four charts, pass them in the same order in all four, or pin the colour per series with the `color` field on `IChartSeries` / `ICategoricalDatum`.
2. **Role 9 is role 1 again.** `colorAt()` wraps, so a chart handed twelve series renders twelve marks in eight colours. Nothing warns you. That is a legibility failure, not a feature.

```vue
<template>
  <NbLineChart :series="series" />
</template>

<script setup lang="ts">
// Same tenant, same colour, in every chart on the page.
const series = [
  { name: 'Acme', color: 'var(--nb-c-chart-1)', data: acme },
  { name: 'Globex', color: 'var(--nb-c-chart-2)', data: globex },
]
</script>
```

Role order is frozen: role N is the colour charts already paint, and reordering the array would recolour every chart in every app that has one. It is not the order that reads best. It opens with three violet-blues (roles 1, 6 and 7), so a chart that uses roles 1 to 5 gets a worse worst-pair than the same palette can give.

## When you know the series count

`seriesColors(count)` picks the best-separated **subset** of the same eight roles for exactly that many series, instead of taking the first `count` in role order:

```vue
<template>
  <NbBarChart :series="regions" :colors="seriesColors(regions.length)" />
  <!-- Strokes and points need contrast against the surface too. -->
  <NbLineChart
    :series="regions"
    :colors="seriesColors(regions.length, { mark: 'line' })"
  />
</template>

<script setup lang="ts">
import { seriesColors } from '@nubisco/ui'
</script>
```

The sets are **nested**, so growing the chart appends a colour rather than reshuffling the ones already drawn: `seriesColors(4)` is `seriesColors(3)` plus one. Concretely the fill order is roles 2, 4, 5, 8, 3, 6, 1, 7 and the line order is 2, 5, 8, 6, 1, 7, 4, 3.

Minimum CIEDE2000 between any two colours in the returned set, light theme, measured off the compiled stylesheet:

| Series | `seriesColors(n)` normal / deuter. / protan. / tritan. | Role order (default)        |
| ------ | ------------------------------------------------------ | --------------------------- |
| 2      | 62.3 / 36.7 / 74.4 / 53.5                              | 16.0 / 5.2 / 9.5 / 13.2     |
| 3      | 36.2 / 17.1 / 27.2 / 24.7                              | 16.0 / 5.2 / 9.5 / 12.8     |
| 4      | 17.9 / 17.1 / 21.2 / 16.7                              | 16.0 / 5.2 / 9.5 / 12.8     |
| 5      | 17.9 / **9.4** / 14.1 / 12.8                           | 16.0 / **5.2** / 9.5 / 12.8 |
| 6      | 10.0 / 8.8 / 7.6 / 8.8                                 | 10.0 / 5.2 / 7.6 / 5.8      |
| 7      | 10.0 / 5.2 / 7.6 / 5.8                                 | 6.5 / 0.8 / 2.1 / 5.8       |
| 8      | 6.5 / 0.8 / 2.1 / 5.8                                  | 6.5 / 0.8 / 2.1 / 5.8       |

At eight the two agree, because there is only one set of eight. Everywhere below that the curated set is better or equal, and at seven it is the difference between a deuteranope seeing seven colours and seeing six (0.8 is the same colour twice).

`{ mark: 'line' }` is a second, tighter search. A 2px line stroke has to clear 3:1 against the surface as well as separate from its neighbours, and roles 3 and 4 do not manage that in the light theme (2.69 and 1.75, see the Accessibility tab), so the line order draws from the six roles that do and appends the other two only if you ask for seven or eight:

| Series | Line set (roles) | normal / deuter. / protan. / tritan. |
| ------ | ---------------- | ------------------------------------ |
| 2      | 2, 5             | 45.5 / 37.7 / 60.0 / 54.6            |
| 3      | 2, 5, 8          | 17.9 / 18.6 / 21.2 / 16.7            |
| 4      | 2, 5, 8, 6       | 10.0 / 8.8 / 7.6 / 8.8               |
| 5      | 2, 5, 8, 6, 1    | 10.0 / 5.2 / 7.6 / 5.8               |
| 6      | 2, 5, 8, 6, 1, 7 | 6.5 / 0.8 / 2.1 / 5.8                |

Two caveats. `seriesColors()` is opt-in and **is** a recolour: a chart that switches to it changes which series is which colour once, so switch a whole dashboard at a time, not one chart. And if you pin a series colour so it stays stable across pages, keep pinning it; a curated set is per chart, not per tenant.

## How many series before colour stops working

Colour is the weakest channel a chart has. Reading the tables above as a rule:

- **Up to 4 series**: comfortable in either ordering, and still needs the redundant cues on the Accessibility tab.
- **5 series**: fine with `seriesColors(5)` (worst pair 9.4 under deuteranopia). In role order the worst pair is 5.2, which is noticeable but tiring; add direct labels.
- **6 series**: acceptable with direct labels on the marks.
- **7 or more**: colour is no longer encoding anything. Facet into small multiples, aggregate the tail into an "Other" series, or switch to a chart type that separates by position (grouped bars, a sorted bar chart) rather than by hue.

Those caps are a property of the default ramps, which contain three violet-blues, not of the role indirection. A product that overrides the roles with eight well-separated hues gets a better palette and the caps go up with it, `seriesColors()` included, because the search is over whatever the tokens resolve to.

## Do not borrow the status colours

Role 3 resolves to the same green as `--nb-c-success` and role 5 to the same red as `--nb-c-danger`. In a chart of four regions that is coincidence, and readers mostly cope. In a chart where anything is passing or failing, it is a trap: the third region is not "good".

When a chart encodes status, name the status tokens and skip the roles entirely:

```vue
<template>
  <NbBarChart
    :series="series"
    :colors="['var(--nb-c-status-valid)', 'var(--nb-c-status-error)']"
  />
</template>
```

`--nb-c-status-valid`, `--nb-c-status-warning` and `--nb-c-status-error` are the foreground status tokens, held to 3:1 on every surface a card paints. The `--nb-c-success` / `-danger` family are button fills and are a step darker.

`NbGanttChart` is the one chart with a status vocabulary built in. Its five statuses default to roles (1, 3, 4, 5 and 2, in the order `default`, `on-track`, `at-risk`, `behind`, `complete`) and are replaced wholesale with `statusColors`, which is where the status inks belong if a product wants them:

```vue
<NbGanttChart
  :tasks="tasks"
  :status-colors="{
    'on-track': 'var(--nb-c-status-valid)',
    'at-risk': 'var(--nb-c-status-warning)',
    behind: 'var(--nb-c-status-error)',
  }"
/>
```

## Sequential

`sequentialAt(t)` returns a point on the single-hue ramp for `t` in 0 to 1, as a `color-mix()` in oklab between `--nb-c-chart-sequential-from` and `--nb-c-chart-sequential-to`. The mixing happens in CSS, at paint time, so the ramp follows the theme and any override without a re-render, and oklab keeps the steps perceptually even (an sRGB midpoint of a saturated pair reads as a dark band the data does not contain).

```vue
<template>
  <NbBarChart :series="[{ name: 'Requests', data }]" :colors="shades" />
</template>

<script setup lang="ts">
import { sequentialAt, rampSteps } from '@nubisco/ui'

const max = Math.max(...data.map((d) => d.y))
const shades = data.map((d) => sequentialAt(d.y / max))

// Or five bins for a legend the reader can match a swatch against:
const legend = rampSteps(5)
</script>
```

In the light theme the largest value is the darkest end; under `.dark` the ramp inverts and the largest value is the brightest. Both directions come from the tokens, so the same `t` is correct in both themes.

Bin before you shade. Five to seven steps is the most a reader can match back to a legend; a continuous ramp is for dense fields (thousands of heat cells) where individual lookup was never the point. And give the low end help: it sits deliberately close to the page ground, so a lone low-value cell has almost no contrast against the surface. Add `stroke: var(--nb-c-border)` and a value label, or a legend with numeric bounds.

## Diverging

`divergingAt(t)` runs `--nb-c-chart-diverging-low` at `t = 0` through `-mid` at `0.5` to `-high` at `1`. Map the domain symmetrically around the real midpoint, or the neutral band is meaningless:

```ts
import { divergingAt } from '@nubisco/ui'

// Variance to target, in percent, clamped to a symmetric domain.
const extent = Math.max(...values.map((v) => Math.abs(v)))
const shade = (v: number) => divergingAt(0.5 + v / (2 * extent))
```

The default poles are cool to warm, not green to red. Green versus red is the one axis a deuteranope cannot read at all, and a diverging scale has no legend row to fall back on: the reader has to tell the sign of a value from its hue alone.

## White-labelling

Override the roles once, on `:root`, in the product's own stylesheet. Every chart in the app follows, including ones the product has not written yet.

```scss
:root {
  --nb-c-chart-1: #0b6b3a;
  --nb-c-chart-2: #1f7ae0;
  --nb-c-chart-3: #b8860b;
  --nb-c-chart-4: #8a3ffc;
  --nb-c-chart-5: #d02670;
  --nb-c-chart-6: #007d79;
  --nb-c-chart-7: #6f6f6f;
  --nb-c-chart-8: #a2191f;

  --nb-c-chart-sequential-from: #e3f2ea;
  --nb-c-chart-sequential-to: #084023;
  --nb-c-chart-diverging-low: #1f7ae0;
  --nb-c-chart-diverging-mid: #d5d7da;
  --nb-c-chart-diverging-high: #a2191f;
}

// The dark theme is a separate ramp, not the same colours on a dark ground.
// The eight light values above are chosen against a white page and several of
// them will fall below 3:1 on a dark one.
.dark {
  --nb-c-chart-1: #42be65;
  // ...
  --nb-c-chart-sequential-from: #0d2a1c;
  --nb-c-chart-sequential-to: #a7f0ba;
}
```

Because `var()` resolves on the element that paints, the same override works scoped to one dashboard or one widget:

```scss
.tenant-branded-report {
  --nb-c-chart-1: var(--tenant-primary);
  --nb-c-chart-2: var(--tenant-secondary);
}
```

Two things to check after an override, both covered on the Accessibility tab: every role clears 3:1 against the surface the chart sits on, in both themes, and no two of the roles you actually use collapse under a colour-vision simulation. `seriesColors()` picks from whatever you set, so it stays useful, but its ordering was searched against the defaults; re-run the search if a rebrand changes which pairs are close.

Charts are not the only place the brand used to leak. The ghost button's hover border named the same violet ramp and now mixes `--nb-c-primary`, so setting the brand is enough there too. `--nb-c-primary` and these thirteen chart tokens are the whole colour surface a white-label product has to think about.

The per-chart `colors` prop still exists and still wins. It is the right tool for one chart that means something specific (a status chart, a ramp, a curated set). It is the wrong tool for branding, which is what the tokens are for: thirteen declarations in one file instead of a `colors` array at every call site.

## Upgrading

Two visible changes land with the roles, and one non-change worth knowing about.

- **Light theme: nothing moves.** Each role resolves to exactly the ramp its chart painted before, asserted per role in `tests/chartRoles.test.ts`. `NbGanttChart`'s five status defaults are included in that: they are roles now, and the roles resolve to the ramps they replaced.
- **Dark theme: every chart repaints, once.** The old palette had no theme branch, so a dark chart painted the light colours on a dark ground. Six of those eight miss WCAG 1.4.11 somewhere on layer-0 to layer-2 there, roles 1 and 7 worst at 1.79 and 1.85; only roles 3 and 4 survive the move. All eight dark roles are now a lighter step of the same hue and all eight clear 3:1 on those surfaces. Screenshot tests over dark charts will need new baselines. Nothing about the API changes, so no code has to move.
- **`NbInterpolationChart` gains a working `colors` prop.** It declared one and never read it, painting a hardcoded violet. It now takes the first entry of `colors`, or role 1. Light theme unchanged; dark theme repaints with the rest.

</doc-tab>

<doc-tab name="Accessibility">

## Contrast

A chart mark is a non-text graphical object, so WCAG 1.4.11 asks for 3:1 against what it sits on. Measured against each layer surface, worst case in bold:

| Role | Light: L0 / L1 / L2 / L3          | Dark: L0 / L1 / L2 / L3       |
| ---- | --------------------------------- | ----------------------------- |
| 1    | 6.55 / 7.28 / 6.20 / 6.91         | 6.32 / 5.48 / 4.51 / 3.56     |
| 2    | 4.72 / 5.25 / 4.47 / 4.98         | 5.10 / 4.42 / 3.64 / **2.87** |
| 3    | **2.85** / 3.16 / **2.69** / 3.00 | 8.87 / 7.69 / 6.33 / 4.99     |
| 4    | **1.85 / 2.06 / 1.75 / 1.95**     | 10.26 / 8.89 / 7.33 / 5.77    |
| 5    | 4.16 / 4.62 / 3.94 / 4.39         | 4.99 / 4.32 / 3.56 / **2.81** |
| 6    | 5.11 / 5.68 / 4.84 / 5.39         | 4.97 / 4.30 / 3.55 / **2.79** |
| 7    | 6.33 / 7.04 / 5.99 / 6.68         | 5.18 / 4.49 / 3.70 / **2.92** |
| 8    | 4.16 / 4.63 / 3.94 / 4.39         | 6.41 / 5.56 / 4.58 / 3.61     |

Three things to take from that table, all deliberate:

- **Role 4 fails everywhere in the light theme, and role 3 fails on layer-0 and layer-2.** The amber tops out at 2.06 and the green only clears on layer-1. Both stay as they are, because raising either repaints every chart already in production. Treat both as **fill-only**: a large filled bar or slice, never a 2px line, never a sparkline stroke, never the 10px legend swatch standing on its own. `seriesColors(n, { mark: 'line' })` does this for you by drawing only from the six roles that clear the bar in both themes. To keep a specific role as a line, override that one token locally: role 4 to `var(--nb-c-phoenix-flames-600)` (3.17 on layer-1), role 3 to `var(--nb-c-emerald-reflection-700)` (5.19).
- **The dark roles are a different set of tints, not the same colours on a dark ground.** Painted on a dark surface, six of the eight light values miss 3:1 somewhere on layer-0 to layer-2 (role 1 bottoms out at 1.79, role 7 at 1.85; only the green and the amber, roles 3 and 4, clear it). So `.dark` steps the same eight hues up their ramps, exactly as `--nb-c-primary` and the status colours are stepped, and all eight then clear the bar. This is the repaint described under Upgrading.
- **Nothing clears 3:1 on layer-3 in the dark theme.** Roles 2, 5, 6 and 7 land between 2.79 and 2.92 on the lightest dark surface. Charts belong on layer-0 to layer-2; if a product needs one on layer-3 in dark, override those four roles one tint lighter in that scope.

Axis labels, tick labels and the legend are text and are held to 4.5:1. They render in `--nb-c-text-muted`, which the layer contrast guard already measures on every surface. Gridlines use `--nb-c-component-plain-border` and are intentionally below 3:1: a gridline is decoration, and the reader must never need one to answer the question.

## Colour vision

Roughly one man in twelve has a colour vision deficiency, and the common ones are red-green. Simulating the roles (Viénot 1999) and measuring the closest pair by CIEDE2000, light theme, in role order:

| Roles in use | Deuteranopia | Protanopia | Tritanopia |
| ------------ | ------------ | ---------- | ---------- |
| first 5      | 5.2          | 9.5        | 12.8       |
| first 6      | 5.2          | 7.6        | 5.8        |
| all 8        | 0.8          | 2.1        | 5.8        |

The 0.8 is roles 1 and 7 (`--nb-c-grape-hyacinth-500` and `--nb-c-powder-blue-500`) rendering as one colour. The 5.2 that runs through the whole deuteranopia column is roles 1 and 2, violet against blue, which is a noticeable but not comfortable separation. `seriesColors()` avoids both pairs until it is forced into them, which is why the Usage tab recommends it whenever the series count is known.

The conclusion is not "avoid these colours", it is **never let colour be the only channel**:

- Charts render a legend by default (`showLegend`), and the legend lists series in the same order they are assigned colours. Keep that order.
- Label lines directly at their right end when there are three or fewer, so the reader never travels to a legend.
- Keep `showTooltip` on. A tooltip names the series, which turns a colour lookup into a hover.
- Vary a second channel for the series that matter most: `NbLineChart` takes per-series `color`, so pair a colour change with a shape change (a dashed line, points on) rather than relying on hue alone.
- In a pie or a stacked bar, the slice order plus a value label does more work than any palette.

Check an override with a simulator before shipping. The pair to watch is always the one your data uses most, not the worst pair in the palette.

## Structure and assistive technology

Every chart renders its `svg` with `role="img"` and an `aria-label` taken from `title`, falling back to the chart type ("Bar chart", "Pie chart"), so give charts a `title`: the fallback names the drawing, not the data. `NbSparkline` is the exception, its label is the fixed string "Sparkline", so put the meaning in the surrounding text or in the cell that owns it.

Colour tokens carry no semantics for a screen reader, which is the point of the tooltip and the legend. Where a chart is the primary content, pair it with a table of the same data. `NbDataTable` is the right partner and needs no special configuration.

## Motion

Nothing animates on load, nothing loops, and no chart moves under a reader who did not point at it. What does transition, all of it on hover or on a click the reader made:

| Where                            | Property     | Duration |
| -------------------------------- | ------------ | -------- |
| Bar and pie marks, chart tooltip | `opacity`    | 120ms    |
| Line and interpolation points    | `r`          | 120ms    |
| Gantt task list rows             | `background` | 80ms     |
| Gantt group collapse caret       | `transform`  | 120ms    |

Only the last of those is motion in the sense `prefers-reduced-motion` is about, and it is not gated on the media query today (see Known gaps). If you add an enter animation, a value tween or an auto-scrolling axis in product code, gate it.

</doc-tab>

<doc-tab name="Api">

## Tokens

All defined in `src/styles/_theme.scss`, overridable on `:root` or any ancestor of the chart.

| Token                          | Default (light)                 | Default (dark)                  |
| ------------------------------ | ------------------------------- | ------------------------------- |
| `--nb-c-chart-1`               | `--nb-c-grape-hyacinth-500`     | `--nb-c-grape-hyacinth-300`     |
| `--nb-c-chart-2`               | `--nb-c-the-blues-brothers-500` | `--nb-c-the-blues-brothers-400` |
| `--nb-c-chart-3`               | `--nb-c-emerald-reflection-600` | `--nb-c-emerald-reflection-500` |
| `--nb-c-chart-4`               | `--nb-c-phoenix-flames-500`     | `--nb-c-phoenix-flames-400`     |
| `--nb-c-chart-5`               | `--nb-c-chicken-comb-500`       | `--nb-c-chicken-comb-400`       |
| `--nb-c-chart-6`               | `--nb-c-liberty-blue-500`       | `--nb-c-liberty-blue-400`       |
| `--nb-c-chart-7`               | `--nb-c-powder-blue-500`        | `--nb-c-powder-blue-350`        |
| `--nb-c-chart-8`               | `--nb-c-nouveau-gray-500`       | `--nb-c-nouveau-gray-400`       |
| `--nb-c-chart-sequential-from` | `--nb-c-grape-hyacinth-100`     | `--nb-c-grape-hyacinth-800`     |
| `--nb-c-chart-sequential-to`   | `--nb-c-grape-hyacinth-700`     | `--nb-c-grape-hyacinth-200`     |
| `--nb-c-chart-diverging-low`   | `--nb-c-the-blues-brothers-500` | `--nb-c-the-blues-brothers-400` |
| `--nb-c-chart-diverging-mid`   | `--nb-c-nouveau-gray-150`       | `--nb-c-nouveau-gray-800`       |
| `--nb-c-chart-diverging-high`  | `--nb-c-chicken-comb-500`       | `--nb-c-chicken-comb-400`       |

## Functions

Named exports of `@nubisco/ui`, alongside the components.

```ts
import { seriesColors, sequentialAt, divergingAt } from '@nubisco/ui'
```

| Export             | Signature                                                      | Returns                                                                                                                     |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `DEFAULT_PALETTE`  | `string[]`                                                     | The eight role references, in role order                                                                                    |
| `CHART_ROLE_COUNT` | `number`                                                       | `8`, the point at which `colorAt` wraps                                                                                     |
| `colorAt`          | `(index: number, palette?: string[]) => string`                | The colour for a 0-based series index, wrapping. An empty `palette` falls back to the roles                                 |
| `chartRole`        | `(role: number) => string`                                     | `var(--nb-c-chart-N)` for a 1-based role, wrapping                                                                          |
| `seriesColors`     | `(count: number, options?: { mark?: TChartMark }) => string[]` | The best-separated `count` roles, nested across counts. `mark` is `'fill'` (default) or `'line'`; `count <= 0` returns `[]` |
| `sequentialAt`     | `(t: number) => string`                                        | A `color-mix()` on the sequential ramp, `t` clamped to 0 to 1                                                               |
| `divergingAt`      | `(t: number) => string`                                        | A `color-mix()` on the diverging ramp, neutral at `t = 0.5`                                                                 |
| `rampSteps`        | `(steps: number, at?: (t: number) => string) => string[]`      | Evenly spaced stops, for legends and binned scales                                                                          |

`TChartMark` is exported as a type. Every returned value is a CSS colour string valid in SVG `fill` and `stroke` and in the `colors` prop of any chart.

## Related props

| Prop                           | Component                            | Note                                                  |
| ------------------------------ | ------------------------------------ | ----------------------------------------------------- |
| `colors: string[]`             | Bar, Line, Pie, Gantt                | Replaces the role sequence for that chart             |
| `colors: string[]`             | Interpolation                        | One curve, so only `colors[0]` is used                |
| `color: string`                | Sparkline                            | A sparkline draws one series, so it takes one colour  |
| `color` on `IChartSeries`      | Bar, Line                            | Pins one series, overrides both of the above          |
| `color` on `ICategoricalDatum` | Pie                                  | Pins one datum                                        |
| `statusColors`                 | Gantt                                | Per-status map, replaces the role defaults            |
| `showLegend`, `showTooltip`    | Bar, Line, Pie, Gantt, Interpolation | The non-colour channels, on by default. Leave them on |

`colors` and `showLegend` / `showTooltip` come from `IChartCommonProps` in `Charts/shared/types.d.ts`, which is why they are spelled the same on every chart.

## Known gaps

- **`NbSparkline` does not go through the roles.** It defaults to `var(--nb-c-primary)`, which is semantic and follows a rebrand, but it is the brand accent rather than a chart role, so a sparkline in a row of charts is the one mark an override of `--nb-c-chart-1` does not reach. Pass `color="var(--nb-c-chart-1)"` if that matters.
- **Wrapping past eight series is silent.** No runtime warning, no dev-mode log.
- **Roles 3 and 4 miss 3:1 in the light theme.** Fixing either is a visual change and is queued for the next major. `seriesColors(n, { mark: 'line' })` routes around them meanwhile.
- **`seriesColors()` is opt-in.** The default assignment is still role order, because making it the default would recolour every existing chart. The better palette is one prop away, not free.
- **The Gantt collapse caret is not gated on `prefers-reduced-motion`.** It is the only transform any chart animates (120ms), and the media query should suppress it.
- **The dark-theme roles do not clear 3:1 on layer-3.** Four of the eight sit between 2.79 and 2.92, see the Accessibility tab.

</doc-tab>
