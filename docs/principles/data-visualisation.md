---
layout: nubisco
title: Data visualisation
description: Choosing a chart, or choosing not to draw one. Axis rules, legends, empty and loading states, density, and what a chart owes a reader who cannot see colour.
---

`src/components/Charts/` holds six chart components (`NbBarChart`, `NbLineChart`, `NbPieChart`, `NbSparkline`, `NbGanttChart`, `NbInterpolationChart`) and three shared parts they all render through (`ChartFrame`, `ChartLegend`, `ChartTooltip`). Until now the documentation told you what each one accepts and nothing at all about when to reach for it, what its axis is allowed to do, or what it shows a user while the fetch is still in flight.

The result is visible in the fleet. A white-label white-label product passes six hardcoded hex values into every chart because it could not see how else to escape a violet first series. Another product asks `NbBarChart` for `orientation="horizontal"`, does not get it, and works around the collided axis labels by shipping a second set of abbreviated category names in its translation files. A device dashboard draws four sparklines from arrays that start empty, so every metric card shows a blank box until the second poll lands, while a desktop app avoids the same blank box only because someone happened to pre-fill its history array with zeros. None of those are careless. All of them are decisions this page should have made for them.

::: tip Colour has its own page
Which of the three scales your data needs, in what order the eight roles are assigned, the measured separations under colour-vision deficiency, and the full white-label override recipe are on [Charts, Colour](/ui/components/charts/color). This page decides everything except which colours; where the two touch, this page states the rule and links.
:::

## Before the chart: is a chart the answer

A chart is a claim that the **shape** of the data carries the meaning. If the meaning is a value, a chart is a slower way to read a number.

| You have                                                       | Draw                                                              | Because                                                                                               |
| -------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| One number, with no comparison                                 | Text, in a type set                                               | An axis around a single figure adds a scale the reader must decode to recover the figure              |
| One number plus its direction of travel                        | Text, plus `NbSparkline`                                          | The number answers "how much", the sparkline answers "which way", and neither needs the other's space |
| Values people will read off precisely, copy, or sort           | `NbDataTable`                                                     | Position is a poor encoding for exact values, and a table sorts. A chart does not                     |
| Two to eight quantities whose relative sizes are the point     | `NbBarChart`                                                      | Length against a common baseline is the most accurately read encoding we ship                         |
| An ordered sequence where the direction of change is the point | `NbLineChart`                                                     | A connecting line is a claim about continuity between neighbours, which is exactly the question       |
| Parts of one meaningful whole, at most five parts              | `NbPieChart`                                                      | Angle reads poorly, but "these sum to everything" reads instantly                                     |
| Scheduled work with duration and dependency                    | `NbGanttChart`                                                    | Two encodings at once, position for when and length for how long                                      |
| A state: healthy, expiring, blocked                            | Not a chart. See [Status indicators](/patterns/status-indicators) | A one-value chart of a categorical state is a badge with extra pixels                                 |

Three cases where a chart is actively worse than the thing it replaced, all of them in the fleet:

**A ranked list of more than about ten things.** A bar chart of twenty categories is a table that cannot be sorted, cannot be searched, and truncates its own labels. `NbDataTable` with a `sortable` column does the job, and it already has `loading`, `error` and `emptyMessage` props that no chart in this library has.

**A number the user is going to act on.** Invoice totals, quota remaining, seats used. Put the number in text at `.type-heading-04` or larger with a `.type-label-sm` caption, and if trend matters put a sparkline beside it.

**A comparison the reader is not being asked to make.** Four panels each showing one metric over time, side by side, is four charts. If nobody compares panel two to panel three, they are four numbers and a lot of chrome.

## Choosing between the chart types

Each of these is a decision with a reason attached, and each carries a constraint that comes from our implementation rather than from theory. The constraints are real, verified in the source, and several of them will change what you pass.

### `NbBarChart`

Comparing one measure across named, unordered categories. Reach for it whenever the reader's question is "which is biggest" or "how much bigger".

```vue
<template>
  <NbBarChart
    title="Policies by branch"
    subtitle="Count, current quarter"
    :series="[{ name: 'Policies', data: byBranch }]"
    :show-legend="false"
    :height="220"
  />
</template>
```

- **Categories come from the first series only.** `categories` is `props.series[0].data.map(d => d.x)`. Every series after the first is read positionally, by index. A second series with different `x` values is plotted under the first series' labels with no warning.
- **A missing point is drawn as zero.** Bars read `s.data[ci]?.y ?? 0`, so a series that is short by one category renders a zero-height bar there and a `0` in the tooltip. "No data for March" and "zero in March" become the same picture. Fill your gaps explicitly before you pass them, or split the chart.
- **`orientation` and `stacked` do nothing.** Both props are declared on `IBarChartProps` and defaulted in `withDefaults`, and neither is referenced by the render. `orientation="horizontal"` gets you a vertical chart. This is why the white-label dashboard ships shortened branch names: it asked for a horizontal chart, got vertical ticks that collided, and fixed the collision in its translation files.

### `NbLineChart`

An ordered dimension, usually time, where the direction and shape of change is the question. The line between two points is a claim that the values in between behaved smoothly, so do not draw one across a gap you did not measure.

- **Points are evenly spaced by index, not by value.** `xPositionFor(i)` is `margin.left + (i / (n - 1)) * innerWidth`. The `x` values are used as tick labels and nothing else. Ten daily readings and then one from six months later are drawn as eleven equal steps. If your samples are irregular, bucket them into regular periods first and pass a point per period, including the empty ones.
- **`curve="smooth"` is the default and it invents values.** The cubic through your points overshoots between them. For anything a reader might measure off the chart, and for step-like data such as a plan tier or a device state, pass `curve="linear"` or `curve="step"`.
- **`area` fills to the bottom of the plot, not to zero.** The area path closes on `size.height - margin.bottom`. It reads as magnitude, so use it only for a single series and only where the quantity is genuinely cumulative or additive. Two overlapping translucent areas at `0.18` opacity are unreadable.

### `NbPieChart`

Parts of one whole, where the whole is a real thing and the parts sum to it. Under five slices. If the categories do not sum to something meaningful, or if you would need to say "the rest", use bars.

- Never for change over time, and never for two pies side by side. Comparing angles across two circles is the least accurate reading task on this page.
- `innerRadius` above zero gives a donut. There is **no slot for the middle**, so the hole is empty space, not a total. If you want the total in the centre, the frame's `title` and `subtitle` are where it goes.
- **Slice labels are always painted white.** `labelColor` is the literal `'var(--nb-c-white)'` for every slice. Against `--nb-c-chart-7` (a pale blue) or any light colour you pass through `colors`, the percentage disappears. With light slices use `labels="none"` and let the legend and tooltip carry the values.

### `NbSparkline`

Shape without values, at text size, inside something else: a status bar cell, a table row, a metric card next to the number it belongs to. It has no axes, no legend, no tooltip and no title, which is the point. If a reader needs to know _what_ the values are, this is the wrong component.

- **It needs at least two points.** `paths` returns empty strings when `data.length < 2`, so a one-sample sparkline is a blank box of the right size. This is the state a metrics dashboard is in for its first poll after mount.
- It scales to its own min and max, always, with no zero baseline. Two sparklines side by side are not comparable, and that is fine: each one answers "which way is this going", not "which is bigger".
- It is the one chart outside the colour roles. Its `color` defaults to `var(--nb-c-primary)`. Pass `color="var(--nb-c-chart-1)"` when it sits in a row with other charts.

### `NbGanttChart`

Work that has a start, a duration and a relationship to other work. Not a timeline of instants (those are points, and a Gantt bar of zero length is a milestone, which is what `milestone: true` is for). Not a progress meter for one thing: that is `NbProgressBar`.

Use `groups` as soon as you pass more than about a dozen tasks, and `time-scale` to match the span, not the data: `day` over a fortnight, `quarter` over two years. `status` is preferred over `color`, because the five statuses are semantic and a raw colour is not.

### `NbInterpolationChart`

Not a chart. It is a form control that happens to look like one: `v-model` over an array of `{ input, output }` points, with `editable`, `inputStep`, `outputStep` and `minPoints`. Treat it as a field, label it like a field, and read [Forms](/patterns/forms) rather than this page. It is listed here only so nobody puts a read-only mapping in it because it was in the charts folder.

## How many series before colour stops working

**Five.** Above five simultaneous categorical colours, telling any two apart becomes a lookup task rather than a perception task, and under the common colour-vision deficiencies some pairs stop being distinguishable at all. The measured numbers behind that limit are on [Charts, Colour](/ui/components/charts/color).

Two facts about our implementation make the limit sharper than it looks:

1. **Nothing warns you.** `colorAt()` wraps at eight, so the ninth series is drawn in role 1 again, identical to the first. A chart handed twelve series draws twelve marks in eight colours and reports no error.
2. **Our legend is inert.** `ChartLegend` is a plain `<ul>` of swatches. There is no hover-to-highlight and no click-to-toggle. Every extra series is one more entry the reader must hold in memory while scanning back to the marks.

When you are over the limit, the answer is never a bigger palette. In rough order of preference:

- **Aggregate.** Top four plus "Other" answers most questions that eight series were asked to answer, and it is honest as long as "Other" is labelled.
- **Filter.** Let the reader choose which series are drawn, and default to a sensible few.
- **Small multiples.** One metric per panel, one series per panel. See [Density and small multiples](#density-and-small-multiples).
- **Emphasise one, mute the rest.** Pin the series in focus to a chart role and pass a muted colour for the others through the `color` field on `IChartSeries`. This works well for "your tenant against the field".

## Axes

### A bar chart's axis starts at zero. Always.

A bar encodes its value as **area from a baseline**. Move the baseline and you have not adjusted a view, you have multiplied every value by a different factor. Bars of 98 and 100 drawn from a baseline of 95 look like a doubling.

This is not left to discipline. `NbBarChart` computes its domain as `Math.min(0, ...values)` to `Math.max(0, ...values)`, so zero is inside the domain whatever you pass, and the axis line is drawn at `yScale(0)` rather than at the bottom of the plot. Negative values push the baseline up and draw downwards from it, correctly. There is no prop that truncates this axis, and there should not be one. If the differences you care about are invisible at full scale, the value is not what you want to plot: plot the difference from a reference and let zero mean "on reference".

### A line chart's axis may crop, when the question is direction

A line encodes change as **slope**, not area, so cropping the value axis exaggerates nothing that the reader is being asked to read. A latency chart between 210ms and 240ms is a flat line at full scale and a useful chart when cropped. The conditions are all three of: a single measure, no `area`, and a reader who wants trend rather than magnitude.

::: warning Ours cannot crop yet
`NbLineChart` computes `min` as `Math.min(0, ...values)`, exactly like the bar chart. A series of values between 210 and 240 is drawn in the top eighth of the plot with 210 units of empty space underneath. Until that changes, the workaround is the same one that makes cropping honest in the first place: plot the delta against a baseline, or an index where 100 is the reference, so that the zero the axis insists on is a number that means something. Filed under [Known gaps](#known-gaps).
:::

### Ticks, units and formatting

- Value ticks come from `niceTicks`, five by default, snapped to 1, 2 or 5 times a power of ten. You do not choose them and you should not need to.
- `formatValue` divides by 1000 and appends `k` above 999. `NbBarChart` prints everything else as an integer; `NbLineChart` prints one decimal for non-integers. Neither knows your unit.
- **There is no axis-label prop on the cartesian charts.** `IChartCommonProps` has `title` and `subtitle` and nothing else. The unit therefore goes in `subtitle`, always, and in words: `subtitle="Requests per minute"`, not `subtitle="rpm"`. `NbInterpolationChart` is the exception and takes `inputLabel` and `outputLabel`, because it is a control.

### Category labels

`NbLineChart` thins its x labels to roughly six evenly spaced values and always keeps the last one. `NbBarChart` prints **every** category, centred under its band, with no rotation, no truncation and no collision detection. Long category names overlap at narrow widths. The fixes, in order: shorten the labels, reduce the categories, or give the chart more width by moving it out of a two-column row at your `md` breakpoint. Do not solve it by removing `title`.

## Labels, legends, and when a legend is noise

Always pass `title`. It is doing three jobs at once: `ChartFrame` renders a real `<figure>` with a `<figcaption>`, and both `NbBarChart` and `NbLineChart` set `aria-label="{{ title }}"` on the SVG. With no title, a screen reader is told the chart is called "Bar chart".

`subtitle` carries the unit and the qualifier: what is counted, over what period, filtered how.

A legend maps colour back to name. It is **only** worth its space when colour is carrying a name the reader cannot get any other way. Turn it off with `:show-legend="false"` when:

- **There is one series.** The title already names it. `ChartFrame` only hides the legend automatically when there are zero series, so a single-series bar chart shows a one-item legend unless you say otherwise.
- **The names are already on the x axis.** A single-series bar chart labels every category under its bar. The legend repeats the series name, which is the one thing that was never ambiguous.
- **The values are on the marks.** A pie with `labels="value"` and five well-known slices may still want the legend for the names; a pie with `labels="percent"` and slices named in the surrounding copy does not.
- **It is a sparkline.** There is no legend to turn off, which is a feature.

Keep it on for every multi-series chart, and keep the series order stable across every chart on the page. Series index decides colour, so reordering the array recolours the chart and breaks the reader's mapping between panels.

## Empty, loading and single-point

This is the section the fleet fails. `NbDataTable` has `loading`, `skeletonRows`, `error` and `emptyMessage`. **No chart in this library has any of them.** What a chart does when it has nothing is therefore entirely your responsibility, and the defaults are actively misleading:

| State                         | What the chart renders today                                                                                  | Why that is wrong                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `series: []`                  | Full gridlines and a 0 to 1 value axis, no bars, no message. The legend collapses                             | Reads as "every value is zero", not "nothing here"     |
| Fetch failed                  | Identical to the above                                                                                        | A failure is reported as a fact about the data         |
| Still loading                 | Identical to the above, then a jump when data lands                                                           | No indication anything is coming, plus a layout jolt   |
| One point, `NbLineChart`      | Nothing. `buildPath` returns `M x,y` with no line commands, and an SVG path with only a moveto paints nothing | An empty plot for a chart that does have data          |
| One point, `NbSparkline`      | An empty box of the right height                                                                              | The first poll of every metrics dashboard looks broken |
| All values zero, `NbPieChart` | No slices. `slices` returns `[]` when the total is zero                                                       | A legend with no circle above it                       |

Handle the states outside the chart, and **name the case**. [`NbEmptyState`](/ui/components/empty-state) takes a `kind` of `empty`, `no-results`, `error` or `forbidden` precisely so that a failed request never renders as "no data yet":

```vue
<template>
  <NbPanel>
    <NbSkeleton
      v-if="loading"
      variant="block"
      :height="260"
      label="Loading request volume"
      complete-label="Request volume loaded"
    />
    <NbEmptyState
      v-else-if="error"
      kind="error"
      size="sm"
      title="Request volume could not load"
      description="The metrics service did not respond. Try again."
    />
    <NbEmptyState
      v-else-if="!series.length"
      kind="empty"
      size="sm"
      title="No requests yet"
      description="Volume appears here once this environment serves its first request."
    />
    <NbLineChart
      v-else
      title="Request volume"
      subtitle="Requests per minute, last 24 hours"
      :series="series"
      :points="hasSinglePoint"
      curve="linear"
      :height="260"
    />
  </NbPanel>
</template>
```

Four rules that fall out of that:

1. **The skeleton must be the height the chart will be.** `variant="block"` with the same `height` you pass the chart. A shorter placeholder buys a layout shift at exactly the moment the reader starts looking.
2. **One `label` per loading region, not per skeleton.** A dashboard of six charts that each announce themselves is six announcements. See [Skeleton](/ui/components/skeleton).
3. **Set `points` when a single point is possible.** It is the only thing that makes a one-point line chart visible. `:points="series[0]?.data.length === 1"` is enough, or pass `points` always if your line is short.
4. **Guard sparklines on length.** `v-if="history.length > 1"`, with the number alone until the second sample arrives. Never render a blank box and hope.

## Density and small multiples

`height` defaults to `280` and accepts a number (pixels), a numeric string, or any CSS length. Practical floors, below which the axis labels start eating the plot: about 180 for a cartesian chart with a legend, about 140 without, about 200 for a pie including its labels, and 14 to 40 for a sparkline. Width is always 100% of the parent, tracked with a `ResizeObserver`, so size a chart by sizing its container.

Turn `showGrid` off below roughly 200 pixels of height. Five dashed gridlines in a 160-pixel panel is more ink than the data.

**Small multiples**, one panel per series with a shared metric, beat one chart with eight series whenever the reader compares _shapes_ rather than _values_. Eight sparklines, one per tenant, each labelled, reads faster than eight lines in one plot and needs no legend at all.

```vue
<template>
  <NbGrid dir="row" wrap="wrap" gap="md" class="tenant-multiples">
    <NbGrid v-for="t in tenants" :key="t.id" dir="col">
      <NbPanel>
        <span class="type-label-sm">{{ t.name }}</span>
        <NbLineChart
          :title="`${t.name} request volume`"
          subtitle="Requests per minute"
          :series="[{ name: t.name, data: t.points }]"
          :show-legend="false"
          :show-grid="false"
          curve="linear"
          :height="140"
        />
      </NbPanel>
    </NbGrid>
  </NbGrid>
</template>
```

::: danger Small multiples do not share a scale
Every chart computes its own domain from its own data. Two panels side by side with visually identical peaks can be an order of magnitude apart, and nothing on screen says so. Use small multiples for **shape** questions ("who is trending up"). For **magnitude** questions ("who is biggest"), use one chart with several series, or a bar chart of the totals. If you must do both, put the value in the panel heading next to the name.
:::

Two more density rules: give every panel a `min-width` so the row wraps instead of crushing (the tick labels are the first thing to fail), and cap a single chart at roughly 10,000 rendered points. Every point is an SVG node, and there is no canvas path yet.

## Accessibility

For a chart, accessible means two things beyond the usual: **there is a text alternative**, and **colour is never the only encoding**. Neither is optional, and neither is provided for you.

**The text alternative.** Every cartesian chart sets `role="img"` and an `aria-label` from `title`. That is a name, not content: it tells a screen reader user what the chart is called and nothing about what it shows. The data itself has to exist somewhere else on the page. In order of preference:

- The numbers are already on the page (a table the chart summarises, a metric row above it). This is the best case and it is common. Nothing more is needed.
- An [`NbDataTable`](/ui/components/data-table) of the same data in a second tab or behind a disclosure, named with `title` or `aria-label`. This is what every dashboard chart should have.
- An `NbDefinitionList` for small categorical sets, which is often less markup than the chart.

**Colour is never the only encoding.** Every non-colour channel our charts have is mouse-only. `ChartTooltip` appears on `mousemove`; the bar chart's dimming is a `mouseenter` on an invisible hover rectangle; the legend has no interaction at all. There is no keyboard path to a data point in any chart in this library. So a fact that lives only in a tooltip does not exist for a keyboard user, and a series identified only by hue does not exist for a reader with a colour-vision deficiency. Cover it by: passing `points` so line series have marks as well as a stroke, giving `NbPieChart` `labels` so the slices carry values, keeping to five colours, and providing the table.

**Contrast.** Chart marks are not text and are held to 3:1 against the surface they sit on rather than 4.5:1. Two of the eight light-theme roles miss that today, and four of the dark-theme roles miss it on layer 3. `seriesColors(n, { mark: 'line' })` routes around them for thin marks, which is exactly where it matters most. The measurements are on [Charts, Colour](/ui/components/charts/color) and the general rule is on [Colour and contrast](/accessibility/color-contrast).

**Motion.** The animation in a chart is small: a 120ms opacity fade on bar hover, and a fade on the tooltip. Both are opacity-only and safe. The Gantt group caret animates a transform and is not gated on `prefers-reduced-motion`, which is a bug and is listed below. Do not add animated draw-in transitions to charts: a line that grows from the left delays the answer to look busy.

**Live data.** A chart that repolls must not announce itself. Do not wrap an updating chart in `aria-live`. If a threshold crossing matters, raise it as a notification through [Status indicators](/patterns/status-indicators), where a human decided it was worth an interruption.

## Theming a white-label product

Charts paint through eight semantic roles, `--nb-c-chart-1` to `--nb-c-chart-8`, plus five ramp anchors, all declared in `src/styles/_theme.scss` for both themes. A product that is not violet redefines those eight once and every chart in the application follows, including the ones nobody has written yet.

The white-label product predates the roles. It found a palette module that named brand ramps directly, could not override them, and did this:

```ts
// Do not copy this. It is the shape of the problem.
const chartColors = [
  '#16a34a',
  '#2563eb',
  '#7c3aed',
  '#0891b2',
  '#d97706',
  '#6b7280',
]
const statusColors = ['#16a34a', '#d97706', '#dc2626']
```

Six literals, passed as `:colors` into each chart, one of them a violet inherited from a placeholder that had nothing to do with the brand. They do not follow the dark theme, they do not follow a rebrand, and no library upgrade can reach them.

The replacement is a stylesheet, not a prop:

```css
:root {
  --nb-c-chart-1: #0f6b3d;
  --nb-c-chart-2: #1d4ed8;
  /* ...through --nb-c-chart-8 */
  --nb-c-chart-sequential-from: #d9ece2;
  --nb-c-chart-sequential-to: #0f6b3d;
}

.dark {
  --nb-c-chart-1: #4ac489;
  --nb-c-chart-2: #7aa2f7;
  /* ... */
}
```

Then pass nothing. Charts fall back to the roles when `colors` is absent, `var()` resolves at paint time so SVG marks retint with no re-render, and the same override scoped to a wrapper element retints one dashboard rather than the application. Reserve the `colors` prop and the per-series `color` field for the case it exists for: pinning one specific series to one specific role so that the same tenant is the same colour in every chart on the page.

The status map on `NbGanttChart` is the one place a semantic override still belongs at the component, through `statusColors`, because "at risk" is your word and not ours.

Full recipe, contrast measurements and the sequential and diverging ramps: [Charts, Colour](/ui/components/charts/color) and [Colours](/principles/color).

## Known gaps

Honest list, all verified in the current source. Do not design around behaviour that is not there.

- `orientation` and `stacked` on `NbBarChart` are accepted and ignored.
- `NbLineChart` pins its value axis to zero and cannot crop.
- No axis-label props on the cartesian charts. The unit lives in `subtitle`.
- X positions are index-based, so irregular time spacing is drawn as regular.
- Pie slice labels are always white, whatever the slice colour.
- No `loading`, `error` or `empty` props on any chart. Handle the states outside.
- No keyboard access to data points, and no interactive legend.
- Small multiples do not share a domain.
- `NbSparkline` sits outside the colour roles and defaults to `--nb-c-primary`.
- The Gantt group caret animates without a `prefers-reduced-motion` guard.

## Before you ship a chart

- Could this be a number, or a table? If yes, make it one.
- Does it have a `title`, and does the `subtitle` name the unit?
- Bar chart: is every series the same length, aligned by index, with gaps filled deliberately?
- Line chart: are the x steps actually regular, and is `curve` right for the data?
- Five or fewer colours? More than eight is silently wrapping.
- Legend: is it earning its space, or repeating the axis?
- Empty, error, loading and single-point: does each one render something a person can read?
- Is the underlying data reachable as text somewhere on the page?
- Does it work in the dark theme, with no hardcoded hex anywhere in the component?
