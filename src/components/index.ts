import type { App } from 'vue'
import NbAiLabel from './AiLabel.vue'
import NbBadge from './Badge.vue'
import NbBarChart from './Charts/BarChart.vue'
import NbBoard from './Board.vue'
import NbBreadcrumbs from './Breadcrumbs.vue'
import NbButton from './Button.vue'
import NbCalendar from './Calendar.vue'
import NbDatePicker from './DatePicker.vue'
import NbCheckbox from './Checkbox.vue'
import NbCheckboxGroup from './CheckboxGroup.vue'
import NbColorStrip from './ColorStrip.vue'
import NbDataTable from './DataTable.vue'
import NbPagination from './Pagination.vue'
import NbFileUploader from './FileUploader.vue'
import NbGanttChart from './Charts/GanttChart.vue'
import NbFlag from './Flag.vue'
import NbForm from './Form.vue'
import NbGrid from './Grid.vue'
import NbIcon from './Icon.vue'
import NbInfoHint from './InfoHint.vue'
import NbInterpolationChart from './Charts/InterpolationChart.vue'
import NbImageCropper from './ImageCropper.vue'
import NbJsonTree from './JsonTree.vue'
import NbLineChart from './Charts/LineChart.vue'
import NbLabel from './Label.vue'
import NbField from './Field.vue'
import NbMenu from './Menu.vue'
import NbMenuBar from './MenuBar.vue'
import NbMenuBarItem from './MenuBarItem.vue'
import NbMenuItem from './MenuItem.vue'
import NbMenuDivider from './MenuDivider.vue'
import NbSubmenu from './Submenu.vue'
import NbCommandPalette from './CommandPalette.vue'
import NbNubiscoMark from './NubiscoMark.vue'
import NbMessage from './Message.vue'
import NbModal from './Modal.vue'
import NbNumberInput from './NumberInput.vue'
import NbLayer from './Layer.vue'
import NbPanel from './Panel.vue'
import NbPieChart from './Charts/PieChart.vue'
import NbProgressBar from './ProgressBar.vue'
import NbRadio from './Radio.vue'
import NbSelect from './Select.vue'
import NbShell from './Shell.vue'
import NbSidebarBrand from './SidebarBrand.vue'
import NbSidebarLink from './SidebarLink.vue'
import NbSidebarMenu from './SidebarMenu.vue'
import NbSidebarMenuGroup from './SidebarMenuGroup.vue'
import NbSidebarMenuItem from './SidebarMenuItem.vue'
import NbSlider from './Slider.vue'
import NbSparkline from './Charts/Sparkline.vue'
import NbSwitch from './Switch.vue'
import NbTabs from './Tabs.vue'
import NbTextInput from './TextInput.vue'
import NbToast from './Toast.vue'
import NbTree from './Tree.vue'
import NbTreeNode from './TreeNode.vue'
import NbUserMenu from './UserMenu.vue'
import NbBottomPanel from './BottomPanel.vue'
import NbShellPanel from './ShellPanel.vue'
import NbBlueprint from './Blueprint.vue'
import NbBlueprintBackground from './BlueprintBackground.vue'
import NbBlueprintCard from './BlueprintCard.vue'
import NbBlueprintControls from './BlueprintControls.vue'
import NbBlueprintMinimap from './BlueprintMinimap.vue'
import NbWalkthrough from './Walkthrough.vue'

const components = {
  NbAiLabel,
  NbBadge,
  NbBarChart,
  NbBoard,
  NbBreadcrumbs,
  NbButton,
  NbCalendar,
  NbDatePicker,
  NbCheckbox,
  NbCheckboxGroup,
  NbColorStrip,
  NbDataTable,
  NbPagination,
  NbFileUploader,
  NbGanttChart,
  NbFlag,
  NbForm,
  NbGrid,
  NbIcon,
  NbInfoHint,
  NbInterpolationChart,
  NbImageCropper,
  NbJsonTree,
  NbLabel,
  NbField,
  NbLineChart,
  NbMenu,
  NbMenuBar,
  NbMenuBarItem,
  NbMenuItem,
  NbMenuDivider,
  NbSubmenu,
  NbCommandPalette,
  NbMessage,
  NbModal,
  NbNumberInput,
  NbLayer,
  NbPanel,
  NbPieChart,
  NbProgressBar,
  NbRadio,
  NbSelect,
  NbShell,
  NbSidebarBrand,
  NbSidebarLink,
  NbSidebarMenu,
  NbSidebarMenuGroup,
  NbSidebarMenuItem,
  NbSlider,
  NbSparkline,
  NbSwitch,
  NbTabs,
  NbTextInput,
  NbToast,
  NbTree,
  NbTreeNode,
  NbNubiscoMark,
  NbUserMenu,
  NbBottomPanel,
  NbShellPanel,
  NbBlueprint,
  NbBlueprintBackground,
  NbBlueprintCard,
  NbBlueprintControls,
  NbBlueprintMinimap,
  NbWalkthrough,
}

export default {
  install(app: App) {
    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component)
    })
  },
}
