interface IUserMenuUser {
  email: string
  name?: string | null
}

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
  /** Where the panel opens relative to the trigger. */
  placement?: TUserMenuPlacement
  disabled?: boolean
}

export { IUserMenuUser, IUserMenuAccount, TUserMenuPlacement, IUserMenuProps }
