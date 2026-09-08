// Shared type definitions for the chart family.
// All cartesian charts (Bar, Line, Area, Bubble, Histogram) consume the
// IChartSeries shape; pie / categorical charts consume ICategoricalDatum.

type TChartScalar = number | string | Date

interface IChartPoint {
  x: TChartScalar
  y: number
  // Optional third dimension (used by Bubble for radius / Heatmap for value).
  z?: number
  // Optional label override for tooltips.
  label?: string
}

interface IChartSeries {
  name: string
  data: IChartPoint[]
  // Optional explicit color override for this series.
  color?: string
}

interface ICategoricalDatum {
  label: string
  value: number
  color?: string
}

interface IChartMargins {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * What a chart hands back when the user picks part of it.
 *
 * Two shapes because the family has two datum shapes: cartesian charts plot
 * `IChartPoint` inside a named series, categorical ones plot a flat
 * `ICategoricalDatum`. `kind` discriminates them so a consumer handling both
 * does not have to guess which fields are present.
 *
 * Every payload carries the underlying values, not the rendered text. A
 * consumer navigating from a chart keys off `x` (or `label`) and the indices;
 * handing back only the display string would push them into reverse-mapping a
 * formatted, possibly localised label back to the datum it came from.
 */
interface IChartSeriesSelection {
  kind: 'series'
  /** The category value as supplied in the data, before any formatting. */
  x: TChartScalar
  y: number
  seriesName: string
  seriesIndex: number
  /** Index of the category along the shared axis. */
  index: number
  /** The datum itself, so `z` and `label` survive the round trip. */
  point: IChartPoint
}

interface IChartCategoricalSelection {
  kind: 'categorical'
  label: string
  value: number
  index: number
  datum: ICategoricalDatum
}

type TChartSelection = IChartSeriesSelection | IChartCategoricalSelection

interface IChartCommonProps {
  title?: string
  subtitle?: string
  height?: number | string
  showLegend?: boolean
  showTooltip?: boolean
  showGrid?: boolean
  colors?: string[]
}

export {
  TChartScalar,
  IChartPoint,
  IChartSeries,
  ICategoricalDatum,
  IChartMargins,
  IChartCommonProps,
  IChartSeriesSelection,
  IChartCategoricalSelection,
  TChartSelection,
}
