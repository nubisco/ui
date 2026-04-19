import type { IChartCommonProps, IChartSeries } from './shared/types.d'

type TLineCurve = 'linear' | 'smooth' | 'step'

interface ILineChartProps extends IChartCommonProps {
  series?: IChartSeries[]
  // Render filled area under each line.
  area?: boolean
  // Show data points along each line.
  points?: boolean
  // Curve style.
  curve?: TLineCurve
}

export type { ILineChartProps, TLineCurve }
