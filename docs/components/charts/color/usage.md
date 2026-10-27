---
layout: nubisco
title: Chart Color
intro: 'Five of the six chart components paint through one colour contract: `NbBarChart`, `NbLineChart`, `NbPieChart`, `NbGanttChart` and `NbInterpolationChart` all resolve their marks through the same module. (`NbSparkline` is the exception and takes a single `color`, defaulting to `var(--nb-c-primary)`.) This page is that contract: which of the three scales a question needs, in what order colours are assigned, how many series colour can carry before it stops working, and what a white-label product overrides.'
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

Charts never name a Nubisco ramp. They paint through eight **role** tokens, `--nb-c-chart-1` to `--nb-c-chart-8`, plus five ramp anchors. In the light theme the defaults resolve to exactly the ramps the charts painted before the roles existed, so nothing moves. **In the dark theme every chart repaints once**, see [Upgrading](#upgrading) below.

## Live demo

<preview>
  <div style="display: flex; flex-wrap: wrap; gap: 8px; width: 100%;">
    <div v-for="n in 8" :key="n" style="flex: 1 1 88px; min-width: 88px;">
      <div :style="{ background: `var(--nb-c-chart-${n})`, height: '44px', borderRadius: 'var(--nb-radius-xs)' }"></div>
      <code style="font-size: 12px;">--nb-c-chart-{{ n }}</code>
    </div>
  </div>
</preview>

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

## How many series before colour stops working

Colour is the weakest channel a chart has. Reading the tables above as a rule:

- **Up to 4 series**: comfortable in either ordering, and still needs the redundant cues on the Accessibility tab.
- **5 series**: fine with `seriesColors(5)` (worst pair 9.4 under deuteranopia). In role order the worst pair is 5.2, which is noticeable but tiring; add direct labels.
- **6 series**: acceptable with direct labels on the marks.
- **7 or more**: colour is no longer encoding anything. Facet into small multiples, aggregate the tail into an "Other" series, or switch to a chart type that separates by position (grouped bars, a sorted bar chart) rather than by hue.

Those caps are a property of the default ramps, which contain three violet-blues, not of the role indirection. A product that overrides the roles with eight well-separated hues gets a better palette and the caps go up with it, `seriesColors()` included, because the search is over whatever the tokens resolve to.

## Upgrading

Two visible changes land with the roles, and one non-change worth knowing about.

- **Light theme: nothing moves.** Each role resolves to exactly the ramp its chart painted before, asserted per role in `tests/chartRoles.test.ts`. `NbGanttChart`'s five status defaults are included in that: they are roles now, and the roles resolve to the ramps they replaced.
- **Dark theme: every chart repaints, once.** The old palette had no theme branch, so a dark chart painted the light colours on a dark ground. Six of those eight miss WCAG 1.4.11 somewhere on layer-0 to layer-2 there, roles 1 and 7 worst at 1.79 and 1.85; only roles 3 and 4 survive the move. All eight dark roles are now a lighter step of the same hue and all eight clear 3:1 on those surfaces. Screenshot tests over dark charts will need new baselines. Nothing about the API changes, so no code has to move.
- **`NbInterpolationChart` gains a working `colors` prop.** It declared one and never read it, painting a hardcoded violet. It now takes the first entry of `colors`, or role 1. Light theme unchanged; dark theme repaints with the rest.
