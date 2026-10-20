import type {
  IChartCommonProps,
  IChartSeries,
  TChartValueFormatter,
} from './shared/types.d'

type TLineCurve = 'linear' | 'smooth' | 'step'

interface ILineChartProps extends IChartCommonProps {
  series?: IChartSeries[]
  // Render filled area under each line.
  area?: boolean
  // Show data points along each line.
  points?: boolean
  // Curve style.
  curve?: TLineCurve
  // Formats every value the chart prints: axis ticks, tooltip rows and the
  // accessible labels. Without it, values of 1000 and over read as `1.2k`.
  valueFormatter?: TChartValueFormatter
}

export type { ILineChartProps, TLineCurve }
