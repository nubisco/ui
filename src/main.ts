import type { App } from 'vue'
import components from './components/index'
import directives from './directives/index'

export default {
  install(app: App) {
    app.use(components)
    app.use(directives)
  },
}

// Named exports for tree-shakeable individual imports
export { default as NbBreadcrumbs } from './components/Breadcrumbs.vue'
export { default as NbBadge } from './components/Badge.vue'
export { default as NbBarChart } from './components/Charts/BarChart.vue'
export { default as NbButton } from './components/Button.vue'
export { default as NbCheckbox } from './components/Checkbox.vue'
export { default as NbColorStrip } from './components/ColorStrip.vue'
export { default as NbFlag } from './components/Flag.vue'
export { default as NbGrid } from './components/Grid.vue'
export { default as NbIcon } from './components/Icon.vue'
export { default as NbJsonTree } from './components/JsonTree.vue'
export { default as NbLineChart } from './components/Charts/LineChart.vue'
export { default as NbLabel } from './components/Label.vue'
export { default as NbMenu } from './components/Menu.vue'
export { default as NbMenuBar } from './components/MenuBar.vue'
export { default as NbMenuBarItem } from './components/MenuBarItem.vue'
export { default as NbMenuItem } from './components/MenuItem.vue'
export { default as NbMenuDivider } from './components/MenuDivider.vue'
export { default as NbSubmenu } from './components/Submenu.vue'
export { default as NbCommandPalette } from './components/CommandPalette.vue'
export type {
  IMenuProps,
  IMenuItemProps,
  ISubmenuProps,
  IMenuBarProps,
  TMenuItemSize,
} from './components/Menu.d'
export type {
  ICommand,
  ICommandPaletteProps,
  ICommandPaletteState,
} from './components/CommandPalette.d'
export { default as NbMessage } from './components/Message.vue'
export { default as NbModal } from './components/Modal.vue'
export { default as NbPanel } from './components/Panel.vue'
export { default as NbPieChart } from './components/Charts/PieChart.vue'
export { default as NbShell } from './components/Shell.vue'
export type { TInspectorSize } from './components/Shell.d'
export { default as NbSidebarLink } from './components/SidebarLink.vue'
export { default as NbToast } from './components/Toast.vue'
export type { TToastVariant, IToastCta } from './components/Toast.vue'
export { default as NbRadio } from './components/Radio.vue'
export { default as NbNumberInput } from './components/NumberInput.vue'
export { default as NbSlider } from './components/Slider.vue'
export { default as NbSparkline } from './components/Charts/Sparkline.vue'
export { default as NbSelect } from './components/Select.vue'
export { default as NbTextInput } from './components/TextInput.vue'
export type { ISelectOption, ISelectProps } from './components/Select.d'

export { default as NbTree } from './components/Tree.vue'
export { default as NbTreeNode } from './components/TreeNode.vue'
export type {
  ITreeProps,
  ITreeNodeProps,
  ITreeContext,
  ITreeDropEvent,
  ITreeDragState,
  TTreeDropPosition,
} from './components/Tree.d'
export { default as NbBottomPanel } from './components/BottomPanel.vue'
export type { TBottomPanelSize } from './components/BottomPanel.d'
export { default as NbShellPanel } from './components/ShellPanel.vue'
export type { TShellPanelSize } from './components/ShellPanel.d'
export { default as NbBlueprint } from './components/Blueprint.vue'
export type { IBlueprintConnection } from './components/Blueprint.d'
export { default as NbBlueprintCard } from './components/BlueprintCard.vue'
export type {
  IBlueprintPort,
  IBlueprintCardProps,
} from './components/BlueprintCard.d'

// Directives
export { default as nbTooltipDirective } from './directives/ToolTip.directive'

// Composables
export { useCommandPalette } from './composables/useCommandPalette.composable'
export { useContextMenu } from './composables/useContextMenu.composable'

// Plugins
export { NbCommandPalettePlugin } from './plugins/commandPalette'

// Labs plugin (experimental components)
export { default as NubiscoUILabs } from './labs'
