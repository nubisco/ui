import type { App } from 'vue'
import NbAiLabel from './AiLabel.vue'
import NbBadge from './Badge.vue'
import NbBarChart from './Charts/BarChart.vue'
import NbBreadcrumbs from './Breadcrumbs.vue'
import NbButton from './Button.vue'
import NbCheckbox from './Checkbox.vue'
import NbColorStrip from './ColorStrip.vue'
import NbFileUploader from './FileUploader.vue'
import NbFlag from './Flag.vue'
import NbForm from './Form.vue'
import NbGrid from './Grid.vue'
import NbIcon from './Icon.vue'
import NbImageCropper from './ImageCropper.vue'
import NbJsonTree from './JsonTree.vue'
import NbLineChart from './Charts/LineChart.vue'
import NbLabel from './Label.vue'
import NbMessage from './Message.vue'
import NbModal from './Modal.vue'
import NbNumberInput from './NumberInput.vue'
import NbPanel from './Panel.vue'
import NbPieChart from './Charts/PieChart.vue'
import NbRadio from './Radio.vue'
import NbSelect from './Select.vue'
import NbShell from './Shell.vue'
import NbSidebarLink from './SidebarLink.vue'
import NbSlider from './Slider.vue'
import NbSwitch from './Switch.vue'
import NbTextInput from './TextInput.vue'
import NbToast from './Toast.vue'

const components = {
  NbAiLabel,
  NbBadge,
  NbBarChart,
  NbBreadcrumbs,
  NbButton,
  NbCheckbox,
  NbColorStrip,
  NbFileUploader,
  NbFlag,
  NbForm,
  NbGrid,
  NbIcon,
  NbImageCropper,
  NbJsonTree,
  NbLabel,
  NbLineChart,
  NbMessage,
  NbModal,
  NbNumberInput,
  NbPanel,
  NbPieChart,
  NbRadio,
  NbSelect,
  NbShell,
  NbSidebarLink,
  NbSlider,
  NbSwitch,
  NbTextInput,
  NbToast,
}

export default {
  install(app: App) {
    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component)
    })
  },
}
