type TInspectorSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type TSidebarVariant = 'compact' | 'verbose'

interface IShellProps {
  /**
   * Whether the inspector column is visible.
   * @default false
   */
  inspectorVisible?: boolean
  /**
   * When true the inspector takes ~50 % of the viewport width instead of the
   * default fixed width. Has no effect when `inspectorVisible` is false.
   * @default false
   */
  inspectorExpanded?: boolean
  /**
   * Controls the width of the inspector panel.
   * - xs: 288px
   * - sm: 360px
   * - md: 560px (current default, backwards compatible)
   * - lg: 50vw
   * - xl: 75vw
   * @default 'md'
   */
  inspectorSize?: TInspectorSize
  /**
   * Whether the main content area has padding.
   * Set to false for full-bleed content like viewports/canvases.
   * @default true
   */
  mainPadding?: boolean
  /**
   * Sidebar presentation mode.
   * - 'compact': narrow icon-only rail (56px). Use with NbSidebarLink. This is
   *   the default and matches the legacy behaviour.
   * - 'verbose': wider sidebar (240px) with full-width rows. Use with
   *   NbSidebarMenu, NbSidebarMenuGroup and NbSidebarMenuItem to render
   *   grouped, multi-level navigation with icons and labels.
   * @default 'compact'
   */
  sidebarVariant?: TSidebarVariant
}

export { IShellProps, TInspectorSize, TSidebarVariant }
