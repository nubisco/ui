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
}

export { IShellProps }
