import type { TIconSource } from '@/types/Glyph.d'
interface ISidebarBrandProps {
  /** Primary brand name (top line, prominent). */
  title: string
  /** Optional secondary line below the title (smaller, muted). */
  subtitle?: string
  /**
   * Optional icon rendered to the left of the title. Uses NbIcon when provided
   * as a string; for fully custom marks (logo, gradient block) use the
   * `icon` slot instead.
   */
  icon?: TIconSource
  /**
   * A neutral generated mark for a product that has no logo yet: a square
   * tile in the app's primary colour holding the title's initials (up to
   * two, from its first two words). A string supplies the letters itself
   * ("Ac", "Q"), of which the first two characters are used.
   *
   * It is drawn only when there is no `icon` and no `#icon` slot, so a
   * product that has a logo is unchanged. Left out, a brand without an icon
   * still renders no mark, as before.
   */
  monogram?: boolean | string
}

export { ISidebarBrandProps }
