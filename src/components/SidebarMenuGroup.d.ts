interface ISidebarMenuGroupProps {
  /** Section heading displayed above the items. */
  label: string
  /**
   * A picture before the heading, as a small round `NbAvatar`: the logo of the
   * project, client or space the group stands for. `null` draws the label's
   * initials there. Left out, the heading is text alone, as it always was.
   * Collapsed, the group is a divider and shows neither.
   */
  picture?: string | null
  /**
   * When true, the group can be collapsed by clicking its heading.
   * @default false
   */
  collapsible?: boolean
  /**
   * Initial collapsed state when `collapsible` is true. Ignored otherwise.
   * @default false
   */
  defaultCollapsed?: boolean
}

export { ISidebarMenuGroupProps }
