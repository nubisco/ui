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
  icon?: string
}

export { ISidebarBrandProps }
