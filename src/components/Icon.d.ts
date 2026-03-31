import { ESize } from '@/types/Size.d'

enum EAnimation {
  SwingRight = 'swing-right',
  Wobble = 'wobble',
  Expand = 'expand',
  Refresh = 'refresh',
  Heart = 'heart',
  Undo = 'undo',
  Italic = 'italic',
  Cog = 'cog',
  Wrench = 'wrench',
  Mouse = 'mouse-pointer',
  Magic = 'magic',
  Lock = 'lock',
  Unlock = 'unlock',
  Hourglass = 'hourglass',
  Eraser = 'eraser',
  Rocket = 'rocket',
  Times = 'times',
}

enum EAnimationMode {
  Hover = 'hover',
  Always = 'always',
}

enum EWeight {
  Thin = 'thin',
  Light = 'light',
  Regular = 'regular',
  Bold = 'bold',
  Fill = 'fill',
  Duotone = 'duotone',
}

enum EIconSize {
  XXL = 92,
  XL = 60,
  LG = 20,
  MD = 16,
  SM = 14,
  XS = 12,
  XXS = 8,
}

export { EAnimation, EAnimationMode, EWeight, EIconSize, ESize }
