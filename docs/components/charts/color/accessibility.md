---
layout: nubisco
title: Chart Color
intro: 'Five of the six chart components paint through one colour contract: `NbBarChart`, `NbLineChart`, `NbPieChart`, `NbGanttChart` and `NbInterpolationChart` all resolve their marks through the same module. (`NbSparkline` is the exception and takes a single `color`, defaulting to `var(--nb-c-primary)`.) This page is that contract: which of the three scales a question needs, in what order colours are assigned, how many series colour can carry before it stops working, and what a white-label product overrides.'
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

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
