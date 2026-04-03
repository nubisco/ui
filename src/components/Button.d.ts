import { ESizeShort } from '@/types/Size.d'

enum EButtonType {
  Button = 'button',
  Submit = 'submit',
  Reset = 'reset',
}

interface IButtonProps {
  variant?: string
  outlined?: boolean
  size?: ESizeShort
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
  /** When provided the component renders as a `<RouterLink>`. Accepts any value valid for RouterLink's `to` prop. */
  to?: string | Record<string, unknown>
}

export { EButtonType, IButtonProps }
