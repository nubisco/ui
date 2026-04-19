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
}
