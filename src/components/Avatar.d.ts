export type TAvatarSize = 'xs' | 'sm' | 'md' | 'lg'

export interface IAvatarProps {
  /** The person's name. Gives the initials and the accessible name. */
  name?: string | null
  /** Used for the initials and the accessible name when there is no name. */
  email?: string | null
  /**
   * Picture URL. Absent, empty, or failing to load all show initials, so a
   * replaced avatar whose old address now 404s degrades instead of breaking.
   */
  picture?: string | null
  /** 20, 24, 28 or 40 pixels. Default `md` (28), the size NbUserMenu uses. */
  size?: TAvatarSize
  /**
   * Hide it from assistive technology. Set it when the name is already shown
   * beside the avatar, so the person is not announced twice.
   */
  decorative?: boolean
}
