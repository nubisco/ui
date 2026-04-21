export type TBottomPanelSize = 'collapsed' | 'default' | 'half' | 'full'

export interface IBottomPanelProps {
  /**
   * Current panel size. Use v-model:size for two-way binding.
   * @default 'default'
   */
  size?: TBottomPanelSize
  /**
   * Panel title shown in the header.
   */
  title?: string
}
