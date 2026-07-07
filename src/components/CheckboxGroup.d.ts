import {
  IHumanInputComponent,
  IWithLabel,
  IWithMessages,
} from '@/types/Props.d'

enum ECheckboxGroupDirection {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

interface ICheckboxGroupProps
  extends IHumanInputComponent, IWithLabel, IWithMessages {
  direction?: ECheckboxGroupDirection
}

export { ECheckboxGroupDirection, ICheckboxGroupProps }
