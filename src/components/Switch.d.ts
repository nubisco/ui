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
  variant?: ESwitchVariant
  size?: ESwitchSize
}

export { ESwitchSize, ESwitchVariant, ISwitchProps }
