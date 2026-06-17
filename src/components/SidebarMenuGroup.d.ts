interface ISidebarMenuGroupProps {
  /** Section heading displayed above the items. */
  label: string
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
