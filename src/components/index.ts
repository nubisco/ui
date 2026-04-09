import type { App } from 'vue'
import NbBadge from './Badge.vue'
import NbBreadcrumbs from './Breadcrumbs.vue'
import NbButton from './Button.vue'
import NbCheckbox from './Checkbox.vue'
import NbColorStrip from './ColorStrip.vue'
import NbFlag from './Flag.vue'
import NbGrid from './Grid.vue'
import NbIcon from './Icon.vue'
import NbJsonTree from './JsonTree.vue'
import NbLabel from './Label.vue'
import NbMessage from './Message.vue'
import NbModal from './Modal.vue'
import NbNumberInput from './NumberInput.vue'
import NbPanel from './Panel.vue'
import NbRadio from './Radio.vue'
import NbSelect from './Select.vue'
import NbShell from './Shell.vue'
import NbSidebarLink from './SidebarLink.vue'
import NbSlider from './Slider.vue'
import NbTextInput from './TextInput.vue'
import NbToast from './Toast.vue'

const components = {
  NbBadge,
  NbBreadcrumbs,
  NbButton,
  NbCheckbox,
  NbColorStrip,
  NbFlag,
  NbGrid,
  NbIcon,
  NbJsonTree,
  NbLabel,
  NbMessage,
  NbModal,
  NbNumberInput,
  NbPanel,
  NbRadio,
  NbSelect,
  NbShell,
  NbSidebarLink,
  NbSlider,
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
