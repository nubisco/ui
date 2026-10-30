import type {
  IChartCommonProps,
  IChartSeries,
  TChartValueFormatter,
} from './shared/types.d'

type TBarOrientation = 'vertical' | 'horizontal'

interface IBarChartProps extends IChartCommonProps {
  series?: IChartSeries[]
  // Which screen axis carries the categories. Horizontal gives each category
  // the full panel width for its label, which is the reason to reach for it.
  orientation?: TBarOrientation
  // When true and multiple series share an x value, bars stack instead of group.
  stacked?: boolean
  // Formats every value the chart prints: axis ticks, tooltip rows and the
  // accessible labels. Without it, values of 1000 and over read as `1.2k`.
  valueFormatter?: TChartValueFormatter
  // Rounds the free end of each bar by this many pixels: the top in a vertical
  // chart, the right in a horizontal one (the other way for negative values),
  // and only the outermost segment of a stack. 0 keeps square bars.
  barRadius?: number
  // Draws a short dash on the baseline, one bar footprint wide, for a
  // category whose values are all zero, so it reads as "none" rather than as
  // a gap.
  showEmpty?: boolean
  // The zero line along the category axis.
  showBaseline?: boolean
  // The value tick labels. Hiding them also closes the gutter they sat in.
  showValueAxis?: boolean
  // Label only every Nth category (the first, then every Nth after it), for
  // dense axes such as 24 hours. The bars are unaffected.
  categoryLabelEvery?: number
}

export type { IBarChartProps, TBarOrientation }
