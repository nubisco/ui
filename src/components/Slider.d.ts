import {
  IHumanInputComponent,
  IWithLabel,
  IWithMessages,
  IWithFieldAppearance,
} from '@/types/Props.d'

interface ISliderProps
  extends
    IHumanInputComponent,
    IWithLabel,
    IWithMessages,
    IWithFieldAppearance {
  modelValue?: number | [number, number] | null
  min?: number
  max?: number
  step?: number
  /** Enables a two-handle range selector instead of a single-value slider. */
  range?: boolean
  /** Shows a `NbNumberInput` alongside the track for direct value entry. */
  showInput?: boolean
}

type TActiveHandle = 'low' | 'high' | null

export { ISliderProps, TActiveHandle }
