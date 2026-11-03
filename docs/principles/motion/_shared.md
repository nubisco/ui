<script setup lang="ts">
import { ref, type Ref } from 'vue'
import DemoFrame from '../../shared/DemoFrame.vue'
import MotionDurations from '../../shared/motion/MotionDurations.vue'
import MotionCurves from '../../shared/motion/MotionCurves.vue'
import MotionEnterExit from '../../shared/motion/MotionEnterExit.vue'
import MotionReflow from '../../shared/motion/MotionReflow.vue'
import MotionReduced from '../../shared/motion/MotionReduced.vue'

// The three jobs
const jobTrigger = ref(null) as Ref<any>
const jobMenu = ref(null) as Ref<any>
const jobMenuOpen = ref(false)
const jobSwitch = ref(true)
const jobCheck = ref(false)

function openJobMenu() {
  if (jobMenuOpen.value) {
    jobMenuOpen.value = false
    return
  }
  const rect = (jobTrigger.value?.$el ?? jobTrigger.value)?.getBoundingClientRect()
  if (rect) jobMenu.value?.setPosition(rect)
  jobMenuOpen.value = true
}

// One event, one timing
const modalOpen = ref(false)

// The frame
const railVariant = ref<'verbose' | 'compact'>('verbose')
const frameInspector = ref(false)
const framePanel = ref('default')

// Controls
const controlTab = ref('overview')
const controlTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
]
</script>
