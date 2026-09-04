// Chart colour, expressed as roles.
//
// Every chart in the family paints through this module. A series asks for
// "role 3", never for a Nubisco ramp: the eight `--nb-c-chart-*` custom
// properties are defined once in `src/styles/_theme.scss` and default to the
// brand ramps these constants used to name inline, so nothing repaints, while
// a white-label product retints every chart in the product by redefining eight
// properties on `:root`.
//
// Why this indirection exists: the previous version of this file listed
// `--nb-c-grape-hyacinth-500` and friends with a comment claiming that brand
// overrides propagated automatically. They did not. Those are ramp names, not
// roles, and a product that rebrands does not own them, so a green-branded
// insurance product hardcoded hex per chart and shipped a violet placeholder
// series. Ramp names are also why `--nb-c-chart-*` steps up its tints under
// `.dark` (three of the eight light values fail WCAG 1.4.11 on a dark surface)
// while the call sites here stay theme-agnostic.
//
// SVG `fill` and `stroke` accept `var(--token)`, and both `var()` and
// `color-mix()` resolve at paint time on the element, so an override applied to
// any ancestor (`:root`, a dashboard wrapper, a single widget) reaches the
// marks with no re-render.
//
// Guidance on choosing between the three scales, on how many series colour can
// carry, and on the measured contrast and colour-vision numbers behind the
// defaults, lives in docs/ui/components/charts/color.md.

/** Number of categorical roles before `colorAt` wraps. */
const CHART_ROLE_COUNT = 8

/**
 * Categorical roles, in assignment order.
 *
 * The order is the contract, not an accident of listing: the earlier roles are
 * the better separated ones, so a two-series chart gets the strongest pair
 * available and an eight-series chart degrades predictably. Reordering this
 * array recolours every chart in every consuming app.
 */
const DEFAULT_PALETTE: string[] = [
  'var(--nb-c-chart-1)',
  'var(--nb-c-chart-2)',
  'var(--nb-c-chart-3)',
  'var(--nb-c-chart-4)',
  'var(--nb-c-chart-5)',
  'var(--nb-c-chart-6)',
  'var(--nb-c-chart-7)',
  'var(--nb-c-chart-8)',
]

/**
 * The colour for series `index`, wrapping at the end of the palette.
 *
 * Wrapping is deliberate: a chart handed twelve series still renders. It also
 * means series 1 and series 9 are indistinguishable, which is a legibility
 * failure, not a feature. Above five series, encode with something other than
 * colour (direct labels, small multiples, facets), or pass `seriesColors()`.
 *
 * An empty `palette` falls back to the roles rather than returning `undefined`,
 * because the chart components default their `colors` prop to `[]` and an
 * `undefined` fill paints black.
 */
const colorAt = (
  index: number,
  palette: string[] = DEFAULT_PALETTE,
): string => {
  const source = palette.length > 0 ? palette : DEFAULT_PALETTE
  const i = Number.isFinite(index) ? Math.trunc(index) : 0
  return source[((i % source.length) + source.length) % source.length]
}

/** The `var()` reference for one categorical role, 1-based as the token is. */
const chartRole = (role: number): string =>
  `var(--nb-c-chart-${((Math.trunc(role) - 1 + CHART_ROLE_COUNT) % CHART_ROLE_COUNT) + 1})`

/** Which channel a mark uses, which decides how much contrast the role needs. */
type TChartMark = 'fill' | 'line'

// Two orderings over the same eight roles, each chosen so that EVERY prefix is
// the best available set of that size, not just the full list.
//
// The numbers behind them are in docs/ui/components/charts/color.md and are
// recomputed in tests/chartRoles.test.ts off the compiled stylesheet: for each
// candidate subset we take the smallest CIEDE2000 distance between any two of
// its members, simulated for deuteranopia and protanopia in both themes, and
// keep the subset whose worst case is highest. The winners turned out to be
// nested, which is why one fixed order can serve every count: adding a series
// never recolours the ones already on the chart.
//
// Why this is not simply the role order: the role order is frozen by backward
// compatibility (role N is the ramp charts already paint), and it happens to
// open with three violet-blues. At five series it leaves a deuteranope 5.2
// apart at the closest pair; this order leaves 9.4.
const FILL_ORDER = [2, 4, 5, 8, 3, 6, 1, 7]

// Roles 3 and 4 are fill-only: they measure 2.69 and 1.75 against the light
// surfaces, so they are legible as a bar or a slice and not as a 1px stroke.
// The line order is the same search run over only the six roles that clear
// WCAG 1.4.11's 3:1 on layer-0 through layer-2 in BOTH themes, with those two
// appended so a caller asking for seven lines still gets seven colours. By
// then colour has stopped encoding anything, which the docs say plainly.
const LINE_ORDER = [2, 5, 8, 6, 1, 7, 4, 3]

/**
 * `count` categorical colours, best-separated set first.
 *
 * Use this when the chart knows how many series it has. `colorAt()` and the
 * default `colors` prop assign roles in role order, which is the compatible
 * choice and not the legible one; this picks the subset that survives colour
 * vision deficiency best at that exact count.
 *
 * Pass `{ mark: 'line' }` for strokes, points and sparkline-thin marks, which
 * need 3:1 contrast against the surface as well as separation from each other.
 * The default, `'fill'`, is for bars, slices, areas and legend chips.
 *
 * Above eight it wraps, same as `colorAt()`, and is just as much a legibility
 * failure there. A non-positive or non-finite `count` returns an empty array,
 * which is what the `colors` prop wants for "use the default".
 */
const seriesColors = (
  count: number,
  options: { mark?: TChartMark } = {},
): string[] => {
  const n = Number.isFinite(count) ? Math.trunc(count) : 0
  if (n <= 0) return []
  const order = options.mark === 'line' ? LINE_ORDER : FILL_ORDER
  return Array.from({ length: n }, (_, i) => chartRole(order[i % order.length]))
}

const clamp01 = (t: number): number =>
  Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0

// Interpolation happens in CSS, in oklab, rather than in JS. Two reasons: the
// anchors are tokens, so their literal values are not known here and change
// with the theme; and oklab keeps the ramp perceptually even, which sRGB
// interpolation does not (an sRGB midpoint of a saturated pair reads darker
// than its neighbours and invents a band the data does not have).
const mix = (from: string, to: string, t: number): string =>
  `color-mix(in oklab, ${to} ${(clamp01(t) * 100).toFixed(2)}%, ${from})`

/**
 * A point on the sequential ramp, `t` from 0 (lowest value) to 1 (highest).
 *
 * One hue, lightness carrying magnitude. Use it when the quantity is ordered
 * and one-directional: heat cells, choropleths, a bar chart shaded by size.
 * Never use it for unordered categories, it invents a ranking.
 *
 * The low end sits close to the page ground by design, so a lone low cell has
 * little contrast against the surface. Give sequential marks a `stroke` of
 * `var(--nb-c-border)` and a value label, or a legend with numeric bounds.
 */
const sequentialAt = (t: number): string =>
  mix('var(--nb-c-chart-sequential-from)', 'var(--nb-c-chart-sequential-to)', t)

/**
 * A point on the diverging ramp, `t` from 0 (low pole) through 0.5 (the
 * neutral midpoint) to 1 (high pole).
 *
 * Use it only when the midpoint means something: zero, a target, a baseline
 * being beaten or missed. Map the domain symmetrically around that midpoint,
 * otherwise the neutral band lands somewhere arbitrary and the chart lies.
 */
const divergingAt = (t: number): string => {
  const v = clamp01(t)
  return v <= 0.5
    ? mix(
        'var(--nb-c-chart-diverging-low)',
        'var(--nb-c-chart-diverging-mid)',
        v * 2,
      )
    : mix(
        'var(--nb-c-chart-diverging-mid)',
        'var(--nb-c-chart-diverging-high)',
        (v - 0.5) * 2,
      )
}

/**
 * `steps` evenly spaced stops of a ramp, for a legend or a binned scale.
 *
 * Bin before you shade. Five to seven steps is the most a reader can match
 * back to a legend swatch; a continuous ramp is for dense fields (thousands of
 * cells) where individual lookup is not the point.
 */
const rampSteps = (
  steps: number,
  at: (t: number) => string = sequentialAt,
): string[] => {
  const n = Math.max(1, Math.trunc(steps))
  return n === 1
    ? [at(1)]
    : Array.from({ length: n }, (_, i) => at(i / (n - 1)))
}

export type { TChartMark }
export {
  CHART_ROLE_COUNT,
  DEFAULT_PALETTE,
  colorAt,
  chartRole,
  seriesColors,
  sequentialAt,
  divergingAt,
  rampSteps,
}
