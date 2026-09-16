interface IUserMenuUser {
  email: string
  name?: string | null
  /**
   * An avatar image URL, such as the platform's OIDC `picture` claim. Optional:
   * without it, or if the image fails to load (a replaced avatar's old URL may
   * 404), the trigger shows initials exactly as before.
   */
  picture?: string | null
}

/**
 * `'avatar'` is the round initials button, the long-standing trigger.
 * `'identity'` is a labelled row (avatar, name and email) for an expanded
 * rail, where a bare avatar sits out of line with the labelled items above it;
 * in a collapsed rail it renders as the avatar alone.
 */
type TUserMenuTrigger = 'avatar' | 'identity'

interface IUserMenuAccount {
  /** Stable identifier for the account (e.g. the platform `sub`). */
  id: string
  email: string
  name?: string | null
  /** Marks the account the product is currently running as. */
  current?: boolean
  /** Whether the row offers "sign this account out of this browser". */
  removable?: boolean
}

type TUserMenuPlacement = 'right-end' | 'top-start'

/**
 * How the menu signs itself as a Nubisco Platform product.
 *
 * A union rather than a boolean because a third mode, `'hub'` (the same
 * lockup, but a real link to the Nubisco Platform product page), lands once
 * that page exists.
 */
type TUserMenuBrand = 'footer' | 'none'

interface IUserMenuProps {
  /** The identity the product is signed in as (header of the menu). */
  user: IUserMenuUser
  /**
   * Other identities signed in on this browser, rendered as an inline switch
   * list. Omit (or pass empty) when the product cannot enumerate them.
   */
  accounts?: IUserMenuAccount[]
  /**
   * True when the product could not determine the browser's identities (e.g.
   * the identities endpoint was unreachable). Renders a generic
   * "Switch account" action instead of an inline list, so the identity
   * provider can show its own chooser.
   */
  accountsUnknown?: boolean
  /** Hide the whole switch/add section for single-account products. */
  showAccountActions?: boolean
  /** Hide the Profile entry when the product has no profile page. */
  showProfile?: boolean
  /**
   * The Nubisco Platform lockup at the foot of the panel. `'footer'` renders a
   * non-interactive signature; `'none'` renders nothing, for white-label
   * deployments and for hosts that are not Nubisco products.
   */
  brand?: TUserMenuBrand
  /** Where the panel opens relative to the trigger. */
  placement?: TUserMenuPlacement
  /**
   * How the trigger is drawn. Defaults to `'avatar'`, unchanged. Opt into
   * `'identity'` in a rail that can be expanded: it follows the rail, showing
   * the person's name when expanded and only the avatar when collapsed.
   */
  trigger?: TUserMenuTrigger
  disabled?: boolean
}

export {
  IUserMenuUser,
  IUserMenuAccount,
  TUserMenuPlacement,
  TUserMenuBrand,
  TUserMenuTrigger,
  IUserMenuProps,
}
