export type TShellPanelSize = 'collapsed' | 'default' | 'full'

export interface IShellPanelProps {
  /**
   * Current panel size. Use v-model:size for two-way binding.
   *
   * - collapsed: header only, no content, does not grow
   * - default: content visible, flex: 1 (shares space equally with siblings)
   * - full: content visible, flex: 1, sibling panels collapse automatically
   *
   * @default 'default'
   */
  size?: TShellPanelSize
  /**
   * Panel title shown in the header.
   */
  title?: string
}
