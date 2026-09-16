export interface ISidebarCollapseToggleProps {
  /**
   * Label while the rail is expanded, where the action collapses it. Defaults
   * to a built-in "Collapse sidebar" in the active locale.
   */
  collapseLabel?: string
  /**
   * Label while the rail is collapsed, where the action expands it. Also the
   * accessible name of the icon-only row. Defaults to "Expand sidebar".
   */
  expandLabel?: string
}
