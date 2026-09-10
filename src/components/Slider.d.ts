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
  /**
   * Whether the min and max are printed either side of the track.
   *
   * They flank the track rather than sitting beneath its ends, so the track's
   * ends are the component's ends and a slider lines up with the controls
   * beside it. Turn them off on a dense row where the bounds are obvious.
   */
  showBounds?: boolean
}

type TActiveHandle = 'low' | 'high' | null

export { ISliderProps, TActiveHandle }
