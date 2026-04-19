import type { IChartCommonProps, IChartSeries } from './shared/types.d'

type TBarOrientation = 'vertical' | 'horizontal'

interface IBarChartProps extends IChartCommonProps {
  series?: IChartSeries[]
  orientation?: TBarOrientation
  // When true and multiple series share an x value, bars stack instead of group.
  stacked?: boolean
}

export type { IBarChartProps, TBarOrientation }
