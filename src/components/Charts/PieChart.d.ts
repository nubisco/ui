import type { IChartCommonProps, ICategoricalDatum } from './shared/types.d'

interface IPieChartProps extends Omit<IChartCommonProps, 'showGrid'> {
  data?: ICategoricalDatum[]
  // Inner radius ratio (0-1). > 0 produces a donut chart.
  innerRadius?: number
  // Label rendering: 'none' | 'percent' | 'value'.
  labels?: 'none' | 'percent' | 'value'
}

export type { IPieChartProps }
