import type { IChartCommonProps } from './shared/types.d'

interface IInterpolationPoint {
  input: number
  output: number
}

interface IInterpolationChartProps extends IChartCommonProps {
  /** The mapping points (sorted by input). Supports v-model. */
  modelValue?: IInterpolationPoint[]
  /** Label for the X (input) axis. */
  inputLabel?: string
  /** Label for the Y (output) axis. */
  outputLabel?: string
  /** Minimum allowed input value. */
  inputMin?: number
  /** Maximum allowed input value. */
  inputMax?: number
  /** Minimum allowed output value. */
  outputMin?: number
  /** Maximum allowed output value. */
  outputMax?: number
  /** Whether the user can drag, add, and remove points. */
  editable?: boolean
  /** Minimum number of points that must remain (cannot remove below this). */
  minPoints?: number
  /** Step size for snapping input values (e.g. 0.5). 0 = no snap. */
  inputStep?: number
  /** Step size for snapping output values (e.g. 1). 0 = no snap. */
  outputStep?: number
}

export type { IInterpolationPoint, IInterpolationChartProps }
