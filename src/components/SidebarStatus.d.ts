interface ISidebarStatusProps {
  /** What the status says, for example "Daemon connected". */
  label: string
  /**
   * The colour of the dot.
   * - 'success': working as it should
   * - 'warning': degraded, still working
   * - 'danger': not working
   * - 'neutral' (default): unknown or not applicable
   */
  status?: 'success' | 'warning' | 'danger' | 'neutral'
}

export { ISidebarStatusProps }
