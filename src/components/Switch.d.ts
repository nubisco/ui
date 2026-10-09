import { IHumanInputComponent, IWithLabel } from '@/types/Props.d'

enum ESwitchSize {
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
}

enum ESwitchVariant {
  Primary = 'primary',
  Secondary = 'secondary',
}

interface ISwitchProps extends IHumanInputComponent, IWithLabel {
  modelValue?: boolean
  variant?: `${ESwitchVariant}`
  size?: `${ESwitchSize}`
  /** Keep the label for assistive technology, but do not show it. */
  hideLabel?: boolean
}

export { ESwitchSize, ESwitchVariant, ISwitchProps }
