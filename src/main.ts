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
export { default as NbButton } from './components/Button.vue'
export { default as NbCheckbox } from './components/Checkbox.vue'
export { default as NbColorStrip } from './components/ColorStrip.vue'
export { default as NbFlag } from './components/Flag.vue'
export { default as NbGrid } from './components/Grid.vue'
export { default as NbIcon } from './components/Icon.vue'
export { default as NbJsonTree } from './components/JsonTree.vue'
export { default as NbLabel } from './components/Label.vue'
export { default as NbMessage } from './components/Message.vue'
export { default as NbModal } from './components/Modal.vue'
export { default as NbPanel } from './components/Panel.vue'
export { default as NbShell } from './components/Shell.vue'
export { default as NbSidebarLink } from './components/SidebarLink.vue'
export { default as NbToast } from './components/Toast.vue'
export type { TToastVariant, IToastCta } from './components/Toast.vue'
export { default as NbRadio } from './components/Radio.vue'
export { default as NbNumberInput } from './components/NumberInput.vue'
export { default as NbSlider } from './components/Slider.vue'
export { default as NbSelect } from './components/Select.vue'
export { default as NbTextInput } from './components/TextInput.vue'
export type { ISelectOption, ISelectProps } from './components/Select.d'

// Directives
export { default as nbTooltipDirective } from './directives/ToolTip.directive'

// Labs plugin (experimental components)
export { default as NubiscoUILabs } from './labs'
