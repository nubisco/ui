import { ESize } from '@/types/Size.d'
import type { TIconSource } from '@/types/Glyph.d'

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

interface IIconProps {
  /**
   * Icon name, or an icon module. A string is resolved at runtime and needs
   * the catalogue (see `@nubisco/ui/icons/all`); a module is linked directly.
   */
  name?: TIconSource
  /**
   * An explicitly imported icon module, for code the plugin cannot see
   * through: `import GithubLogo from '@nubisco/ui/icons/github-logo'`.
   * Takes precedence over `name`.
   */
  icon?: TIconSource
  size?: ESize | string | number
  animation?: `${EAnimation}` | null
  animationMode?: `${EAnimationMode}`
  color?: string
  weight?: `${EWeight}`
  /**
   * A native tooltip. It also names the icon for assistive technology, the
   * same as `label`, so an icon with a `title` is announced.
   */
  title?: string
  /**
   * The accessible name. Give one only when the icon carries meaning that no
   * adjacent text repeats; the icon then renders `role="img"` with this name.
   * Without `label` or `title` the icon is decorative and `aria-hidden`.
   */
  label?: string
  clickable?: boolean
  hoverable?: boolean
}

export { EAnimation, EAnimationMode, EWeight, EIconSize, IIconProps }
export type { TIconSource }
