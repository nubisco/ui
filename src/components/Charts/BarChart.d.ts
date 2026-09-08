import type { IChartCommonProps, IChartSeries } from './shared/types.d'

type TBarOrientation = 'vertical' | 'horizontal'

interface IBarChartProps extends IChartCommonProps {
  series?: IChartSeries[]
  // Which screen axis carries the categories. Horizontal gives each category
  // the full panel width for its label, which is the reason to reach for it.
  orientation?: TBarOrientation
  // When true and multiple series share an x value, bars stack instead of group.
  stacked?: boolean
}

export type { IBarChartProps, TBarOrientation }
