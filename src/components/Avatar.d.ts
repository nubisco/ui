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
  /**
   * `xs` (20), `sm` (24), `md` (28) or `lg` (40) pixels, or any number of
   * pixels for a size the scale does not carry. A number sizes the circle and
   * scales the initials with it. Default `md` (28), the size NbUserMenu uses.
   */
  size?: TAvatarSize | number
  /**
   * Background of the initials, for giving each person their own colour so a
   * row of faces is tellable apart at small sizes. Any CSS colour, including a
   * token: `var(--nb-c-chart-3)`. Unset, every avatar takes the same one.
   *
   * The picture covers it, so it only shows when initials do.
   */
  background?: string
  /**
   * Colour of the initials. Set it alongside a `background` light enough that
   * the default foreground would not read against it.
   */
  color?: string
  /**
   * Hide it from assistive technology. Set it when the name is already shown
   * beside the avatar, so the person is not announced twice.
   */
  decorative?: boolean
}
