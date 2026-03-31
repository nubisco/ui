import {
  IHumanInputComponent,
  IWithLabel,
  IWithMessages,
} from '@/types/Props.d'

interface IRadioOption {
  label: string
  value: string
  disabled?: boolean
}

enum ERadioDirection {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

interface IRadioProps extends IHumanInputComponent, IWithLabel, IWithMessages {
  modelValue?: string
  options: IRadioOption[]
  /** Required for native radio-button grouping via the HTML `name` attribute. */
  name: string
  direction?: ERadioDirection
  /** Makes options visible but non-interactive. */
  readonly?: boolean
}

export { IRadioOption, ERadioDirection, IRadioProps }
