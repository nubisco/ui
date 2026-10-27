<script setup lang="ts">
import { ref, type Ref } from 'vue'

// Basic menu
const basicTrigger = ref(null) as Ref<any>
const basicMenu = ref(null) as Ref<any>
const basicOpen = ref(false)

function openBasicMenu() {
  if (basicOpen.value) { basicOpen.value = false; return }
  const rect = (basicTrigger.value?.$el ?? basicTrigger.value)?.getBoundingClientRect()
  if (rect) basicMenu.value?.setPosition(rect)
  basicOpen.value = true
}

// Divider menu
const dividerTrigger = ref(null) as Ref<any>
const dividerMenu = ref(null) as Ref<any>
const dividerOpen = ref(false)

function openDividerMenu() {
  if (dividerOpen.value) { dividerOpen.value = false; return }
  const rect = (dividerTrigger.value?.$el ?? dividerTrigger.value)?.getBoundingClientRect()
  if (rect) dividerMenu.value?.setPosition(rect)
  dividerOpen.value = true
}

// Icon menu
const iconTrigger = ref(null) as Ref<any>
const iconMenu = ref(null) as Ref<any>
const iconOpen = ref(false)

function openIconMenu() {
  if (iconOpen.value) { iconOpen.value = false; return }
  const rect = (iconTrigger.value?.$el ?? iconTrigger.value)?.getBoundingClientRect()
  if (rect) iconMenu.value?.setPosition(rect)
  iconOpen.value = true
}

// Selectable menu
const checkTrigger = ref(null) as Ref<any>
const checkMenu = ref(null) as Ref<any>
const checkOpen = ref(false)
const showGrid = ref(true)
const showRulers = ref(false)
const showGuides = ref(true)

function openCheckMenu() {
  if (checkOpen.value) { checkOpen.value = false; return }
  const rect = (checkTrigger.value?.$el ?? checkTrigger.value)?.getBoundingClientRect()
  if (rect) checkMenu.value?.setPosition(rect)
  checkOpen.value = true
}

// Radio menu
const radioTrigger = ref(null) as Ref<any>
const radioMenu = ref(null) as Ref<any>
const radioOpen = ref(false)
const sortBy = ref('name')

function openRadioMenu() {
  if (radioOpen.value) { radioOpen.value = false; return }
  const rect = (radioTrigger.value?.$el ?? radioTrigger.value)?.getBoundingClientRect()
  if (rect) radioMenu.value?.setPosition(rect)
  radioOpen.value = true
}

// Danger menu
const dangerTrigger = ref(null) as Ref<any>
const dangerMenu = ref(null) as Ref<any>
const dangerOpen = ref(false)

function openDangerMenu() {
  if (dangerOpen.value) { dangerOpen.value = false; return }
  const rect = (dangerTrigger.value?.$el ?? dangerTrigger.value)?.getBoundingClientRect()
  if (rect) dangerMenu.value?.setPosition(rect)
  dangerOpen.value = true
}

// Disabled menu
const disabledTrigger = ref(null) as Ref<any>
const disabledMenu = ref(null) as Ref<any>
const disabledOpen = ref(false)

function openDisabledMenu() {
  if (disabledOpen.value) { disabledOpen.value = false; return }
  const rect = (disabledTrigger.value?.$el ?? disabledTrigger.value)?.getBoundingClientRect()
  if (rect) disabledMenu.value?.setPosition(rect)
  disabledOpen.value = true
}

// Submenu
const subTrigger = ref(null) as Ref<any>
const subMenu = ref(null) as Ref<any>
const subOpen = ref(false)

function openSubMenu() {
  if (subOpen.value) { subOpen.value = false; return }
  const rect = (subTrigger.value?.$el ?? subTrigger.value)?.getBoundingClientRect()
  if (rect) subMenu.value?.setPosition(rect)
  subOpen.value = true
}

// Size menu
const xsTrigger = ref(null) as Ref<any>
const smTrigger = ref(null) as Ref<any>
const mdTrigger = ref(null) as Ref<any>
const lgTrigger = ref(null) as Ref<any>
const sizeMenu = ref(null) as Ref<any>
const sizeOpen = ref(false)
const currentSize = ref<'xs' | 'sm' | 'md' | 'lg'>('md')

const sizeTriggerMap: Record<string, Ref<any>> = { xs: xsTrigger, sm: smTrigger, md: mdTrigger, lg: lgTrigger }

function openSizeMenu(size: 'xs' | 'sm' | 'md' | 'lg') {
  if (sizeOpen.value) { sizeOpen.value = false; return }
  currentSize.value = size
  const triggerRef = sizeTriggerMap[size]
  const rect = (triggerRef.value?.$el ?? triggerRef.value)?.getBoundingClientRect()
  if (rect) sizeMenu.value?.setPosition(rect)
  sizeOpen.value = true
}
</script>
