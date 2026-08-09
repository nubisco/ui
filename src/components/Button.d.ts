import { ESize } from '@/types/Size.d'

enum EButtonType {
  Button = 'button',
  Submit = 'submit',
  Reset = 'reset',
}

/**
 * The full size scale NbButton implements. Every token here is backed by a
 * real `.nb-button--<size>` rule (height, inline padding, font size, icon
 * size) plus a matching icon-only width, so all seven render correctly.
 *
 * Deliberately NOT `ESizeShort` (`sm | md | lg`): that is the narrower scale
 * used by Modal, DataTable and Pagination, and typing the button with it
 * rejected four sizes the component has always styled. The raw literals sit
 * alongside the enum so templates can write `size="xs"` without importing it.
 */
type TButtonSize = ESize | 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

interface IButtonProps {
  variant?: string
  outlined?: boolean
  size?: TButtonSize
  disabled?: boolean
  loading?: boolean
  /** Icon name passed directly to NbIcon. Rendered in the trailing padding area. Hidden while loading. */
  icon?: string
  /** Native button type. Ignored when `href` is provided. */
  type?: EButtonType
  /** When provided the component renders as an `<a>` element instead of `<button>`. */
  href?: string
  /** Forwarded to the `<a>` element. Only used when `href` is set. */
  target?: string
  /** Forwarded to the `<a>` element. Only used when `href` is set. */
  rel?: string
  /**
   * Target route. When vue-router is installed, the button renders as a
   * `<RouterLink>` and accepts any value valid for its `to` prop (string path or
   * location object). Without vue-router, a string `to` falls back to a plain
   * `<a>` and an object `to` falls back to a `<button>` that emits `click`.
   */
  to?: string | Record<string, unknown>
}

export { EButtonType, IButtonProps }
export type { TButtonSize }
