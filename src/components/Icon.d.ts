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

/**
 * Pixel values of the named sizes. The scale is `sm` 16, `md` 20, `lg` 24 and
 * `xl` 32. `xs` and `xxs` are below what the icons are drawn for and warn in
 * development; `xxl` is kept for compatibility.
 */
enum EIconSize {
  XXL = 92,
  XL = 32,
  LG = 24,
  MD = 20,
  SM = 16,
  XS = 12,
  XXS = 8,
}

/** The icon size scale. */
type TIconSize = 'sm' | 'md' | 'lg' | 'xl'

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
  /**
   * `sm` (16, the default), `md` (20), `lg` (24) or `xl` (32). A number is
   * pixels and any other string is a CSS length. `xs`, `xxs` and numbers
   * under 16 are deprecated and warn once in development.
   */
  size?: TIconSize | `${ESize}` | ESize | (string & {}) | number
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
  /**
   * @deprecated An icon that does something is a button. Use
   * `<NbButton variant="ghost" icon="...">` with `v-nb-tooltip` naming the
   * action. Warns once in development.
   */
  clickable?: boolean
  hoverable?: boolean
}

export { EAnimation, EAnimationMode, EWeight, EIconSize, IIconProps }
export type { TIconSource, TIconSize }
